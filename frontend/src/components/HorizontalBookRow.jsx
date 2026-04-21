import { motion, useReducedMotion } from "framer-motion";
import { Link, useNavigate } from "react-router-dom";
import { useState } from "react";
import BookCard from "./BookCard";

function MarqueeStrip({ books, reverse = false }) {
  const reduce = useReducedMotion();
  const sec = Math.min(Math.max(books.length * 4.4, 42), 88);

  if (reduce) {
    return (
      <div className="-mx-4 flex snap-x snap-mandatory gap-4 overflow-x-auto px-4 pb-2 md:-mx-6 md:px-6">
        {books.map((b) => (
          <div key={b.id} className="snap-start">
            <BookCard book={b} />
          </div>
        ))}
      </div>
    );
  }

  return (
    <div
      className="book-marquee-track flex w-max gap-4"
      style={{
        ["--marquee-sec"]: `${sec}s`,
        animationDirection: reverse ? "reverse" : "normal",
      }}
    >
      {books.map((b) => (
        <BookCard key={b.id} book={b} />
      ))}
      {books.map((b) => (
        <BookCard key={`${b.id}-marquee`} book={b} decorative />
      ))}
    </div>
  );
}

function ScrollStrip({ books }) {
  return (
    <div className="-mx-4 flex snap-x snap-mandatory gap-4 overflow-x-auto px-4 pb-2 md:-mx-6 md:px-6">
      {books.map((b) => (
        <div key={b.id} className="snap-start">
          <BookCard book={b} />
        </div>
      ))}
    </div>
  );
}

export default function HorizontalBookRow({
  title,
  subtitle,
  books,
  loading,
  error,
  reverse = false,
  variant = "marquee",
  actionTo,
  actionLabel = "Hepsini göster",
  className = "",
}) {
  const reduce = useReducedMotion();
  const navigate = useNavigate();
  const [isExpanding, setIsExpanding] = useState(false);

  function handleShowAllClick(e) {
    if (!actionTo || reduce) return;
    e.preventDefault();
    setIsExpanding(true);
    setTimeout(() => navigate(actionTo), 190);
  }

  return (
    <motion.section
      className={`mb-10 rounded-3xl border border-slate-200/80 bg-gradient-to-b from-white to-slate-50/70 p-4 shadow-md transition duration-300 hover:-translate-y-1 hover:shadow-xl md:mb-12 md:p-6 ${className}`}
      initial={reduce ? false : { opacity: 0, y: 28 }}
      animate={
        reduce
          ? undefined
          : isExpanding
            ? { scale: 1.03, y: -4, boxShadow: "0 18px 40px rgba(15, 23, 42, 0.16)" }
            : { scale: 1, y: 0, boxShadow: "0 6px 18px rgba(15, 23, 42, 0.08)" }
      }
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true, amount: 0.12, margin: "0px 0px -8% 0px" }}
      transition={{ duration: reduce ? 0 : 0.55, ease: [0.22, 1, 0.36, 1] }}
    >
      <div className="mb-5 flex flex-wrap items-end justify-between gap-3 border-b border-slate-200/80 pb-4">
        <div>
          <h2 className="text-xl font-bold tracking-tight text-ink md:text-[1.7rem]">
            {title}
          </h2>
          {subtitle && (
            <p className="mt-1 max-w-xl text-sm text-ink/55 md:text-[0.95rem]">
              {subtitle}
            </p>
          )}
        </div>
        {actionTo && (
          <Link
            to={actionTo}
            onClick={handleShowAllClick}
            className="inline-flex items-center gap-2 rounded-full bg-slate-100 px-3 py-1.5 text-sm font-medium text-slate-700 transition hover:bg-slate-200 hover:text-slate-900"
          >
            {actionLabel}
            <svg
              className="h-4 w-4"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
              aria-hidden
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M9 5l7 7-7 7"
              />
            </svg>
          </Link>
        )}
        {!loading && !error && books?.length > 0 && (
          <span
            className="hidden items-center gap-1 text-xs font-medium text-slate-500 sm:flex motion-reduce:animate-none animate-scroll-hint"
            aria-hidden
          >
            Üzerine gelince durur · tıklayarak detay
            <svg
              className="h-4 w-4"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
              aria-hidden
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M9 5l7 7-7 7"
              />
            </svg>
          </span>
        )}
      </div>
      {!loading && !error && books?.length > 0 && (
        <p className="mb-3 flex items-center gap-1 text-xs text-ink/45 sm:hidden">
          Kaydırarak keşfet
          <span aria-hidden>→</span>
        </p>
      )}
      {error && (
        <p className="rounded-card border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-800">
          {error}
        </p>
      )}
      {loading && (
        <div className="flex gap-4 overflow-hidden py-1">
          {[1, 2, 3, 4, 5].map((i) => (
            <div
              key={i}
              className="h-[280px] w-[160px] flex-shrink-0 animate-pulse rounded-card bg-white shadow-card"
            />
          ))}
        </div>
      )}
      {!loading && !error && (
        <div className="relative overflow-hidden py-1">
          <div
            className="pointer-events-none absolute left-0 top-0 z-10 h-full w-10 bg-gradient-to-r from-white to-transparent md:w-14"
            aria-hidden
          />
          <div
            className="pointer-events-none absolute right-0 top-0 z-10 h-full w-10 bg-gradient-to-l from-white to-transparent md:w-14"
            aria-hidden
          />
          {books?.length ? (
            variant === "scroll" || reduce ? (
              <ScrollStrip books={books} />
            ) : (
              <MarqueeStrip books={books} reverse={reverse} />
            )
          ) : (
            <div className="flex flex-col items-center justify-center rounded-xl border border-slate-200 bg-white px-3 py-5 text-center">
              <svg
                className="mb-2 h-7 w-7 text-slate-300"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                aria-hidden
              >
                <path
                  d="M4 6.5A2.5 2.5 0 016.5 4H20v14H6.5A2.5 2.5 0 004 20.5v-14z"
                  strokeWidth="1.5"
                />
                <path d="M8 8h8M8 11h8" strokeWidth="1.5" strokeLinecap="round" />
              </svg>
              <p className="text-sm font-medium text-slate-500">
                Bu bölümde henüz kitap bulunamadı.
              </p>
            </div>
          )}
        </div>
      )}
    </motion.section>
  );
}
