import { Link, useLocation, useNavigate } from "react-router-dom";
import { useState } from "react";
import { AnimatePresence, motion, useReducedMotion } from "framer-motion";
import { apiUrl } from "../services/dbBooks";
import { useAuth } from "../context/AuthContext";

export default function Login() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [hataMesaji, setHataMesaji] = useState("");
  const [yukleniyor, setYukleniyor] = useState(false); 
  const navigate = useNavigate();
  const location = useLocation();
  const { login } = useAuth();
  const reduce = useReducedMotion();

  // PrivateRoute korumalı bir sayfadan buraya gönderildiyse oraya geri döneriz.
  const from = location.state?.from;
  const redirectTo =
    from && typeof from.pathname === "string"
      ? `${from.pathname}${from.search || ""}`
      : "/";

  async function onSubmit(e) {
    e.preventDefault();
    setHataMesaji(""); 
    setYukleniyor(true); 
    try {
      const response = await fetch(apiUrl("/api/auth/login"), {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, password }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || "Giriş yapılamadı. Bilgilerinizi kontrol edin.");
      }

      login(data.user, data.token);
      navigate(redirectTo, { replace: true });

    } catch (err) {
      setHataMesaji(err.message); 
    } finally {
      setYukleniyor(false); // İşlem bitince butonu normale döndür
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
      <div className="absolute inset-0 bg-black/50" /> 
      
      <div className="relative mx-auto flex w-full max-w-md justify-center">
        <div className="w-full rounded-panel border border-white/20 bg-white/10 p-6 shadow-2xl backdrop-blur-md sm:p-8">
          <div className="mb-8">
            <div className="mb-5 h-1.5 w-20 rounded-full bg-accent" />
            <h1 className="mb-2 text-3xl font-bold text-white">
              Tekrar hoş geldiniz
            </h1>
            <p className="text-sm text-white/80">
              Devam etmek için hesabınıza giriş yapın.
            </p>
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
              <label htmlFor="email" className="block text-sm font-medium text-white">E-posta</label>
              <input
                id="email"
                type="email"
                autoComplete="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="w-full rounded-lg border border-white/30 bg-white/10 px-4 py-2.5 text-white outline-none placeholder:text-white/50 transition focus:border-white focus:bg-white/20 focus:ring-2 focus:ring-white/30"
                required
              />
            </div>

            <div className="space-y-1.5">
              <div className="flex items-center justify-between">
                <label htmlFor="password" className="block text-sm font-medium text-white">Şifre</label>
              </div>
              <input
                id="password"
                type="password"
                autoComplete="current-password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="w-full rounded-lg border border-white/30 bg-white/10 px-4 py-2.5 text-white outline-none placeholder:text-white/50 transition focus:border-white focus:bg-white/20 focus:ring-2 focus:ring-white/30"
                required
              />
            </div>

            <button 
              type="submit" 
              disabled={yukleniyor}
              className="mt-6 flex w-full items-center justify-center gap-2 rounded-lg bg-accent py-3 font-semibold text-white shadow-lg transition hover:bg-accentDark disabled:cursor-not-allowed disabled:bg-accent/70"
            >
              {yukleniyor && (
                <span className="h-4 w-4 animate-spin rounded-full border-2 border-white/40 border-t-white" aria-hidden />
              )}
              {yukleniyor ? "Giriş yapılıyor..." : "Giriş yap"}
            </button>
          </form>

          <p className="mt-8 text-center text-sm text-white/80">
            Hesabınız yok mu?{" "}
            <Link to="/kayit" className="font-semibold text-accent transition hover:text-accentDark hover:underline underline-offset-2">
              Kayıt ol
            </Link>
          </p>
        </div>
      </div>
    </section>
  );
}