const path = require("path");
require("dotenv").config({ path: path.join(__dirname, ".env") });

const express = require("express");
const { Pool } = require("pg");
const cors = require("cors");
const { isSafeRemoteImageUrl } = require("./scripts/coverProxyUtils");
const { sniffImageMime } = require("./scripts/sniffImageMime");

const app = express();
app.use(cors());
app.use(express.json());

/** Yerel kapak dosyaları: indirme script'i buraya yazar; tarayıcı /covers/... ile okur */
app.use(
  "/covers",
  express.static(path.join(__dirname, "public", "covers"), { maxAge: "7d" }),
);

/**
 * Uzak görseli sunucudan çekip tarayıcıya iletir (Referer / bazı hotlink engellerini aşar).
 * Örnek: /api/cover-proxy?url=https%3A%2F%2Fexample.com%2Fa.jpg
 * Frontend: VITE_COVER_USE_PROXY=true
 */
app.get("/api/cover-proxy", async (req, res) => {
  const raw = req.query.url;
  if (typeof raw !== "string" || !raw.trim()) {
    return res.status(400).type("text/plain").send("url parametresi gerekli");
  }
  let target;
  try {
    target = decodeURIComponent(raw.trim());
  } catch {
    return res.status(400).type("text/plain").send("geçersiz url");
  }
  if (!isSafeRemoteImageUrl(target)) {
    return res.status(400).type("text/plain").send("izin verilmeyen adres");
  }
  const maxBytes = 5 * 1024 * 1024;
  try {
    const r = await fetch(target, {
      headers: { "User-Agent": "Kutuphane-Otomasyon-CoverProxy/1.0" },
      redirect: "follow",
    });
    if (!r.ok) {
      return res.status(502).type("text/plain").send("kaynak yanıt vermedi");
    }
    const buf = Buffer.from(await r.arrayBuffer());
    if (buf.length > maxBytes) {
      return res.status(413).type("text/plain").send("dosya çok büyük");
    }
    let ct = (r.headers.get("content-type") || "").split(";")[0].trim();
    if (!ct.startsWith("image/")) {
      const guessed = sniffImageMime(buf);
      if (guessed) ct = guessed;
      else {
        return res.status(415).type("text/plain").send("içerik görsel değil");
      }
    }
    res.setHeader("Content-Type", ct);
    res.setHeader("Cache-Control", "public, max-age=86400");
    res.send(buf);
  } catch (err) {
    console.error("cover-proxy", err.message);
    res.status(502).type("text/plain").send("indirilemedi");
  }
});

const dbUrl = (process.env.DATABASE_URL || process.env.SUPABASE_DB_URL || "").trim();
const useSsl = process.env.DB_SSL === "false" ? false : { rejectUnauthorized: false };

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
});
