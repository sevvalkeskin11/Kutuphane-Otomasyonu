import { useEffect, useState } from "react";
import { Link, useParams } from "react-router-dom";
import { SIMILAR_BOOKS_POOL_LIMIT } from "../config/perfTuning";
import HorizontalBookRow from "../components/HorizontalBookRow";
import SmartBookCover from "../components/SmartBookCover";
import Button from "../components/ui/Button";
import Card from "../components/ui/Card";
import { apiUrl } from "../services/dbBooks";
import { apiFetch } from "../services/apiFetch";
import { useAuth } from "../context/AuthContext";

export default function BookDetail() {
  const { id } = useParams(); // URL'den gelen ISBN (BookCard'ı güncellediğimiz için buraya isbn gelecek)
  const { token, isAuthenticated } = useAuth();
  const [book, setBook] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [notice, setNotice] = useState("");
  const [expandedDescription, setExpandedDescription] = useState(false);
  const [similarBooks, setSimilarBooks] = useState([]);

  // Stok durumunu tutmak için
  const [stock, setStock] = useState({ inStock: false, copies: 0 });

  // Favori durumu (sadece giriş yapmış kullanıcılar için anlamlı)
  const [isFavorite, setIsFavorite] = useState(false);
  const [favoriteBusy, setFavoriteBusy] = useState(false);

  // 1. KİTAP BİLGİLERİNİ GERÇEK BACKEND'DEN ÇEK
  useEffect(() => {
    let cancelled = false;
    setLoading(true);
    setError("");
    setNotice("");

    fetch(apiUrl(`/api/kitaplar/${encodeURIComponent(id)}`))
      .then((res) => {
        if (!res.ok) throw new Error("Kitap bulunamadı.");
        return res.json();
      })
      .then((data) => {
        if (!cancelled) {
          setBook(data);
          // Veritabanındaki stok_adedi'ni kullanıyoruz
          setStock({ 
            inStock: data.stok_adedi > 0, 
            copies: data.stok_adedi || 0 
          });
        }
      })
      .catch((err) => {
        if (!cancelled) setError(err.message);
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });

    return () => {
      cancelled = true;
    };
  }, [id]);

  // 2. GERÇEK ÖDÜNÇ ALMA İŞLEMİ (TOKEN İLE)
  async function handleBorrow() {
    setNotice("");

    // Kullanıcı giriş yapmamışsa uyar
    if (!isAuthenticated || !token) {
      setNotice("❌ Ödünç almak için önce giriş yapmalısınız.");
      return;
    }

    try {
      const response = await apiFetch("/api/odunc", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ kitapIsbn: book.isbn }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || "Ödünç alma işlemi başarısız oldu.");
      }

      // Backend başarılı döndüyse stoku güncelle ve mesaj göster
      setStock({ inStock: data.stock.inStock, copies: data.stock.copies });
      setNotice("✅ Kitap başarıyla hesabınıza tanımlandı!");

    } catch (err) {
      setNotice(`❌ Hata: ${err.message}`);
    }
  }

  // 3. KİTAP FAVORİDE Mİ? (Sadece giriş yapmış kullanıcı için)
  useEffect(() => {
    if (!isAuthenticated || !book?.isbn) {
      setIsFavorite(false);
      return;
    }
    let cancelled = false;
    apiFetch("/api/favoriler")
      .then((res) => (res.ok ? res.json() : []))
      .then((favs) => {
        if (cancelled || !Array.isArray(favs)) return;
        setIsFavorite(favs.some((f) => f.isbn === book.isbn));
      })
      .catch(() => {
        /* sessizce geç: kalp boş kalır */
      });
    return () => {
      cancelled = true;
    };
  }, [isAuthenticated, book?.isbn]);

  // Favori ekle/kaldır
  async function toggleFavorite() {
    setNotice("");
    if (!isAuthenticated || !token) {
      setNotice("❌ Favorilere eklemek için önce giriş yapmalısınız.");
      return;
    }
    if (!book?.isbn || favoriteBusy) return;

    setFavoriteBusy(true);
    const wasFavorite = isFavorite;
    // Optimistik güncelleme: kullanıcıya anında geri bildirim
    setIsFavorite(!wasFavorite);

    try {
      const res = wasFavorite
        ? await apiFetch(`/api/favoriler/${encodeURIComponent(book.isbn)}`, {
            method: "DELETE",
          })
        : await apiFetch("/api/favoriler", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ kitapIsbn: book.isbn }),
          });

      if (!res.ok && res.status !== 409) {
        const data = await res.json().catch(() => ({}));
        throw new Error(data?.error || "Favori işlemi başarısız oldu.");
      }
      // 409 (zaten favoride) → optimistik güncelleme zaten doğru
    } catch (err) {
      setIsFavorite(wasFavorite); // geri al
      setNotice(`❌ ${err.message}`);
    } finally {
      setFavoriteBusy(false);
    }
  }

  // 4. BENZER KİTAPLARI KENDİ VERİTABANIMIZDAN GETİR
  useEffect(() => {
    if (!book) return;
    let cancelled = false;

    fetch(
      apiUrl(
        `/api/kitaplar?limit=${encodeURIComponent(String(SIMILAR_BOOKS_POOL_LIMIT))}`,
      ),
    )
      .then((res) => res.json())
      .then((items) => {
        if (cancelled) return;
        
        const mainAuthor = (book.yazar || "").toLowerCase();
        const mainCat = (book.kategoriler || "").toLowerCase();

        const related = items
          .filter((candidate) => candidate.isbn !== book.isbn)
          .filter((candidate) => {
            const candidateCat = (candidate.kategoriler || "").toLowerCase();
            const candidateAuthor = (candidate.yazar || "").toLowerCase();
            
            const categoryMatch = mainCat && candidateCat.includes(mainCat);
            const authorMatch = mainAuthor && candidateAuthor.includes(mainAuthor);
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
        <Link to="/katalog" className="mt-4 inline-block font-semibold text-accent">
          Kataloğa dön
        </Link>
      </div>
    );
  }

  // Veritabanı sütun isimlerine göre değişkenler
  const authorLine = book.yazar || "Bilinmeyen yazar";
  const hasCover = Boolean(book.kapak_url);
  const desc = book.ozet || book.aciklama || "Bu kitap için özet bilgisi bulunmuyor.";
  const shouldTrim = desc.length > 900;
  const shownDesc = !shouldTrim || expandedDescription ? desc : `${desc.slice(0, 900)}...`;

  return (
    <div className="mx-auto max-w-4xl px-4 py-10 md:px-6 md:py-14">
      <Link to="/katalog" className="mb-6 inline-flex text-sm font-medium text-ink/55 hover:text-accent">
        ← Katalog
      </Link>

      {!hasCover && (
        <p className="mb-6 rounded-lg border border-ink/10 bg-surface px-4 py-3 text-sm text-ink/55">
          Bu kayıt için veritabanında kapak URL’si tanımlı değil; listede başlık ile gösterilir.
        </p>
      )}

      <Card as="article" className="overflow-hidden md:flex">
        <div className="flex justify-center bg-gradient-to-br from-surface to-ink/[0.04] p-8 md:w-[320px] md:shrink-0">
          <div className="flex w-full max-w-[260px] min-h-[200px] items-stretch">
            <SmartBookCover
              src={book.kapak_url}
              fallbackSrc="/placeholder-book.jpg"
              title={book.kitap_adi}
              variant="detail"
              alt={`${book.kitap_adi} kitap kapağı`}
              imageClassName="max-h-[420px] w-full rounded-lg object-contain shadow-card"
            />
          </div>
        </div>
        <div className="flex flex-1 flex-col p-8">
          <h1 className="text-2xl font-bold leading-tight text-ink md:text-3xl">
            {book.kitap_adi}
          </h1>
          <p className="mt-2 text-lg text-ink/65">{authorLine}</p>
          <div className="mt-4 flex flex-wrap gap-2">
            {book.basim_yili && (
              <span className="rounded-full bg-ink/5 px-3 py-1 text-xs text-ink/65">
                Yayın: {book.basim_yili}
              </span>
            )}
            {book.sayfa_sayisi && (
              <span className="rounded-full bg-ink/5 px-3 py-1 text-xs text-ink/65">
                Sayfa: {book.sayfa_sayisi}
              </span>
            )}
            {book.yayinevi && (
              <span className="rounded-full bg-ink/5 px-3 py-1 text-xs text-ink/65">
                Yayınevi: {book.yayinevi}
              </span>
            )}
          </div>

          <div className="mt-6 flex flex-wrap items-center gap-3">
            <span
              className={`inline-flex items-center rounded-full px-3 py-1 text-sm font-semibold ${
                stock.inStock ? "bg-emerald-100 text-emerald-800" : "bg-ink/10 text-ink/60"
              }`}
            >
              {stock.inStock ? "Stokta var" : "Stokta yok"}
            </span>
            {stock.inStock && (
              <span className="text-sm text-ink/50">
                {stock.copies} adet kaldı
              </span>
            )}
          </div>

          <p className="mt-6 text-sm leading-relaxed text-ink/75 md:text-base whitespace-pre-wrap">
            {shownDesc}
          </p>
          {shouldTrim && (
            <Button
              variant="ghost"
              className="mt-2 w-fit px-0 text-sm"
              onClick={() => setExpandedDescription((v) => !v)}
            >
              {expandedDescription ? "Daha az göster" : "Devamını oku"}
            </Button>
          )}

          <div className="mt-8 flex flex-wrap items-center gap-3">
            <Button disabled={!stock.inStock} onClick={handleBorrow} size="lg">
              Ödünç al
            </Button>
            <button
              type="button"
              onClick={toggleFavorite}
              disabled={favoriteBusy}
              aria-pressed={isFavorite}
              aria-label={isFavorite ? "Favorilerden çıkar" : "Favorilere ekle"}
              title={
                isAuthenticated
                  ? isFavorite
                    ? "Favorilerden çıkar"
                    : "Favorilere ekle"
                  : "Favorilere eklemek için giriş yapın"
              }
              className={`group inline-flex h-12 items-center gap-2 rounded-full border px-5 text-sm font-semibold transition disabled:cursor-not-allowed disabled:opacity-60 ${
                isFavorite
                  ? "border-rose-300 bg-rose-50 text-rose-600 hover:bg-rose-100"
                  : "border-ink/15 bg-white text-ink/75 hover:border-rose-200 hover:bg-rose-50 hover:text-rose-600"
              }`}
            >
              <svg
                viewBox="0 0 24 24"
                className="h-5 w-5"
                aria-hidden
                fill={isFavorite ? "currentColor" : "none"}
                stroke="currentColor"
                strokeWidth="1.8"
                strokeLinejoin="round"
                strokeLinecap="round"
              >
                <path d="M12 21s-7-4.35-7-10a4 4 0 017-2.65A4 4 0 0119 11c0 5.65-7 10-7 10z" />
              </svg>
              <span>{isFavorite ? "Favoride" : "Favorilere ekle"}</span>
            </button>
          </div>
          
          {/* Uyarı ve Başarı Mesajları Buraya Gelecek */}
          {notice && (
            <p className={`mt-3 rounded-lg border px-3 py-2 text-sm ${notice.includes('❌') ? 'border-red-200 bg-red-50 text-red-700' : 'border-emerald-200 bg-emerald-50 text-emerald-700'}`}>
              {notice}
            </p>
          )}
        </div>
      </Card>
      
      {similarBooks.length > 0 && (
        <div className="mt-10">
          <HorizontalBookRow
            title="Benzer kitaplar"
            subtitle="Aynı yazar veya benzer kategorilerden seçildi."
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