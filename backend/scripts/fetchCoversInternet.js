/**
 * kitaplar tablosundaki ISBN (+ varsa kapak_url) ile internetten kapak bulur,
 * backend/public/covers/ altına kaydeder.
 *
 * Sıra: 1) Veritabanındaki http(s) kapak_url  2) Open Library (L, sonra M)
 *       3) Google Books ISBN araması  4) (isteğe bağlı) başlık+yazar ile Google araması
 *       Kitap Yurdu vb. mağaza sitelerinden otomatik kazıma eklenmez (ToS / telif / kırılgan HTML).
 *
 * backend klasöründen:
 *   npm run fetch-covers-internet
 *
 * Ortam (backend/.env):
 *   PG* — veritabanı
 *   GOOGLE_BOOKS_API_KEY=... — isteğe bağlı (günlük kota)
 *   FETCH_UPDATE_DB=true — başarıda kapak_url = /covers/{dosya} yazar
 *   FETCH_SKIP_EXISTING=true — aynı ISBN için dosya varsa atlar
 *   FETCH_MIN_BYTES=2500 — bundan küçük dosyayı “kapak yok” say (OL yer tutucusu)
 *   FETCH_LIMIT=999 — en fazla bu kadar satır işle (ORDER BY isbn); npm: fetch-covers-999
 *   FETCH_ONLY_VALID_ISBN=false — varsayılan: ISBN-13 yalnızca 978/979 önekli; ISBN-10 (+X)
 *   FETCH_RELAX_ISBN13=true — 13 hane olsun yeter (152… gibi sahte barkodlar da seçilir; genelde YOK)
 *   FETCH_GOOGLE_MIN_BYTES=1100 — Google kapakları küçük gelirse eşik (varsayılan indirmede kullanılır)
 *   FETCH_GOOGLE_BY_TITLE=true — OL + ISBN Google boşsa kitap_adi (+ yazar) ile Google’da ara (yanlış eşleşme riski)
 *   FETCH_GOOGLE_LANG=tr — başlık aramasına langRestrict (boş bırakırsanız kısıtlama yok)
 */
const path = require("path");
const fs = require("fs");
require("dotenv").config({ path: path.join(__dirname, "..", ".env") });
const { Pool } = require("pg");
const { sniffImageMime, extFromMime } = require("./sniffImageMime");

const COVERS_DIR = path.join(__dirname, "..", "public", "covers");
const DELAY_MS = Number(process.env.FETCH_COVER_DELAY_MS) || 350;
const MAX_BYTES = 5 * 1024 * 1024;
const MIN_BYTES = Math.max(
  500,
  Number(process.env.FETCH_MIN_BYTES) || 2500,
);
const GOOGLE_MIN_BYTES = Math.max(
  400,
  Number(process.env.FETCH_GOOGLE_MIN_BYTES) || 1100,
);

const FETCH_LIMIT = (() => {
  const n = parseInt(String(process.env.FETCH_LIMIT || ""), 10);
  return Number.isFinite(n) && n > 0 ? Math.min(n, 50000) : null;
})();

/** Varsayılan true: LIMIT önce çöp satırları tüketmesin */
const ONLY_VALID_ISBN =
  process.env.FETCH_ONLY_VALID_ISBN !== "false" &&
  process.env.FETCH_ONLY_VALID_ISBN !== "0";

const RELAX_ISBN13 =
  process.env.FETCH_RELAX_ISBN13 === "true" ||
  process.env.FETCH_RELAX_ISBN13 === "1";

/** PostgreSQL: gerçek ISBN-13 = 978/979 + 10 hane; veya ISBN-10 */
function sqlValidIsbnFilter() {
  if (!ONLY_VALID_ISBN) return "";
  const d = `regexp_replace(trim(isbn::text), '[^0-9]', '', 'g')`;
  const isbn13 = RELAX_ISBN13
    ? `(length(${d}) = 13)`
    : `(
    length(${d}) = 13
    AND (${d} LIKE '978%' OR ${d} LIKE '979%')
  )`;
  return ` AND (
    ${isbn13}
    OR (regexp_replace(trim(isbn::text), '[^0-9Xx]', '', 'g') ~* '^[0-9]{9}[0-9X]$')
  )`;
}

