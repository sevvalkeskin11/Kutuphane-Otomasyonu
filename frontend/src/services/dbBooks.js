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
  const isbnRaw = b.isbn != null ? String(b.isbn).trim() : "";
  const digits = isbnRaw.replace(/\D/g, "");

  const customCover = [b.kapak_url, b.kapak_resmi, b.kapak]
    .map((x) => (x != null ? String(x).trim() : ""))
    .find((u) => u.startsWith("http") || u.startsWith("/"));
  // Open Library çoğu Türk ISBN'inde anlamlı kapak vermiyor; kapak için doğrudan backend /api/kapak (Google) kullanılıyor.
  const coverUrl = customCover || null;

  const title = (b.kitap_adi && String(b.kitap_adi).trim()) || "Başlıksız";
  const authorStr =
    b.yazar != null && String(b.yazar).trim() !== ""
      ? String(b.yazar).trim()
      : "";
  const authors = authorStr ? [authorStr] : [];
  const rawCat = b.ilgili_kategoriler ?? b.kategoriler;
  const categories = Array.isArray(rawCat)
    ? rawCat.filter(Boolean)
    : rawCat
      ? [String(rawCat)]
      : [];

  const descRaw =
    b.kitap_aciklamasi ?? b.aciklama ?? b.ozet ?? b.ozet_metin ?? "";
  const description = String(descRaw || "").trim();

  return {
    id: isbnRaw || `local-${i}`,
    isbnDigits: digits.length >= 10 ? digits : "",
    title,
    authors,
    thumbnail: coverUrl,
    description,
    publishedDate: b.yayin_tarihi,
    pageCount: b.sayfa_sayisi,
    publisher: b.yayinevi,
    price: b.fiyat,
    volumeInfo: {
      title,
      authors,
      publisher: b.yayinevi,
      publishedDate: b.yayin_tarihi,
      description,
      pageCount: b.sayfa_sayisi,
      categories,
      imageLinks: {
        thumbnail: coverUrl,
      },
    },
  };
};

export const fetchLocalBooks = async (limit = 50) => {
  const q =
    limit != null && limit !== 50
      ? `?limit=${encodeURIComponent(String(limit))}`
      : "";
  const response = await fetch(apiUrl(`/api/kitaplar${q}`));
  const data = await parseJsonResponse(response);
  if (!Array.isArray(data)) throw new Error("Kitap listesi alınamadı");
  return data.map(formatBookData);
};

export const searchLocalBooks = async (query) => {
  const response = await fetch(
    apiUrl(`/api/kitaplar/ara?q=${encodeURIComponent(query || "")}`),
  );
  const data = await parseJsonResponse(response);
  if (!Array.isArray(data)) throw new Error("Arama sonucu alınamadı");
  return data.map(formatBookData);
};

export const getLocalBookById = async (id) => {
  const response = await fetch(apiUrl(`/api/kitaplar/${encodeURIComponent(id)}`));
  const data = await parseJsonResponse(response);
  return formatBookData(data, 0);
};
