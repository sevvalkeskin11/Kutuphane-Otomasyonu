/**
 * Bir kerelik: kitaplar tablosundaki kapak URL'lerinden görsel indirip
 * public/covers/{isbn}.{ext} olarak kaydeder.
 *
 * Çalıştırma (backend klasöründen):
 *   npm run download-covers
 *
 * Ortam: backend/.env içindeki PG* değişkenleri.
 * Farklı sütun: DOWNLOAD_COVER_COLUMN=resim_url (sadece aşağıdaki listeden biri)
 */
const path = require("path");
const fs = require("fs");
require("dotenv").config({ path: path.join(__dirname, "..", ".env") });
const { Pool } = require("pg");

const COVERS_DIR = path.join(__dirname, "..", "public", "covers");
const DELAY_MS = 250;
const MAX_BYTES = 5 * 1024 * 1024;

const ALLOWED_COLUMNS = new Set([
  "kapak_url",
  "resim_url",
  "gorsel_url",
  "image_url",
  "cover_url",
]);

function coverColumn() {
  const c = (process.env.DOWNLOAD_COVER_COLUMN || "kapak_url").trim();
  if (!ALLOWED_COLUMNS.has(c)) {
    throw new Error(
      `DOWNLOAD_COVER_COLUMN izinli değil: ${c}. İzinliler: ${[...ALLOWED_COLUMNS].join(", ")}`,
    );
  }
  return c;
}

function sleep(ms) {
  return new Promise((r) => setTimeout(r, ms));
}

function extFromContentType(ct) {
  if (!ct) return ".jpg";
  if (ct.includes("png")) return ".png";
  if (ct.includes("webp")) return ".webp";
  if (ct.includes("gif")) return ".gif";
  if (ct.includes("jpeg") || ct.includes("jpg")) return ".jpg";
  return ".jpg";
}

function safeIsbnFilePart(isbn) {
  const d = String(isbn || "").replace(/\D/g, "");
  return d.length >= 10 ? d : null;
}

async function main() {
  const col = coverColumn();
  if (!fs.existsSync(COVERS_DIR)) {
    fs.mkdirSync(COVERS_DIR, { recursive: true });
  }

  const pool = new Pool({
    user: process.env.PGUSER || "postgres",
    password: process.env.PGPASSWORD || "123456",
    host: process.env.PGHOST || "localhost",
    port: Number(process.env.PGPORT) || 5432,
    database: process.env.PGDATABASE || "KutuphaneOtomasyon",
  });

  const { rows } = await pool.query(
    `SELECT isbn, "${col}" AS cap_url FROM kitaplar WHERE "${col}" IS NOT NULL AND trim("${col}"::text) <> ''`,
  );

  let ok = 0;
  let skip = 0;
  let fail = 0;

  for (const row of rows) {
    const fileBase = safeIsbnFilePart(row.isbn);
    const raw = row.cap_url != null ? String(row.cap_url).trim() : "";
    if (!fileBase || !raw.startsWith("http")) {
      skip++;
      continue;
    }

    try {
      const res = await fetch(raw, {
        headers: { "User-Agent": "Kutuphane-CoverSync/1.0" },
        redirect: "follow",
      });
      if (!res.ok) {
        fail++;
        console.warn("HTTP", res.status, raw.slice(0, 80));
        await sleep(DELAY_MS);
        continue;
      }
      const ct = res.headers.get("content-type") || "";
      if (!ct.startsWith("image/")) {
        skip++;
        console.warn("Görsel değil:", ct, raw.slice(0, 60));
        await sleep(DELAY_MS);
        continue;
      }
      const buf = Buffer.from(await res.arrayBuffer());
      if (buf.length > MAX_BYTES) {
        fail++;
        console.warn("Çok büyük:", fileBase);
        await sleep(DELAY_MS);
        continue;
      }
      const ext = extFromContentType(ct);
      const out = path.join(COVERS_DIR, `${fileBase}${ext}`);
      fs.writeFileSync(out, buf);
      ok++;
      console.log("OK", fileBase, ext);
    } catch (e) {
      fail++;
      console.warn("Hata", fileBase, e.message);
    }
    await sleep(DELAY_MS);
  }

  await pool.end();
  console.log("\nÖzet — indirilen:", ok, "atlanan:", skip, "hata:", fail);
  console.log(
    "Kapakları sitede kullanmak: frontend .env → VITE_COVER_BASE_URL=http://127.0.0.1:5000",
  );
  console.log(
    "Veritabanında kapak yolunu /covers/{isbn}.jpg şeklinde güncelleyin veya mevcut tam URL'yi bırakıp proxy kullanın.",
  );
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