const UA = "Kutuphane-CoverFetch/1.0 (educational; +local)";

async function sleepDelay(ms) {
  await new Promise((r) => setTimeout(r, ms));
}

/** Dosya adı için güvenli ISBN parçası; 13 hane = yalnızca 978/979 (veya RELAX) */
function fileBaseFromIsbn(isbnRaw) {
  if (isbnRaw == null) return null;
  const compact = String(isbnRaw).replace(/[\s-]/g, "").toUpperCase();
  if (/^\d{9}[\dX]$/.test(compact)) return compact;
  const digits = compact.replace(/\D/g, "");
  if (digits.length >= 13) {
    const d13 = digits.slice(0, 13);
    if (RELAX_ISBN13 || d13.startsWith("978") || d13.startsWith("979"))
      return d13;
    return null;
  }
  if (digits.length >= 10) return digits.slice(0, 10);
  return null;
}

function openLibraryUrls(isbnRaw) {
  const compact = String(isbnRaw).replace(/[\s-]/g, "").toUpperCase();
  let param = null;
  if (/^\d{9}[\dX]$/.test(compact)) param = compact;
  else {
    const digits = compact.replace(/\D/g, "");
    if (digits.length >= 13) param = digits.slice(0, 13);
    else if (digits.length >= 10) param = digits.slice(0, 10);
  }
  if (!param) return [];
  return [
    `https://covers.openlibrary.org/b/isbn/${param}-L.jpg`,
    `https://covers.openlibrary.org/b/isbn/${param}-M.jpg`,
  ];
}

function isbnQueryForGoogle(isbnRaw) {
  const compact = String(isbnRaw).replace(/[\s-]/g, "").toUpperCase();
  if (/^\d{9}[\dX]$/.test(compact)) return compact;
  const digits = compact.replace(/\D/g, "");
  if (digits.length >= 13) return digits.slice(0, 13);
  if (digits.length >= 10) return digits.slice(0, 10);
  return null;
}

