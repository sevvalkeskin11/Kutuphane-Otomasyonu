import { Link, useNavigate } from "react-router-dom";
import { useEffect, useState } from "react";
import { AnimatePresence, motion, useReducedMotion } from "framer-motion";
import { apiUrl } from "../services/dbBooks";
import { useAuth } from "../context/AuthContext";

export default function Register() {
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [hataMesaji, setHataMesaji] = useState("");
  const [basariliKayit, setBasariliKayit] = useState(false);
  const [yukleniyor, setYukleniyor] = useState(false);
  const navigate = useNavigate();
  const { login } = useAuth();
  const reduce = useReducedMotion();

  useEffect(() => {
    if (!basariliKayit) return;
    const t = setTimeout(() => navigate("/"), 1800);
    return () => clearTimeout(t);
  }, [basariliKayit, navigate]);

  async function onSubmit(e) {
    e.preventDefault();
    setHataMesaji("");
    setYukleniyor(true);

    try {
      const response = await fetch(apiUrl("/api/auth/register"), {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ fullName: name, email, password }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || "Kayıt işlemi başarısız oldu.");
      }

      login(data.user, data.token);
      setBasariliKayit(true);
    } catch (err) {
      setHataMesaji(err.message);
    } finally {
      setYukleniyor(false);
    }
  }

  return (
    <section className="relative flex min-h-screen items-center justify-center overflow-hidden px-4 py-8 md:px-6 md:py-10">
      <div
        className="absolute inset-0 bg-cover bg-center bg-no-repeat"
        style={{
          backgroundImage: "url('/pexels-ian-panelo-35644053.jpg')",
          backgroundPosition: "center 24%",
        }}
      />
      <div className="absolute inset-0 bg-black/50" /> {/* Arka plan okunabilirlik için koyulaştırıldı */}
      
      <div className="relative mx-auto flex w-full max-w-md justify-center">
        <div className="w-full rounded-panel border border-white/20 bg-white/10 p-6 shadow-2xl backdrop-blur-md sm:p-8">
          <div className="mb-8">
            <div className="mb-5 h-1.5 w-20 rounded-full bg-accent" />
            <h1 className="mb-2 text-3xl font-bold text-white">Hesap oluştur</h1>
            <p className="text-sm text-white/80">Kütüphaneye katılın ve ödünç işlemlerini kolayca yönetin.</p>
          </div>

          <AnimatePresence>
            {hataMesaji && (
              <motion.div
                key="hata"
                initial={reduce ? false : { opacity: 0, y: -8 }}
                animate={{ opacity: 1, y: 0 }}
                exit={reduce ? undefined : { opacity: 0, y: -8 }}
                transition={{ duration: 0.2 }}
                className="mb-6 flex items-start gap-2 rounded-lg border border-red-400/50 bg-red-500/90 p-3 text-sm text-white shadow-md backdrop-blur"
              >
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" className="mt-0.5 h-4 w-4 shrink-0" aria-hidden>
                  <circle cx="12" cy="12" r="9" strokeWidth="1.8" />
                  <path d="M12 8v5" strokeWidth="1.8" strokeLinecap="round" />
                  <path d="M12 16h.01" strokeWidth="2.2" strokeLinecap="round" />
                </svg>
                <span>{hataMesaji}</span>
              </motion.div>
            )}
          </AnimatePresence>

          <form onSubmit={onSubmit} className="space-y-5">
            <div className="space-y-1.5">
              <label htmlFor="name" className="block text-sm font-medium text-white">Ad soyad</label>
              <input
                id="name"
                type="text"
                autoComplete="name"
                value={name}
                onChange={(e) => setName(e.target.value)}
                className="w-full rounded-lg border border-white/30 bg-white/10 px-4 py-2.5 text-white outline-none placeholder:text-white/50 transition focus:border-white focus:bg-white/20 focus:ring-2 focus:ring-white/30"
                required
              />
            </div>
            
            <div className="space-y-1.5">
              <label htmlFor="reg-email" className="block text-sm font-medium text-white">E-posta</label>
              <input
                id="reg-email"
                type="email"
                autoComplete="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="w-full rounded-lg border border-white/30 bg-white/10 px-4 py-2.5 text-white outline-none placeholder:text-white/50 transition focus:border-white focus:bg-white/20 focus:ring-2 focus:ring-white/30"
                required
              />
            </div>

            <div className="space-y-1.5">
              <label htmlFor="reg-password" className="block text-sm font-medium text-white">Şifre</label>
              <input
                id="reg-password"
                type="password"
                autoComplete="new-password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                minLength={8}
                className="w-full rounded-lg border border-white/30 bg-white/10 px-4 py-2.5 text-white outline-none placeholder:text-white/50 transition focus:border-white focus:bg-white/20 focus:ring-2 focus:ring-white/30"
                required
              />
              <p className="text-xs text-white/70">En az 8 karakter.</p>
            </div>

            <button
              type="submit"
              disabled={yukleniyor || basariliKayit}
              className="mt-6 flex w-full items-center justify-center gap-2 rounded-lg bg-accent py-3 font-semibold text-white shadow-lg transition hover:bg-accentDark disabled:cursor-not-allowed disabled:bg-accent/70"
            >
              {yukleniyor && (
                <span className="h-4 w-4 animate-spin rounded-full border-2 border-white/40 border-t-white" aria-hidden />
              )}
              {yukleniyor ? "Kayıt yapılıyor..." : "Hesap oluştur"}
            </button>
          </form>

          <p className="mt-8 text-center text-sm text-white/80">
            Zaten üye misiniz?{" "}
            <Link to="/giris" className="font-semibold text-accent transition hover:text-accentDark hover:underline underline-offset-2">
              Giriş yap
            </Link>
          </p>

        </div>
      </div>

      <AnimatePresence>
        {basariliKayit && (
          <motion.div
            key="basari-backdrop"
            initial={reduce ? false : { opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={reduce ? undefined : { opacity: 0 }}
            transition={{ duration: 0.25 }}
            className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 px-4 backdrop-blur-md"
            role="status"
            aria-live="polite"
          >
            <motion.div
              initial={reduce ? false : { scale: 0.92, opacity: 0, y: 12 }}
              animate={{ scale: 1, opacity: 1, y: 0 }}
              exit={reduce ? undefined : { scale: 0.96, opacity: 0, y: -8 }}
              transition={{ type: "spring", stiffness: 260, damping: 22 }}
              className="relative w-full max-w-sm overflow-hidden rounded-2xl border border-white/60 bg-white/95 p-7 text-center shadow-2xl"
            >
              <div className="pointer-events-none absolute inset-x-0 -top-16 mx-auto h-32 w-32 rounded-full bg-accent/25 blur-3xl" />

              <motion.div
                initial={reduce ? false : { scale: 0 }}
                animate={{ scale: 1 }}
                transition={{ delay: 0.1, type: "spring", stiffness: 300, damping: 18 }}
                className="relative mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-accent text-white shadow-lg shadow-accent/40"
              >
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" className="h-9 w-9" aria-hidden>
                  <motion.path
                    d="M5 12.5l4 4L19 7"
                    strokeWidth="2.8"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    initial={reduce ? false : { pathLength: 0 }}
                    animate={{ pathLength: 1 }}
                    transition={{ delay: 0.25, duration: 0.45, ease: "easeOut" }}
                  />
                </svg>
              </motion.div>

              <h2 className="relative mb-1.5 text-xl font-bold text-night">
                Kayıt başarılı!
              </h2>
              <p className="relative text-sm text-ink/70">
                Kütüphaneye hoş geldiniz{name ? `, ${name.split(" ")[0]}` : ""}. Anasayfaya yönlendiriliyorsunuz...
              </p>

              <div className="relative mt-5 h-1 w-full overflow-hidden rounded-full bg-accent/15">
                <motion.div
                  initial={reduce ? false : { scaleX: 0 }}
                  animate={{ scaleX: 1 }}
                  transition={{ duration: 1.7, ease: "linear" }}
                  className="h-full origin-left bg-accent"
                />
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </section>
  );
}