import { useState } from 'react'
import { mockTransactions } from '../../data/mockAdmin'

export default function Transactions() {
  const [rows, setRows] = useState(mockTransactions)

  function markReturned(id) {
    setRows((list) => list.filter((r) => r.id !== id))
    alert('Teslim alındı — stok güncellendi (demo).')
  }

  return (
    <div>
      <h1 className="mb-2 text-2xl font-bold text-ink">Ödünç işlemleri</h1>
      <p className="mb-8 text-sm text-ink/55">Kullanıcı, kitap ve iade tarihi; teslim ile stok güncelleme.</p>

      <div className="overflow-hidden rounded-card bg-white shadow-card">
        <div className="overflow-x-auto">
          <table className="w-full min-w-[720px] text-left text-sm">
            <thead className="border-b border-ink/8 bg-surface/80">
              <tr>
                <th className="px-4 py-3 font-semibold text-ink">Kullanıcı</th>
                <th className="px-4 py-3 font-semibold text-ink">Kitap</th>
                <th className="px-4 py-3 font-semibold text-ink">İade tarihi</th>
                <th className="px-4 py-3 font-semibold text-ink">Durum</th>
                <th className="px-4 py-3 text-right font-semibold text-ink">Aksiyon</th>
              </tr>
            </thead>
            <tbody>
              {rows.length === 0 && (
                <tr>
                  <td colSpan={5} className="px-4 py-10 text-center text-ink/45">
                    Aktif ödünç kaydı yok.
                  </td>
                </tr>
              )}
              {rows.map((r) => (
                <tr key={r.id} className="border-b border-ink/5 transition hover:bg-surface/50">
                  <td className="px-4 py-3 font-medium text-ink">{r.userName}</td>
                  <td className="px-4 py-3 text-ink/70">{r.bookTitle}</td>
                  <td className="px-4 py-3 text-ink/60">{r.dueDate}</td>
                  <td className="px-4 py-3">
                    <span
                      className={`inline-flex rounded-full px-2.5 py-0.5 text-xs font-semibold ${
                        r.status === 'overdue' ? 'bg-red-100 text-red-800' : 'bg-amber-100 text-amber-900'
                      }`}
                    >
                      {r.status === 'overdue' ? 'Gecikmiş' : 'Ödünçte'}
                    </span>
                  </td>
                  <td className="px-4 py-3 text-right">
                    <button
                      type="button"
                      onClick={() => markReturned(r.id)}
                      className="rounded-lg bg-night px-3 py-1.5 text-xs font-semibold text-white hover:bg-nightLight"
                    >
                      Teslim alındı
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  )
}
