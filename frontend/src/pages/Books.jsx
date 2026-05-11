import { useEffect, useMemo, useState } from "react";
import { useSearchParams } from "react-router-dom";
import { CATALOG_BOOKS_FETCH_LIMIT } from "../config/perfTuning";
import { apiFetch } from "../services/apiFetch";
import BookCard, { bookListKey } from "../components/BookCard";
import HorizontalBookRow from "../components/HorizontalBookRow";
import Button from "../components/ui/Button";
import Input from "../components/ui/Input";

// Backend /api/kategoriler erişilemediğinde gösterilecek emniyetli liste.
const FALLBACK_CATEGORIES = [
  "Roman",
  "Çocuk",
  "Polisiye",
  "Fantastik",
  "Bilim kurgu",
  "Tarih",
  "Türk klasiği",
  "Dünya klasiği",
];

function normalizeCatalogQuery(q) {
  if (!q) return "";
  const m = q.match(/subject:\s*([^+&]+)/i);
  if (m) {
    try {
      return decodeURIComponent(m[1].replace(/\+/g, " "));
    } catch {
      return m[1].replace(/\+/g, " ");
    }
  }
  return q;
}

// 1. Arama motorunu kendi veritabanı sütunlarımıza uyarladık (AÇIKLAMA EKLENDİ)
function catalogBookMatches(book, q, cat, author) {
  const title = (book.kitap_adi || "").toLowerCase();
  const authors = (book.yazar || "").toLowerCase();
  const cats = (book.kategoriler || "").toLowerCase();
  const desc = (book.aciklama || book.ozet || "").toLowerCase(); // YENİ: Özetleri de alıyoruz
  const hay = `${title} ${authors} ${cats} ${desc}`; // YENİ: desc aramaya dahil edildi

  if (q.trim()) {
    const words = q.toLowerCase().split(/\s+/).filter(Boolean);
    if (words.length && !words.every((w) => hay.includes(w))) return false;
  }
  if (cat.trim()) {
    const c = cat.toLowerCase();
    if (!cats.includes(c) && !title.includes(c)) return false;
  }
  if (author.trim()) {
    if (!authors.includes(author.toLowerCase())) return false;
  }
  return true;
}

// Bir kategori ismini kök başlığına indirger: "Bilim kurgu/macera" → "Bilim kurgu"
function extractRootCategory(categoryName) {
  return String(categoryName || "").split("/")[0].trim();
}

// Bir kitabın `kategoriler` hücresinden tüm kök kategorileri çıkarır.
// Örn. "Distopya/bilim kurgu, Roman/suç" → ["Distopya", "Roman"]
function bookRootCategories(book) {
  const raw = (book?.kategoriler || "").toString().trim();
  if (!raw) return [];
  return raw
    .split(",")
    .map((part) => extractRootCategory(part).toLowerCase())
    .filter(Boolean);
}

// Verilen kök kategoriye ait kitapları döndürür.
function booksForRoot(all, rootName, limit = 12) {
  const target = rootName.trim().toLowerCase();
  if (!target) return [];
  return all
    .filter((book) => bookRootCategories(book).includes(target))
    .slice(0, limit);
}

