import { useCallback, useEffect, useState } from "react";
import { apiUrl } from "../services/dbBooks";

/**
 * 1) Veritabanı kapak URL’si (src) varsa önce o
 * 2) Yoksa veya yüklenemezse → /api/kapak (Google Books, ISBN)
 * 3) Son çare: başlık/yazar yer tutucusu
 */
export default function SmartBookCover({
  src,
  isbnDigits = "",
  title,
  authorLine = "",
  className = "",
  imageClassName = "",
  placeholderClassName = "",
}) {
  const digits = String(isbnDigits || "").replace(/\D/g, "");
  const canGoogle = digits.length >= 10;

  const [displaySrc, setDisplaySrc] = useState(() => src || null);
  const [status, setStatus] = useState(() => {
    if (src) return "primary";
    if (canGoogle) return "loading";
    return "empty";
  });

  const tryBackendCover = useCallback(() => {
    if (!canGoogle) {
      setDisplaySrc(null);
      setStatus("empty");
      return;
    }
    setStatus("loading");
    const params = new URLSearchParams();
    params.set("isbn", digits);
    const tit = (title || "").trim();
    if (tit.length >= 2) params.set("baslik", tit);
    const auth = (authorLine || "").trim();
    if (auth.length >= 2 && !/^bilinmeyen\s+yazar$/i.test(auth)) {
      params.set("yazar", auth);
    }
    fetch(apiUrl(`/api/kapak/lookup?${params.toString()}`))
      .then((r) => r.json())
      .then((d) => {
        if (d.url) {
          setDisplaySrc(d.url);
          setStatus("google");
        } else {
          setDisplaySrc(null);
          setStatus("empty");
        }
      })
      .catch(() => {
        setDisplaySrc(null);
        setStatus("empty");
      });
  }, [canGoogle, digits]);

  useEffect(() => {
    if (src) {
      setDisplaySrc(src);
      setStatus("primary");
      return;
    }
    tryBackendCover();
  }, [src, tryBackendCover]);

  const onImgError = useCallback(() => {
    if (status === "primary" && src && displaySrc === src) {
      setDisplaySrc(null);
      tryBackendCover();
      return;
    }
    if (status === "google") {
      setDisplaySrc(null);
      setStatus("empty");
    }
  }, [status, src, displaySrc, tryBackendCover]);

  const onImgLoad = useCallback(
    (e) => {
      const w = e.currentTarget.naturalWidth;
      if (w > 0 && w < 48) onImgError();
    },
    [onImgError],
  );

  if (status === "loading" && !displaySrc) {
    return (
      <div
        className={`flex h-full w-full animate-pulse bg-gradient-to-br from-night/30 to-night/10 ${className}`}
        aria-hidden
      />
    );
  }

  if (!displaySrc || status === "empty") {
    return (
      <div
        className={`flex h-full w-full flex-col items-center justify-center bg-gradient-to-br from-night via-night/90 to-accent/35 p-3 text-center ${placeholderClassName} ${className}`}
      >
        <span className="line-clamp-4 text-[11px] font-semibold leading-snug text-white/95 md:text-xs">
          {title || "Kitap"}
        </span>
        {authorLine ? (
          <span className="mt-2 line-clamp-2 text-[10px] text-white/75">
            {authorLine}
          </span>
        ) : null}
      </div>
    );
  }

  return (
    <img
      key={displaySrc}
      src={displaySrc}
      alt=""
      className={imageClassName}
      loading="lazy"
      referrerPolicy="no-referrer"
      onError={onImgError}
      onLoad={onImgLoad}
    />
  );
}
