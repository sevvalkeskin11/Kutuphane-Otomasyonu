-- PostgreSQL: Kütüphane otomasyonu örnek tablo (sütun adları backend sorgularıyla uyumludur)
CREATE TABLE IF NOT EXISTS kitaplar (
  isbn VARCHAR(32) PRIMARY KEY,
  kitap_adi TEXT,
  yazar TEXT,
  yayinevi TEXT,
  yayin_tarihi VARCHAR(32),
  kitap_aciklamasi TEXT,
  sayfa_sayisi INTEGER,
  ilgili_kategoriler TEXT,
  kategoriler TEXT,
  fiyat NUMERIC(10, 2),
  -- İsteğe bağlı: gerçek kapak görseli URL’si (Open Library yetersiz kaldığında)
  kapak_url TEXT
);

-- Mevcut tabloya eklemek için:
-- ALTER TABLE kitaplar ADD COLUMN IF NOT EXISTS kapak_url TEXT;
-- Açıklama için alternatif sütun adları kullanıyorsanız uygulama şunları da okur: aciklama, ozet, ozet_metin
