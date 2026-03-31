import { useState } from 'react'
import { mockUsers } from '../../data/mockAdmin'

export default function ManageUsers() {
  const [users, setUsers] = useState(mockUsers)

  function toggleStatus(id) {
    setUsers((list) =>
      list.map((u) =>
        u.id === id ? { ...u, status: u.status === 'active' ? 'inactive' : 'active' } : u,
      ),
    )
  }

  function resetPassword(email) {
    alert(`Şifre sıfırlama bağlantısı (demo): ${email}`)
  }

  return (
    <div>
      <h1 className="mb-2 text-2xl font-bold text-ink">Kullanıcı yönetimi</h1>
      <p className="mb-8 text-sm text-ink/55">Üye listesi ve durum güncellemeleri.</p>

      <div className="overflow-hidden rounded-card bg-white shadow-card">
        <div className="overflow-x-auto">
          <table className="w-full min-w-[640px] text-left text-sm">
            <thead className="border-b border-ink/8 bg-surface/80">
              <tr>
                <th className="px-4 py-3 font-semibold text-ink">Ad</th>
                <th className="px-4 py-3 font-semibold text-ink">E-posta</th>
                <th className="px-4 py-3 font-semibold text-ink">Kayıt</th>
                <th className="px-4 py-3 font-semibold text-ink">Durum</th>
                <th className="px-4 py-3 font-semibold text-ink text-right">İşlemler</th>
              </tr>
            </thead>
            <tbody>
              {users.map((u) => (
                <tr key={u.id} className="border-b border-ink/5 transition hover:bg-surface/50">
                  <td className="px-4 py-3 font-medium text-ink">{u.name}</td>
                  <td className="px-4 py-3 text-ink/65">{u.email}</td>
                  <td className="px-4 py-3 text-ink/50">{u.joined}</td>
                  <td className="px-4 py-3">
                    <span
                      className={`inline-flex rounded-full px-2.5 py-0.5 text-xs font-semibold ${
                        u.status === 'active'
                          ? 'bg-emerald-100 text-emerald-800'
                          : 'bg-ink/10 text-ink/55'
                      }`}
                    >
                      {u.status === 'active' ? 'Aktif' : 'Pasif'}
                    </span>
                  </td>
                  <td className="px-4 py-3 text-right">
                    <button
                      type="button"
                      onClick={() => toggleStatus(u.id)}
                      className="mr-2 text-xs font-semibold text-night hover:underline"
                    >
                      Durum
                    </button>
                    <button
                      type="button"
                      onClick={() => resetPassword(u.email)}
                      className="text-xs font-semibold text-accent hover:underline"
                    >
                      Şifre sıfırla
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