function pickGoogleImageLink(links) {
  if (!links) return null;
  const raw =
    links.large ||
    links.medium ||
    links.small ||
    links.thumbnail ||
    links.smallThumbnail;
  if (!raw) return null;
  let s = String(raw).replace(/^http:\/\//i, "https://");
  if (s.includes("books.google.com") && /[?&]zoom=\d/.test(s)) {
    s = s.replace(/([?&])zoom=\d/, "$1zoom=3");
  }
  return s;
}

async function tryGoogleBooksImageUrl(isbnRaw, apiKey) {
  if (!apiKey || !String(apiKey).trim()) return null;
  const q = isbnQueryForGoogle(isbnRaw);
  if (!q) return null;
  const url = `https://www.googleapis.com/books/v1/volumes?q=isbn:${encodeURIComponent(q)}&key=${encodeURIComponent(apiKey.trim())}`;
  const r = await fetch(url, { headers: { "User-Agent": UA } });
  if (!r.ok) return null;
  const data = await r.json();
  return pickGoogleImageLink(data.items?.[0]?.volumeInfo?.imageLinks);
}

function sanitizeGoogleQueryPart(s, maxLen) {
  return String(s || "")
    .replace(/\s+/g, " ")
    .trim()
    .slice(0, maxLen)
    .replace(/["'\\]/g, "");
}

/** Başlık (+ yazar) ile arama; birkaç sonuç dener (kapaksız volume atlanır). */
async function googleTitleAuthorCoverUrls(title, author, apiKey) {
  if (!apiKey || !String(apiKey).trim()) return [];
  const t = sanitizeGoogleQueryPart(title, 120);
  const a = sanitizeGoogleQueryPart(author, 80);
  if (t.length < 2) return [];
  const q =
    a.length >= 2 ? `intitle:${t} inauthor:${a}` : `intitle:${t}`;
  let url = `https://www.googleapis.com/books/v1/volumes?q=${encodeURIComponent(q)}&maxResults=5&key=${encodeURIComponent(apiKey.trim())}`;
  const lang = (process.env.FETCH_GOOGLE_LANG || "").trim();
  if (lang) url += `&langRestrict=${encodeURIComponent(lang)}`;
  const r = await fetch(url, { headers: { "User-Agent": UA } });
  if (!r.ok) return [];
  const data = await r.json();
  const out = [];
  for (const it of data.items || []) {
    const u = pickGoogleImageLink(it.volumeInfo?.imageLinks);
    if (u) out.push(u);
  }
  return out;
}

/**
 * URL'den indirir; görsel doğrular. Başarıda { buf, contentType } döner.
 */
function minBytesForUrl(imageUrl) {
  if (String(imageUrl).includes("books.google.com")) return GOOGLE_MIN_BYTES;
  return MIN_BYTES;
}

async function downloadAsImage(imageUrl) {
  const res = await fetch(imageUrl, {
    headers: { "User-Agent": UA },
    redirect: "follow",
  });
  if (!res.ok) return null;
  const buf = Buffer.from(await res.arrayBuffer());
  const lo = minBytesForUrl(imageUrl);
  if (buf.length < lo || buf.length > MAX_BYTES) return null;
  let ct = (res.headers.get("content-type") || "").split(";")[0].trim();
  if (!ct.startsWith("image/")) {
    const guessed = sniffImageMime(buf);
    if (!guessed) return null;
    ct = guessed;
  }
  return { buf, contentType: ct };
}

async function trySources(urls) {
  for (const u of urls) {
    if (!u || typeof u !== "string") continue;
    const trimmed = u.trim();
    if (!trimmed.startsWith("http")) continue;
    try {
      const got = await downloadAsImage(trimmed);
      if (got) return { ...got, sourceUrl: trimmed };
    } catch {
      /* sonraki */
    }
    await sleepDelay(DELAY_MS);
  }
  return null;
}

function existingCoverPath(fileBase) {
  if (!fileBase || !fs.existsSync(COVERS_DIR)) return null;
  for (const ext of [".jpg", ".jpeg", ".png", ".webp", ".gif"]) {
    const p = path.join(COVERS_DIR, `${fileBase}${ext}`);
    if (fs.existsSync(p)) return p;
  }
  return null;
}

async function main() {
  if (!fs.existsSync(COVERS_DIR)) {
    fs.mkdirSync(COVERS_DIR, { recursive: true });
  }

  const skipExisting =
    process.env.FETCH_SKIP_EXISTING === "true" ||
    process.env.FETCH_SKIP_EXISTING === "1";
  const updateDb =
    process.env.FETCH_UPDATE_DB === "true" ||
    process.env.FETCH_UPDATE_DB === "1";
  const googleKey =
    process.env.GOOGLE_BOOKS_API_KEY || process.env.GBOOKS_API_KEY || "";
  const googleByTitle =
    process.env.FETCH_GOOGLE_BY_TITLE === "true" ||
    process.env.FETCH_GOOGLE_BY_TITLE === "1";

  const dbUrl = (
    process.env.DATABASE_URL ||
    process.env.SUPABASE_DB_URL ||
    ""
  ).trim();
  const useSsl =
    process.env.DB_SSL === "false" ? false : { rejectUnauthorized: false };
  const pool = dbUrl
    ? new Pool({
        connectionString: dbUrl,
        ssl: useSsl,
      })
    : new Pool({
        user: process.env.PGUSER || "postgres",
        password: process.env.PGPASSWORD || "123456",
        host: process.env.PGHOST || "localhost",
        port: Number(process.env.PGPORT) || 5432,
        database: process.env.PGDATABASE || "KutuphaneOtomasyon",
        ssl: process.env.PGHOST ? useSsl : false,
      });

  const vf = sqlValidIsbnFilter();
  const baseWhere = `isbn IS NOT NULL AND trim(isbn::text) <> ''${vf}`;
  if (ONLY_VALID_ISBN) {
    console.log(
      RELAX_ISBN13
        ? "[fetchCovers] 13 haneli + ISBN-10 satırları (RELAX: 978/979 zorunlu değil)."
        : "[fetchCovers] ISBN-13 yalnızca 978… veya 979…; ayrıca ISBN-10. (152… gibi sahte barkodlar elenir.)",
    );
  }
  let sql = `SELECT * FROM kitaplar WHERE ${baseWhere} ORDER BY isbn`;
  const qparams = [];
  if (FETCH_LIMIT != null) {
    sql += ` LIMIT $1`;
    qparams.push(FETCH_LIMIT);
  }
  const { rows } = await pool.query(sql, qparams);
  if (googleByTitle) {
    console.log(
      "[fetchCovers] FETCH_GOOGLE_BY_TITLE=açık — başlık eşleşmesi bazen yanlış kapak verebilir.",
    );
  }
  if (FETCH_LIMIT != null) {
    console.log("FETCH_LIMIT=", FETCH_LIMIT, "işlenecek satır:", rows.length);
  }

  let ok = 0;
  let skip = 0;
  let fail = 0;

  for (const row of rows) {
    const fileBase = fileBaseFromIsbn(row.isbn);
    if (!fileBase) {
      skip++;
      console.warn("ISBN_ATLANIYOR", String(row.isbn).slice(0, 40));
      continue;
    }

    if (skipExisting && existingCoverPath(fileBase)) {
      skip++;
      console.log("VAR", fileBase);
      continue;
    }

    const dbUrlRaw = row.kapak_url != null ? String(row.kapak_url).trim() : "";
    const dbUrl =
      dbUrlRaw !== "" && !dbUrlRaw.startsWith("/covers/")
        ? dbUrlRaw
        : "";

    const candidates = [];
    if (dbUrl.startsWith("http")) candidates.push(dbUrl);
    for (const ol of openLibraryUrls(row.isbn)) candidates.push(ol);

    let result = await trySources(candidates);

    if (!result && googleKey) {
      await sleepDelay(DELAY_MS);
      const gUrl = await tryGoogleBooksImageUrl(row.isbn, googleKey);
      if (gUrl) {
        await sleepDelay(DELAY_MS);
        result = await trySources([gUrl]);
      }
    }

    if (!result && googleKey && googleByTitle) {
      const title = row.kitap_adi;
      const author = row.yazar ?? "";
      await sleepDelay(DELAY_MS);
      const gUrls = await googleTitleAuthorCoverUrls(
        title,
        author,
        googleKey,
      );
      if (gUrls.length) {
        await sleepDelay(DELAY_MS);
        result = await trySources(gUrls);
      }
    }

    if (!result) {
      fail++;
      console.warn("YOK", fileBase);
      await sleepDelay(DELAY_MS);
      continue;
    }

    const ext = extFromMime(result.contentType);
    const outPath = path.join(COVERS_DIR, `${fileBase}${ext}`);
    fs.writeFileSync(outPath, result.buf);
    ok++;
    console.log("OK", fileBase, ext, result.sourceUrl?.slice(0, 60));

    if (updateDb) {
      const relative = `/covers/${fileBase}${ext}`;
      try {
        await pool.query(
          `UPDATE kitaplar SET kapak_url = $1 WHERE isbn = $2`,
          [relative, row.isbn],
        );
      } catch (e) {
        if (e.code === "42703") {
          console.warn(
            "[fetchCovers] FETCH_UPDATE_DB atlandı: kapak_url sütunu yok. Ekleyin: ALTER TABLE kitaplar ADD COLUMN kapak_url TEXT;",
          );
        } else throw e;
      }
    }

    await sleepDelay(DELAY_MS);
  }

  await pool.end();
  console.log("\nÖzet — indirilen:", ok, "atlanan:", skip, "bulunamayan:", fail);
  console.log(
    "Frontend: VITE_COVER_BASE_URL=http://127.0.0.1:5000 (veya canlı API kökü)",
  );
  if (!updateDb) {
    console.log(
      "Veritabanını otomatik güncellemek için: FETCH_UPDATE_DB=true npm run fetch-covers-internet",
    );
  }
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
