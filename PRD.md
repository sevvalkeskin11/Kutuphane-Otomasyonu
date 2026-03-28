# Proje: Modern Kütüphane Otomasyon Sistemi

## 🚀 Genel Bakış
Bu proje; React (Frontend) ve Node.js (Backend) kullanılarak geliştirilecek, modern bir kütüphane yönetim sistemidir. Tasarım ilhamı **Storytel**'in temiz, minimalist ve kart odaklı yapısından alınacaktır. Kitap verileri dinamik olarak **Google Books API** üzerinden çekilecektir.

## 🎨 Tasarım Rehberi (Storytel Style)
- **Renk Paleti:** Arka planlarda "Off-white" (#F9F9F9), ana metinlerde koyu gri/siyah (#121212), vurgu rengi olarak Storytel turuncusu veya modern bir gece mavisi.
- **Kart Yapısı:** Hafif gölgeli (soft shadow), yuvarlatılmış köşeler (border-radius: 12px) ve üzerine gelindiğinde hafifçe büyüyen (hover scale) kitap kartları.
- **Tipografi:** Sans-serif, okunaklı ve geniş harf arası boşluklar.

## 🛠 Teknik Yığın (Tech Stack)
- **Frontend:** React.js, React Router, Axios, CSS Modules veya Tailwind CSS.
- **Backend:** Node.js, Express.js.
- **Veritabanı:** MongoDB veya PostgreSQL (Kullanıcılar, Ödünç İşlemleri ve Stok takibi için).
- **Veri Kaynağı:** Google Books API.

---

## 🏗️ Sayfa Yapıları ve Görevler

### 1. Kullanıcı Tarafı (User Interface)
* **Anasayfa (Home):** * Üstte geniş bir "Hero" alanı (Arama barı ile birlikte).
    * "Yeni Eklenenler" ve "Trend Kitaplar" yatay kaydırılabilir (horizontal scroll) listeleri.
* **Kayıt ve Giriş (Auth):** * Modern, sade form tasarımları. JWT tabanlı kimlik doğrulama.
* **Kitap Kataloğu (Books):** * Filtreleme paneli (Kategori, Yazar).
    * Google Books API'den gelen verilerin listelendiği grid yapı.
* **Kitap Detay Sayfası:** * Büyük kitap kapağı, özet metni, sayfa sayısı.
    * **Stok Durumu:** Veritabanından kontrol edilen "Stokta Var/Yok" bilgisi.
    * "Ödünç Al" butonu (Eğer stoktaysa).

### 2. Admin Tarafı (Admin Panel)
* **Admin Dashboard:** * İstatistik kartları (Toplam Kitap, Aktif Ödünç, Gecikenler).
    * Basit grafiksel gösterimler.
* **Kullanıcı Yönetimi (ManageUsers):** * Üye listesi, durum güncelleme (Aktif/Pasif), şifre sıfırlama.
* **Ödünç İşlemleri (Transactions):** * Tablo yapısında; Kullanıcı Adı - Kitap - İade Tarihi.
    * "Teslim Alındı" butonu ile stok güncelleme aksiyonu.

---

## 🤖 Cursor İçin Adım Adım Talimatlar (Sırayla Uygula)

1.  **Klasör Yapısı:** Önce temel React ve Node.js klasör yapısını oluştur. Gerekli bağımlılıkları (`axios`, `react-router-dom`, `express`, `mongoose/pg`) kur.
2.  **API Entegrasyonu:** Google Books API'den veri çeken bir servis yaz. `q=subject:fiction` gibi parametrelerle başlangıç verisi getir.
3.  **Tasarım Sistemi:** Storytel'deki gibi tasarım bileşenlerini oluştur.
https://www.storytel.com/tr

4.  **Backend Logic:** Ödünç alma mantığını kur. Bir kitap ödünç alındığında veritabanında `isBorrowed: true` olarak işaretlenmeli ve stoktan düşmeli.
5.  **Admin Paneli:** Admin yetkisi olan kullanıcılar için dashboard ve tablo görünümlerini oluştur.

---

**Not:** Kod yazarken temiz kod (clean code) prensiplerine uy, bileşenleri (components) tekrar kullanılabilir şekilde tasarla.