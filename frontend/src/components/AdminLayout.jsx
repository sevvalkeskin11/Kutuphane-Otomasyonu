import { NavLink, Outlet } from 'react-router-dom'

const link = ({ isActive }) =>
  `block rounded-lg px-3 py-2 text-sm font-medium transition-colors ${
    isActive ? 'bg-white text-night shadow-sm' : 'text-ink/70 hover:bg-white/60 hover:text-ink'
  }`

export default function AdminLayout() {
  return (
    <div className="min-h-screen bg-surface">
      <div className="border-b border-ink/5 bg-white">
        <div className="mx-auto flex max-w-6xl items-center justify-between px-4 py-4 md:px-6">
          <NavLink to="/admin" className="font-bold text-night">
            Yönetim paneli
          </NavLink>
          <NavLink to="/" className="text-sm font-medium text-accent hover:text-accentDark">
            Siteye dön
          </NavLink>
        </div>
      </div>
      <div className="mx-auto flex max-w-6xl flex-col gap-8 px-4 py-8 md:flex-row md:px-6">
        <aside className="w-full shrink-0 md:w-52">
          <nav className="space-y-1 rounded-card bg-ink/[0.03] p-2">
            <NavLink to="/admin" end className={link}>
              Özet
            </NavLink>
            <NavLink to="/admin/kullanicilar" className={link}>
              Kullanıcılar
            </NavLink>
            <NavLink to="/admin/odunc" className={link}>
              Ödünç işlemleri
            </NavLink>
          </nav>
        </aside>
        <div className="min-w-0 flex-1">
          <Outlet />
        </div>
      </div>
    </div>
  )
}
