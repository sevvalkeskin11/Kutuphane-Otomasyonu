import { Navigate, NavLink, Outlet, useLocation, useNavigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";

const NAV = [
  { to: "/admin", label: "Özet", icon: "stats", end: true },
  { to: "/admin/kullanicilar", label: "Kullanıcılar", icon: "users" },
  { to: "/admin/odunc", label: "Ödünç işlemleri", icon: "swap" },
];

export default function AdminLayout() {
  const { user, isAdmin, logout } = useAuth();
  const location = useLocation();
  const navigate = useNavigate();

  if (!isAdmin) {
    return <Navigate to="/" replace />;
  }

  const current = NAV.find((n) => (n.end ? location.pathname === n.to : location.pathname.startsWith(n.to))) || NAV[0];
  const initials = getInitials(user?.fullName);

  return (
    <div className="flex min-h-screen bg-surface">
      <aside className="sticky top-0 hidden h-screen w-60 shrink-0 flex-col border-r border-ink/8 bg-white md:flex">
        <div className="flex items-center gap-2 px-5 py-5">
          <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-gradient-to-br from-accent to-accentDark text-white shadow-md shadow-accent/30">
            <BookIcon />
          </div>
          <div className="min-w-0">
            <p className="text-xs font-semibold uppercase tracking-[0.18em] text-ink/45">Yönetim</p>
            <p className="truncate text-sm font-bold text-ink">Kütüphane paneli</p>
          </div>
        </div>

        <nav className="flex-1 space-y-1 px-3">
          {NAV.map((item) => (
            <NavLink
              key={item.to}
              to={item.to}
              end={item.end}
              className={({ isActive }) =>
                `group flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-medium transition ${
                  isActive
                    ? "bg-accent/10 text-accentDark"
                    : "text-ink/65 hover:bg-surface hover:text-ink"
                }`
              }
            >
              {({ isActive }) => (
                <>
                  <span
                    className={`flex h-8 w-8 items-center justify-center rounded-lg transition ${
                      isActive ? "bg-accent text-white" : "bg-ink/[0.04] text-ink/55 group-hover:bg-ink/8"
                    }`}
                  >
                    <NavIcon name={item.icon} />
                  </span>
                  <span className="flex-1">{item.label}</span>
                  {isActive && <span className="h-2 w-2 rounded-full bg-accent" aria-hidden />}
                </>
              )}
            </NavLink>
          ))}
        </nav>

        <div className="px-3 pb-3">
          <div className="rounded-2xl border border-ink/8 bg-surface p-3">
            <div className="flex items-center gap-3">
              <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-night text-sm font-bold text-white">
                {initials}
              </div>
              <div className="min-w-0 flex-1">
                <p className="truncate text-sm font-semibold text-ink">{user?.fullName || "Yönetici"}</p>
                <p className="truncate text-[11px] text-ink/55">{user?.email}</p>
              </div>
            </div>
            <div className="mt-3 grid grid-cols-2 gap-2">
              <button
                onClick={() => navigate("/")}
                className="rounded-lg bg-white px-2.5 py-1.5 text-xs font-semibold text-ink/70 shadow-sm transition hover:text-ink"
              >
                Siteye dön
              </button>
              <button
                onClick={() => {
                  logout();
                  navigate("/");
                }}
                className="rounded-lg bg-accent px-2.5 py-1.5 text-xs font-semibold text-white shadow-sm transition hover:bg-accentDark"
              >
                Çıkış
              </button>
            </div>
          </div>
        </div>
      </aside>

      <div className="flex min-w-0 flex-1 flex-col">
        <header className="sticky top-0 z-20 flex items-center justify-between gap-3 border-b border-ink/8 bg-white/85 px-4 py-3 backdrop-blur md:px-8">
          <div className="flex items-center gap-2 text-sm">
            <span className="text-ink/45">Yönetim</span>
            <span className="text-ink/25">/</span>
            <span className="font-semibold text-ink">{current.label}</span>
          </div>

          <div className="flex items-center gap-2 md:hidden">
            <select
              value={current.to}
              onChange={(e) => navigate(e.target.value)}
              className="rounded-lg border border-ink/10 bg-white px-2 py-1.5 text-sm font-medium text-ink"
              aria-label="Sayfa seç"
            >
              {NAV.map((n) => (
                <option key={n.to} value={n.to}>
                  {n.label}
                </option>
              ))}
            </select>
            <button
              onClick={() => {
                logout();
                navigate("/");
              }}
              className="rounded-lg bg-accent px-3 py-1.5 text-xs font-semibold text-white"
            >
              Çıkış
            </button>
          </div>
        </header>

        <main className="mx-auto w-full max-w-6xl flex-1 px-4 py-6 md:px-8 md:py-8">
          <Outlet />
        </main>
      </div>
    </div>
  );
}

function getInitials(name) {
  if (!name || typeof name !== "string") return "Y";
  const parts = name.trim().split(/\s+/);
  return ((parts[0]?.[0] || "") + (parts.length > 1 ? parts[parts.length - 1][0] : "")).toUpperCase() || "Y";
}

function BookIcon() {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" className="h-5 w-5" aria-hidden>
      <path d="M4 5.5A2.5 2.5 0 016.5 3H20v15H6.5A2.5 2.5 0 004 20.5v-15z" />
      <path d="M4 20.5A2.5 2.5 0 016.5 18H20" />
    </svg>
  );
}

function NavIcon({ name }) {
  const props = {
    viewBox: "0 0 24 24",
    fill: "none",
    stroke: "currentColor",
    strokeWidth: "1.8",
    strokeLinecap: "round",
    strokeLinejoin: "round",
    className: "h-4 w-4",
    "aria-hidden": true,
  };
  if (name === "stats") {
    return (
      <svg {...props}>
        <path d="M4 19V9" />
        <path d="M10 19V5" />
        <path d="M16 19v-7" />
        <path d="M22 19H2" />
      </svg>
    );
  }
  if (name === "users") {
    return (
      <svg {...props}>
        <path d="M16 21v-2a4 4 0 00-8 0v2" />
        <circle cx="12" cy="7" r="4" />
      </svg>
    );
  }
  if (name === "swap") {
    return (
      <svg {...props}>
        <path d="M7 4l-4 4 4 4" />
        <path d="M3 8h14" />
        <path d="M17 20l4-4-4-4" />
        <path d="M21 16H7" />
      </svg>
    );
  }
  return null;
}
