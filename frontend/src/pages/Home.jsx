import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { motion, useReducedMotion } from "framer-motion";
import HorizontalBookRow from "../components/HorizontalBookRow";
import SmartBookCover from "../components/SmartBookCover";
import Button from "../components/ui/Button";
import Card from "../components/ui/Card";
import Input from "../components/ui/Input";
import { fetchLocalBooks } from "../services/dbBooks";

export default function Home() {
  const navigate = useNavigate();
  const reduce = useReducedMotion();
  const [q, setQ] = useState("");

  const [turkishBooks, setTurkishBooks] = useState([]);
  const [classics, setClassics] = useState([]);
  const [weeklyPopular, setWeeklyPopular] = useState([]);
  const [startWithThese, setStartWithThese] = useState([]);
  const [mostLoved, setMostLoved] = useState([]);
  const [recentlyAdded, setRecentlyAdded] = useState([]);

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    let cancelled = false;

    fetchLocalBooks()
      .then((data) => {
        if (cancelled) return;

        setWeeklyPopular(data.slice(0, 10));
        setStartWithThese(data.slice(10, 20));
        setMostLoved(data.slice(20, 30));
        setRecentlyAdded(data.slice(30, 40));
        setTurkishBooks(data.slice(40, 50));
        setClassics(data.slice(5, 15));
      })
      .catch((err) => {
        if (!cancelled) setError(`Veritabanına bağlanılamadı: ${err.message}`);
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });

    return () => {
      cancelled = true;
    };
  }, []);

  function onSearch(e) {
    e.preventDefault();
    const term = q.trim();
    if (term) navigate(`/katalog?q=${encodeURIComponent(term)}`);
    else navigate("/katalog");
  }

  const heroEase = [0.22, 1, 0.36, 1];
  const heroStagger = reduce ? 0 : 0.09;
  const heroDelay = reduce ? 0 : 0.12;
  const quickStats = [
    { label: "Türkçe Öneri", value: "60.000+" },
    { label: "Klasik Seçki", value: "150+" },
    { label: "Hızlı Arama", value: "<1sn" },
  ];
  const topPreviewBooks = buildPreviewBooks(turkishBooks, classics, 8);
  const bottomPreviewBooks = buildPreviewBooks(classics, turkishBooks, 8);
  const quickSearches = ["Roman", "Tarih", "Bilim kurgu"];

  return (
    <div className="bg-surface">
      <section className="relative overflow-hidden px-4 pb-28 pt-5 text-white md:px-6 md:pb-32 md:pt-8">
        <div
          className="absolute inset-0 bg-cover bg-center bg-no-repeat"
          style={{
            backgroundImage: "url('/pexels-furkanceylan-20837730.jpg')",
          }}
          aria-hidden
        />
        <div
          className="absolute inset-0 bg-gradient-to-br from-black/55 via-black/45 to-black/55"
          aria-hidden
        />
        <div
          className="pointer-events-none absolute inset-0 opacity-40 motion-reduce:animate-none animate-hero-shimmer bg-[length:200%_200%]"
          style={{
            backgroundImage:
              "linear-gradient(110deg, transparent 0%, rgba(255,107,53,0.15) 25%, transparent 50%, rgba(255,255,255,0.08) 75%, transparent 100%)",
          }}
          aria-hidden
        />
        <div
          className="pointer-events-none absolute -right-20 -top-20 hidden h-72 w-72 rounded-full bg-accent/25 blur-3xl motion-reduce:animate-none md:block animate-hero-blob"
          aria-hidden
        />
        <div
          className="pointer-events-none absolute -bottom-24 -left-16 h-80 w-80 rounded-full bg-white/10 blur-3xl motion-reduce:animate-none animate-hero-blob-2"
          aria-hidden
        />
        <div
          className="pointer-events-none absolute right-1/4 top-1/3 h-40 w-40 rounded-full bg-accent/20 blur-2xl motion-reduce:animate-none animate-hero-blob"
          style={{ animationDelay: "-5s" }}
          aria-hidden
        />

        <motion.div
          className="relative mx-auto max-w-5xl text-center"
          initial="hidden"
          animate="show"
          variants={{
            hidden: {},
            show: {
              transition: {
                staggerChildren: heroStagger,
                delayChildren: heroDelay,
              },
            },
          }}
        >
          <motion.p
            variants={{
              hidden: reduce ? { opacity: 1 } : { opacity: 0, y: 16 },
              show: {
                opacity: 1,
                y: 0,
                transition: { duration: reduce ? 0 : 0.5, ease: heroEase },
              },
            }}
            className="mb-4 text-xs font-semibold uppercase tracking-[0.26em] text-white/70 md:text-sm"
          >
            Keşfet · Ödünç al · Oku
          </motion.p>
          <motion.h1
            variants={{
              hidden: reduce ? { opacity: 1 } : { opacity: 0, y: 22 },
              show: {
                opacity: 1,
                y: 0,
                transition: { duration: reduce ? 0 : 0.58, ease: heroEase },
              },
            }}
            className="mb-4 text-3xl font-bold leading-[1.15] tracking-tight md:text-6xl md:leading-tight"
          >
            Kütüphaneniz tek yerde
          </motion.h1>
          <motion.p
            variants={{
              hidden: reduce ? { opacity: 1 } : { opacity: 0, y: 18 },
              show: {
                opacity: 1,
                y: 0,
                transition: { duration: reduce ? 0 : 0.52, ease: heroEase },
              },
            }}
            className="mx-auto mb-10 max-w-2xl text-base text-white/85 md:mb-12 md:text-xl"
          >
            Türkçe seçkiler ve dünya klasikleri tek bir ekranda. Arayın,
            keşfedin, favorilerinizi kaydedin.
          </motion.p>
          <motion.form
            variants={{
              hidden: reduce ? { opacity: 1 } : { opacity: 0, y: 20 },
              show: {
                opacity: 1,
                y: 0,
                transition: { duration: reduce ? 0 : 0.55, ease: heroEase },
              },
            }}
            onSubmit={onSearch}
            className="mx-auto flex max-w-2xl flex-col gap-3 sm:flex-row sm:items-stretch"
          >
            <motion.div
              className="flex-1"
              whileFocus={reduce ? undefined : { scale: 1.01 }}
            >
              <Input
                type="search"
                value={q}
                onChange={(e) => setQ(e.target.value)}
                placeholder="Kitap, yazar veya konu ara..."
                className="h-12 rounded-full border-0 bg-white/95 px-5 text-ink shadow-lg placeholder:text-ink/40 md:h-14"
                aria-label="Arama"
              />
            </motion.div>
            <motion.div
              whileHover={reduce ? undefined : { scale: 1.03 }}
              whileTap={reduce ? undefined : { scale: 0.97 }}
            >
              <Button type="submit" size="pill" className="h-12 shrink-0 md:h-14">
                Ara
              </Button>
            </motion.div>
          </motion.form>
          <div className="mt-4 flex flex-wrap items-center justify-center gap-2">
            {quickSearches.map((item) => (
              <Button
                key={item}
                variant="ghost"
                size="sm"
                className="rounded-full bg-white/10 text-white hover:bg-white/20 hover:text-white"
                onClick={() => navigate(`/katalog?q=${encodeURIComponent(item)}`)}
              >
                {item}
              </Button>
            ))}
          </div>

          {error && (
            <div className="mx-auto mt-4 w-full max-w-3xl rounded-xl border border-red-200/70 bg-red-50/95 px-4 py-3 text-left text-sm text-red-900 shadow">
              <p className="font-semibold">Kitap verisi yüklenemedi</p>
              <p className="mt-1 text-red-800/90">{error}</p>
            </div>
          )}

          <motion.div
            variants={{
              hidden: reduce ? { opacity: 1 } : { opacity: 0, y: 18 },
              show: {
                opacity: 1,
                y: 0,
                transition: { duration: reduce ? 0 : 0.6, ease: heroEase },
              },
            }}
            className="relative mx-auto mt-8 w-full max-w-6xl overflow-hidden px-0 py-0 md:mt-10 md:py-1"
          >
            <div className="space-y-1.5">
              <div className="relative overflow-hidden">
                <div className="pointer-events-none absolute inset-y-0 left-0 z-10 w-8 bg-gradient-to-r from-night/55 to-transparent md:w-10" />
                <div className="pointer-events-none absolute inset-y-0 right-0 z-10 w-8 bg-gradient-to-l from-night/55 to-transparent md:w-10" />
                <motion.div
                  className="flex w-max gap-1.5 px-0 md:gap-2 md:px-0"
                  animate={reduce ? undefined : { x: ["0%", "-50%"] }}
                  transition={
                    reduce
                      ? undefined
                      : {
                          duration: 48,
                          ease: "linear",
                          repeat: Infinity,
                          repeatType: "loop",
                        }
                  }
                >
                  {[...topPreviewBooks, ...topPreviewBooks].map((book, i) => (
                    <div
                      key={`top-${book.id}-${i}`}
                      className="h-24 w-16 overflow-hidden rounded-md border border-white/10 bg-night/25 md:h-28 md:w-20"
                    >
                      <SmartBookCover
                        src={book.volumeInfo?.imageLinks?.thumbnail}
                        fallbackSrc={book.coverFallbackUrl}
                        title={book.volumeInfo?.title}
                        decorative
                        variant="hero"
                        imageClassName="h-full w-full scale-[1.08] rounded-md object-cover saturate-110 transition-transform duration-500 hover:scale-[1.12]"
                      />
                    </div>
                  ))}
                </motion.div>
              </div>
              <div className="relative overflow-hidden">
                <div className="pointer-events-none absolute inset-y-0 left-0 z-10 w-8 bg-gradient-to-r from-night/55 to-transparent md:w-10" />
                <div className="pointer-events-none absolute inset-y-0 right-0 z-10 w-8 bg-gradient-to-l from-night/55 to-transparent md:w-10" />
                <motion.div
                  className="flex w-max gap-1.5 px-0 md:gap-2 md:px-0"
                  animate={reduce ? undefined : { x: ["-50%", "0%"] }}
                  transition={
                    reduce
                      ? undefined
                      : {
                          duration: 56,
                          ease: "linear",
                          repeat: Infinity,
                          repeatType: "loop",
                        }
                  }
                >
                  {[...bottomPreviewBooks, ...bottomPreviewBooks].map(
                    (book, i) => (
                      <div
                        key={`bottom-${book.id}-${i}`}
                        className="h-24 w-16 overflow-hidden rounded-md border border-white/10 bg-night/25 md:h-28 md:w-20"
                      >
                        <SmartBookCover
                          src={book.volumeInfo?.imageLinks?.thumbnail}
                          fallbackSrc={book.coverFallbackUrl}
                          title={book.volumeInfo?.title}
                          decorative
                          variant="hero"
                          imageClassName="h-full w-full scale-[1.08] rounded-md object-cover saturate-110 transition-transform duration-500 hover:scale-[1.12]"
                        />
                      </div>
                    ),
                  )}
                </motion.div>
              </div>
            </div>
          </motion.div>
        </motion.div>
      </section>

      <div className="mx-auto -mt-16 max-w-6xl px-4 md:-mt-20 md:px-6">
        <Card className="rounded-2xl border border-white/70 bg-white/90 p-5 backdrop-blur md:p-7">
          <div className="grid grid-cols-1 gap-3 sm:grid-cols-3">
            {quickStats.map((item) => (
              <div
                key={item.label}
                className="rounded-xl border border-ink/10 bg-surface px-4 py-4"
              >
                <p className="text-xs font-semibold uppercase tracking-[0.18em] text-ink/45">
                  {item.label}
                </p>
                <p className="mt-2 text-2xl font-bold tracking-tight text-night">
                  {item.value}
                </p>
              </div>
            ))}
          </div>
        </Card>
      </div>

      <div className="mx-auto max-w-6xl px-4 py-10 md:px-6 md:py-14">
        <HorizontalBookRow
          title="Haftanın Popüler Kitapları"
          subtitle="Bu hafta okuyucularin en cok ilgi gosterdigi secimler."
          books={weeklyPopular}
          loading={loading}
          error={error}
          variant="scroll"
          actionTo="/katalog?q=bestseller%20fiction"
        />
        <HorizontalBookRow
          title="Bu Kitaplarla Başla"
          subtitle="Yeni bir okuma rutini icin ideal baslangic listesi."
          books={startWithThese}
          loading={loading}
          error={error}
          variant="scroll"
          actionTo="/katalog?q=modern%20classics%20fiction"
        />
        <HorizontalBookRow
          title="En Sevilen Kitaplar"
          subtitle="Uzun sure trendde kalan ve tekrar tekrar onerilen eserler."
          books={mostLoved}
          loading={loading}
          error={error}
          variant="scroll"
          actionTo="/katalog?q=most%20loved%20novels%20fiction"
        />
        <HorizontalBookRow
          title="Son Eklenen Kitaplar"
          subtitle="Kataloga yeni eklenen guncel kitaplari kacirma."
          books={recentlyAdded}
          loading={loading}
          error={error}
          variant="scroll"
          actionTo="/katalog?q=subject%3Afiction"
        />
        <HorizontalBookRow
          title="Öne çıkan Türkçe kitaplar"
          subtitle="Veritabanımızdan derlenen yerli edebiyat ve roman seçkileri."
          books={turkishBooks}
          loading={loading}
          error={error}
        />
        <HorizontalBookRow
          title="Dünya klasikleri"
          subtitle="Evrensel edebiyattan seçilmiş klasik eserler — keşfetmek için kaydırın."
          books={classics}
          loading={loading}
          error={error}
          reverse
        />
      </div>
    </div>
  );
}

function buildPreviewBooks(primaryBooks = [], secondaryBooks = [], target = 8) {
  const pick = (b) => Boolean(b.thumbnail && b.volumeInfo?.title);
  const primary = primaryBooks.filter(pick);
  const secondary = secondaryBooks.filter(pick);
  const pool = [...primary, ...secondary];

  if (!pool.length) return [];

  const result = [];
  let i = 0;
  while (result.length < target) {
    const book = pool[i % pool.length];
    result.push({ ...book, id: `${book.id}-preview-${i}` });
    i += 1;
  }

  return result;
}
