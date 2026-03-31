import { Link, NavLink, Outlet } from 'react-router-dom'

const navClass = ({ isActive }) =>
  `text-sm font-medium transition-colors ${isActive ? 'text-accent' : 'text-ink/70 hover:text-ink'}`

export default function Layout() {
  return (
    <div className="flex min-h-screen flex-col">
      <header className="sticky top-0 z-50 border-b border-ink/5 bg-surface/90 backdrop-blur-md">
        <div className="mx-auto flex h-16 max-w-6xl items-center justify-between gap-4 px-4 md:px-6">
          <Link to="/" className="flex items-center gap-2 font-bold tracking-tight text-ink">
            <svg
              xmlns="http://www.w3.org/2000/svg"
              width="44"
              height="44"
              viewBox="0 0 100 100"
              role="img"
              aria-label="ADLIB Kütüphane Otomasyonu logosu"
              className="shrink-0"
            >
              <rect width="100" height="100" rx="10" fill="#111827" />
              <g transform="translate(35, 25)">
                <rect x="0" y="0" width="30" height="50" rx="4" stroke="#ffffff" strokeWidth="3" fill="none" />
                <rect x="35" y="5" width="8" height="8" rx="2" fill="#ff6f3c" opacity="0.6" />
                <rect x="35" y="18" width="8" height="8" rx="2" fill="#ff6f3c" opacity="0.8" />
                <rect x="35" y="31" width="8" height="8" rx="2" fill="#ff6f3c" />
                <text
                  x="15"
                  y="65"
                  textAnchor="middle"
                  fill="#ffffff"
                  fontFamily="'Segoe UI', Roboto, Helvetica, Arial, sans-serif"
                  fontSize="8"
                  fontWeight="bold"
                >
                  ADLIB
                </text>
                <text
                  x="15"
                  y="72"
                  textAnchor="middle"
                  fill="#94a3b8"
                  fontFamily="'Segoe UI', Roboto, Helvetica, Arial, sans-serif"
                  fontSize="4"
                >
                  KUTUPHANE OTOMASYONU
                </text>
              </g>
            </svg>
            <span className="hidden sm:inline">Kütüphane</span>
          </Link>
          <nav className="flex items-center gap-6 md:gap-8">
            <NavLink to="/" end className={navClass}>
              Anasayfa
            </NavLink>
            <NavLink to="/katalog" className={navClass}>
              Katalog
            </NavLink>
            <NavLink to="/giris" className={navClass}>
              Giriş
            </NavLink>
            <NavLink to="/kayit" className={navClass}>
              Kayıt
            </NavLink>
            <NavLink
              to="/admin"
              className={({ isActive }) =>
                `rounded-full px-3 py-1.5 text-sm font-semibold transition-colors ${
                  isActive ? 'bg-night text-white' : 'bg-night/10 text-night hover:bg-night/15'
                }`
              }
            >
              Admin
            </NavLink>
          </nav>
        </div>
      </header>
      <main className="flex-1">
        <Outlet />
      </main>
      <footer className="border-t border-ink/5 bg-white py-8">
        <div className="mx-auto max-w-6xl px-4 text-center text-sm text-ink/50 md:px-6">
          Modern Kütüphane Otomasyonu — veriler Google Books API ile zenginleştirilir.
        </div>
      </footer>
    </div>
  )
}
