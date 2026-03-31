import { Link } from 'react-router-dom'
import { useState } from 'react'

export default function Login() {
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')

  function onSubmit(e) {
    e.preventDefault()
    // JWT backend bağlandığında burada çağrılacak
    alert('Giriş isteği gönderildi (demo). Backend JWT entegrasyonu eklenecek.')
  }

  return (
    <div className="mx-auto max-w-md px-4 py-16 md:px-6">
      <div className="rounded-card bg-white p-8 shadow-card">
        <h1 className="mb-1 text-2xl font-bold text-ink">Giriş yap</h1>
        <p className="mb-8 text-sm text-ink/55">Hesabınıza erişin ve ödünçlerinizi görün.</p>
        <form onSubmit={onSubmit} className="space-y-5">
          <div>
            <label htmlFor="email" className="mb-1.5 block text-sm font-medium text-ink">
              E-posta
            </label>
            <input
              id="email"
              type="email"
              autoComplete="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="w-full rounded-lg border border-ink/10 bg-surface px-4 py-3 text-ink outline-none transition focus:border-accent focus:ring-2 focus:ring-accent/20"
              required
            />
          </div>
          <div>
            <label htmlFor="password" className="mb-1.5 block text-sm font-medium text-ink">
              Şifre
            </label>
            <input
              id="password"
              type="password"
              autoComplete="current-password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="w-full rounded-lg border border-ink/10 bg-surface px-4 py-3 text-ink outline-none transition focus:border-accent focus:ring-2 focus:ring-accent/20"
              required
            />
          </div>
          <button
            type="submit"
            className="w-full rounded-lg bg-night py-3 font-semibold text-white transition hover:bg-nightLight"
          >
            Giriş yap
          </button>
        </form>
        <p className="mt-6 text-center text-sm text-ink/55">
          Hesabınız yok mu?{' '}
          <Link to="/kayit" className="font-semibold text-accent hover:text-accentDark">
            Kayıt ol
          </Link>
        </p>
      </div>
    </div>
  )
}
