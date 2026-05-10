import { useEffect, useRef, useState } from 'react'
import { Link, NavLink, Outlet, useLocation, useNavigate } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'

const navClass = ({ isActive }) =>
  `text-sm font-medium transition-colors ${isActive ? 'text-accent' : 'text-ink/70 hover:text-ink'}`

const navIconClass = "h-5 w-5 shrink-0"

function getInitials(fullName) {
  const trimmed = String(fullName || '').trim()
  if (!trimmed) return 'Ü'
  const parts = trimmed.split(/\s+/).filter(Boolean)
  const first = parts[0]?.[0] || ''
  const last = parts.length > 1 ? parts[parts.length - 1][0] : ''
  return (first + last).toUpperCase() || 'Ü'
}

function UserMenu() {
  const { user, isAdmin, logout } = useAuth()
  const navigate = useNavigate()
  const [open, setOpen] = useState(false)
  const wrapperRef = useRef(null)

  useEffect(() => {
    if (!open) return
    function handleClick(event) {
      if (wrapperRef.current && !wrapperRef.current.contains(event.target)) {
        setOpen(false)
      }
    }
    function handleKey(event) {
      if (event.key === 'Escape') setOpen(false)
    }
    document.addEventListener('mousedown', handleClick)
    document.addEventListener('keydown', handleKey)
    return () => {
      document.removeEventListener('mousedown', handleClick)
      document.removeEventListener('keydown', handleKey)
    }
  }, [open])

  function handleLogout() {
    setOpen(false)
    logout()
    navigate('/')
  }

  return (
    <div ref={wrapperRef} className="relative">
      <button
        type="button"
        onClick={() => setOpen((prev) => !prev)}
        aria-haspopup="menu"
        aria-expanded={open}
        className="flex items-center gap-2 rounded-full border border-ink/10 bg-white px-2 py-1 text-sm font-medium text-ink transition hover:border-ink/20 hover:bg-ink/5"
      >
        <span className="flex h-7 w-7 items-center justify-center rounded-full bg-accent text-xs font-semibold text-white">
          {getInitials(user?.fullName)}
        </span>
        <span className="hidden max-w-[120px] truncate sm:inline">
          {user?.fullName || user?.email || 'Hesabım'}
        </span>
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" className="h-4 w-4 text-ink/60" aria-hidden>
          <path d="M6 9l6 6 6-6" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" />
        </svg>
      </button>

      {open && (
        <div
          role="menu"
          className="absolute right-0 mt-2 w-56 overflow-hidden rounded-xl border border-ink/10 bg-white shadow-lg"
        >
          <div className="border-b border-ink/5 px-4 py-3">
            <p className="truncate text-sm font-semibold text-ink">{user?.fullName || 'Üye'}</p>
            {user?.email && (
              <p className="truncate text-xs text-ink/60">{user.email}</p>
            )}
          </div>
          <div className="py-1 text-sm">
            <Link
              to="/profil"
              onClick={() => setOpen(false)}
              role="menuitem"
              className="flex items-center gap-2 px-4 py-2 text-ink/80 transition hover:bg-ink/[0.04] hover:text-ink"
            >
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" className="h-4 w-4" aria-hidden>
                <path d="M20 21a8 8 0 10-16 0" strokeWidth="1.8" strokeLinecap="round" />
                <circle cx="12" cy="8" r="4" strokeWidth="1.8" />
              </svg>
              Profilim
            </Link>
            {isAdmin && (
              <Link
                to="/admin"
                onClick={() => setOpen(false)}
                role="menuitem"
                className="flex items-center gap-2 px-4 py-2 text-ink/80 transition hover:bg-ink/[0.04] hover:text-ink"
              >
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" className="h-4 w-4" aria-hidden>
                  <path d="M3 12l2-2 4 4 8-8 4 4" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" />
                </svg>
                Yönetim paneli
              </Link>
            )}
            <div className="my-1 border-t border-ink/5" />
            <button
              type="button"
              role="menuitem"
              onClick={handleLogout}
              className="flex w-full items-center gap-2 px-4 py-2 text-left text-red-600 transition hover:bg-red-50"
            >
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" className="h-4 w-4" aria-hidden>
                <path d="M15 17l5-5-5-5M20 12H9M12 21H6a2 2 0 01-2-2V5a2 2 0 012-2h6" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" />
              </svg>
              Çıkış yap
            </button>
          </div>
        </div>
      )}
    </div>
  )
}

export default function Layout() {
  const { pathname } = useLocation()
  const { isAuthenticated, isAdmin } = useAuth()
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

            {!isAuthenticated && (
              <>
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
              </>
            )}

            {isAuthenticated && isAdmin && (
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
            )}

            {isAuthenticated && <UserMenu />}
          </nav>
        </div>
      </header>
      <main className="flex-1 bg-surface">
        <Outlet />
      </main>
      {!isAuthPage && (
        <footer className="border-t border-ink/5 bg-surface py-4">
          <div className="mx-auto max-w-6xl px-4 text-center text-xs text-ink/50 md:px-6">
            Modern Kütüphane Otomasyonu — kitap verileri PostgreSQL veritabanınızdan gelir.
          </div>
        </footer>
      )}
    </div>
  )
}
