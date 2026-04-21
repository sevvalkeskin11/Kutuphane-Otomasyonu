-- ==========================================
-- Kütüphane Otomasyonu - PostgreSQL Şeması
-- Bu dosya, backend `server.js` endpointlerinin kullandığı kolon adlarıyla uyumludur.
-- ==========================================

-- 1) TEMİZLİK (sıfırdan kurulum için)
DROP TABLE IF EXISTS odunc_islemleri CASCADE;
DROP TABLE IF EXISTS kitaplar CASCADE;
DROP TABLE IF EXISTS kullanicilar CASCADE;
DROP TYPE IF EXISTS kitap_durumu CASCADE;

-- 2) ÖZEL TİPLER
CREATE TYPE kitap_durumu AS ENUM ('Mevcut', 'Ödünç Verildi', 'Hasarlı', 'Kayıp');

-- 3) KULLANICILAR
CREATE TABLE kullanicilar (
  id BIGSERIAL PRIMARY KEY,
  full_name TEXT NOT NULL,
  email TEXT NOT NULL UNIQUE,
  password_hash TEXT NOT NULL,
  phone_number TEXT,
  address TEXT,
  role TEXT NOT NULL DEFAULT 'uye' CHECK (role IN ('uye', 'admin')),
  is_active BOOLEAN DEFAULT TRUE,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 4) KİTAPLAR
CREATE TABLE kitaplar (
  isbn VARCHAR(64) PRIMARY KEY,
  kitap_adi TEXT NOT NULL,
  yazar TEXT NOT NULL,
  yayinevi TEXT,
  yayin_tarihi VARCHAR(32),
  basim_yili INTEGER,
  kitap_aciklamasi TEXT,
  sayfa_sayisi INTEGER,
  ilgili_kategoriler TEXT,
  kategoriler TEXT,
  raf_konumu VARCHAR(50),
  durum kitap_durumu DEFAULT 'Mevcut',
  fiyat NUMERIC(10, 2),
  kapak_url TEXT,
  puan NUMERIC(3, 2) DEFAULT 0,
  stok_adedi INTEGER DEFAULT 0 CHECK (stok_adedi >= 0),
  mevcut_adet INTEGER DEFAULT 0 CHECK (mevcut_adet >= 0),
  kayit_tarihi TEXT,
  CONSTRAINT chk_mevcut_stok_limit CHECK (mevcut_adet <= stok_adedi)
);

-- 5) ÖDÜNÇ İŞLEMLERİ
CREATE TABLE odunc_islemleri (
  id BIGSERIAL PRIMARY KEY,
  user_id BIGINT REFERENCES kullanicilar(id) ON DELETE CASCADE,
  kitap_isbn VARCHAR(64) REFERENCES kitaplar(isbn) ON DELETE RESTRICT,
  borrow_date DATE DEFAULT CURRENT_DATE,
  due_date DATE NOT NULL,
  return_date DATE,
  status TEXT DEFAULT 'oduncte' CHECK (status IN ('oduncte', 'iade_edildi', 'gecikti', 'iptal')),
  fine_amount NUMERIC(10, 2) DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 6) İNDEKSLER
CREATE INDEX idx_kitaplar_adi ON kitaplar (kitap_adi);
CREATE INDEX idx_kitaplar_isbn ON kitaplar (isbn);
CREATE INDEX idx_kullanicilar_email ON kullanicilar (email);
CREATE INDEX idx_odunc_active ON odunc_islemleri (status) WHERE status = 'oduncte';
