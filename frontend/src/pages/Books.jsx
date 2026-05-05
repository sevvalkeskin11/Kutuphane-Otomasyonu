import { useEffect, useMemo, useState } from "react";
import { useSearchParams } from "react-router-dom";
import BookCard from "../components/BookCard";
import HorizontalBookRow from "../components/HorizontalBookRow";
import Button from "../components/ui/Button";
import Input from "../components/ui/Input";

const CATALOG_SECTIONS = [
  { title: "Biyografi", keywords: ["biyografi", "yaşam öyküsü"] },
  { title: "Çocuk", keywords: ["çocuk"] },
  { title: "Polisiye", keywords: ["polisiye", "gerilim"] },
  { title: "Roman", keywords: ["roman"] },
  { title: "Fantastik", keywords: ["fantastik", "fantezi"] },
  { title: "Bilim kurgu", keywords: ["bilim kurgu", "science fiction"] },
  { title: "Tarih", keywords: ["tarih"] },
  { title: "Kişisel gelişim", keywords: ["kişisel", "gelişim"] },
];

const DEFAULT_CATEGORY_OPTIONS = [
  "Biyografi",
  "Çocuk",
  "Polisiye",
  "Roman",
  "Fantastik",
  "Bilim kurgu",
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

// 1. Arama motorunu kendi veritabanı sütunlarımıza uyarladık
function catalogBookMatches(book, q, cat, author) {
  const title = (book.kitap_adi || "").toLowerCase();
  const authors = (book.yazar || "").toLowerCase();
  const cats = (book.kategoriler || "").toLowerCase();
  const hay = `${title} ${authors} ${cats}`;

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

// 2. Kategori bölümlerini (Roman, Tarih vb.) kendi sütunlarımıza göre ayırdık
function booksForSection(all, keywords, sectionIndex) {
  const lower = keywords.map((k) => k.toLowerCase());
  const picked = all.filter((book) => {
    const cats = (book.kategoriler || "").toLowerCase();
    const title = (book.kitap_adi || "").toLowerCase();
    const blob = `${cats} ${title}`;
    return lower.some((kw) => blob.includes(kw));
  });
  if (picked.length >= 3) return picked.slice(0, 12);
  const n = all.length;
  if (!n) return [];
  const start = (sectionIndex * 11) % n;
  const rotated = [...all.slice(start), ...all.slice(0, start)];
  return rotated.slice(0, 12);
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
    
    fetch("http://localhost:5050/api/kitaplar?limit=200")
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

  const filteredBooks = useMemo(
    () =>
      allBooks.filter((b) =>
        catalogBookMatches(b, query, category, authorFilter),
      ),
    [allBooks, query, category, authorFilter],
  );

  const sectionBooksMap = useMemo(() => {
    const m = {};
    CATALOG_SECTIONS.forEach((s, idx) => {
      m[s.title] = booksForSection(allBooks, s.keywords, idx);
    });
    return m;
  }, [allBooks]);

  // 4. Kategori seçeneklerini senin veritabanındaki verilere göre çeker
  const categoryOptions = useMemo(() => {
    const set = new Set();
    DEFAULT_CATEGORY_OPTIONS.forEach((cat) => set.add(cat));
    allBooks.forEach((book) => {
      const cat = book.kategoriler;
      if (cat) {
        const trimmed = String(cat).trim();
        if (trimmed) set.add(trimmed);
      }
    });
    return [...set].sort((a, b) => a.localeCompare(b, "tr"));
  }, [allBooks]);

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
        <div className="mb-6 flex flex-wrap gap-2">
          {activeFilters.map((item) => (
            <span
              key={item}
              className="rounded-full border border-amber-200 bg-amber-50 px-3 py-1 text-xs font-semibold text-amber-700"
            >
              {item}
            </span>
          ))}
        </div>
      )}

      <div className="mb-10 grid grid-cols-1 gap-6 md:grid-cols-2">
        {CATALOG_SECTIONS.map((s, idx) => (
          <HorizontalBookRow
            key={s.title}
            title={s.title}
            books={sectionBooksMap[s.title] || []}
            loading={loading}
            error=""
            variant="scroll"
            reverse={idx % 2 === 1}
            actionTo={`/katalog?q=${encodeURIComponent(s.keywords[0])}`}
            className="mb-0"
          />
        ))}
      </div>

      <section className="rounded-3xl border border-slate-200/80 bg-gradient-to-b from-white to-slate-50/40 p-5 shadow-lg md:p-6">
        {error && (
          <div className="mb-6 rounded-2xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-800">
            {error}
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
        ) : (
          <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5">
            {gridBooks.map((b) => (
              <BookCard key={b.id} book={b} />
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
    </div>
  );
}
