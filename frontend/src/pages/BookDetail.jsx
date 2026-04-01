import { useEffect, useState } from "react";
import { Link, useParams } from "react-router-dom";
import HorizontalBookRow from "../components/HorizontalBookRow";
import SmartBookCover from "../components/SmartBookCover";
import Button from "../components/ui/Button";
import Card from "../components/ui/Card";
import { fetchLocalBooks, getLocalBookById as getBookById } from "../services/dbBooks";
import { getStockForBook, simulateBorrow } from "../data/mockAdmin";

export default function BookDetail() {
  const { id } = useParams();
  const [book, setBook] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [notice, setNotice] = useState("");
  const [expandedDescription, setExpandedDescription] = useState(false);
  const [similarBooks, setSimilarBooks] = useState([]);
  const [, setStockRev] = useState(0);
  const stock = getStockForBook(id);

  useEffect(() => {
    let cancelled = false;
    setLoading(true);
    setError("");
    getBookById(id)
      .then((b) => {
        if (!cancelled) setBook(b);
      })
      .catch(() => {
        if (!cancelled) setError("Kitap bilgisi alınamadı.");
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });
    return () => {
      cancelled = true;
    };
  }, [id]);

  function handleBorrow() {
    const ok = simulateBorrow(id);
    if (ok) {
      setStockRev((n) => n + 1);
      setNotice(
        "Odunc islemi kaydedildi (demo). Backend baglandiginda kalici olacak.",
      );
    } else {
      setNotice("Stokta uygun kopya yok.");
    }
  }

  useEffect(() => {
    if (!book) return;
    let cancelled = false;
    const mainAuthor = (book.authors?.[0] || "").toLowerCase();
    const categories = (book.volumeInfo?.categories || []).map((c) => c.toLowerCase());

    fetchLocalBooks(120)
      .then((items) => {
        if (cancelled) return;
        const related = items
          .filter((candidate) => candidate.id !== book.id)
          .filter((candidate) => {
            const candidateCats = (
              candidate.volumeInfo?.categories || []
            ).map((c) => c.toLowerCase());
            const candidateAuthor = (candidate.authors?.[0] || "").toLowerCase();
            const categoryMatch = candidateCats.some((cat) => categories.includes(cat));
            const authorMatch = Boolean(mainAuthor && candidateAuthor.includes(mainAuthor));
            return categoryMatch || authorMatch;
          })
          .slice(0, 12);
        setSimilarBooks(related);
      })
      .catch(() => {
        if (!cancelled) setSimilarBooks([]);
      });

    return () => {
      cancelled = true;
    };
  }, [book]);

  if (loading) {
    return (
      <div className="mx-auto max-w-4xl px-4 py-16 md:px-6">
        <div className="animate-pulse rounded-card bg-white p-8 shadow-card">
          <div className="h-80 max-w-xs rounded-lg bg-ink/10" />
        </div>
      </div>
    );
  }

  if (error || !book) {
    return (
      <div className="mx-auto max-w-4xl px-4 py-16 text-center md:px-6">
        <p className="text-ink/60">{error || "Kitap bulunamadı."}</p>
        <Link
          to="/katalog"
          className="mt-4 inline-block font-semibold text-accent"
        >
          Kataloga dön
        </Link>
      </div>
    );
  }

  const authorLine = book.authors?.join(", ") || "Bilinmeyen yazar";
  const hasCover = Boolean(book.thumbnail);
  const desc = book.description || "Bu kitap için özet bilgisi bulunmuyor.";
  const shouldTrim = desc.length > 900;
  const shownDesc = !shouldTrim || expandedDescription ? desc : `${desc.slice(0, 900)}...`;

  return (
    <div className="mx-auto max-w-4xl px-4 py-10 md:px-6 md:py-14">
      <Link
        to="/katalog"
        className="mb-6 inline-flex text-sm font-medium text-ink/55 hover:text-accent"
      >
        ← Katalog
      </Link>

      {!hasCover && (
        <p className="mb-6 rounded-lg border border-ink/10 bg-surface px-4 py-3 text-sm text-ink/55">
          Bu kayıt için veritabanında kapak URL’si tanımlı değil; listede başlık ile
          gösterilir.
        </p>
      )}

      <Card as="article" className="overflow-hidden md:flex">
        <div className="flex justify-center bg-gradient-to-br from-surface to-ink/[0.04] p-8 md:w-[320px] md:shrink-0">
          <div className="flex w-full max-w-[260px] min-h-[200px] items-stretch">
            <SmartBookCover
              src={book.thumbnail}
              fallbackSrc={book.coverFallbackUrl}
              title={book.title}
              variant="detail"
              alt={`${book.title} kitap kapagi`}
              imageClassName="max-h-[420px] w-full rounded-lg object-contain shadow-card"
            />
          </div>
        </div>
        <div className="flex flex-1 flex-col p-8">
          <h1 className="text-2xl font-bold leading-tight text-ink md:text-3xl">
            {book.title}
          </h1>
          <p className="mt-2 text-lg text-ink/65">{authorLine}</p>
          <div className="mt-4 flex flex-wrap gap-2">
            {book.publishedDate && (
              <span className="rounded-full bg-ink/5 px-3 py-1 text-xs text-ink/65">
                Yayin: {book.publishedDate}
              </span>
            )}
            {book.pageCount != null && (
              <span className="rounded-full bg-ink/5 px-3 py-1 text-xs text-ink/65">
                Sayfa: {book.pageCount}
              </span>
            )}
          </div>

          <div className="mt-6 flex flex-wrap items-center gap-3">
            <span
              className={`inline-flex items-center rounded-full px-3 py-1 text-sm font-semibold ${
                stock.inStock
                  ? "bg-emerald-100 text-emerald-800"
                  : "bg-ink/10 text-ink/60"
              }`}
            >
              {stock.inStock ? "Stokta var" : "Stokta yok"}
            </span>
            {stock.inStock && (
              <span className="text-sm text-ink/50">
                {stock.copies} kopya (demo)
              </span>
            )}
          </div>

          <p className="mt-6 text-sm leading-relaxed text-ink/75 md:text-base">
            {shownDesc}
          </p>
          {shouldTrim && (
            <Button
              variant="ghost"
              className="mt-2 w-fit px-0 text-sm"
              onClick={() => setExpandedDescription((v) => !v)}
            >
              {expandedDescription ? "Daha az goster" : "Devamini oku"}
            </Button>
          )}

          <div className="mt-8 flex flex-wrap gap-3">
            <Button
              disabled={!stock.inStock}
              onClick={handleBorrow}
              size="lg"
            >
              Odunc al
            </Button>
          </div>
          {notice && (
            <p className="mt-3 rounded-lg border border-ink/10 bg-surface px-3 py-2 text-sm text-ink/70">
              {notice}
            </p>
          )}
          <p className="mt-3 text-xs text-ink/40">
            Stok bilgisi şu an örnek veridir; veritabanı entegrasyonu sonrası
            gerçek zamanlı olacaktır.
          </p>
        </div>
      </Card>
      {similarBooks.length > 0 && (
        <div className="mt-10">
          <HorizontalBookRow
            title="Benzer kitaplar"
            subtitle="Ayni yazar veya benzer kategorilerden secildi."
            books={similarBooks}
            loading={false}
            error=""
            variant="scroll"
          />
        </div>
      )}
    </div>
  );
}
