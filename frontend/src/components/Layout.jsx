import { Link, NavLink, Outlet, useLocation } from 'react-router-dom'

const navClass = ({ isActive }) =>
  `text-sm font-medium transition-colors ${isActive ? 'text-accent' : 'text-ink/70 hover:text-ink'}`

const navIconClass = "h-5 w-5 shrink-0"

export default function Layout() {
  const { pathname } = useLocation()
  const isAuthPage = pathname === '/giris' || pathname === '/kayit'

  return (
    <div className="flex min-h-screen flex-col">
      <header className="sticky top-0 z-50 border-b border-ink/5 bg-surface/90 backdrop-blur-md">
        <div className="mx-auto flex h-16 max-w-6xl items-center justify-between gap-4 px-4 md:px-6">
          <Link to="/" className="flex items-center gap-2 font-bold tracking-tight text-ink">
            <img
              src="/logo.png"
              alt="Kütüphane Otomasyonu logosu"
              className="h-11 w-11 shrink-0 rounded-md object-cover"
            />
            <span className="hidden sm:inline">Kütüphane</span>
          </Link>
          <nav className="flex items-center gap-6 md:gap-8">
            <NavLink to="/" end className={navClass}>
              Anasayfa
            </NavLink>
            <NavLink to="/katalog" className={navClass}>
              Kitaplar
            </NavLink>
            <NavLink to="/giris" className={({ isActive }) => `${navClass({ isActive })} inline-flex items-center gap-2`}>
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" className={navIconClass} aria-hidden>
                <path d="M20 21a8 8 0 10-16 0" strokeWidth="1.8" strokeLinecap="round" />
                <circle cx="12" cy="8" r="4" strokeWidth="1.8" />
              </svg>
              Üye Girişi
            </NavLink>
            <NavLink to="/kayit" className={({ isActive }) => `${navClass({ isActive })} inline-flex items-center gap-2`}>
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" className={navIconClass} aria-hidden>
                <path d="M20 21a8 8 0 10-16 0" strokeWidth="1.8" strokeLinecap="round" />
                <circle cx="12" cy="8" r="4" strokeWidth="1.8" />
                <circle cx="19" cy="18" r="3.2" strokeWidth="1.8" />
                <path d="M19 16.6v2.8M17.6 18h2.8" strokeWidth="1.8" strokeLinecap="round" />
              </svg>
              Üye Ol
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
      {!isAuthPage && (
        <footer className="border-t border-ink/5 bg-white py-8">
          <div className="mx-auto max-w-6xl px-4 text-center text-sm text-ink/50 md:px-6">
            Modern Kütüphane Otomasyonu — kitap verileri PostgreSQL veritabanınızdan gelir.
          </div>
        </footer>
      )}
    </div>
  )
}
