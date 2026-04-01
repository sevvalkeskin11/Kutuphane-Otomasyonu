import { useCallback, useEffect, useState } from "react";

/**
 * Kapak: önce src; http→https ve isteğe bağlı fallbackSrc (ör. kırık DB URL sonrası Open Library).
 * İkisi de yüklenemezse başlık yer tutucusu.
 * variant="hero": koyu şerit (ana sayfa şeridi).
 * variant="detail": detay sayfası yer tutucusu (daha yüksek).
 */
export default function SmartBookCover({
  src,
  /** Birincil adres (ör. veritabanı) kırılırsa denenecek; genelde Open Library */
  fallbackSrc,
  title = "",
  alt,
  decorative = false,
  imageClassName = "",
  variant = "card",
}) {
  const initial =
    src != null && String(src).trim() !== "" ? String(src).trim() : null;
  const [displaySrc, setDisplaySrc] = useState(initial);
  const [triedHttpsUpgrade, setTriedHttpsUpgrade] = useState(false);
  const [triedFallback, setTriedFallback] = useState(false);

  useEffect(() => {
    const next =
      src != null && String(src).trim() !== "" ? String(src).trim() : null;
    setDisplaySrc(next);
    setTriedHttpsUpgrade(false);
    setTriedFallback(false);
  }, [src, fallbackSrc]);

  const onImgError = useCallback(() => {
    if (displaySrc?.startsWith("http://") && !triedHttpsUpgrade) {
      setTriedHttpsUpgrade(true);
      setDisplaySrc(displaySrc.replace(/^http:\/\//i, "https://"));
      return;
    }
    const fb =
      fallbackSrc != null && String(fallbackSrc).trim() !== ""
        ? String(fallbackSrc).trim()
        : "";
    if (fb && !triedFallback && fb !== displaySrc) {
      setTriedFallback(true);
      setTriedHttpsUpgrade(false);
      setDisplaySrc(fb);
      return;
    }
    setDisplaySrc(null);
  }, [displaySrc, triedHttpsUpgrade, triedFallback, fallbackSrc]);

  if (!displaySrc) {
    const label = title?.trim() || "Kapak yok";
    if (variant === "hero") {
      return (
        <div className="flex h-full w-full items-center justify-center bg-night/45 p-1.5 text-center text-[9px] font-medium leading-tight text-white/90 md:text-[10px]">
          <span className="line-clamp-4">{label}</span>
        </div>
      );
    }
    if (variant === "detail") {
      return (
        <div className="flex min-h-[280px] w-full flex-col items-center justify-center rounded-lg border border-ink/10 bg-surface p-8 text-center md:min-h-[360px]">
          <span className="max-w-xs text-sm leading-relaxed text-ink/45">
            {label}
          </span>
        </div>
      );
    }
    return (
      <div className="flex h-full w-full flex-col items-center justify-center bg-gradient-to-br from-night/[0.07] to-night/[0.12] p-3 text-center">
        <span className="line-clamp-4 text-xs font-medium text-ink/45">
          {label}
        </span>
      </div>
    );
  }

  return (
    <img
      key={`${displaySrc}-${triedHttpsUpgrade}-${triedFallback}`}
      src={displaySrc}
      alt={decorative ? "" : alt || `${title || "Kitap"} kapak görseli`}
      aria-hidden={decorative ? true : undefined}
      className={imageClassName}
      loading="lazy"
      referrerPolicy="no-referrer"
      onError={onImgError}
    />
  );
}
