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

/** Metin içinden ilk http(s) adresini çıkarır (hücrede ek yazı varsa). */
function extractHttpUrlFromText(s) {
  const m = String(s).match(/https?:\/\/[^\s"'<>[\]()]+/i);
  if (!m) return null;
  return m[0].replace(/[),.;:]+$/g, "");
}

/** Veritabanı hücresindeki görsel adresini tek biçimde döndürür. */
function normalizeCoverUrl(raw) {
  let u = raw != null ? String(raw).trim() : "";
  if (!u) return null;
  u = u.replace(/^['"]+|['"]+$/g, "").trim();
  u = u.replace(/&amp;/gi, "&");
  u = u.replace(/\s/g, "%20");
  if (u.startsWith("//")) u = `https:${u}`;
  if (/^www\./i.test(u)) u = `https://${u}`;
  if (u.startsWith("http")) return u;
  if (u.startsWith("/")) return u;
  // example.com/path/to.jpg (şema yok)
  if (/^[\w.-]+\.[a-z]{2,}\/\S+/i.test(u)) return `https://${u}`;
  const extracted = extractHttpUrlFromText(u);
  if (extracted) return extracted;
  return null;
}

function looksLikeImageHttpUrl(u) {
  if (!u || !/^https?:\/\//i.test(u)) return false;
  const path = u.split(/[?#]/)[0].toLowerCase();
  if (/\.(jpe?g|png|gif|webp|bmp|svg|avif)(\?|$)/i.test(path)) return true;
  if (
    /\/(img|images|image|photos|media|covers|kapak|upload|static|cdn|files|assets|storage)\b/i.test(
      path,
    )
  )
    return true;
  return false;
}

/** Göreli kapak yolları (/uploads/…) için tam kök; yoksa tarayıcı Vite portuna gider ve 404 olur. */
function absolutizeMediaUrl(u) {
  if (!u) return null;
  if (!u.startsWith("/")) return u;

  const coverBase = (import.meta.env.VITE_COVER_BASE_URL || "").replace(
    /\/$/,
    "",
  );
  if (coverBase) return `${coverBase}${u}`;

  const apiBase = (import.meta.env.VITE_API_BASE_URL || "").replace(/\/$/, "");
  if (apiBase) return `${apiBase}${u}`;

  // Geliştirme: API proxy ile /api aynı backend’e gider; görseller genelde backend’de statik
  if (import.meta.env.DEV) return `http://127.0.0.1:5000${u}`;

  return u;
}

/** Uzak http(s) adreslerini backend proxy üzerinden verir (hotlink / Referer sorunları için). */
function proxifiedCoverUrl(u) {
  if (!u || import.meta.env.VITE_COVER_USE_PROXY !== "true") return u;
  if (!/^https?:\/\//i.test(u)) return u;
  return apiUrl(`/api/cover-proxy?url=${encodeURIComponent(u)}`);
}

const TEXT_FIELD_KEYS = new Set([
  "kitap_adi",
  "yazar",
  "yayinevi",
  "kitap_aciklamasi",
  "aciklama",
  "ozet",
  "ozet_metin",
  "ilgili_kategoriler",
  "kategoriler",
  "yayin_tarihi",
]);

function pickCoverUrlFromRow(b) {
  if (!b || typeof b !== "object") return null;

  const byLower = {};
  for (const k of Object.keys(b)) {
    byLower[k.toLowerCase()] = b[k];
  }

  const coverCol = import.meta.env.VITE_COVER_COLUMN?.trim();
  if (coverCol) {
    const raw = byLower[coverCol.toLowerCase()] ?? b[coverCol];
    const v = normalizeCoverUrl(raw);
    if (v) return v;
  }

  const orderedKeys = [
    "kapak_url",
    "kapak_adresi",
    "kapak_resmi",
    "kapak",
    "kapak_link",
    "kapak_gorsel",
    "kitap_kapak",
    "resim_url",
    "resim_link",
    "gorsel_url",
    "gorsel_link",
    "görsel_url",
    "görsel",
    "kitap_resmi",
    "kitap_gorsel",
    "image_url",
    "cover_url",
    "cover",
    "foto_url",
    "foto",
    "thumbnail_url",
    "thumb_url",
    "picture_url",
    "resim",
    "gorsel",
    "book_cover",
    "bookcover",
    "coverimage",
    "img_url",
    "imgurl",
    "img",
    "photo_url",
    "photourl",
    "dosya_yolu",
    "filepath",
    "file_path",
    "uri",
    "href",
    "link",
    "url_resim",
    "resim_adresi",
    "url",
  ];
  for (const k of orderedKeys) {
    const raw = byLower[k] ?? b[k];
    const v = normalizeCoverUrl(raw);
    if (!v) continue;
    // "url/link/href/uri" alanları çoğu kayıtta ürün sayfası olabilir.
    // Bu alanlardan gelen değerleri sadece görsel benzeri ise kabul et.
    if (/^(url|link|href|uri)$/i.test(k) && !looksLikeImageHttpUrl(v)) {
      continue;
    }
    return v;
  }

  const genericUrl = normalizeCoverUrl(byLower.url ?? b.url);
  if (
    genericUrl &&
    (genericUrl.startsWith("/") || looksLikeImageHttpUrl(genericUrl))
  ) {
    return genericUrl;
  }

  for (const [key, val] of Object.entries(b)) {
    const kl = key.toLowerCase();
    if (TEXT_FIELD_KEYS.has(kl)) continue;
    if (
      !/(kapak|resim|gorsel|görsel|image|cover|thumb|foto|picture|photo|avatar|banner|dosya|file|path|link|url|uri|src|media)/.test(
        kl,
      )
    )
      continue;
    const v = normalizeCoverUrl(val);
    if (v && (looksLikeImageHttpUrl(v) || /^https?:\/\//i.test(v))) return v;
  }

  for (const val of Object.values(b)) {
    const v = normalizeCoverUrl(val);
    if (v && looksLikeImageHttpUrl(v)) return v;
  }

  for (const [key, val] of Object.entries(b)) {
    const kl = key.toLowerCase();
    if (TEXT_FIELD_KEYS.has(kl)) continue;
    const str = val != null ? String(val) : "";
    if (str.length < 12 || str.length > 4000) continue;
    const ex = extractHttpUrlFromText(str);
    if (ex && looksLikeImageHttpUrl(ex)) return ex;
  }

  const aciklamaBlob = [
    b.kitap_aciklamasi,
    b.aciklama,
    b.ozet,
    b.ozet_metin,
  ]
    .filter(Boolean)
    .map((x) => String(x).slice(0, 2500))
    .join(" ");
  const fromDesc = extractHttpUrlFromText(aciklamaBlob);
  if (fromDesc && looksLikeImageHttpUrl(fromDesc)) return fromDesc;

  return null;
}

/** Kapak URL’si çözümlenen (görsel kullanılabilir) kitaplar. */
export function filterBooksWithCoverUrl(books) {
  return (books || []).filter((b) => Boolean(b?.thumbnail));
}

/**
 * Open Library kapak URL’si (anahtar gerekmez).
 * ISBN-10 son hanesi X ise korunur; yalnızca rakam kullanılırsa X kaybolurdu.
 */
export function openLibraryCoverByIsbn(isbnRaw) {
  if (isbnRaw == null || String(isbnRaw).trim() === "") return null;
  const compact = String(isbnRaw).replace(/[\s-]/g, "").toUpperCase();
  if (/^\d{9}[\dX]$/.test(compact)) {
    return `https://covers.openlibrary.org/b/isbn/${compact}-M.jpg`;
  }
  const digits = compact.replace(/\D/g, "");
  if (digits.length >= 13) {
    return `https://covers.openlibrary.org/b/isbn/${digits.slice(0, 13)}-M.jpg`;
  }
  if (digits.length >= 10) {
    return `https://covers.openlibrary.org/b/isbn/${digits.slice(0, 10)}-M.jpg`;
  }
  return null;
}

const formatBookData = (b, i) => {
  const isbnRaw = b.isbn != null ? String(b.isbn).trim() : "";
  const digits = isbnRaw.replace(/\D/g, "");

  const forceOl =
    import.meta.env.VITE_FORCE_OPENLIBRARY_COVER === "true" ||
    import.meta.env.VITE_FORCE_OPENLIBRARY_COVER === "1";
  const fromDb = forceOl ? null : absolutizeMediaUrl(pickCoverUrlFromRow(b));
  const disableOl =
    import.meta.env.VITE_DISABLE_OPENLIBRARY_COVER === "true" ||
    import.meta.env.VITE_DISABLE_OPENLIBRARY_COVER === "1";
  const olUrl = !disableOl ? openLibraryCoverByIsbn(isbnRaw) : null;
  const primaryRaw = fromDb || olUrl;
  const coverUrl = proxifiedCoverUrl(primaryRaw);

  /** DB adresi kırıksa <img onError> ile Open Library denensin */
  let coverFallbackUrl = null;
  if (fromDb && olUrl) {
    const a = fromDb.split(/[?#]/)[0].toLowerCase().replace(/\/+$/, "");
    const b = olUrl.split(/[?#]/)[0].toLowerCase().replace(/\/+$/, "");
    if (a !== b) coverFallbackUrl = proxifiedCoverUrl(olUrl);
  }

  if (
    import.meta.env.VITE_BOOKS_DEBUG === "true" &&
    i === 0 &&
    typeof window !== "undefined"
  ) {
    const picked = pickCoverUrlFromRow(b);
    console.info("[dbBooks] Örnek satır sütunları:", Object.keys(b));
    console.info(
      "[dbBooks] DB kapak (pickCover → absolutize):",
      picked,
      "→",
      absolutizeMediaUrl(picked),
    );
    console.info(
      "[dbBooks] Son kapak:",
      coverUrl,
      "yedek:",
      coverFallbackUrl || "(yok)",
      fromDb ? "(önce DB)" : olUrl ? "(önce OL)" : "(yok)",
    );
  }

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
    coverFallbackUrl,
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
        fallback: coverFallbackUrl || undefined,
      },
    },
  };
};

export const fetchLocalBooks = async (limit = 200) => {
  const n = Math.min(Math.max(Number(limit) || 200, 1), 200);
  const response = await fetch(apiUrl(`/api/kitaplar?limit=${encodeURIComponent(String(n))}`));
  const data = await parseJsonResponse(response);
  if (!Array.isArray(data)) throw new Error("Kitap listesi alınamadı");
  return filterBooksWithCoverUrl(data.map(formatBookData));
};

export const searchLocalBooks = async (query) => {
  const response = await fetch(
    apiUrl(`/api/kitaplar/ara?q=${encodeURIComponent(query || "")}`),
  );
  const data = await parseJsonResponse(response);
  if (!Array.isArray(data)) throw new Error("Arama sonucu alınamadı");
  return filterBooksWithCoverUrl(data.map(formatBookData));
};

export const getLocalBookById = async (id) => {
  const response = await fetch(apiUrl(`/api/kitaplar/${encodeURIComponent(id)}`));
  const data = await parseJsonResponse(response);
  return formatBookData(data, 0);
};
