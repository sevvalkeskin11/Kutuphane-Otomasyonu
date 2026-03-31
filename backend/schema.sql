-- ==========================================
-- 1. TEMİZLİK (Sıfırdan kurulum için)
-- ==========================================
DROP TABLE IF EXISTS odunc_islemleri CASCADE;
DROP TABLE IF EXISTS kitaplar CASCADE;
DROP TABLE IF EXISTS kullanicilar CASCADE;
DROP TYPE IF EXISTS kitap_durumu CASCADE;

-- ==========================================
-- 2. ÖZEL TİPLER (ENUMS)
-- ==========================================
CREATE TYPE kitap_durumu AS ENUM ('Mevcut', 'Ödünç Verildi', 'Hasarlı', 'Kayıp');

-- ==========================================
-- 3. KİTAPLAR TABLOSU
-- ==========================================
CREATE TABLE kitaplar (
    -- Profesyonel UUID kullanımı
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    
    -- Excel/CSV dosyanla tam uyumlu sütunlar
    kitap_adi TEXT NOT NULL,
    yazar TEXT NOT NULL,
    kategoriler TEXT,
    isbn VARCHAR(20), 
    sayfa_sayisi INTEGER,
    yayinevi TEXT,
    kitap_aciklamasi TEXT, -- CSV'de olmasa bile veritabanında dursun, manuel eklenebilir
    
    -- Stok ve Mevcut Adet Mantığı
    stok_adedi INTEGER DEFAULT 0 CHECK (stok_adedi >= 0),
    mevcut_adet INTEGER DEFAULT 0 CHECK (mevcut_adet >= 0),
    
    -- Yeni Mühendislik Detayları
    basim_yili INTEGER,
    raf_konumu VARCHAR(50),
    durum kitap_durumu DEFAULT 'Mevcut',
    
    -- Görsel ve İstatistik (MVP için opsiyonel)
    kapak_url TEXT,
    puan NUMERIC(3,2) DEFAULT 0,
    
    kayit_tarihi TEXT, -- CSV'deki 1/10/2024 formatını bozmamak için TEXT kalsın

    -- Mühendislik Kısıtı: Mevcut stoktan fazla olamaz
    CONSTRAINT chk_mevcut_stok_limit CHECK (mevcut_adet <= stok_adedi)
);

-- ==========================================
-- 4. KULLANICILAR TABLOSU
-- ==========================================
CREATE TABLE kullanicilar (
    id BIGSERIAL PRIMARY KEY,
    full_name TEXT NOT NULL,
    email TEXT NOT NULL UNIQUE,
    password_hash TEXT NOT NULL,
    role TEXT NOT NULL DEFAULT 'uye' CHECK (role IN ('uye', 'admin')),
    is_active BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- ==========================================
-- 5. ÖDÜNÇ İŞLEMLERİ (Relational Yapı)
-- ==========================================
CREATE TABLE odunc_islemleri (
    id BIGSERIAL PRIMARY KEY,
    user_id BIGINT REFERENCES kullanicilar(id) ON DELETE CASCADE,
    -- Kitabı id (UUID) üzerinden bağlamak en güvenlisidir
    kitap_id UUID REFERENCES kitaplar(id) ON DELETE RESTRICT,
    borrow_date DATE DEFAULT CURRENT_DATE,
    due_date DATE NOT NULL,
    return_date DATE,
    status TEXT DEFAULT 'oduncte' CHECK (status IN ('oduncte', 'iade_edildi', 'gecikti', 'iptal')),
    fine_amount NUMERIC(10, 2) DEFAULT 0,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- ==========================================
-- 6. İNDEKSLER (Arama Performansı İçin)
-- ==========================================
CREATE INDEX idx_kitaplar_adi ON kitaplar (kitap_adi);
CREATE INDEX idx_kitaplar_isbn ON kitaplar (isbn);
CREATE INDEX idx_kullanicilar_email ON kullanicilar (email);
CREATE INDEX idx_odunc_active ON odunc_islemleri (status) WHERE status = 'oduncte';