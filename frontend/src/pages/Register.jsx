import { Link, useNavigate } from "react-router-dom";
import { useState } from "react";

export default function Register() {
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [hataMesaji, setHataMesaji] = useState("");
  const navigate = useNavigate();

  async function onSubmit(e) {
    e.preventDefault();
    setHataMesaji("");

    try {
      // 1. Backend'e kayıt isteği at
      // DİKKAT: name değişkenini fullName olarak yolluyoruz çünkü backend öyle istiyor!
      const response = await fetch("http://localhost:5050/api/auth/register", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ fullName: name, email, password }),
      });

      const data = await response.json();

      // 2. E-posta zaten kayıtlıysa vs. hata fırlat
      if (!response.ok) {
        throw new Error(data.error || "Kayıt işlemi başarısız oldu.");
      }

      // 3. Başarılıysa direkt token'ı kaydet ve giriş yapmış say
      localStorage.setItem("token", data.token);
      localStorage.setItem("user", JSON.stringify(data.user));

      alert("Kayıt başarılı! Kütüphaneye hoş geldiniz.");
      
      // 4. Anasayfaya yönlendir
      navigate("/");

    } catch (err) {
      setHataMesaji(err.message);
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
            <h1 className="mb-1 text-3xl font-bold text-white">Hesap oluştur</h1>
            <p className="text-sm text-white/85">Kütüphaneye katılın ve ödünç işlemlerini kolayca yönetin.</p>
          </div>

          {/* Hata varsa ekranda göster */}
          {hataMesaji && (
            <div className="mb-4 rounded bg-red-500/80 p-3 text-sm text-white backdrop-blur">
              {hataMesaji}
            </div>
          )}

          <form onSubmit={onSubmit} className="space-y-4">
            <div className="space-y-1.5">
              <label htmlFor="name" className="block text-sm font-medium text-white">Ad soyad</label>
              <input
                id="name"
                type="text"
                autoComplete="name"
                value={name}
                onChange={(e) => setName(e.target.value)}
                className="w-full rounded-lg border border-white/60 bg-white/25 px-4 py-2.5 text-white outline-none placeholder:text-white/65 transition focus:border-white focus:ring-2 focus:ring-white/30"
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
                className="w-full rounded-lg border border-white/60 bg-white/25 px-4 py-2.5 text-white outline-none placeholder:text-white/65 transition focus:border-white focus:ring-2 focus:ring-white/30"
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
                className="w-full rounded-lg border border-white/60 bg-white/25 px-4 py-2.5 text-white outline-none placeholder:text-white/65 transition focus:border-white focus:ring-2 focus:ring-white/30"
                required
              />
              <p className="text-xs text-white/75">En az 8 karakter.</p>
            </div>
            <button type="submit" className="w-full rounded-lg bg-accent py-3 font-semibold text-white transition hover:bg-accentDark">
              Hesap oluştur
            </button>
          </form>

          <p className="mt-6 text-center text-sm text-white/85">
            Zaten üye misiniz?{" "}
            <Link to="/giris" className="font-semibold text-accent transition hover:text-accentDark">Giriş yap</Link>
          </p>
        </div>
      </div>
    </section>
  );
}