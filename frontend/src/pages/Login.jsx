import { Link, useNavigate } from "react-router-dom";
import { useState } from "react";

export default function Login() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [hataMesaji, setHataMesaji] = useState(""); // Hataları ekranda göstermek için
  const navigate = useNavigate(); // Giriş başarılıysa yönlendirmek için

  async function onSubmit(e) {
    e.preventDefault();
    setHataMesaji(""); // Yeni denemede eski hatayı temizle

    try {
      // 1. Backend'e isteği at
      const response = await fetch("http://localhost:5050/api/auth/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, password }),
      });

      const data = await response.json();

      // 2. Eğer backend hata dönerse (örn: yanlış şifre)
      if (!response.ok) {
        throw new Error(data.error || "Giriş yapılamadı.");
      }

      // 3. Başarılıysa! Token'ı ve kullanıcıyı tarayıcıya kaydet
      localStorage.setItem("token", data.token);
      localStorage.setItem("user", JSON.stringify(data.user));

      // 4. Anasayfaya yönlendir
      navigate("/"); 

    } catch (err) {
      setHataMesaji(err.message); // Hatayı ekrana basmak için state'e kaydet
    }
  }

  return (
    <section className="relative flex min-h-[calc(100vh-140px)] items-start overflow-hidden px-4 py-8 md:px-6 md:py-10">
      <div
        className="absolute inset-0 bg-cover bg-center bg-no-repeat"
        style={{
          backgroundImage: "url('/pexels-ian-panelo-35644053.jpg')",
          backgroundPosition: "center 24%",
        }}
      />
      <div className="absolute inset-0 bg-black/45" />
      <div className="relative mx-auto flex w-full max-w-5xl justify-center">
        <div className="w-full max-w-md rounded-panel min-h-[560px] border border-white/35 bg-white/78 p-6 shadow-card backdrop-blur-sm sm:p-8">
          <div className="mb-6">
            <div className="mb-5 h-1.5 w-20 rounded-full bg-accent" />
            <h1 className="mb-1 text-3xl font-bold text-white">
              Tekrar hoş geldiniz
            </h1>
            <p className="text-sm text-white/85">
              Devam etmek için hesabınıza giriş yapın.
            </p>
          </div>

          {/* Hata varsa ekranda kırmızı bir kutu içinde göster */}
          {hataMesaji && (
            <div className="mb-4 rounded bg-red-500/80 p-3 text-sm text-white backdrop-blur">
              {hataMesaji}
            </div>
          )}

          <form onSubmit={onSubmit} className="space-y-4">
            <div className="space-y-1.5">
              <label htmlFor="email" className="block text-sm font-medium text-white">E-posta</label>
              <input
                id="email"
                type="email"
                autoComplete="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="w-full rounded-lg border border-white/60 bg-white/25 px-4 py-2.5 text-white outline-none placeholder:text-white/65 transition focus:border-white focus:ring-2 focus:ring-white/30"
                required
              />
            </div>

            <div className="space-y-1.5">
              <div className="flex items-center justify-between">
                <label htmlFor="password" className="block text-sm font-medium text-white">Şifre</label>
                <button type="button" className="text-xs text-white/80 transition hover:text-white">Şifremi unuttum</button>
              </div>
              <input
                id="password"
                type="password"
                autoComplete="current-password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="w-full rounded-lg border border-white/60 bg-white/25 px-4 py-2.5 text-white outline-none placeholder:text-white/65 transition focus:border-white focus:ring-2 focus:ring-white/30"
                required
              />
            </div>

            <div className="h-[86px]" aria-hidden="true" />

            <button type="submit" className="w-full rounded-lg bg-accent py-3 font-semibold text-white transition hover:bg-accentDark">
              Giriş yap
            </button>
          </form>

          <p className="mt-6 text-center text-sm text-white/85">
            Hesabınız yok mu?{" "}
            <Link to="/kayit" className="font-semibold text-accent transition hover:text-accentDark">Kayıt ol</Link>
          </p>
        </div>
      </div>
    </section>
  );
}