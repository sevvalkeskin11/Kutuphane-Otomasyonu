import { useEffect, useMemo, useRef, useState } from "react";
import { AnimatePresence, motion, useReducedMotion } from "framer-motion";
import { apiUrl } from "../../services/dbBooks";
import { useAuth } from "../../context/AuthContext";

export default function ManageUsers() {
  const { token, user: currentUser } = useAuth();
  const reduce = useReducedMotion();

  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [sort, setSort] = useState({ key: "joined", dir: "desc" });

  const [busyId, setBusyId] = useState(null);
  const [tempPasswordInfo, setTempPasswordInfo] = useState(null);
  const [confirm, setConfirm] = useState(null);
  const [drawerUser, setDrawerUser] = useState(null);
  const [toast, setToast] = useState(null);

  useEffect(() => {
    if (!token) return;
    let cancelled = false;
    setLoading(true);
    fetch(apiUrl("/api/admin/users?limit=200"), {
      headers: { Authorization: `Bearer ${token}` },
    })
      .then(async (r) => {
        const body = await r.json().catch(() => []);
        if (!r.ok) throw new Error(body.error || "Kullanıcılar yüklenemedi");
        return body;
      })
      .then((rows) => !cancelled && setUsers(Array.isArray(rows) ? rows : []))
      .catch((err) => !cancelled && setError(err.message))
      .finally(() => !cancelled && setLoading(false));
    return () => {
      cancelled = true;
    };
  }, [token]);

  function showToast(type, message) {
    setToast({ type, message });
    setTimeout(() => setToast(null), 2800);
  }

  async function performStatusChange(u) {
    setBusyId(u.id);
    try {
      const res = await fetch(apiUrl(`/api/admin/users/${u.id}/status`), {
        method: "PATCH",
        headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
        body: JSON.stringify({ isActive: u.status !== "active" }),
      });
      const body = await res.json();
      if (!res.ok) throw new Error(body.error || "Durum değiştirilemedi");
      setUsers((list) => list.map((x) => (x.id === u.id ? body : x)));
      if (drawerUser?.id === u.id) setDrawerUser(body);
      showToast(
        "success",
        body.status === "active" ? "Kullanıcı aktifleştirildi." : "Kullanıcı pasifleştirildi.",
      );
    } catch (err) {
      showToast("error", err.message);
    } finally {
      setBusyId(null);
    }
  }

  function requestStatusChange(u) {
    const isMe = currentUser && String(currentUser.id) === String(u.id);
    const isAdmin = u.role === "admin";
    const willDisable = u.status === "active";

    if (isMe && willDisable) {
      showToast("error", "Kendi hesabını pasifleştiremezsin.");
      return;
    }

    if (willDisable && isAdmin) {
      setConfirm({
        title: "Yöneticiyi pasifleştir?",
        description: `${u.name} bir yönetici. Pasifleştirildiğinde sisteme giriş yapamaz. Devam etmek istiyor musun?`,
        action: "Pasifleştir",
        tone: "danger",
        onConfirm: () => performStatusChange(u),
      });
      return;
    }

    performStatusChange(u);
  }

  async function resetPassword(u) {
    setBusyId(u.id);
    try {
      const res = await fetch(apiUrl(`/api/admin/users/${u.id}/reset-password`), {
        method: "POST",
        headers: { Authorization: `Bearer ${token}` },
      });
      const body = await res.json();
      if (!res.ok) throw new Error(body.error || "Şifre sıfırlanamadı");
      setTempPasswordInfo({ email: body.email, password: body.temporaryPassword, name: u.name });
    } catch (err) {
      showToast("error", err.message);
    } finally {
      setBusyId(null);
    }
  }

  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase();
    let list = users.filter((u) => {
      if (statusFilter === "active" && u.status !== "active") return false;
      if (statusFilter === "inactive" && u.status === "active") return false;
      if (statusFilter === "admin" && u.role !== "admin") return false;
      if (!q) return true;
      return (
        (u.name || "").toLowerCase().includes(q) ||
        (u.email || "").toLowerCase().includes(q)
      );
    });

    const dir = sort.dir === "asc" ? 1 : -1;
    list = [...list].sort((a, b) => {
      const k = sort.key;
      if (k === "name") return (a.name || "").localeCompare(b.name || "", "tr") * dir;
      if (k === "joined") return ((new Date(a.joined).getTime() || 0) - (new Date(b.joined).getTime() || 0)) * dir;
      if (k === "status") {
        const score = (u) => (u.status === "active" ? 1 : 0);
        return (score(a) - score(b)) * dir;
      }
      if (k === "role") {
        const score = (u) => (u.role === "admin" ? 1 : 0);
        return (score(a) - score(b)) * dir;
      }
      return 0;
    });
    return list;
  }, [users, search, statusFilter, sort]);

  const counts = useMemo(() => ({
    all: users.length,
    active: users.filter((u) => u.status === "active").length,
    inactive: users.filter((u) => u.status !== "active").length,
    admin: users.filter((u) => u.role === "admin").length,
  }), [users]);

  function toggleSort(key) {
    setSort((s) => (s.key === key ? { key, dir: s.dir === "asc" ? "desc" : "asc" } : { key, dir: "asc" }));
  }

  return (
    <div>
      <div className="mb-6 flex flex-wrap items-end justify-between gap-3">
        <div>
          <h1 className="text-2xl font-bold text-ink md:text-[1.7rem]">Kullanıcı yönetimi</h1>
          <p className="mt-1 text-sm text-ink/55">
            Üyeleri ara, sırala, detayları incele ve hesaplarını yönet.
          </p>
        </div>
      </div>

      <div className="mb-4 flex flex-wrap items-center gap-3 rounded-2xl border border-ink/8 bg-white p-3 shadow-sm">
        <div className="relative min-w-[220px] flex-1">
          <SearchIcon className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-ink/40" />
          <input
            type="search"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="İsim veya e-posta ara..."
            className="w-full rounded-lg border border-ink/10 bg-surface py-2 pl-9 pr-3 text-sm text-ink outline-none transition focus:border-accent focus:bg-white focus:ring-2 focus:ring-accent/25"
          />
        </div>
        <FilterChip label="Tümü" count={counts.all} active={statusFilter === "all"} onClick={() => setStatusFilter("all")} />
        <FilterChip label="Aktif" count={counts.active} active={statusFilter === "active"} onClick={() => setStatusFilter("active")} />
        <FilterChip label="Pasif" count={counts.inactive} active={statusFilter === "inactive"} onClick={() => setStatusFilter("inactive")} />
        <FilterChip label="Yöneticiler" count={counts.admin} active={statusFilter === "admin"} onClick={() => setStatusFilter("admin")} />
      </div>

      {error && (
        <div className="mb-4 rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
          {error}
        </div>
      )}

      <div className="overflow-hidden rounded-2xl border border-ink/8 bg-white shadow-sm">
        <div className="overflow-x-auto">
          <table className="w-full min-w-[760px] text-left text-sm">
            <thead className="bg-surface/70 text-xs font-semibold uppercase tracking-wider text-ink/55">
              <tr>
                <SortableTh label="Kullanıcı" sortKey="name" sort={sort} onClick={toggleSort} />
                <SortableTh label="Rol" sortKey="role" sort={sort} onClick={toggleSort} />
                <SortableTh label="Kayıt" sortKey="joined" sort={sort} onClick={toggleSort} />
                <SortableTh label="Durum" sortKey="status" sort={sort} onClick={toggleSort} />
                <th className="px-4 py-3 text-right">İşlemler</th>
              </tr>
            </thead>
            <tbody>
              {loading && (
                <tr>
                  <td colSpan={5} className="px-4 py-12 text-center text-ink/45">
                    Yükleniyor...
                  </td>
                </tr>
              )}
              {!loading && !filtered.length && <EmptyRow />}
              {filtered.map((u) => {
                const isMe = currentUser && String(currentUser.id) === String(u.id);
                return (
                  <tr
                    key={u.id}
                    onClick={() => setDrawerUser(u)}
                    className={`cursor-pointer border-t border-ink/5 transition hover:bg-surface/60 ${
                      drawerUser?.id === u.id ? "bg-accent/[0.04]" : ""
                    }`}
                  >
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-3">
                        <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-gradient-to-br from-accent/80 to-accentDark text-xs font-bold text-white">
                          {getInitials(u.name)}
                        </div>
                        <div className="min-w-0">
                          <p className="flex items-center gap-1.5 truncate font-semibold text-ink">
                            {u.name || "—"}
                            {isMe && (
                              <span className="rounded bg-ink/[0.06] px-1.5 py-0.5 text-[10px] font-semibold uppercase tracking-wider text-ink/55">
                                Sen
                              </span>
                            )}
                          </p>
                          <p className="truncate text-xs text-ink/55">{u.email}</p>
                        </div>
                      </div>
                    </td>
                    <td className="px-4 py-3">
                      {u.role === "admin" ? (
                        <span className="inline-flex items-center gap-1 text-xs font-semibold text-accent">
                          <ShieldIcon className="h-3.5 w-3.5" />
                          Yönetici
                        </span>
                      ) : (
                        <span className="text-xs text-ink/55">Üye</span>
                      )}
                    </td>
                    <td className="px-4 py-3 text-xs text-ink/55">{formatDate(u.joined)}</td>
                    <td className="px-4 py-3">
                      <StatusDot active={u.status === "active"} />
                    </td>
                    <td className="px-4 py-3" onClick={(e) => e.stopPropagation()}>
                      <div className="flex justify-end">
                        <RowMenu
                          onView={() => setDrawerUser(u)}
                          onToggle={() => requestStatusChange(u)}
                          onReset={() => resetPassword(u)}
                          isActive={u.status === "active"}
                          busy={busyId === u.id}
                        />
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>

      <AnimatePresence>
        {drawerUser && (
          <UserDetailDrawer
            key={drawerUser.id}
            user={drawerUser}
            token={token}
            onClose={() => setDrawerUser(null)}
            onToggle={() => requestStatusChange(drawerUser)}
            onReset={() => resetPassword(drawerUser)}
            busy={busyId === drawerUser.id}
            reduce={reduce}
          />
        )}
      </AnimatePresence>

      <AnimatePresence>
        {confirm && (
          <ConfirmDialog
            data={confirm}
            onClose={() => setConfirm(null)}
            onConfirm={async () => {
              const cb = confirm.onConfirm;
              setConfirm(null);
              await cb?.();
            }}
            reduce={reduce}
          />
        )}
      </AnimatePresence>

      <AnimatePresence>
        {tempPasswordInfo && (
          <TempPasswordModal
            info={tempPasswordInfo}
            onClose={() => setTempPasswordInfo(null)}
            onCopied={() => showToast("success", "Geçici şifre panoya kopyalandı.")}
            reduce={reduce}
          />
        )}
      </AnimatePresence>

      <AnimatePresence>
        {toast && <Toast type={toast.type} message={toast.message} reduce={reduce} />}
      </AnimatePresence>
    </div>
  );
}

function SortableTh({ label, sortKey, sort, onClick }) {
  const active = sort.key === sortKey;
  return (
    <th
      className="cursor-pointer select-none px-4 py-3"
      onClick={() => onClick(sortKey)}
      title="Sırala"
    >
      <span className={`inline-flex items-center gap-1 ${active ? "text-ink" : ""}`}>
        {label}
        <SortChevron active={active} dir={sort.dir} />
      </span>
    </th>
  );
}

function SortChevron({ active, dir }) {
  return (
    <svg
      viewBox="0 0 12 12"
      className={`h-3 w-3 transition ${active ? "text-accent" : "text-ink/30"}`}
      aria-hidden
    >
      <path
        d={active && dir === "asc" ? "M6 4l3 3H3l3-3z" : "M6 8l-3-3h6L6 8z"}
        fill="currentColor"
      />
    </svg>
  );
}

function StatusDot({ active }) {
  return (
    <span className={`inline-flex items-center gap-1.5 text-xs font-medium ${active ? "text-emerald-700" : "text-ink/55"}`}>
      <span className={`h-1.5 w-1.5 rounded-full ${active ? "bg-emerald-500" : "bg-ink/30"}`} />
      {active ? "Aktif" : "Pasif"}
    </span>
  );
}

function EmptyRow() {
  return (
    <tr>
      <td colSpan={5} className="px-4 py-16 text-center">
        <div className="mx-auto flex max-w-sm flex-col items-center text-ink/55">
          <div className="mb-3 flex h-12 w-12 items-center justify-center rounded-full bg-accent/10 text-accentDark">
            <SearchIcon className="h-5 w-5" />
          </div>
          <p className="text-sm font-semibold text-ink">Sonuç bulunamadı</p>
          <p className="mt-1 text-xs">
            Arama veya filtre kriterlerini değiştirip tekrar dene.
          </p>
        </div>
      </td>
    </tr>
  );
}

function FilterChip({ label, count, active, onClick }) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={`inline-flex items-center gap-1.5 rounded-full px-3 py-1.5 text-xs font-semibold transition ${
        active
          ? "bg-accent text-white shadow-sm shadow-accent/30"
          : "bg-surface text-ink/65 hover:bg-ink/[0.06]"
      }`}
    >
      {label}
      <span className={`rounded-full px-1.5 py-0.5 text-[10px] ${active ? "bg-white/25" : "bg-ink/8 text-ink/50"}`}>
        {count}
      </span>
    </button>
  );
}

function RowMenu({ onView, onToggle, onReset, isActive, busy }) {
  const [open, setOpen] = useState(false);
  const ref = useRef(null);

  useEffect(() => {
    if (!open) return;
    function onDoc(e) {
      if (ref.current && !ref.current.contains(e.target)) setOpen(false);
    }
    document.addEventListener("mousedown", onDoc);
    return () => document.removeEventListener("mousedown", onDoc);
  }, [open]);

  return (
    <div className="relative" ref={ref}>
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        disabled={busy}
        className={`flex h-8 w-8 items-center justify-center rounded-lg border transition ${
          open ? "border-accent/40 bg-accent/10 text-accentDark" : "border-ink/10 bg-white text-ink/60 hover:border-ink/20 hover:bg-surface"
        } disabled:opacity-50`}
        aria-label="Aksiyonlar"
      >
        {busy ? (
          <span className="h-3.5 w-3.5 animate-spin rounded-full border-2 border-ink/20 border-t-ink/60" />
        ) : (
          <DotsIcon />
        )}
      </button>
      {open && (
        <div className="absolute right-0 z-10 mt-1 w-48 overflow-hidden rounded-xl border border-ink/10 bg-white p-1 shadow-lg">
          <MenuItem icon="eye" label="Detayları gör" onClick={() => { setOpen(false); onView(); }} />
          <MenuItem
            icon={isActive ? "off" : "on"}
            label={isActive ? "Pasifleştir" : "Aktifleştir"}
            onClick={() => { setOpen(false); onToggle(); }}
          />
          <MenuItem icon="key" label="Şifre sıfırla" tone="accent" onClick={() => { setOpen(false); onReset(); }} />
        </div>
      )}
    </div>
  );
}

function MenuItem({ icon, label, onClick, tone }) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={`flex w-full items-center gap-2 rounded-lg px-3 py-2 text-left text-sm transition hover:bg-surface ${
        tone === "accent" ? "text-accentDark" : "text-ink/80"
      }`}
    >
      <MenuIcon name={icon} />
      {label}
    </button>
  );
}

