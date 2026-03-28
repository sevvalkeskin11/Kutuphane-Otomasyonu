import { useEffect, useMemo, useState } from "react";
import { useSearchParams } from "react-router-dom";
import BookCard from "../components/BookCard";
import HorizontalBookRow from "../components/HorizontalBookRow";
import { fetchLocalBooks } from "../services/dbBooks";

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

function catalogBookMatches(book, q, cat, author) {
  const title = (book.title || "").toLowerCase();
  const authors = (book.authors || []).join(" ").toLowerCase();
  const cats = (book.volumeInfo?.categories || []).join(" ").toLowerCase();
  const hay = `${title} ${authors} ${cats}`;

  if (q.trim()) {
    const words = q
      .toLowerCase()
      .split(/\s+/)
      .filter(Boolean);
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

function booksForSection(all, keywords, sectionIndex) {
  const lower = keywords.map((k) => k.toLowerCase());
  const picked = all.filter((book) => {
    const cats = (book.volumeInfo?.categories || []).join(" ").toLowerCase();
    const title = (book.title || "").toLowerCase();
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
  const initialQ = normalizeCatalogQuery(searchParams.get("q") || "");
  const [query, setQuery] = useState(initialQ);
  const [category, setCategory] = useState("");
  const [authorFilter, setAuthorFilter] = useState("");
  const [allBooks, setAllBooks] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    setQuery(normalizeCatalogQuery(searchParams.get("q") || ""));
  }, [searchParams]);

  useEffect(() => {
    let cancelled = false;
    setLoading(true);
    setError("");
    fetchLocalBooks(200)
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

  function applySearch(e) {
    e.preventDefault();
    const p = new URLSearchParams();
    if (query.trim()) p.set("q", query.trim());
    setSearchParams(p);
  }

  const gridBooks = filteredBooks.slice(0, 40);

  return (
    <div className="mx-auto max-w-6xl px-4 py-10 md:px-6 md:py-14">
      <h1 className="mb-2 text-3xl font-bold tracking-tight text-ink">
        Kitap kataloğu
      </h1>
      <p className="mb-10 max-w-2xl text-ink/60">
        Kayıtlar PostgreSQL veritabanınızdaki <code className="text-ink/80">kitaplar</code>{" "}
        tablosundan gelir. Arama ve filtreler bu liste üzerinde çalışır.
      </p>

      <div className="mb-10">
        <div className="grid grid-cols-1 gap-6 md:grid-cols-2">
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
      </div>

      <div className="mb-10 flex flex-col gap-8 lg:flex-row">
        <aside className="w-full shrink-0 rounded-card bg-white p-6 shadow-card lg:w-64">
          <h2 className="mb-4 text-sm font-bold uppercase tracking-wider text-ink/50">
            Filtreler
          </h2>
          <form onSubmit={applySearch} className="space-y-4">
            <div>
              <label className="mb-1 block text-xs font-medium text-ink/70">
                Arama
              </label>
              <input
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                placeholder="Başlık, yazar veya kategori"
                className="w-full rounded-lg border border-ink/10 bg-surface px-3 py-2 text-sm outline-none focus:border-accent focus:ring-1 focus:ring-accent"
              />
            </div>
            <div>
              <label className="mb-1 block text-xs font-medium text-ink/70">
                Kategori (metin)
              </label>
              <input
                value={category}
                onChange={(e) => setCategory(e.target.value)}
                placeholder="ör. roman, tarih"
                className="w-full rounded-lg border border-ink/10 bg-surface px-3 py-2 text-sm outline-none focus:border-accent focus:ring-1 focus:ring-accent"
              />
            </div>
            <div>
              <label className="mb-1 block text-xs font-medium text-ink/70">
                Yazar
              </label>
              <input
                value={authorFilter}
                onChange={(e) => setAuthorFilter(e.target.value)}
                placeholder="Yazar adı"
                className="w-full rounded-lg border border-ink/10 bg-surface px-3 py-2 text-sm outline-none focus:border-accent focus:ring-1 focus:ring-accent"
              />
            </div>
            <button
              type="submit"
              className="w-full rounded-lg bg-night py-2.5 text-sm font-semibold text-white hover:bg-nightLight"
            >
              URL ile kaydet
            </button>
          </form>
        </aside>

        <div className="min-w-0 flex-1">
          {error && (
            <div className="mb-6 rounded-card border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-800">
              {error}
            </div>
          )}
          {loading ? (
            <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5">
              {Array.from({ length: 10 }).map((_, i) => (
                <div
                  key={i}
                  className="aspect-[2/3] animate-pulse rounded-card bg-white shadow-card"
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
          {!loading && !error && gridBooks.length === 0 && (
            <p className="text-center text-ink/50">
              Sonuç bulunamadı. Filtreleri değiştirmeyi veya veritabanına kayıt
              eklemeyi deneyin.
            </p>
          )}
        </div>
      </div>
    </div>
  );
}
