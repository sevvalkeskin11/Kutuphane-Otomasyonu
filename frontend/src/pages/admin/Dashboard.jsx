import { useEffect, useMemo, useState } from "react";
import { Link } from "react-router-dom";
import { apiUrl } from "../../services/dbBooks";
import { useAuth } from "../../context/AuthContext";

export default function Dashboard() {
  const { token } = useAuth();
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    if (!token) return;
    let cancelled = false;
    setLoading(true);
    fetch(apiUrl("/api/admin/dashboard"), {
      headers: { Authorization: `Bearer ${token}` },
    })
      .then(async (r) => {
        const body = await r.json().catch(() => ({}));
        if (!r.ok) throw new Error(body.error || "Veri alınamadı");
        return body;
      })
      .then((body) => !cancelled && setData(body))
      .catch((err) => !cancelled && setError(err.message))
      .finally(() => !cancelled && setLoading(false));
    return () => {
      cancelled = true;
    };
  }, [token]);

  return (
    <div>
      <PageHeader
        title="Özet"
        subtitle="Kütüphanenin güncel durumu ve haftalık ödünç hareketleri."
      />

      {error && (
        <div className="mb-6 rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
          {error}
        </div>
      )}

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <StatCard
          label="Toplam kitap"
          value={data?.totalBooks}
          loading={loading}
          tone="ink"
          icon="book"
          hint="Katalogdaki kayıt sayısı"
        />
        <StatCard
          label="Aktif ödünç"
          value={data?.activeBorrows}
          loading={loading}
          tone="night"
          icon="user"
          hint="Şu an okuyucuda"
        />
        <StatCard
          label="Gecikenler"
          value={data?.overdue}
          loading={loading}
          tone="accent"
          icon="alert"
          hint="İade tarihi geçmiş"
          highlight={(data?.overdue || 0) > 0}
        />
        <StatCard
          label="Bu hafta ödünç"
          value={(data?.weekData || []).reduce((acc, d) => acc + (d.v || 0), 0)}
          loading={loading}
          tone="emerald"
          icon="trend"
          hint="Son 7 gün toplamı"
        />
      </div>

      <div className="mt-6 grid gap-4 lg:grid-cols-3">
        <WeeklyChart data={data?.weekData || []} loading={loading} />
        <QuickActions />
      </div>
    </div>
  );
}

function PageHeader({ title, subtitle }) {
  return (
    <div className="mb-6 flex flex-wrap items-end justify-between gap-3">
      <div>
        <h1 className="text-2xl font-bold text-ink md:text-[1.7rem]">{title}</h1>
        <p className="mt-1 text-sm text-ink/55">{subtitle}</p>
      </div>
    </div>
  );
}

function StatCard({ label, value, loading, tone = "ink", icon, hint, highlight }) {
  const toneCls = {
    ink: "text-ink",
    night: "text-night",
    accent: "text-accent",
    emerald: "text-emerald-600",
  }[tone];

  const iconBg = {
    ink: "bg-ink/[0.06] text-ink/70",
    night: "bg-night/10 text-night",
    accent: "bg-accent/15 text-accentDark",
    emerald: "bg-emerald-100 text-emerald-700",
  }[tone];

  return (
    <div
      className={`relative overflow-hidden rounded-2xl border bg-white p-5 transition hover:-translate-y-0.5 hover:shadow-md ${
        highlight ? "border-accent/40 shadow-md shadow-accent/10" : "border-ink/8 shadow-sm"
      }`}
    >
      <div className="flex items-start justify-between">
        <p className="text-xs font-semibold uppercase tracking-[0.16em] text-ink/50">
          {label}
        </p>
        <span className={`flex h-8 w-8 items-center justify-center rounded-lg ${iconBg}`}>
          <StatIcon name={icon} />
        </span>
      </div>
      <p className={`mt-3 text-[2rem] font-bold leading-none tracking-tight ${toneCls}`}>
        {loading ? (
          <span className="inline-block h-8 w-16 animate-pulse rounded bg-ink/10 align-middle" />
        ) : value != null ? (
          Number(value).toLocaleString("tr-TR")
        ) : (
          "—"
        )}
      </p>
      {hint && <p className="mt-2 text-xs text-ink/50">{hint}</p>}
    </div>
  );
}

