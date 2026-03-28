import { mockDashboardStats } from '../../data/mockAdmin'

function StatCard({ label, value, hint, accent }) {
  return (
    <div className="rounded-card bg-white p-6 shadow-card">
      <p className="text-sm font-medium text-ink/50">{label}</p>
      <p className={`mt-2 text-3xl font-bold tracking-tight ${accent || 'text-ink'}`}>{value}</p>
      {hint && <p className="mt-2 text-xs text-ink/45">{hint}</p>}
    </div>
  )
}

function SimpleBarChart({ data }) {
  const max = Math.max(...data.map((d) => d.v), 1)
  return (
    <div className="rounded-card bg-white p-6 shadow-card">
      <h2 className="mb-6 text-lg font-bold text-ink">Haftalık ödünç (örnek)</h2>
      <div className="flex h-48 items-end justify-between gap-2 border-b border-ink/10 pb-2">
        {data.map((d) => (
          <div key={d.label} className="flex flex-1 flex-col items-center gap-2">
            <div
              className="w-full max-w-[40px] rounded-t-md bg-gradient-to-t from-night to-nightLight transition-all"
              style={{ height: `${(d.v / max) * 100}%`, minHeight: d.v ? '8px' : '0' }}
              title={`${d.label}: ${d.v}`}
            />
            <span className="text-[10px] font-medium text-ink/45">{d.label}</span>
          </div>
        ))}
      </div>
    </div>
  )
}

export default function Dashboard() {
  const s = mockDashboardStats
  const weekData = [
    { label: 'Pt', v: 42 },
    { label: 'Sa', v: 55 },
    { label: 'Ça', v: 38 },
    { label: 'Pe', v: 61 },
    { label: 'Cu', v: 48 },
    { label: 'Ct', v: 22 },
    { label: 'Pa', v: 18 },
  ]

  return (
    <div>
      <h1 className="mb-2 text-2xl font-bold text-ink">Özet</h1>
      <p className="mb-8 text-sm text-ink/55">İstatistikler örnek veridir; API bağlantısı ile güncellenecek.</p>

      <div className="mb-8 grid gap-4 sm:grid-cols-3">
        <StatCard label="Toplam kitap" value={s.totalBooks.toLocaleString('tr-TR')} />
        <StatCard
          label="Aktif ödünç"
          value={s.activeBorrows}
          hint="Şu an okuyucuda"
          accent="text-night"
        />
        <StatCard
          label="Gecikenler"
          value={s.overdue}
          hint="İade tarihi geçmiş"
          accent="text-accent"
        />
      </div>

      <SimpleBarChart data={weekData} />

      <div className="mt-8 rounded-card border border-ink/8 bg-ink/[0.02] p-5 text-sm text-ink/60">
        Yönetim: kullanıcı durumlarını ve ödünç kayıtlarını sol menüden yönetebilirsiniz.
      </div>
    </div>
  )
}
