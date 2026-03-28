const path = require("path");
require("dotenv").config({ path: path.join(__dirname, ".env") });

const express = require("express");
const { Pool } = require("pg");
const cors = require("cors");

const app = express();
app.use(cors());
app.use(express.json());

const pool = new Pool({
  user: process.env.PGUSER || "postgres",
  password: process.env.PGPASSWORD || "123456",
  host: process.env.PGHOST || "localhost",
  port: Number(process.env.PGPORT) || 5432,
  database: process.env.PGDATABASE || "KutuphaneOtomasyon",
});

/** Kapak araması önbelleği (ISBN + başlık + yazar birleşik anahtar). */
const coverCache = new Map();

function pickCoverFromVolumeInfo(volumeInfo) {
  const links = volumeInfo?.imageLinks;
  const pick =
    links?.extraLarge ||
    links?.large ||
    links?.medium ||
    links?.thumbnail ||
    links?.smallThumbnail ||
    null;
  return pick ? String(pick).replace(/^http:\/\//i, "https://") : null;
}

function normalizeTr(s) {
  return String(s || "")
    .toLowerCase()
    .normalize("NFD")
    .replace(/\p{M}/gu, "")
    .replace(/ı/g, "i")
    .replace(/ğ/g, "g")
    .replace(/ü/g, "u")
    .replace(/ş/g, "s")
    .replace(/ö/g, "o")
    .replace(/ç/g, "c")
    .replace(/[^a-z0-9\s]/g, " ")
    .replace(/\s+/g, " ")
    .trim();
}

/** Yanlış kitabın kapağını vermemek için başlık/yazar skoru. */
function pickBestGoogleItem(items, wantTitle, wantAuthor) {
  if (!items?.length) return null;
  const wt = normalizeTr(wantTitle);
  const wa = normalizeTr(wantAuthor);
  const titleTok = wt.split(/\s+/).filter((x) => x.length >= 3);
  const authorTok = wa.split(/\s+/).filter((x) => x.length >= 2);
  const needAuthorOk = authorTok.length > 0;

  const rows = [];
  for (const it of items) {
    const vol = it.volumeInfo;
    if (!vol) continue;
    const cover = pickCoverFromVolumeInfo(vol);
    if (!cover) continue;
    const t = normalizeTr(vol.title);
    const authBlob = normalizeTr((vol.authors || []).join(" "));
    let score = 0;
    if (wt.length >= 4 && t.includes(wt)) score += 100;
    if (wt.length >= 4 && wt.includes(t) && t.length >= 5) score += 70;
    for (const w of titleTok) {
      if (w.length >= 3 && t.includes(w)) score += 14;
    }
    const authorOk =
      !needAuthorOk || authorTok.some((p) => p.length >= 2 && authBlob.includes(p));
    if (needAuthorOk && !authorOk) score -= 80;
    for (const p of authorTok) {
      if (p.length >= 2 && authBlob.includes(p)) score += 28;
    }
    rows.push({ score, cover });
  }
  if (!rows.length) return null;
  rows.sort((a, b) => b.score - a.score);
  if (rows[0].score < 12) return null;
  return rows[0].cover;
}

async function openLibrarySearchCover(title, author) {
  const t = String(title || "").trim();
  if (t.length < 2) return null;
  const q = [t, String(author || "").trim()].filter((x) => x.length >= 1).join(" ");
  try {
    const url = `https://openlibrary.org/search.json?q=${encodeURIComponent(q)}&limit=20`;
    const res = await fetch(url);
    if (!res.ok) return null;
    const data = await res.json();
    const docs = data.docs || [];
    const wt = normalizeTr(t);
    const authorTok = normalizeTr(author)
      .split(/\s+/)
      .filter((x) => x.length >= 2);
    for (const doc of docs) {
      const dt = normalizeTr(doc.title || "");
      const da = normalizeTr((doc.author_name || []).join(" "));
      const titleHit =
        (wt.length >= 4 && dt.includes(wt)) ||
        (wt.length >= 4 && wt.includes(dt) && dt.length >= 4) ||
        wt
          .split(/\s+/)
          .filter((w) => w.length >= 3)
          .some((w) => dt.includes(w));
      if (!titleHit) continue;
      if (authorTok.length && !authorTok.some((p) => da.includes(p))) continue;
      if (doc.cover_i) {
        return `https://covers.openlibrary.org/b/id/${doc.cover_i}-L.jpg`;
      }
    }
  } catch (e) {
    console.error("[kapak] Open Library:", e.message);
  }
  return null;
}

async function fetchGoogleVolumes(searchUrl) {
  const res = await fetch(searchUrl);
  const raw = await res.text();
  let data;
  try {
    data = raw ? JSON.parse(raw) : {};
  } catch {
    console.error("[kapak] Google yanıtı JSON değil:", raw.slice(0, 120));
    return { ok: false, data: {} };
  }
  if (!res.ok) {
    console.error("[kapak] Google HTTP", res.status, data.error || raw.slice(0, 200));
    return { ok: false, data };
  }
  if (data.error) {
    console.error("[kapak] Google API:", data.error.message || JSON.stringify(data.error));
    return { ok: false, data };
  }
  return { ok: true, data };
}

/**
 * Google ISBN’de çoğu yerli kitap yok → başlık/yazar + skor + Open Library yedeği.
 */
async function resolveCoverFromGoogle({ isbnDigits, title, author }) {
  const key = process.env.GOOGLE_BOOKS_API_KEY?.trim();
  if (!key) return { url: null, needsApiKey: true };

  const t = String(title || "").trim();
  const a = String(author || "").trim();
  const cacheKey = `${String(isbnDigits || "").replace(/\D/g, "")}|${t}|${a}`;
  if (coverCache.has(cacheKey)) {
    return { url: coverCache.get(cacheKey), needsApiKey: false };
  }

  const base = "https://www.googleapis.com/books/v1/volumes";
  const keyQ = `&key=${encodeURIComponent(key)}`;
  const tr = "&langRestrict=tr";

  const googleTry = async (qParam, max) => {
    const { ok, data } = await fetchGoogleVolumes(
      `${base}?q=${encodeURIComponent(qParam)}&maxResults=${max}${tr}${keyQ}`,
    );
    if (!ok || !data.items?.length) return null;
    return pickBestGoogleItem(data.items, t || qParam, a);
  };

  const googleTryNoLang = async (qParam, max) => {
    const { ok, data } = await fetchGoogleVolumes(
      `${base}?q=${encodeURIComponent(qParam)}&maxResults=${max}${keyQ}`,
    );
    if (!ok || !data.items?.length) return null;
    return pickBestGoogleItem(data.items, t || qParam, a);
  };

  let found = null;

  // 1) ISBN
  if (isbnDigits && String(isbnDigits).replace(/\D/g, "").length >= 10) {
    const digits = String(isbnDigits).replace(/\D/g, "");
    const { ok, data } = await fetchGoogleVolumes(
      `${base}?q=isbn:${encodeURIComponent(digits)}${keyQ}`,
    );
    if (ok && data.items?.length) {
      if (t.length >= 3) {
        found = pickBestGoogleItem(data.items, t, a);
      }
      if (!found) {
        found = pickCoverFromVolumeInfo(data.items[0].volumeInfo);
      }
    }
  }

  // 2) intitle + inauthor
  if (!found && t.length >= 2) {
    let q = `intitle:${t}`;
    if (a.length >= 2) q += ` inauthor:${a}`;
    found = await googleTry(q, 15);
  }

  // 3) Sadece başlık (yazar Google’da eşleşmeyebilir)
  if (!found && t.length >= 2) {
    found = await googleTry(`intitle:${t}`, 15);
  }

  // 4) Serbest metin (dil kısıtı yok — yabancı baskı kapağı gelebilir)
  if (!found && t.length >= 2) {
    const loose = a.length >= 2 ? `${t} ${a}` : t;
    found = await googleTryNoLang(loose, 12);
  }

  // 5) Open Library (API anahtarı gerekmez)
  if (!found && t.length >= 2) {
    found = await openLibrarySearchCover(t, a);
  }

  if (found) {
    coverCache.set(cacheKey, found);
    return { url: found, needsApiKey: false };
  }

  coverCache.set(cacheKey, null);
  return { url: null, needsApiKey: false };
}

// :isbn rotası "lookup" kelimesini yutmasın diye önce tam yol:
app.get("/api/kapak/lookup", async (req, res) => {
  try {
    const isbnDigits = String(req.query.isbn || "").replace(/\D/g, "");
    const title = typeof req.query.baslik === "string" ? req.query.baslik : "";
    const author = typeof req.query.yazar === "string" ? req.query.yazar : "";
    if (isbnDigits.length < 10 && String(title).trim().length < 2) {
      return res.json({
        url: null,
        needsApiKey: !process.env.GOOGLE_BOOKS_API_KEY?.trim(),
      });
    }
    const out = await resolveCoverFromGoogle({ isbnDigits, title, author });
    res.json(out);
  } catch (err) {
    console.error(err);
    res.status(500).json({ url: null, needsApiKey: false });
  }
});

app.get("/api/kapak/:isbn", async (req, res) => {
  try {
    const digits = String(req.params.isbn || "").replace(/\D/g, "");
    if (digits.length < 10) {
      return res.json({ url: null, needsApiKey: !process.env.GOOGLE_BOOKS_API_KEY?.trim() });
    }
    if (!process.env.GOOGLE_BOOKS_API_KEY?.trim()) {
      return res.json({ url: null, needsApiKey: true });
    }
    const out = await resolveCoverFromGoogle({
      isbnDigits: digits,
      title: "",
      author: "",
    });
    res.json({ ...out, needsApiKey: false });
  } catch (err) {
    console.error(err);
    res.status(500).json({ url: null, needsApiKey: false });
  }
});

// 1. Liste (limit: varsayılan 50, en fazla 200)
app.get("/api/kitaplar", async (req, res) => {
  try {
    const raw = parseInt(String(req.query.limit || "50"), 10);
    const limit = Number.isFinite(raw) ? Math.min(Math.max(raw, 1), 200) : 50;
    const result = await pool.query("SELECT * FROM kitaplar LIMIT $1", [limit]);
    res.json(result.rows);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Sunucu hatası", detail: err.message });
  }
});

// 2. Arama (q boşsa son kitaplar)
app.get("/api/kitaplar/ara", async (req, res) => {
  try {
    const q = typeof req.query.q === "string" ? req.query.q.trim() : "";
    if (!q) {
      const result = await pool.query(
        "SELECT * FROM kitaplar ORDER BY kitap_adi NULLS LAST LIMIT 40",
      );
      return res.json(result.rows);
    }
    const searchQuery = `%${q}%`;
    const result = await pool.query(
      "SELECT * FROM kitaplar WHERE kitap_adi ILIKE $1 OR yazar ILIKE $1 OR COALESCE(ilgili_kategoriler,'') ILIKE $1 OR COALESCE(kategoriler,'') ILIKE $1 LIMIT 40",
      [searchQuery],
    );
    res.json(result.rows);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Arama hatası", detail: err.message });
  }
});

// 3. DETAY SAYFASI İÇİN (Tek bir kitabı ISBN'e göre getirir)
app.get("/api/kitaplar/:isbn", async (req, res) => {
  try {
    const { isbn } = req.params;
    const result = await pool.query(
      "SELECT * FROM kitaplar WHERE isbn = $1 LIMIT 1",
      [isbn],
    );
    if (result.rows.length === 0)
      return res.status(404).json({ mesaj: "Kitap bulunamadı" });
    res.json(result.rows[0]);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Detay hatası", detail: err.message });
  }
});

app.listen(5000, () => {
  console.log("Backend sunucusu http://localhost:5000 adresinde çalışıyor...");
  if (!process.env.GOOGLE_BOOKS_API_KEY?.trim()) {
    console.warn(
      "[kapak] GOOGLE_BOOKS_API_KEY yok — kapaklar Google Books’tan çekilemez (backend/.env).",
    );
  } else {
    console.log("[kapak] Google Books API anahtarı yüklendi.");
  }
});