export default function Books() {
  const [searchParams, setSearchParams] = useSearchParams();
  const [query, setQuery] = useState(
    normalizeCatalogQuery(searchParams.get("q") || ""),
  );
  const [category, setCategory] = useState(searchParams.get("category") || "");
  const [authorFilter, setAuthorFilter] = useState(
    searchParams.get("author") || "",
  );
  const [allBooks, setAllBooks] = useState([]);
  const [serverCategories, setServerCategories] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [visibleCount, setVisibleCount] = useState(40);
  const [searchFocused, setSearchFocused] = useState(false);

  useEffect(() => {
    setQuery(normalizeCatalogQuery(searchParams.get("q") || ""));
    setCategory(searchParams.get("category") || "");
    setAuthorFilter(searchParams.get("author") || "");
    setVisibleCount(40);
  }, [searchParams]);

  // 3. Sahte servis yerine gerçek Backend'e (PostgreSQL) bağlanıyoruz
  useEffect(() => {
    let cancelled = false;
    setLoading(true);
    setError("");
    
    apiFetch(
      `/api/kitaplar?limit=${encodeURIComponent(String(CATALOG_BOOKS_FETCH_LIMIT))}`,
    )
      .then((res) => {
        if (!res.ok) throw new Error("Sunucudan veri alınamadı");
        return res.json();
      })
      .then((data) => {
        if (!cancelled) setAllBooks(data);
      })
      .catch((err) => {
        if (!cancelled)
          setError(
            err.message ||
              "Kitaplar yüklenemedi. PostgreSQL ve backend'in çalıştığından emin olun.",
          );
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });
      
    return () => {
      cancelled = true;
    };
  }, []);

  // Kategori listesini backend'den çek (GET /api/kategoriler).
  // Backend hata verirse useMemo'daki kitap-türetimli liste fallback olur.
  useEffect(() => {
    let cancelled = false;
    apiFetch("/api/kategoriler")
      .then((res) => (res.ok ? res.json() : []))
      .then((data) => {
        if (!cancelled && Array.isArray(data)) setServerCategories(data);
      })
      .catch(() => {
        /* sessizce yut: fallback devreye girer */
      });
    return () => {
      cancelled = true;
    };
  }, []);

  const filteredBooks = useMemo(
    () =>
      allBooks.filter((b) =>
        catalogBookMatches(b, query, category, authorFilter),
      ),
    [allBooks, query, category, authorFilter],
  );

  // Kök kategori şeritleri: 52 alt kategoriyi "/" ile bölüp ana türlere indirgiyoruz.
  // ("Bilim kurgu/macera" → "Bilim kurgu", "Çocuk/felsefe" → "Çocuk", vb.)
  const categorySections = useMemo(() => {
    const source = serverCategories.length > 0 ? serverCategories : FALLBACK_CATEGORIES;

    // Tüm kök isimleri tekilleştir, ekran adını korumak için ilk gördüğümüz biçimi al.
    const seen = new Map(); // lowercase → display
    for (const item of source) {
      const root = extractRootCategory(item);
      if (!root) continue;
      const lc = root.toLowerCase();
      if (!seen.has(lc)) seen.set(lc, root);
    }

    // Veride yoksa kategoriler listesinde olmayıp ama kitaplarda var olan kökler de görünsün
    for (const book of allBooks) {
      for (const lc of bookRootCategories(book)) {
        if (!seen.has(lc)) seen.set(lc, lc.charAt(0).toUpperCase() + lc.slice(1));
      }
    }

    const sorted = [...seen.values()].sort((a, b) => a.localeCompare(b, "tr"));

    return sorted
      .map((name) => ({ name, books: booksForRoot(allBooks, name, 12) }))
      .filter((s) => s.books.length > 0);
  }, [serverCategories, allBooks]);

// 4. Kategori seçenekleri: Slash (/) ve virgül (,) temizliği yapıldı!
  const categoryOptions = useMemo(() => {
    const set = new Set();

    const kategorileriTemizleVeEkle = (catString) => {
      if (!catString) return;
      String(catString)
        .split(/[,/]/) // Hem virgül hem slash'ten böler
        .map((part) => part.trim())
        .filter(Boolean)
        .forEach((part) => {
          const formatli = part.charAt(0).toUpperCase() + part.slice(1).toLowerCase();
          set.add(formatli);
        });
    };

    if (serverCategories.length > 0) {
      serverCategories.forEach(kategorileriTemizleVeEkle);
    } else {
      allBooks.forEach((book) => {
        kategorileriTemizleVeEkle(book.kategoriler);
      });
    }

    return [...set].sort((a, b) => a.localeCompare(b, "tr"));
  }, [serverCategories, allBooks]);

  // 5. Arama yaparken çıkan hızlı önerileri (dropdown) kendi verimize göre ayarladık
  const quickSuggestions = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) return [];
    const pool = [];
    allBooks.forEach((book) => {
      if (book.kitap_adi) pool.push(book.kitap_adi);
      if (book.yazar) pool.push(book.yazar);
      if (book.kategoriler) pool.push(book.kategoriler);
    });
    return [...new Set(pool)]
      .filter((item) => item.toLowerCase().includes(q))
      .slice(0, 7);
  }, [allBooks, query]);

  function applySearch(e) {
    e.preventDefault();
    const p = new URLSearchParams();
    if (query.trim()) p.set("q", query.trim());
    if (category.trim()) p.set("category", category.trim());
    if (authorFilter.trim()) p.set("author", authorFilter.trim());
    setSearchParams(p);
  }

  function clearFilters() {
    setQuery("");
    setCategory("");
    setAuthorFilter("");
    setSearchParams(new URLSearchParams());
  }

  function applySuggestion(value) {
    setQuery(value);
    const p = new URLSearchParams();
    p.set("q", value);
    if (category.trim()) p.set("category", category.trim());
    if (authorFilter.trim()) p.set("author", authorFilter.trim());
    setSearchParams(p);
    setSearchFocused(false);
  }

  const activeFilters = [
    query.trim() ? `Arama: ${query.trim()}` : "",
    category.trim() ? `Kategori: ${category.trim()}` : "",
    authorFilter.trim() ? `Yazar: ${authorFilter.trim()}` : "",
  ].filter(Boolean);

  const gridBooks = filteredBooks.slice(0, visibleCount);
  const hasMore = filteredBooks.length > gridBooks.length;
  return (
    <div className="mx-auto max-w-6xl px-4 py-10 md:px-6 md:py-14">
      <section
        className="relative mx-auto mb-10 min-h-[250px] max-w-5xl overflow-hidden rounded-panel border border-white/35 bg-white/10 p-5 shadow-card backdrop-blur-sm md:min-h-[280px] md:p-7"
        style={{
          backgroundImage: "url('/arama1.jpg')",
          backgroundSize: "cover",
          backgroundPosition: "center",
        }}
      >
        <div className="absolute inset-0 bg-black/10 backdrop-blur-[1.5px]" />
        <p className="relative mx-auto max-w-3xl text-center text-base font-semibold leading-relaxed text-white md:text-[1.1rem]">
          Kütüphanemizde bulunan mevcut kitapların müsaitlik durumunu öğrenin.
          Başlık, kategori veya yazara göre arayarak uygun kitapları hızla
          keşfedin.
        </p>
        <form onSubmit={applySearch} className="relative mt-7">
          <div className="flex flex-col gap-2 md:flex-row md:items-center">
            <div className="relative flex-1">
              <svg
                className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-white/75"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                aria-hidden
              >
                <path
                  d="M21 21l-4.35-4.35M11 18a7 7 0 100-14 7 7 0 000 14z"
                  strokeWidth="1.8"
                  strokeLinecap="round"
                />
              </svg>
              <input
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                onFocus={() => setSearchFocused(true)}
                onBlur={() => setTimeout(() => setSearchFocused(false), 120)}
                placeholder="Kitap adı, yazar veya kategori ile ara..."
                className="h-12 w-full rounded-xl border border-white/60 bg-white/20 pl-10 pr-10 text-sm font-medium text-white outline-none transition placeholder:text-white/70 focus:border-white focus:ring-2 focus:ring-white/30"
              />
              {query.trim() && (
                <button
                  type="button"
                  onClick={() => setQuery("")}
                  className="absolute right-2 top-1/2 -translate-y-1/2 rounded-md px-2 py-1 text-xs font-semibold text-white/90 hover:bg-white/15"
                >
                  Temizle
                </button>
              )}
            </div>
            <Button
              type="submit"
              variant="primary"
              className="h-12 rounded-xl bg-accent px-6 text-white hover:bg-accentDark"
            >
              Ara
            </Button>
          </div>
          {searchFocused && quickSuggestions.length > 0 && (
            <div className="mt-2 rounded-xl border border-white/30 bg-black/45 p-2 shadow-sm backdrop-blur-sm">
              <p className="px-2 pb-1 text-xs font-semibold uppercase tracking-wide text-white/75">
                Öneriler
              </p>
              <div className="flex flex-wrap gap-2">
                {quickSuggestions.map((item) => (
                  <button
                    key={item}
                    type="button"
                    onMouseDown={(e) => e.preventDefault()}
                    onClick={() => applySuggestion(item)}
                    className="rounded-full border border-white/35 bg-white/20 px-3 py-1 text-xs font-medium text-white hover:bg-white/30"
                  >
                    {item}
                  </button>
                ))}
              </div>
            </div>
          )}

          <div className="mt-3 grid grid-cols-1 gap-3 md:grid-cols-12">
            <div className="md:col-span-4">
              <select
                value={category}
                onChange={(e) => setCategory(e.target.value)}
                className="h-11 w-full rounded-lg border border-white/60 bg-white/20 px-3 text-sm font-medium text-white outline-none transition focus:border-white focus:ring-2 focus:ring-white/30"
              >
                <option value="" className="bg-white text-slate-900">
                  Kategori filtresi (Tüm türler)
                </option>
                {categoryOptions.map((cat) => (
                  <option
                    key={cat}
                    value={cat}
                    className="bg-white text-slate-900"
                  >
                    {cat}
                  </option>
                ))}
              </select>
            </div>
            <div className="md:col-span-4">
              <Input
                value={authorFilter}
                onChange={(e) => setAuthorFilter(e.target.value)}
                placeholder="Yazar filtresi"
                className="h-11 border-white/60 bg-white/20 text-sm font-medium text-white placeholder:text-white/70"
              />
            </div>
            <div className="md:col-span-4 flex items-center justify-end gap-4">
              <Button
                type="button"
                variant="ghost"
                onClick={clearFilters}
                className="text-sm font-semibold text-white/90 underline-offset-4 hover:bg-white/15 hover:text-white hover:underline"
              >
                Filtreleri temizle
              </Button>
              {!loading && !error && (
                <span className="text-sm font-semibold text-white/90">
                  {filteredBooks.length} sonuç
                </span>
              )}
            </div>
          </div>
        </form>
      </section>

      {activeFilters.length > 0 && (
        <div className="mb-6 flex flex-wrap items-center gap-2">
          {activeFilters.map((item) => (
            <span
              key={item}
              className="rounded-full border border-amber-200 bg-amber-50 px-3 py-1 text-xs font-semibold text-amber-700"
            >
              {item}
            </span>
          ))}
          <button
            type="button"
            onClick={clearFilters}
            className="ml-1 rounded-full border border-ink/10 bg-white px-3 py-1 text-xs font-semibold text-ink/70 transition hover:bg-ink/[0.04]"
          >
            Filtreleri temizle
          </button>
        </div>
      )}

      {error && (
        <div className="mb-6 rounded-2xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-800">
          {error}
        </div>
      )}

      {/* Filtre/arama varken: arama sonuçları grid'i */}
      {activeFilters.length > 0 && (
        <section className="rounded-3xl border border-slate-200/80 bg-gradient-to-b from-white to-slate-50/40 p-5 shadow-lg md:p-6">
          {!loading && !error && (
            <div className="mb-4 flex items-end justify-between">
              <h2 className="text-lg font-bold text-ink">Arama sonuçları</h2>
              <span className="text-sm font-medium text-ink/55">
                {filteredBooks.length} sonuç
              </span>
            </div>
          )}
          {loading ? (
            <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5">
              {Array.from({ length: 10 }).map((_, i) => (
                <div
                  key={i}
                  className="aspect-[2/3] animate-pulse rounded-2xl bg-slate-100"
                />
              ))}
            </div>
          ) : filteredBooks.length === 0 ? (
            <div className="flex flex-col items-center justify-center rounded-2xl border border-dashed border-ink/15 bg-white px-6 py-12 text-center">
              <p className="text-base font-semibold text-ink">
                Aramanıza uygun kitap bulunamadı
              </p>
              <p className="mt-1 max-w-md text-sm text-ink/55">
                Farklı bir kelime deneyin veya filtreleri temizleyin.
              </p>
              <Button
                variant="secondary"
                className="mt-4"
                onClick={clearFilters}
              >
                Filtreleri temizle
              </Button>
            </div>
          ) : (
            <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5">
              {gridBooks.map((b, i) => (
                <BookCard key={bookListKey(b, i)} book={b} />
              ))}
            </div>
          )}
          {!loading && !error && hasMore && (
            <div className="mt-6 flex justify-center">
              <Button
                variant="secondary"
                onClick={() => setVisibleCount((n) => n + 20)}
              >
                Daha fazla göster
              </Button>
            </div>
          )}
        </section>
      )}

      {/* Filtre yokken: tüm kategoriler iki sütun hizada */}
      {activeFilters.length === 0 && (
        <>
          {!loading && categorySections.length > 0 && (
            <div className="mb-4 flex items-end justify-between">
              <h2 className="text-lg font-bold text-ink">Kategoriler</h2>
              <span className="text-sm text-ink/55">
                {categorySections.length} kategori · {allBooks.length} kitap
              </span>
            </div>
          )}
          <div className="grid grid-cols-1 gap-5 md:grid-cols-2 md:gap-6">
            {categorySections.map((s, idx) => (
              <HorizontalBookRow
                key={s.name}
                title={s.name}
                books={s.books}
                loading={loading}
                error=""
                variant="scroll"
                reverse={idx % 2 === 1}
                actionTo={`/katalog?category=${encodeURIComponent(s.name)}`}
                className="mb-0"
              />
            ))}
          </div>
          {!loading && categorySections.length === 0 && (
            <div className="rounded-2xl border border-dashed border-ink/15 bg-white p-8 text-center text-sm text-ink/55">
              Henüz kategorize edilmiş kitap yok.
            </div>
          )}
        </>
      )}
    </div>
  );
}
