export const apiUrl = (path) => {
  const base = (import.meta.env.VITE_API_BASE_URL || "").replace(/\/$/, "");
  return base ? `${base}${path}` : path;
};

async function parseJsonResponse(response) {
  const text = await response.text();
  let data;
  try {
    data = text ? JSON.parse(text) : null;
  } catch {
    throw new Error(text || "Geçersiz sunucu yanıtı");
  }
  if (!response.ok) {
    const msg =
      (data && (data.error || data.mesaj)) || text || response.statusText;
    throw new Error(typeof msg === "string" ? msg : "İstek başarısız");
  }
  return data;
}

const formatBookData = (b, i) => {
  // ARTIK ID OLARAK VERİTABANINDAKİ UUID'Yİ KULLANIYORUZ
  const id = b.id || `local-${i}`;
  const isbnRaw = b.isbn != null ? String(b.isbn).trim() : "";
  const digits = isbnRaw.replace(/\D/g, "");

  // Kapak resmi önceliği: Veritabanındaki URL -> Yoksa null
  const coverUrl = b.kapak_url || null;

  const title = (b.kitap_adi && String(b.kitap_adi).trim()) || "Başlıksız";
  const authorStr = (b.yazar && String(b.yazar).trim()) || "Bilinmeyen Yazar";
  
  // Kategorileri diziye çevirme
  const categories = b.kategoriler 
    ? String(b.kategoriler).split(',').map(c => c.trim()) 
    : [];

  return {
    id, // Veritabanındaki UUID
    isbn: isbnRaw,
    isbnDigits: digits,
    title,
    authors: [authorStr],
    thumbnail: coverUrl,
    description: b.kitap_aciklamasi || "",
    pageCount: b.sayfa_sayisi,
    publisher: b.yayinevi,
    // YENİ EKLENEN MÜHENDİSLİK ALANLARI
    stockCount: b.stok_adedi || 0,
    availableCount: b.mevcut_adet || 0,
    shelfLocation: b.raf_konumu || "Bilinmiyor",
    status: b.durum || "Bilinmiyor",
    publishYear: b.basim_yili,
    registrationDate: b.kayit_tarihi,
    
    // Google Books yapısıyla uyumlu kalması için volumeInfo objesi
    volumeInfo: {
      title,
      authors: [authorStr],
      publisher: b.yayinevi,
      publishedDate: b.basim_yili ? String(b.basim_yili) : b.yayin_tarihi,
      description: b.kitap_aciklamasi || "",
      pageCount: b.sayfa_sayisi,
      categories,
      imageLinks: {
        thumbnail: coverUrl,
      },
    },
  };
};

export const fetchLocalBooks = async (limit = 50) => {
  const q = limit !== 50 ? `?limit=${limit}` : "";
  const response = await fetch(apiUrl(`/api/kitaplar${q}`));
  const data = await parseJsonResponse(response);
  if (!Array.isArray(data)) throw new Error("Kitap listesi alınamadı");
  return data.map((b, i) => formatBookData(b, i));
};

export const searchLocalBooks = async (query) => {
  if (!query) return [];
  const response = await fetch(
    apiUrl(`/api/kitaplar/ara?q=${encodeURIComponent(query)}`),
  );
  const data = await parseJsonResponse(response);
  if (!Array.isArray(data)) throw new Error("Arama sonucu alınamadı");
  return data.map((b, i) => formatBookData(b, i));
};

export const getLocalBookById = async (id) => {
  // Artık ID parametresi UUID (örn: 550e8400...) bekliyor
  const response = await fetch(apiUrl(`/api/kitaplar/${encodeURIComponent(id)}`));
  const data = await parseJsonResponse(response);
  return formatBookData(data, 0);
};