import { data } from "autoprefixer";
import React from "react";
import { useState } from "react";
import { useNavigate } from "react-router-dom";

export default function SignInAdminForm() {
  const [form, setForm] = useState({ email: "", password: "" });
  const navigate = useNavigate();

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setForm({ ...form, [e.target.name]: e.target.value });
  };

  const handleAdminLogin = async (e: React.FormEvent) => {
    e.preventDefault();

    try {
      const response = await fetch("http://localhost:3001/admin/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email: form.email, password: form.password }),
      });

      const data = await response.json();
      console.log("Admin login response:", data); // Debug log

      if (response.ok) {
        localStorage.setItem("admin", JSON.stringify(data.admin));
        window.dispatchEvent(new Event("storage"));
        alert("Admin girişi başarılı!");
        navigate("/adminpanel");
      } else {
        alert(data.message || "Giriş başarısız. Lütfen bilgilerinizi kontrol edin.");
      }
    } catch (error) {
      console.error("Admin giriş hatası:", error);
      alert("Bir hata oluştu. Lütfen tekrar deneyin.");
    }
  };

  return (
     <div className="max-w-md mx-auto mt-10 p-6 bg-white rounded-lg shadow-md ">
      <form onSubmit={handleAdminLogin} className="space-y-4">
        <div>
          <label className="block mb-1">Email Adresi</label>
          <input
            name="email"
            type="text"
            className="w-full border border-gray-300 p-2 rounded-lg"
            value={form.email}
            onChange={handleChange}
            required
          />
        </div>
        <div>
          <label className="block mb-1">Şifre</label>
          <input
            name="password"
            type="password"
            className="w-full border border-gray-300 p-2 rounded-lg"
            value={form.password}
            onChange={handleChange}
            required
          />
        </div>
        <div className="flex justify-between items-center">
          <label>
            <input type="checkbox" className="mr-2" /> Beni hatırla
          </label>
          <a href="#" className="text-cyan-700 text-sm">
            Şifremi unuttum
          </a>
        </div>
        <button
          type="submit"
          className="w-full bg-cyan-700 text-white p-2 rounded-lg hover:bg-cyan-800"
        >
          Giriş Yap
        </button>
        <div className="text-center">
          <p>
            Hesabınız yok mu?{" "}
            <a href="./" className="text-cyan-600">
              Üye ol
            </a>
          </p>
        </div>
      </form>
    </div>
  );
}