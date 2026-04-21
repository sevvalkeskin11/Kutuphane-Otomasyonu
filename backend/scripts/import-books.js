#!/usr/bin/env node

const fs = require("fs");
const path = require("path");
const { createHash } = require("crypto");
const dotenv = require("dotenv");
const { Pool } = require("pg");

// .env dosyasını bir üst dizinde arar
dotenv.config({ path: path.join(__dirname, "..", ".env") });

// 1. CSV başlıkları ile Veritabanı sütunlarını eşleştiriyoruz
const FIELD_KEYS = {
  isbn: ["isbn", "isbn13", "isbn_13"],
  title: ["kitap_adi", "title"],
  author: ["yazar", "author"],
  category: ["kategoriler", "category"],
  pageCount: ["sayfa_sayisi", "pages"],
  publisher: ["yayinevi", "publisher"],
  stock: ["stok_adedi", "stock"],
  year: ["basim_yili", "year"],
  available: ["mevcut_adet"],
  shelf: ["raf_konumu"],
  status: ["durum"],
  regDate: ["kayit_tarihi"]
};

// 2. SQL Sorgusu: id (UUID) otomatik oluşacağı için buraya eklemiyoruz.
const UPSERT_SQL = `
INSERT INTO kitaplar (
  kitap_adi, yazar, kategoriler, isbn, sayfa_sayisi, 
  yayinevi, stok_adedi, basim_yili, mevcut_adet, 
  raf_konumu, durum, kayit_tarihi
) VALUES (
  $1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12
)
ON CONFLICT (isbn) DO UPDATE SET
  kitap_adi = EXCLUDED.kitap_adi,
  yazar = EXCLUDED.yazar,
  kategoriler = EXCLUDED.kategoriler,
  sayfa_sayisi = EXCLUDED.sayfa_sayisi,
  yayinevi = EXCLUDED.yayinevi,
  stok_adedi = EXCLUDED.stok_adedi,
  basim_yili = EXCLUDED.basim_yili,
  mevcut_adet = EXCLUDED.mevcut_adet,
  raf_konumu = EXCLUDED.raf_konumu,
  durum = EXCLUDED.durum,
  kayit_tarihi = EXCLUDED.kayit_tarihi
RETURNING (xmax = 0) AS inserted;
`;

// Yardımcı Fonksiyonlar
function normalizeHeader(v) {
  return String(v || "").trim().toLowerCase().replace(/[^a-z0-9]+/g, "_");
}

function pick(record, keys) {
  for (const key of keys) {
    if (record[key]) return String(record[key]).trim();
  }
  return "";
}

function toInt(v) {
  const p = parseInt(String(v || "").replace(/[^0-9]/g, ""), 10);
  return isFinite(p) ? p : null;
}

function normalizeIsbn(v) {
  const c = String(v || "").replace(/[^0-9X]/gi, "");
  return c.length >= 10 ? c : null;
}

function buildFallbackIsbn(record, row) {
  const seed = `${pick(record, FIELD_KEYS.title)}-${row}`;
  const hash = createHash("sha1").update(seed).digest("hex").slice(0, 10);
  return `TEMP-${hash}`;
}

function parseCsv(text) {
  const lines = text.split(/\r?\n/);
  if (!lines.length) return [];
  const delimiter = lines[0].includes(";") ? ";" : ",";
  const headers = lines[0].split(delimiter).map(normalizeHeader);
  
  return lines.slice(1).filter(l => l.trim()).map(line => {
    const values = line.split(delimiter);
    const obj = {};
    headers.forEach((h, i) => obj[h] = values[i]);
    return obj;
  });
}

function mapBook(record, row) {
  const title = pick(record, FIELD_KEYS.title);
  if (!title) return null;

  const isbn = normalizeIsbn(pick(record, FIELD_KEYS.isbn)) || buildFallbackIsbn(record, row);

  return {
    kitap_adi: title,
    yazar: pick(record, FIELD_KEYS.author) || "Bilinmeyen Yazar",
    kategoriler: pick(record, FIELD_KEYS.category),
    isbn: isbn,
    sayfa_sayisi: toInt(pick(record, FIELD_KEYS.pageCount)),
    yayinevi: pick(record, FIELD_KEYS.publisher),
    stok_adedi: Math.max(0, (toInt(pick(record, FIELD_KEYS.stock)) || 1)),
    basim_yili: toInt(pick(record, FIELD_KEYS.year)),
    mevcut_adet: Math.max(0, (toInt(pick(record, FIELD_KEYS.available)) || 0)),
    raf_konumu: pick(record, FIELD_KEYS.shelf) || "Bilinmiyor",
    durum: pick(record, FIELD_KEYS.status) || "Mevcut",
    kayit_tarihi: pick(record, FIELD_KEYS.regDate)
  };
}

async function main() {
  const filePath = process.argv.find(a => a.endsWith(".csv"));
  if (!filePath) {
    console.error("Hata: Lütfen bir CSV dosyası yolu belirtin. Örn: node import-books.js kitaplar.csv");
    process.exit(1);
  }

  const rawText = fs.readFileSync(path.resolve(filePath), "utf8");
  const records = parseCsv(rawText);
  const books = records.map((r, i) => mapBook(r, i + 1)).filter(Boolean);

  console.log(`[Import] ${books.length} kitap hazırlandı. Veritabanına bağlanılıyor...`);

  const pool = new Pool({ 
    connectionString: process.env.SUPABASE_DB_URL,
    ssl: { rejectUnauthorized: false }
  });

  let inserted = 0;
  let updated = 0;

  try {
    for (const b of books) {
      const res = await pool.query(UPSERT_SQL, [
        b.kitap_adi, b.yazar, b.kategoriler, b.isbn, b.sayfa_sayisi,
        b.yayinevi, b.stok_adedi, b.basim_yili, b.mevcut_adet,
        b.raf_konumu, b.durum, b.kayit_tarihi
      ]);
      if (res.rows[0]?.inserted) inserted++; else updated++;
    }
    console.log(`[Bitti] Eklendi: ${inserted}, Güncellendi: ${updated}`);
  } catch (err) {
    console.error("[Hata]", err.message);
  } finally {
    await pool.end();
  }
}

main();