function MenuIcon({ name }) {
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
  if (name === "eye") return <svg {...props}><path d="M2 12s3.5-7 10-7 10 7 10 7-3.5 7-10 7S2 12 2 12z"/><circle cx="12" cy="12" r="3"/></svg>;
  if (name === "key") return <svg {...props}><circle cx="8" cy="15" r="4"/><path d="M11 12l9-9"/><path d="M16 7l3 3"/></svg>;
  if (name === "on") return <svg {...props}><circle cx="12" cy="12" r="9"/><path d="M8 12l3 3 5-6"/></svg>;
  if (name === "off") return <svg {...props}><circle cx="12" cy="12" r="9"/><path d="M9 9l6 6M15 9l-6 6"/></svg>;
  return null;
}

function DotsIcon() {
  return (
    <svg viewBox="0 0 24 24" fill="currentColor" className="h-4 w-4" aria-hidden>
      <circle cx="6" cy="12" r="1.6" />
      <circle cx="12" cy="12" r="1.6" />
      <circle cx="18" cy="12" r="1.6" />
    </svg>
  );
}

function UserDetailDrawer({ user, token, onClose, onToggle, onReset, busy, reduce }) {
  const [transactions, setTransactions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    function onKey(e) {
      if (e.key === "Escape") onClose();
    }
    document.addEventListener("keydown", onKey);
    return () => document.removeEventListener("keydown", onKey);
  }, [onClose]);

  useEffect(() => {
    if (!token) return;
    let cancelled = false;
    setLoading(true);
    setError("");
    fetch(apiUrl(`/api/admin/transactions?status=all&limit=300`), {
      headers: { Authorization: `Bearer ${token}` },
    })
      .then(async (r) => {
        const body = await r.json().catch(() => []);
        if (!r.ok) throw new Error(body.error || "Geçmiş yüklenemedi");
        return body;
      })
      .then((rows) => {
        if (cancelled) return;
        const mine = (Array.isArray(rows) ? rows : []).filter(
          (t) => String(t.userId) === String(user.id),
        );
        setTransactions(mine);
      })
      .catch((err) => !cancelled && setError(err.message))
      .finally(() => !cancelled && setLoading(false));
    return () => {
      cancelled = true;
    };
  }, [token, user.id]);

  function handleClose(e) {
    if (e) {
      e.preventDefault();
      e.stopPropagation();
    }
    onClose();
  }

  const stats = useMemo(() => {
    const aktif = transactions.filter((t) => t.status === "borrowed" || t.status === "overdue").length;
    const gecikmis = transactions.filter((t) => t.status === "overdue").length;
    return { toplam: transactions.length, aktif, gecikmis };
  }, [transactions]);

  return (
    <>
      <motion.div
        initial={reduce ? false : { opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={reduce ? undefined : { opacity: 0 }}
        transition={{ duration: 0.2 }}
        className="fixed inset-0 z-40 bg-black/35 backdrop-blur-sm"
        onClick={handleClose}
        aria-hidden
      />
      <motion.aside
        initial={reduce ? false : { x: "100%" }}
        animate={{ x: 0 }}
        exit={reduce ? undefined : { x: "100%" }}
        transition={{ type: "spring", stiffness: 240, damping: 30 }}
        className="fixed bottom-0 right-0 top-0 z-50 flex h-full w-full max-w-md flex-col overflow-hidden bg-white shadow-2xl"
        role="dialog"
        aria-modal="true"
      >
        <div className="relative overflow-hidden bg-gradient-to-br from-accent/15 via-white to-night/10 px-5 py-6">
          <div className="pointer-events-none absolute -right-16 -top-16 h-44 w-44 rounded-full bg-accent/25 blur-3xl" />
          <button
            type="button"
            onClick={handleClose}
            className="absolute right-3 top-3 z-10 flex h-9 w-9 items-center justify-center rounded-lg border border-ink/10 bg-white text-ink/60 shadow-sm transition hover:border-accent/40 hover:text-accent"
            aria-label="Kapat"
          >
            <CloseIcon />
          </button>

          <div className="relative flex items-center gap-4">
            <div className="flex h-16 w-16 shrink-0 items-center justify-center rounded-2xl bg-gradient-to-br from-accent to-accentDark text-2xl font-bold text-white shadow-lg shadow-accent/30">
              {getInitials(user.name)}
            </div>
            <div className="min-w-0">
              <p className="text-[11px] font-semibold uppercase tracking-[0.18em] text-ink/45">
                Kullanıcı detayı
              </p>
              <h3 className="truncate text-lg font-bold text-ink">{user.name || "—"}</h3>
              <p className="truncate text-xs text-ink/60">{user.email}</p>
              <div className="mt-2 flex items-center gap-3 text-[11px] uppercase tracking-[0.16em] text-ink/45">
                <span>{user.role === "admin" ? "Yönetici" : "Üye"}</span>
                <span aria-hidden>·</span>
                <span>{user.status === "active" ? "Hesap aktif" : "Hesap pasif"}</span>
              </div>
            </div>
          </div>
        </div>

        <div className="border-b border-ink/8 px-5 py-4">
          <div className="grid grid-cols-3 gap-2">
            <DrawerStat label="Toplam ödünç" value={stats.toplam} loading={loading} tone="ink" />
            <DrawerStat label="Aktif" value={stats.aktif} loading={loading} tone="accent" />
            <DrawerStat label="Gecikmiş" value={stats.gecikmis} loading={loading} tone="red" />
          </div>
        </div>

        <div className="flex flex-1 flex-col overflow-hidden">
          <div className="flex items-center justify-between px-5 pt-4">
            <h4 className="text-sm font-bold text-ink">Ödünç geçmişi</h4>
            <p className="text-xs text-ink/45">
              Kayıt tarihi: {formatDate(user.joined)}
            </p>
          </div>

          <div className="flex-1 overflow-y-auto px-5 pb-4">
            {error && (
              <p className="mt-3 rounded-lg border border-red-200 bg-red-50 px-3 py-2 text-xs text-red-700">
                {error}
              </p>
            )}
            {loading && (
              <div className="mt-3 space-y-2">
                {[1, 2, 3].map((i) => (
                  <div key={i} className="h-14 animate-pulse rounded-xl bg-ink/5" />
                ))}
              </div>
            )}
            {!loading && !error && transactions.length === 0 && (
              <p className="mt-6 rounded-xl border border-dashed border-ink/15 bg-surface/40 px-4 py-8 text-center text-xs text-ink/55">
                Bu kullanıcının ödünç geçmişi yok.
              </p>
            )}
            <ul className="mt-3 space-y-2">
              {transactions.map((t) => (
                <li
                  key={t.id}
                  className={`rounded-xl border p-3 ${
                    t.status === "overdue"
                      ? "border-red-200 bg-red-50/40"
                      : t.status === "returned"
                      ? "border-emerald-200 bg-emerald-50/40"
                      : "border-ink/8 bg-white"
                  }`}
                >
                  <div className="flex items-start justify-between gap-3">
                    <div className="min-w-0">
                      <p className="line-clamp-1 text-sm font-semibold text-ink">{t.bookTitle}</p>
                      <p className="text-[11px] text-ink/45">ISBN: {t.bookIsbn}</p>
                    </div>
                    <DrawerStatus status={t.status} />
                  </div>
                  <div className="mt-2 flex items-center gap-3 text-[11px] text-ink/55">
                    <span>Alış: {formatDate(t.borrowDate)}</span>
                    <span aria-hidden>·</span>
                    <span>Son tarih: {formatDate(t.dueDate)}</span>
                    {t.returnDate && (
                      <>
                        <span aria-hidden>·</span>
                        <span>İade: {formatDate(t.returnDate)}</span>
                      </>
                    )}
                  </div>
                </li>
              ))}
            </ul>
          </div>
        </div>

        <div className="border-t border-ink/8 bg-white px-5 py-4">
          <div className="flex flex-wrap items-center gap-2">
            <button
              type="button"
              onClick={onToggle}
              disabled={busy}
              className="inline-flex flex-1 items-center justify-center gap-2 rounded-lg border border-ink/10 bg-white px-3 py-2 text-sm font-semibold text-ink/80 transition hover:bg-surface disabled:opacity-50"
            >
              {user.status === "active" ? "Pasifleştir" : "Aktifleştir"}
            </button>
            <button
              type="button"
              onClick={onReset}
              disabled={busy}
              className="inline-flex flex-1 items-center justify-center gap-2 rounded-lg bg-accent px-3 py-2 text-sm font-semibold text-white shadow-md shadow-accent/30 transition hover:bg-accentDark disabled:opacity-50"
            >
              Şifre sıfırla
            </button>
          </div>
        </div>
      </motion.aside>
    </>
  );
}

function DrawerStat({ label, value, loading, tone }) {
  const cls = {
    ink: "text-ink",
    accent: "text-accent",
    red: "text-red-600",
  }[tone];
  return (
    <div className="rounded-xl bg-surface/60 p-3">
      <p className="text-[10px] font-semibold uppercase tracking-wider text-ink/50">
        {label}
      </p>
      <p className={`mt-1 text-xl font-bold ${cls}`}>
        {loading ? <span className="inline-block h-5 w-8 animate-pulse rounded bg-ink/10" /> : value}
      </p>
    </div>
  );
}

function DrawerStatus({ status }) {
  if (status === "returned") {
    return <span className="rounded-full bg-emerald-100 px-2 py-0.5 text-[10px] font-semibold text-emerald-700">İade edildi</span>;
  }
  if (status === "overdue") {
    return <span className="rounded-full bg-red-100 px-2 py-0.5 text-[10px] font-semibold text-red-700">Gecikmiş</span>;
  }
  return <span className="rounded-full bg-accent/15 px-2 py-0.5 text-[10px] font-semibold text-accentDark">Ödünçte</span>;
}

function ConfirmDialog({ data, onClose, onConfirm, reduce }) {
  return (
    <motion.div
      initial={reduce ? false : { opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={reduce ? undefined : { opacity: 0 }}
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 px-4 backdrop-blur-md"
      onClick={onClose}
      role="dialog"
      aria-modal="true"
    >
      <motion.div
        initial={reduce ? false : { scale: 0.94, y: 16, opacity: 0 }}
        animate={{ scale: 1, y: 0, opacity: 1 }}
        exit={reduce ? undefined : { scale: 0.96, y: -8, opacity: 0 }}
        transition={{ type: "spring", stiffness: 260, damping: 22 }}
        className="relative w-full max-w-md overflow-hidden rounded-2xl border border-white/60 bg-white p-6 shadow-2xl"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="pointer-events-none absolute -right-12 -top-12 h-32 w-32 rounded-full bg-accent/25 blur-3xl" />
        <div className="relative">
          <div className="mb-3 flex h-11 w-11 items-center justify-center rounded-full bg-accent/10 text-accentDark">
            <ShieldIcon className="h-5 w-5" />
          </div>
          <h3 className="text-lg font-bold text-ink">{data.title}</h3>
          <p className="mt-1 text-sm text-ink/65">{data.description}</p>

          <div className="mt-5 flex items-center justify-end gap-2">
            <button
              type="button"
              onClick={onClose}
              className="rounded-full px-4 py-2 text-sm font-semibold text-ink/70 transition hover:bg-surface"
            >
              Vazgeç
            </button>
            <button
              type="button"
              onClick={onConfirm}
              className={`rounded-full px-4 py-2 text-sm font-semibold text-white shadow-md transition ${
                data.tone === "danger"
                  ? "bg-red-600 shadow-red-600/30 hover:bg-red-700"
                  : "bg-accent shadow-accent/30 hover:bg-accentDark"
              }`}
            >
              {data.action || "Onayla"}
            </button>
          </div>
        </div>
      </motion.div>
    </motion.div>
  );
}

function TempPasswordModal({ info, onClose, onCopied, reduce }) {
  return (
    <motion.div
      initial={reduce ? false : { opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={reduce ? undefined : { opacity: 0 }}
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 px-4 backdrop-blur-md"
      onClick={onClose}
      role="dialog"
      aria-modal="true"
    >
      <motion.div
        initial={reduce ? false : { scale: 0.94, y: 16, opacity: 0 }}
        animate={{ scale: 1, y: 0, opacity: 1 }}
        exit={reduce ? undefined : { scale: 0.96, y: -8, opacity: 0 }}
        transition={{ type: "spring", stiffness: 260, damping: 22 }}
        className="relative w-full max-w-md overflow-hidden rounded-2xl border border-white/60 bg-white p-6 shadow-2xl"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="pointer-events-none absolute -right-12 -top-12 h-32 w-32 rounded-full bg-accent/25 blur-3xl" />
        <div className="relative">
          <h3 className="text-lg font-bold text-ink">Geçici şifre oluşturuldu</h3>
          <p className="mt-1 text-sm text-ink/60">
            <span className="font-semibold text-ink">{info.name}</span> ({info.email}) için aşağıdaki tek kullanımlık şifre üretildi.
            Kullanıcıya iletip ilk girişte değiştirmesini isteyin.
          </p>

          <div className="mt-5 rounded-xl border border-dashed border-accent/40 bg-accent/5 p-4">
            <p className="text-[10px] font-semibold uppercase tracking-wider text-accentDark">Geçici şifre</p>
            <p className="mt-1 select-all break-all font-mono text-lg font-bold text-night">
              {info.password}
            </p>
          </div>

          <div className="mt-5 flex items-center justify-end gap-2">
            <button
              type="button"
              onClick={onClose}
              className="rounded-full px-4 py-2 text-sm font-semibold text-ink/70 transition hover:bg-surface"
            >
              Kapat
            </button>
            <button
              type="button"
              onClick={async () => {
                try {
                  await navigator.clipboard.writeText(info.password);
                  onCopied();
                } catch {
                  /* ignore */
                }
              }}
              className="rounded-full bg-accent px-4 py-2 text-sm font-semibold text-white shadow-md shadow-accent/30 transition hover:bg-accentDark"
            >
              Şifreyi kopyala
            </button>
          </div>
        </div>
      </motion.div>
    </motion.div>
  );
}

function Toast({ type, message, reduce }) {
  return (
    <motion.div
      initial={reduce ? false : { opacity: 0, y: -16 }}
      animate={{ opacity: 1, y: 0 }}
      exit={reduce ? undefined : { opacity: 0, y: -16 }}
      transition={{ type: "spring", stiffness: 280, damping: 24 }}
      className={`fixed right-4 top-4 z-50 flex w-[320px] max-w-[calc(100vw-2rem)] items-start gap-3 rounded-xl border px-4 py-3 shadow-xl backdrop-blur sm:right-6 sm:top-6 ${
        type === "success" ? "border-accent/30 bg-white/95" : "border-red-200 bg-white/95"
      }`}
      role="status"
      aria-live="polite"
    >
      <div className={`flex h-8 w-8 shrink-0 items-center justify-center rounded-full text-white ${
        type === "success" ? "bg-accent" : "bg-red-500"
      }`}>
        {type === "success" ? <CheckIcon /> : <ExclaimIcon />}
      </div>
      <p className="mt-0.5 text-sm font-medium text-night">{message}</p>
    </motion.div>
  );
}

function getInitials(name) {
  if (!name || typeof name !== "string") return "?";
  const parts = name.trim().split(/\s+/);
  return ((parts[0]?.[0] || "") + (parts.length > 1 ? parts[parts.length - 1][0] : "")).toUpperCase() || "?";
}

function formatDate(value) {
  if (!value) return "—";
  const d = new Date(value);
  if (Number.isNaN(d.getTime())) return "—";
  return d.toLocaleDateString("tr-TR", { day: "2-digit", month: "short", year: "numeric" });
}

function SearchIcon({ className }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" aria-hidden>
      <circle cx="11" cy="11" r="7" />
      <path d="M21 21l-4.3-4.3" />
    </svg>
  );
}

function ShieldIcon({ className }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinejoin="round" aria-hidden>
      <path d="M12 3l8 3v5c0 5-3.5 8.5-8 10-4.5-1.5-8-5-8-10V6l8-3z" />
      <path d="M9 12.5l2 2 4-4" strokeWidth="1.8" strokeLinecap="round" />
    </svg>
  );
}

function CheckIcon() {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.4" strokeLinecap="round" strokeLinejoin="round" className="h-4 w-4" aria-hidden>
      <path d="M5 12.5l4 4L19 7" />
    </svg>
  );
}

function CloseIcon() {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="h-4 w-4" aria-hidden>
      <path d="M6 6l12 12M6 18L18 6" />
    </svg>
  );
}

function ExclaimIcon() {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="h-4 w-4" aria-hidden>
      <circle cx="12" cy="12" r="9" />
      <path d="M12 8v5" />
      <path d="M12 16h.01" strokeWidth="2.4" />
    </svg>
  );
}
