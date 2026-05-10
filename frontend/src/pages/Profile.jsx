import { useEffect, useMemo, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { AnimatePresence, motion, useReducedMotion } from "framer-motion";
import { apiFetch } from "../services/apiFetch";
import { useAuth } from "../context/AuthContext";

const TABS = [
  { id: "bilgilerim", label: "Bilgilerim", icon: "user" },
  { id: "odunclerim", label: "Ödünç Geçmişim", icon: "book" },
  { id: "favorilerim", label: "Favorilerim", icon: "heart" },
  { id: "cezalarim", label: "Cezalarım", icon: "alert" },
];

export default function Profile() {
  const { user, token, isAuthenticated, logout, updateUser } = useAuth();
  const navigate = useNavigate();
  const reduce = useReducedMotion();

  const [activeTab, setActiveTab] = useState("bilgilerim");
  const [borrows, setBorrows] = useState([]);
  const [favorites, setFavorites] = useState([]);
  const [fines, setFines] = useState({ toplamBorc: 0, detaylar: [] });
  const [stats, setStats] = useState({ aktif: 0, toplam: 0, favori: 0, ceza: 0 });
  const [loadingData, setLoadingData] = useState(true);
  const [toast, setToast] = useState(null);

  useEffect(() => {
    if (!isAuthenticated || !token) return;
    let cancelled = false;

    Promise.allSettled([
      apiFetch("/api/profil/odunclerim").then((r) => r.json()),
      apiFetch("/api/favoriler").then((r) => r.json()),
      apiFetch("/api/profil/cezalarim").then((r) => r.json()),
    ])
      .then(([oduncRes, favoriRes, cezaRes]) => {
        if (cancelled) return;
        const oduncList = Array.isArray(oduncRes.value) ? oduncRes.value : [];
        const favoriList = Array.isArray(favoriRes.value) ? favoriRes.value : [];
        const cezaData =
          cezaRes.status === "fulfilled" && cezaRes.value && typeof cezaRes.value === "object"
            ? cezaRes.value
            : { toplamBorc: 0, detaylar: [] };

        setBorrows(oduncList);
        setFavorites(favoriList);
        setFines(cezaData);

        const aktif = oduncList.filter((b) => !b.return_date).length;
        setStats({
          aktif,
          toplam: oduncList.length,
          favori: favoriList.length,
          ceza: Number(cezaData.toplamBorc) || 0,
        });
      })
      .finally(() => {
        if (!cancelled) setLoadingData(false);
      });

    return () => {
      cancelled = true;
    };
  }, [isAuthenticated, token]);

  function showToast(type, message) {
    setToast({ type, message });
    setTimeout(() => setToast(null), 2800);
  }

  // Bu sayfa <PrivateRoute> ile sarmalandığı için buraya gelindiğinde
  // kullanıcının giriş yapmış olduğunu varsayabiliriz.

  const initials = getInitials(user?.fullName);
  const roleLabel = user?.role === "admin" ? "Yönetici" : "Üye";
  const isActive = user?.isActive !== false;

  return (
    <section className="mx-auto max-w-6xl px-4 py-8 md:px-6 md:py-10">
      <ProfileHeader
        initials={initials}
        name={user?.fullName || "İsimsiz"}
        email={user?.email}
        roleLabel={roleLabel}
        isActive={isActive}
        onLogout={() => {
          logout();
          navigate("/");
        }}
      />

      <StatsGrid stats={stats} loading={loadingData} />

      <div className="mt-8">
        <TabBar tabs={TABS} active={activeTab} onChange={setActiveTab} />

        <div className="mt-5 rounded-2xl border border-ink/8 bg-white p-5 shadow-sm md:p-7">
          <AnimatePresence mode="wait">
            <motion.div
              key={activeTab}
              initial={reduce ? false : { opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              exit={reduce ? undefined : { opacity: 0, y: -8 }}
              transition={{ duration: 0.2 }}
            >
              {activeTab === "bilgilerim" && (
                <ProfileForm
                  user={user}
                  onUpdated={(patch) => {
                    updateUser(patch);
                    showToast("success", "Bilgileriniz güncellendi.");
                  }}
                  onError={(msg) => showToast("error", msg)}
                />
              )}
              {activeTab === "odunclerim" && (
                <BorrowList
                  items={borrows}
                  loading={loadingData}
                  onReturned={(updatedLoan) => {
                    setBorrows((prev) =>
                      prev.map((b) =>
                        String(b.id) === String(updatedLoan.id)
                          ? {
                              ...b,
                              return_date:
                                updatedLoan.returnDate ||
                                new Date().toISOString().slice(0, 10),
                              status: "iade_edildi",
                            }
                          : b,
                      ),
                    );
                    setStats((s) => ({
                      ...s,
                      aktif: Math.max(0, s.aktif - 1),
                    }));
                    showToast("success", "Kitap başarıyla iade edildi.");
                  }}
                  onError={(msg) => showToast("error", msg)}
                />
              )}
              {activeTab === "favorilerim" && (
                <FavoriteGrid items={favorites} loading={loadingData} />
              )}
              {activeTab === "cezalarim" && (
                <FineList data={fines} loading={loadingData} />
              )}
            </motion.div>
          </AnimatePresence>
        </div>
      </div>

      <AnimatePresence>
        {toast && (
          <motion.div
            initial={reduce ? false : { opacity: 0, y: -16 }}
            animate={{ opacity: 1, y: 0 }}
            exit={reduce ? undefined : { opacity: 0, y: -16 }}
            transition={{ type: "spring", stiffness: 280, damping: 24 }}
            className={`fixed right-4 top-4 z-50 flex w-[320px] max-w-[calc(100vw-2rem)] items-start gap-3 rounded-xl border px-4 py-3 shadow-xl backdrop-blur sm:right-6 sm:top-6 ${
              toast.type === "success"
                ? "border-accent/30 bg-white/95 text-night"
                : "border-red-200 bg-white/95 text-red-900"
            }`}
            role="status"
            aria-live="polite"
          >
            <div
              className={`flex h-8 w-8 shrink-0 items-center justify-center rounded-full ${
                toast.type === "success" ? "bg-accent text-white" : "bg-red-500 text-white"
              }`}
            >
              {toast.type === "success" ? <CheckIcon /> : <AlertIcon />}
            </div>
            <p className="mt-0.5 text-sm font-medium leading-snug">{toast.message}</p>
          </motion.div>
        )}
      </AnimatePresence>
    </section>
  );
}

function ProfileHeader({ initials, name, email, roleLabel, isActive, onLogout }) {
  return (
    <div className="relative overflow-hidden rounded-3xl border border-white/40 bg-gradient-to-br from-accent/15 via-white to-night/10 p-5 shadow-sm md:p-8">
      <div className="pointer-events-none absolute -right-16 -top-16 h-56 w-56 rounded-full bg-accent/25 blur-3xl" />
      <div className="pointer-events-none absolute -bottom-20 -left-10 h-48 w-48 rounded-full bg-night/15 blur-3xl" />

      <div className="relative flex flex-col gap-5 md:flex-row md:items-center md:justify-between">
        <div className="flex items-center gap-4">
          <div className="relative shrink-0">
            <div className="flex h-16 w-16 items-center justify-center rounded-2xl bg-gradient-to-br from-accent to-accentDark text-2xl font-bold text-white shadow-lg shadow-accent/30 md:h-20 md:w-20 md:text-3xl">
              {initials}
            </div>
            {isActive && (
              <span
                className="absolute -bottom-1 -right-1 flex h-5 w-5 items-center justify-center rounded-full border-2 border-white bg-emerald-500 text-white"
                title="Hesap aktif"
                aria-label="Hesap aktif"
              >
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round" className="h-2.5 w-2.5" aria-hidden>
                  <path d="M5 12.5l4 4L19 7" />
                </svg>
              </span>
            )}
          </div>
          <div className="min-w-0">
            <div className="flex items-center gap-2">
              {roleLabel === "Yönetici" && (
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" className="h-5 w-5 text-accent" aria-hidden>
                  <path d="M12 3l8 3v5c0 5-3.5 8.5-8 10-4.5-1.5-8-5-8-10V6l8-3z" strokeWidth="1.6" strokeLinejoin="round" />
                  <path d="M9 12.5l2 2 4-4" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" />
                </svg>
              )}
              <h1 className="truncate text-xl font-bold text-ink md:text-2xl">{name}</h1>
            </div>
            <p className="mt-0.5 truncate text-sm text-ink/60">{email}</p>
            <p className="mt-1.5 flex flex-wrap items-center gap-x-2 gap-y-0.5 text-[11px] font-medium uppercase tracking-[0.18em] text-ink/45">
              <span>{roleLabel}</span>
              <span className="text-ink/25" aria-hidden>·</span>
              <span>{isActive ? "Hesap aktif" : "Hesap pasif"}</span>
            </p>
          </div>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          <Link
            to="/katalog"
            className="inline-flex items-center gap-2 rounded-full border border-ink/10 bg-white px-4 py-2 text-sm font-semibold text-ink transition hover:bg-surface"
          >
            <BookIcon className="h-4 w-4" />
            Katalogu keşfet
          </Link>
          <button
            onClick={onLogout}
            className="inline-flex items-center gap-2 rounded-full bg-accent px-4 py-2 text-sm font-semibold text-white shadow-md shadow-accent/30 transition hover:bg-accentDark"
          >
            <LogoutIcon className="h-4 w-4" />
            Çıkış yap
          </button>
        </div>
      </div>
    </div>
  );
}

function StatsGrid({ stats, loading }) {
  const items = [
    {
      label: "Aktif Ödünç",
      value: stats.aktif,
      hint: "Halen sende olan kitap",
      tone: "accent",
    },
    {
      label: "Toplam Ödünç",
      value: stats.toplam,
      hint: "Tüm zamanlar",
      tone: "night",
    },
    {
      label: "Favorilerim",
      value: stats.favori,
      hint: "Kaydettiğin kitap",
      tone: "rose",
    },
    {
      label: "Gecikme Cezası",
      value: stats.ceza > 0 ? `${stats.ceza.toFixed(2)}₺` : "0₺",
      hint: stats.ceza > 0 ? "Ödenmemiş borç" : "Borcun yok",
      tone: stats.ceza > 0 ? "red" : "emerald",
    },
  ];

  return (
    <div className="mt-6 grid grid-cols-2 gap-3 md:grid-cols-4 md:gap-4">
      {items.map((item) => (
        <div
          key={item.label}
          className="rounded-2xl border border-ink/8 bg-white p-4 shadow-sm transition hover:-translate-y-0.5 hover:shadow-md md:p-5"
        >
          <div className="flex items-center gap-2">
            <span className={`h-2 w-2 rounded-full ${toneDot(item.tone)}`} />
            <p className="text-[11px] font-semibold uppercase tracking-[0.16em] text-ink/50">
              {item.label}
            </p>
          </div>
          <p className="mt-2 text-2xl font-bold tracking-tight text-night md:text-[1.7rem]">
            {loading ? <span className="inline-block h-7 w-12 animate-pulse rounded bg-ink/10" /> : item.value}
          </p>
          <p className="mt-0.5 text-xs text-ink/55">{item.hint}</p>
        </div>
      ))}
    </div>
  );
}

function TabBar({ tabs, active, onChange }) {
  return (
    <div className="flex flex-wrap gap-1.5 rounded-2xl border border-ink/8 bg-white p-1.5 shadow-sm">
      {tabs.map((tab) => {
        const isActive = active === tab.id;
        return (
          <button
            key={tab.id}
            type="button"
            onClick={() => onChange(tab.id)}
            className={`relative flex flex-1 items-center justify-center gap-2 rounded-xl px-3 py-2.5 text-sm font-semibold transition ${
              isActive
                ? "bg-accent text-white shadow-md shadow-accent/30"
                : "text-ink/70 hover:bg-surface hover:text-ink"
            }`}
          >
            <TabIcon name={tab.icon} className="h-4 w-4" />
            <span>{tab.label}</span>
          </button>
        );
      })}
    </div>
  );
}

function ProfileForm({ user, onUpdated, onError }) {
  const [fullName, setFullName] = useState(user?.fullName || "");
  const [phoneNumber, setPhoneNumber] = useState(user?.phoneNumber || "");
  const [address, setAddress] = useState(user?.address || "");
  const [newPassword, setNewPassword] = useState("");
  const [saving, setSaving] = useState(false);

  async function handleSubmit(e) {
    e.preventDefault();
    setSaving(true);
    try {
      const res = await apiFetch("/api/auth/guncelle", {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          fullName,
          phoneNumber,
          address,
          newPassword: newPassword || undefined,
        }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Güncelleme başarısız");
      onUpdated({
        fullName: data.user?.full_name ?? fullName,
        phoneNumber: data.user?.phone_number ?? phoneNumber,
        address: data.user?.address ?? address,
      });
      setNewPassword("");
    } catch (err) {
      onError(err.message);
    } finally {
      setSaving(false);
    }
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-5">
      <div>
        <h2 className="text-lg font-bold text-ink">Hesap bilgileri</h2>
        <p className="mt-0.5 text-sm text-ink/55">
          Ad soyad, iletişim ve şifre bilgilerinizi buradan güncelleyebilirsiniz.
        </p>
      </div>

      <div className="grid gap-4 md:grid-cols-2">
        <Field label="Ad soyad" htmlFor="fullName">
          <input
            id="fullName"
            value={fullName}
            onChange={(e) => setFullName(e.target.value)}
            className={fieldInputClass}
            required
          />
        </Field>
        <Field label="E-posta" htmlFor="email" hint="E-posta adresi değiştirilemez.">
          <input
            id="email"
            value={user?.email || ""}
            disabled
            className={`${fieldInputClass} cursor-not-allowed bg-surface text-ink/55`}
          />
        </Field>
        <Field label="Telefon" htmlFor="phone">
          <input
            id="phone"
            value={phoneNumber}
            onChange={(e) => setPhoneNumber(e.target.value)}
            placeholder="05xx xxx xx xx"
            className={fieldInputClass}
          />
        </Field>
        <Field label="Adres" htmlFor="address">
          <input
            id="address"
            value={address}
            onChange={(e) => setAddress(e.target.value)}
            placeholder="İl / İlçe / Mahalle"
            className={fieldInputClass}
          />
        </Field>
      </div>

      <div className="rounded-xl border border-dashed border-ink/15 bg-surface/60 p-4">
        <h3 className="text-sm font-semibold text-ink">Şifreyi güncelle</h3>
        <p className="mt-0.5 text-xs text-ink/55">
          Sadece şifrenizi değiştirmek istiyorsanız doldurun. En az 8 karakter olmalıdır.
        </p>
        <input
          type="password"
          value={newPassword}
          onChange={(e) => setNewPassword(e.target.value)}
          placeholder="Yeni şifre"
          minLength={8}
          autoComplete="new-password"
          className={`${fieldInputClass} mt-3`}
        />
      </div>

      <div className="flex items-center justify-end gap-3">
        <button
          type="submit"
          disabled={saving}
          className="inline-flex items-center gap-2 rounded-full bg-accent px-5 py-2.5 text-sm font-semibold text-white shadow-md shadow-accent/30 transition hover:bg-accentDark disabled:cursor-not-allowed disabled:bg-accent/70"
        >
          {saving && (
            <span className="h-4 w-4 animate-spin rounded-full border-2 border-white/40 border-t-white" />
          )}
          {saving ? "Kaydediliyor..." : "Değişiklikleri kaydet"}
        </button>
      </div>
    </form>
  );
}

function BorrowList({ items, loading, onReturned, onError }) {
  const [returningId, setReturningId] = useState(null);

  if (loading) return <SkeletonList />;
  if (!items.length)
    return (
      <EmptyState
        title="Henüz ödünç geçmişin yok"
        description="Katalogdan bir kitap seçip ödünç almaya başlayabilirsin."
        actionTo="/katalog"
        actionLabel="Katalogu aç"
      />
    );

  async function handleReturn(loan) {
    if (!loan?.id || returningId) return;
    if (!window.confirm(`"${loan.kitap_adi || "Bu kitap"}" iade edilsin mi?`)) return;
    setReturningId(loan.id);
    try {
      const res = await apiFetch(`/api/profil/iade/${encodeURIComponent(loan.id)}`, {
        method: "POST",
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) {
        throw new Error(data?.error || "İade işlemi başarısız oldu.");
      }
      onReturned?.(data.transaction || { id: loan.id });
    } catch (err) {
      onError?.(err.message || "İade işlemi başarısız oldu.");
    } finally {
      setReturningId(null);
    }
  }

  return (
    <div className="overflow-hidden rounded-xl border border-ink/8">
      <table className="min-w-full text-left text-sm">
        <thead className="bg-surface text-xs font-semibold uppercase tracking-wider text-ink/60">
          <tr>
            <th className="px-4 py-3">Kitap</th>
            <th className="px-4 py-3">Alış</th>
            <th className="px-4 py-3">Son tarih</th>
            <th className="px-4 py-3">İade</th>
            <th className="px-4 py-3">Durum</th>
            <th className="px-4 py-3 text-right">İşlem</th>
          </tr>
        </thead>
        <tbody>
          {items.map((b) => {
            const isActiveLoan = !b.return_date;
            const isBusy = String(returningId) === String(b.id);
            return (
              <tr key={b.id} className="border-t border-ink/5 transition hover:bg-surface/60">
                <td className="px-4 py-3">
                  <div className="flex items-center gap-3">
                    {b.kapak_url ? (
                      <img
                        src={b.kapak_url}
                        alt=""
                        className="h-10 w-7 shrink-0 rounded object-cover"
                      />
                    ) : (
                      <div className="h-10 w-7 shrink-0 rounded bg-ink/10" />
                    )}
                    <div className="min-w-0">
                      <Link
                        to={`/kitap/${encodeURIComponent(b.kitap_isbn || "")}`}
                        className="block truncate font-medium text-ink hover:text-accent"
                      >
                        {b.kitap_adi || "—"}
                      </Link>
                      <p className="truncate text-xs text-ink/50">{b.yazar || ""}</p>
                    </div>
                  </div>
                </td>
                <td className="px-4 py-3 text-ink/75">{formatDate(b.borrow_date)}</td>
                <td className="px-4 py-3 text-ink/75">{formatDate(b.due_date)}</td>
                <td className="px-4 py-3 text-ink/75">{formatDate(b.return_date) || "—"}</td>
                <td className="px-4 py-3">
                  <BorrowStatusBadge borrow={b} />
                </td>
                <td className="px-4 py-3 text-right">
                  {isActiveLoan ? (
                    <button
                      type="button"
                      onClick={() => handleReturn(b)}
                      disabled={isBusy}
                      className="inline-flex items-center gap-2 rounded-full bg-accent px-3 py-1.5 text-xs font-semibold text-white shadow-sm transition hover:bg-accentDark disabled:cursor-not-allowed disabled:bg-accent/60"
                    >
                      {isBusy && (
                        <span className="h-3 w-3 animate-spin rounded-full border-2 border-white/40 border-t-white" />
                      )}
                      {isBusy ? "İade ediliyor…" : "İade Et"}
                    </button>
                  ) : (
                    <span className="text-xs text-ink/40">—</span>
                  )}
                </td>
              </tr>
            );
          })}
        </tbody>
      </table>
    </div>
  );
}

function BorrowStatusBadge({ borrow }) {
  if (borrow.return_date) {
    return (
      <span className="inline-flex items-center rounded-full bg-emerald-100 px-2.5 py-0.5 text-xs font-semibold text-emerald-700">
        İade edildi
      </span>
    );
  }
  const isOverdue =
    borrow.due_date && new Date(borrow.due_date).getTime() < Date.now();
  if (isOverdue) {
    return (
      <span className="inline-flex items-center rounded-full bg-red-100 px-2.5 py-0.5 text-xs font-semibold text-red-700">
        Gecikti
      </span>
    );
  }
  return (
    <span className="inline-flex items-center rounded-full bg-accent/15 px-2.5 py-0.5 text-xs font-semibold text-accentDark">
      Aktif
    </span>
  );
}

function FavoriteGrid({ items, loading }) {
  if (loading) return <SkeletonGrid />;
  if (!items.length)
    return (
      <EmptyState
        title="Henüz favorin yok"
        description="Kitap detay sayfasından kalp simgesine basarak favori ekleyebilirsin."
        actionTo="/katalog"
        actionLabel="Kitap keşfet"
      />
    );

  return (
    <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5">
      {items.map((book) => (
        <Link
          key={book.favori_islem_id || book.isbn}
          to={`/kitap/${encodeURIComponent(book.isbn || "")}`}
          className="group rounded-xl border border-ink/8 bg-white p-2 transition hover:-translate-y-0.5 hover:border-accent/30 hover:shadow-md"
        >
          <div className="aspect-[2/3] overflow-hidden rounded-lg bg-surface">
            {book.kapak_url ? (
              <img
                src={book.kapak_url}
                alt=""
                className="h-full w-full object-cover transition group-hover:scale-105"
              />
            ) : (
              <div className="flex h-full items-center justify-center text-xs text-ink/40">
                Kapak yok
              </div>
            )}
          </div>
          <p className="mt-2 line-clamp-1 text-sm font-semibold text-ink">
            {book.kitap_adi || "—"}
          </p>
          <p className="line-clamp-1 text-xs text-ink/55">{book.yazar || ""}</p>
        </Link>
      ))}
    </div>
  );
}

function FineList({ data, loading }) {
  if (loading) return <SkeletonList />;
  const detaylar = data?.detaylar || [];
  if (!detaylar.length)
    return (
      <div className="flex flex-col items-center justify-center rounded-xl border border-emerald-200 bg-emerald-50 px-6 py-12 text-center">
        <div className="mb-3 flex h-12 w-12 items-center justify-center rounded-full bg-emerald-500 text-white">
          <CheckIcon />
        </div>
        <h3 className="text-lg font-bold text-emerald-800">Cezasız bir okuyucusun</h3>
        <p className="mt-1 text-sm text-emerald-700">
          Şu an ödenmemiş gecikme cezan yok. Böyle devam!
        </p>
      </div>
    );

  return (
    <div>
      <div className="mb-4 flex flex-wrap items-center justify-between gap-3 rounded-xl bg-red-50 p-4">
        <div>
          <p className="text-xs font-semibold uppercase tracking-wider text-red-600">
            Toplam borç
          </p>
          <p className="text-2xl font-bold text-red-700">
            {Number(data.toplamBorc).toFixed(2)} ₺
          </p>
        </div>
        <p className="max-w-sm text-sm text-red-700/80">
          {data.mesaj || "Ödenmemiş gecikme cezalarınız bulunuyor."}
        </p>
      </div>
      <ul className="space-y-2">
        {detaylar.map((c) => (
          <li
            key={c.id}
            className="flex items-center justify-between rounded-xl border border-ink/8 bg-white p-3"
          >
            <div className="min-w-0">
              <p className="truncate font-medium text-ink">{c.kitap_adi}</p>
              <p className="text-xs text-ink/55">
                Son tarih: {formatDate(c.due_date)}
              </p>
            </div>
            <span className="rounded-full bg-red-100 px-3 py-1 text-sm font-semibold text-red-700">
              {Number(c.fine_amount).toFixed(2)} ₺
            </span>
          </li>
        ))}
      </ul>
    </div>
  );
}

function Field({ label, htmlFor, hint, children }) {
  return (
    <label htmlFor={htmlFor} className="block">
      <span className="mb-1 block text-xs font-semibold uppercase tracking-wider text-ink/55">
        {label}
      </span>
      {children}
      {hint && <span className="mt-1 block text-xs text-ink/45">{hint}</span>}
    </label>
  );
}

const fieldInputClass =
  "w-full rounded-lg border border-ink/10 bg-white px-3.5 py-2.5 text-sm text-ink outline-none transition placeholder:text-ink/35 focus:border-accent focus:ring-2 focus:ring-accent/30";

function EmptyState({ title, description, actionTo, actionLabel }) {
  return (
    <div className="flex flex-col items-center justify-center rounded-xl border border-dashed border-ink/15 bg-surface/40 px-6 py-12 text-center">
      <div className="mb-3 flex h-12 w-12 items-center justify-center rounded-full bg-accent/15 text-accentDark">
        <BookIcon className="h-5 w-5" />
      </div>
      <h3 className="text-base font-semibold text-ink">{title}</h3>
      <p className="mt-1 max-w-md text-sm text-ink/55">{description}</p>
      {actionTo && (
        <Link
          to={actionTo}
          className="mt-4 inline-flex items-center gap-2 rounded-full bg-accent px-4 py-2 text-sm font-semibold text-white transition hover:bg-accentDark"
        >
          {actionLabel}
        </Link>
      )}
    </div>
  );
}

function SkeletonList() {
  return (
    <div className="space-y-2">
      {[1, 2, 3, 4].map((i) => (
        <div key={i} className="h-12 animate-pulse rounded-xl bg-ink/5" />
      ))}
    </div>
  );
}

function SkeletonGrid() {
  return (
    <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5">
      {[1, 2, 3, 4, 5].map((i) => (
        <div key={i} className="aspect-[2/3] animate-pulse rounded-xl bg-ink/5" />
      ))}
    </div>
  );
}

function getInitials(name) {
  if (!name || typeof name !== "string") return "?";
  const parts = name.trim().split(/\s+/);
  const a = parts[0]?.[0] || "";
  const b = parts.length > 1 ? parts[parts.length - 1][0] : "";
  return (a + b).toUpperCase() || "?";
}

function formatDate(value) {
  if (!value) return "";
  const d = new Date(value);
  if (Number.isNaN(d.getTime())) return "";
  return d.toLocaleDateString("tr-TR", {
    day: "2-digit",
    month: "short",
    year: "numeric",
  });
}

function toneDot(tone) {
  switch (tone) {
    case "accent":
      return "bg-accent";
    case "night":
      return "bg-night";
    case "rose":
      return "bg-rose-500";
    case "red":
      return "bg-red-500";
    case "emerald":
      return "bg-emerald-500";
    default:
      return "bg-ink/40";
  }
}

function TabIcon({ name, className }) {
  const props = {
    className,
    viewBox: "0 0 24 24",
    fill: "none",
    stroke: "currentColor",
    strokeWidth: "1.8",
    strokeLinecap: "round",
    strokeLinejoin: "round",
    "aria-hidden": true,
  };
  if (name === "user")
    return (
      <svg {...props}>
        <path d="M20 21a8 8 0 10-16 0" />
        <circle cx="12" cy="8" r="4" />
      </svg>
    );
  if (name === "book")
    return (
      <svg {...props}>
        <path d="M4 5.5A2.5 2.5 0 016.5 3H20v15H6.5A2.5 2.5 0 004 20.5v-15z" />
        <path d="M4 20.5A2.5 2.5 0 016.5 18H20" />
      </svg>
    );
  if (name === "heart")
    return (
      <svg {...props}>
        <path d="M12 21s-7-4.35-7-10a4 4 0 017-2.65A4 4 0 0119 11c0 5.65-7 10-7 10z" />
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
  return null;
}

function BookIcon({ className = "h-4 w-4" }) {
  return (
    <svg
      className={className}
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.8"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden
    >
      <path d="M4 5.5A2.5 2.5 0 016.5 3H20v15H6.5A2.5 2.5 0 004 20.5v-15z" />
      <path d="M4 20.5A2.5 2.5 0 016.5 18H20" />
    </svg>
  );
}

function LogoutIcon({ className = "h-4 w-4" }) {
  return (
    <svg
      className={className}
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.8"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden
    >
      <path d="M9 21H5a2 2 0 01-2-2V5a2 2 0 012-2h4" />
      <path d="M16 17l5-5-5-5" />
      <path d="M21 12H9" />
    </svg>
  );
}

function CheckIcon() {
  return (
    <svg
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2.4"
      strokeLinecap="round"
      strokeLinejoin="round"
      className="h-4 w-4"
      aria-hidden
    >
      <path d="M5 12.5l4 4L19 7" />
    </svg>
  );
}

function AlertIcon() {
  return (
    <svg
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
      className="h-4 w-4"
      aria-hidden
    >
      <circle cx="12" cy="12" r="9" />
      <path d="M12 8v5" />
      <path d="M12 16h.01" strokeWidth="2.4" />
    </svg>
  );
}
