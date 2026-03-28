import { Link } from 'react-router-dom'
import { useState } from 'react'

export default function Register() {
  const [name, setName] = useState('')
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')

  function onSubmit(e) {
    e.preventDefault()
    alert('Kayıt isteği gönderildi (demo). Backend JWT entegrasyonu eklenecek.')
  }

  return (
    <div className="mx-auto max-w-md px-4 py-16 md:px-6">
      <div className="rounded-card bg-white p-8 shadow-card">
        <h1 className="mb-1 text-2xl font-bold text-ink">Kayıt ol</h1>
        <p className="mb-8 text-sm text-ink/55">Ücretsiz üye olun ve kitap ödünç alın.</p>
        <form onSubmit={onSubmit} className="space-y-5">
          <div>
            <label htmlFor="name" className="mb-1.5 block text-sm font-medium text-ink">
              Ad soyad
            </label>
            <input
              id="name"
              type="text"
              autoComplete="name"
              value={name}
              onChange={(e) => setName(e.target.value)}
              className="w-full rounded-lg border border-ink/10 bg-surface px-4 py-3 text-ink outline-none transition focus:border-accent focus:ring-2 focus:ring-accent/20"
              required
            />
          </div>
          <div>
            <label htmlFor="reg-email" className="mb-1.5 block text-sm font-medium text-ink">
              E-posta
            </label>
            <input
              id="reg-email"
              type="email"
              autoComplete="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="w-full rounded-lg border border-ink/10 bg-surface px-4 py-3 text-ink outline-none transition focus:border-accent focus:ring-2 focus:ring-accent/20"
              required
            />
          </div>
          <div>
            <label htmlFor="reg-password" className="mb-1.5 block text-sm font-medium text-ink">
              Şifre
            </label>
            <input
              id="reg-password"
              type="password"
              autoComplete="new-password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              minLength={8}
              className="w-full rounded-lg border border-ink/10 bg-surface px-4 py-3 text-ink outline-none transition focus:border-accent focus:ring-2 focus:ring-accent/20"
              required
            />
            <p className="mt-1 text-xs text-ink/45">En az 8 karakter.</p>
          </div>
          <button
            type="submit"
            className="w-full rounded-lg bg-accent py-3 font-semibold text-white transition hover:bg-accentDark"
          >
            Hesap oluştur
          </button>
        </form>
        <p className="mt-6 text-center text-sm text-ink/55">
          Zaten üye misiniz?{' '}
          <Link to="/giris" className="font-semibold text-night hover:underline">
            Giriş yap
          </Link>
        </p>
      </div>
    </div>
  )
}
