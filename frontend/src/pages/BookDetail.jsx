import { useEffect, useState } from "react";
import { Link, useParams } from "react-router-dom";
import SmartBookCover from "../components/SmartBookCover";
import { getLocalBookById as getBookById } from "../services/dbBooks";
import { getStockForBook, simulateBorrow } from "../data/mockAdmin";

export default function BookDetail() {
  const { id } = useParams();
  const [book, setBook] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
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
      alert(
        "Ödünç işlemi kaydedildi (demo). Backend bağlandığında kalıcı olacak.",
      );
    } else {
      alert("Stokta uygun kopya yok.");
    }
  }

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

  return (
    <div className="mx-auto max-w-4xl px-4 py-10 md:px-6 md:py-14">
      <Link
        to="/katalog"
        className="mb-6 inline-flex text-sm font-medium text-ink/55 hover:text-accent"
      >
        ← Katalog
      </Link>

      <article className="overflow-hidden rounded-card bg-white shadow-card md:flex">
        <div className="flex justify-center bg-gradient-to-br from-surface to-ink/[0.04] p-8 md:w-[320px] md:shrink-0">
          <div className="w-full max-w-[260px]">
            <SmartBookCover
              src={book.thumbnail}
              isbnDigits={book.isbnDigits}
              title={book.title}
              authorLine={authorLine}
              className="min-h-[280px] w-full overflow-hidden rounded-lg shadow-card md:min-h-[360px]"
              imageClassName="max-h-[420px] w-full rounded-lg object-contain shadow-card"
              placeholderClassName="min-h-[280px] md:min-h-[360px]"
            />
          </div>
        </div>
        <div className="flex flex-1 flex-col p-8">
          <h1 className="text-2xl font-bold leading-tight text-ink md:text-3xl">
            {book.title}
          </h1>
          <p className="mt-2 text-lg text-ink/65">{authorLine}</p>
          {book.publishedDate && (
            <p className="mt-1 text-sm text-ink/45">
              Yayın: {book.publishedDate}
            </p>
          )}
          {book.pageCount != null && (
            <p className="mt-4 text-sm font-medium text-ink">
              Sayfa sayısı:{" "}
              <span className="text-ink/70">{book.pageCount}</span>
            </p>
          )}

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

          <p className="mt-6 flex-1 text-sm leading-relaxed text-ink/75 md:text-base">
            {book.description
              ? book.description.length > 900
                ? `${book.description.slice(0, 900)}…`
                : book.description
              : "Bu kitap için özet bilgisi bulunmuyor."}
          </p>

          <div className="mt-8 flex flex-wrap gap-3">
            <button
              type="button"
              disabled={!stock.inStock}
              onClick={handleBorrow}
              className="rounded-lg bg-accent px-6 py-3 font-semibold text-white transition hover:bg-accentDark disabled:cursor-not-allowed disabled:opacity-45"
            >
              Ödünç al
            </button>
          </div>
          <p className="mt-3 text-xs text-ink/40">
            Stok bilgisi şu an örnek veridir; veritabanı entegrasyonu sonrası
            gerçek zamanlı olacaktır.
          </p>
        </div>
      </article>
    </div>
  );
}