function WeeklyChart({ data, loading }) {
  const max = Math.max(1, ...data.map((d) => d.v || 0));
  const total = data.reduce((acc, d) => acc + (d.v || 0), 0);
  const peak = useMemo(() => {
    if (!data.length) return null;
    return data.reduce((acc, d) => (d.v > (acc?.v ?? -Infinity) ? d : acc), null);
  }, [data]);

  return (
    <div className="rounded-2xl border border-ink/8 bg-white p-5 shadow-sm lg:col-span-2">
      <div className="mb-1 flex flex-wrap items-end justify-between gap-2">
        <div>
          <h2 className="text-base font-bold text-ink">Haftalık ödünç hareketleri</h2>
          <p className="mt-0.5 text-xs text-ink/55">Son 7 gün</p>
        </div>
        <div className="flex items-center gap-3 text-xs text-ink/55">
          <span>
            Toplam <span className="font-semibold text-ink">{total}</span>
          </span>
          {peak && peak.v > 0 && (
            <span>
              En yoğun <span className="font-semibold text-ink">{peak.label}</span>
            </span>
          )}
        </div>
      </div>

      <div className="mt-5 flex h-56 items-end justify-between gap-3">
        {(loading ? Array.from({ length: 7 }) : data).map((d, i) => {
          if (loading) {
            return (
              <div key={i} className="flex flex-1 flex-col items-center gap-2">
                <div className="h-32 w-full max-w-[42px] animate-pulse rounded-md bg-ink/8" />
                <div className="h-3 w-6 animate-pulse rounded bg-ink/8" />
              </div>
            );
          }
          const heightPct = (d.v / max) * 100;
          const isPeak = peak && d.label === peak.label && d.v > 0;
          return (
            <div key={d.label + i} className="flex flex-1 flex-col items-center gap-2">
              <div className="relative flex w-full max-w-[42px] flex-1 items-end">
                <div
                  className={`relative w-full rounded-t-md transition-all duration-700 ease-out ${
                    isPeak
                      ? "bg-gradient-to-t from-accent to-[#ff8b5e]"
                      : "bg-gradient-to-t from-night to-nightLight"
                  }`}
                  style={{
                    height: `${heightPct}%`,
                    minHeight: d.v ? "8px" : "2px",
                    opacity: d.v ? 1 : 0.35,
                  }}
                  title={`${d.label}: ${d.v}`}
                >
                  {d.v > 0 && (
                    <span className="absolute -top-5 left-1/2 -translate-x-1/2 text-[10px] font-semibold text-ink/60">
                      {d.v}
                    </span>
                  )}
                </div>
              </div>
              <span className="text-[11px] font-medium uppercase tracking-wider text-ink/45">
                {d.label}
              </span>
            </div>
          );
        })}
      </div>

      <div className="mt-4 h-px bg-ink/8" aria-hidden />

      <div className="mt-4 flex items-center gap-4 text-xs text-ink/55">
        <span className="flex items-center gap-1.5">
          <span className="h-2.5 w-2.5 rounded-sm bg-gradient-to-b from-night to-nightLight" />
          Günlük ödünç
        </span>
        <span className="flex items-center gap-1.5">
          <span className="h-2.5 w-2.5 rounded-sm bg-gradient-to-b from-accent to-[#ff8b5e]" />
          En yoğun gün
        </span>
      </div>
    </div>
  );
}

function QuickActions() {
  const items = [
    {
      to: "/admin/odunc",
      title: "Ödünç işlemleri",
      desc: "Aktif ödünçleri görüntüle, iade işlemleri yap.",
      icon: "swap",
    },
    {
      to: "/admin/kullanicilar",
      title: "Kullanıcı yönetimi",
      desc: "Üyeleri ara, durumlarını ve şifrelerini yönet.",
      icon: "users",
    },
    {
      to: "/katalog",
      title: "Katalogu görüntüle",
      desc: "Site tarafında kataloğu okuyucu gözüyle gör.",
      icon: "book",
    },
  ];
  return (
    <div className="rounded-2xl border border-ink/8 bg-white p-5 shadow-sm">
      <h2 className="text-base font-bold text-ink">Hızlı işlemler</h2>
      <p className="mt-0.5 text-xs text-ink/55">Sık kullanılan ekranlara kestirme.</p>
      <ul className="mt-4 space-y-2">
        {items.map((it) => (
          <li key={it.to}>
            <Link
              to={it.to}
              className="group flex items-center gap-3 rounded-xl border border-ink/8 bg-white p-3 transition hover:-translate-y-0.5 hover:border-accent/40 hover:shadow-md"
            >
              <span className="flex h-9 w-9 items-center justify-center rounded-lg bg-accent/10 text-accentDark transition group-hover:bg-accent group-hover:text-white">
                <StatIcon name={it.icon} />
              </span>
              <div className="min-w-0 flex-1">
                <p className="truncate text-sm font-semibold text-ink">{it.title}</p>
                <p className="truncate text-xs text-ink/55">{it.desc}</p>
              </div>
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" className="h-4 w-4 text-ink/35 transition group-hover:translate-x-0.5 group-hover:text-accent" aria-hidden>
                <path d="M9 5l7 7-7 7" />
              </svg>
            </Link>
          </li>
        ))}
      </ul>
    </div>
  );
}

function StatIcon({ name }) {
  const props = {
    viewBox: "0 0 24 24",
    fill: "none",
    stroke: "currentColor",
    strokeWidth: "1.7",
    strokeLinecap: "round",
    strokeLinejoin: "round",
    className: "h-4 w-4",
    "aria-hidden": true,
  };
  if (name === "book")
    return (
      <svg {...props}>
        <path d="M4 5.5A2.5 2.5 0 016.5 3H20v15H6.5A2.5 2.5 0 004 20.5v-15z" />
        <path d="M4 20.5A2.5 2.5 0 016.5 18H20" />
      </svg>
    );
  if (name === "user")
    return (
      <svg {...props}>
        <path d="M20 21a8 8 0 10-16 0" />
        <circle cx="12" cy="8" r="4" />
      </svg>
    );
  if (name === "alert")
    return (
      <svg {...props}>
        <path d="M12 3l10 18H2L12 3z" />
        <path d="M12 10v4" />
        <path d="M12 17h.01" strokeWidth="2.4" />
      </svg>
    );
  if (name === "trend")
    return (
      <svg {...props}>
        <path d="M3 17l6-6 4 4 7-7" />
        <path d="M14 8h6v6" />
      </svg>
    );
  if (name === "users")
    return (
      <svg {...props}>
        <path d="M16 21v-2a4 4 0 00-8 0v2" />
        <circle cx="12" cy="7" r="4" />
      </svg>
    );
  if (name === "swap")
    return (
      <svg {...props}>
        <path d="M7 4l-4 4 4 4" />
        <path d="M3 8h14" />
        <path d="M17 20l4-4-4-4" />
        <path d="M21 16H7" />
      </svg>
    );
  return null;
}
