import { useEffect, useMemo, useState } from "react";
import { AnimatePresence, motion, useReducedMotion } from "framer-motion";
import { apiUrl } from "../../services/dbBooks";
import { useAuth } from "../../context/AuthContext";

const TABS = [
  { id: "active", label: "Aktif" },
  { id: "borrowed", label: "Ödünçte" },
  { id: "overdue", label: "Gecikmiş" },
  { id: "returned", label: "İade edildi" },
  { id: "all", label: "Tümü" },
];

export default function Transactions() {
  const { token } = useAuth();
  const reduce = useReducedMotion();

  const [tab, setTab] = useState("active");
  const [rows, setRows] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [busyId, setBusyId] = useState(null);
  const [search, setSearch] = useState("");
  const [toast, setToast] = useState(null);

  useEffect(() => {
    if (!token) return;
    let cancelled = false;
    setLoading(true);
    setError("");
    fetch(apiUrl(`/api/admin/transactions?status=${encodeURIComponent(tab)}&limit=300`), {
      headers: { Authorization: `Bearer ${token}` },
    })
      .then(async (r) => {
        const body = await r.json().catch(() => []);
        if (!r.ok) throw new Error(body.error || "Ödünç kayıtları alınamadı");
        return body;
      })
      .then((rows) => !cancelled && setRows(Array.isArray(rows) ? rows : []))
      .catch((err) => !cancelled && setError(err.message))
      .finally(() => !cancelled && setLoading(false));
    return () => {
      cancelled = true;
    };
  }, [token, tab]);

  function showToast(type, message) {
    setToast({ type, message });
    setTimeout(() => setToast(null), 2800);
  }

  async function markReturned(row) {
    setBusyId(row.id);
    try {
      const res = await fetch(apiUrl(`/api/admin/transactions/${row.id}/return`), {
        method: "POST",
        headers: { Authorization: `Bearer ${token}` },
      });
      const body = await res.json();
      if (!res.ok) throw new Error(body.error || "İade işlenemedi");
      const next = body.transaction;
      setRows((list) =>
        list
          .map((r) =>
            r.id === row.id
              ? {
                  ...r,
                  status: "returned",
                  returnDate: next?.returnDate || new Date().toISOString().slice(0, 10),
                }
              : r,
          )
          .filter((r) => (tab === "active" || tab === "borrowed" || tab === "overdue" ? r.status !== "returned" : true)),
      );
      showToast("success", "İade alındı, stok güncellendi.");
    } catch (err) {
      showToast("error", err.message);
    } finally {
      setBusyId(null);
    }
  }

  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase();
    if (!q) return rows;
    return rows.filter((r) => {
      return (
        (r.userName || "").toLowerCase().includes(q) ||
        (r.bookTitle || "").toLowerCase().includes(q) ||
        (r.bookIsbn || "").toLowerCase().includes(q)
      );
    });
  }, [rows, search]);

  return (
    <div>
      <div className="mb-6 flex flex-wrap items-end justify-between gap-3">
        <div>
          <h1 className="text-2xl font-bold text-ink md:text-[1.7rem]">Ödünç işlemleri</h1>
          <p className="mt-1 text-sm text-ink/55">
            Aktif ödünçleri takip edin, iade alımı tek tıklamayla stok günceller.
          </p>
        </div>
      </div>

      <div className="mb-4 flex flex-wrap items-center gap-2 rounded-2xl border border-ink/8 bg-white p-2 shadow-sm">
        <div className="flex flex-1 flex-wrap gap-1">
          {TABS.map((t) => (
            <button
              key={t.id}
              type="button"
              onClick={() => setTab(t.id)}
              className={`rounded-lg px-3 py-2 text-sm font-semibold transition ${
                tab === t.id
                  ? "bg-accent text-white shadow-sm shadow-accent/25"
                  : "text-ink/65 hover:bg-surface hover:text-ink"
              }`}
            >
              {t.label}
            </button>
          ))}
        </div>
        <div className="relative ml-auto min-w-[220px] flex-1 sm:flex-none sm:basis-[280px]">
          <SearchIcon className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-ink/40" />
          <input
            type="search"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Kullanıcı, kitap veya ISBN ara..."
            className="w-full rounded-lg border border-ink/10 bg-surface py-2 pl-9 pr-3 text-sm text-ink outline-none transition focus:border-accent focus:bg-white focus:ring-2 focus:ring-accent/25"
          />
        </div>
      </div>

      {error && (
        <div className="mb-4 rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
          {error}
        </div>
      )}

      <div className="overflow-hidden rounded-2xl border border-ink/8 bg-white shadow-sm">
        <div className="overflow-x-auto">
          <table className="w-full min-w-[820px] text-left text-sm">
            <thead className="bg-surface/70 text-xs font-semibold uppercase tracking-wider text-ink/55">
              <tr>
                <th className="px-4 py-3">Kullanıcı</th>
                <th className="px-4 py-3">Kitap</th>
                <th className="px-4 py-3">Alış</th>
                <th className="px-4 py-3">Son tarih</th>
                <th className="px-4 py-3">Durum</th>
                <th className="px-4 py-3 text-right">Aksiyon</th>
              </tr>
            </thead>
            <tbody>
              {loading && (
                <tr>
                  <td colSpan={6} className="px-4 py-12 text-center text-ink/45">
                    Yükleniyor...
                  </td>
                </tr>
              )}
              {!loading && !filtered.length && (
                <tr>
                  <td colSpan={6} className="px-4 py-12 text-center text-ink/45">
                    Bu filtreye uyan kayıt yok.
                  </td>
                </tr>
              )}
              {filtered.map((r) => {
                const overdue = r.status === "overdue";
                const returned = r.status === "returned";
                return (
                  <tr
                    key={r.id}
                    className={`border-t border-ink/5 transition hover:bg-surface/40 ${
                      overdue ? "bg-red-50/30" : ""
                    }`}
                  >
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-3">
                        <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-night/8 text-xs font-bold text-night">
                          {getInitials(r.userName)}
                        </div>
                        <div className="min-w-0">
                          <p className="truncate font-medium text-ink">{r.userName || "—"}</p>
                          <p className="truncate text-xs text-ink/45">ID: {r.userId}</p>
                        </div>
                      </div>
                    </td>
                    <td className="px-4 py-3">
                      <p className="line-clamp-1 font-medium text-ink">{r.bookTitle}</p>
                      <p className="text-xs text-ink/45">ISBN: {r.bookIsbn}</p>
                    </td>
                    <td className="px-4 py-3 text-xs text-ink/65">{formatDate(r.borrowDate)}</td>
                    <td className="px-4 py-3 text-xs">
                      <span className={overdue ? "font-semibold text-red-700" : "text-ink/65"}>
                        {formatDate(r.dueDate)}
                      </span>
                      {overdue && <DaysLate dueDate={r.dueDate} />}
                    </td>
                    <td className="px-4 py-3">
                      <StatusPill status={r.status} returnDate={r.returnDate} />
                    </td>
                    <td className="px-4 py-3 text-right">
                      {!returned ? (
                        <button
                          type="button"
                          onClick={() => markReturned(r)}
                          disabled={busyId === r.id}
                          className="inline-flex items-center gap-1.5 rounded-lg bg-accent px-3 py-1.5 text-xs font-semibold text-white shadow-sm shadow-accent/25 transition hover:bg-accentDark disabled:opacity-50"
                        >
                          {busyId === r.id ? (
                            <span className="h-3 w-3 animate-spin rounded-full border-2 border-white/40 border-t-white" />
                          ) : (
                            <CheckIcon />
                          )}
                          {busyId === r.id ? "İade alınıyor" : "İade al"}
                        </button>
                      ) : (
                        <span className="text-xs text-ink/50">{formatDate(r.returnDate)}</span>
                      )}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>

      <AnimatePresence>
        {toast && <Toast type={toast.type} message={toast.message} reduce={reduce} />}
      </AnimatePresence>
    </div>
  );
}

function StatusPill({ status, returnDate }) {
  if (status === "returned") {
    return (
      <span className="inline-flex items-center gap-1.5 text-xs font-medium text-emerald-700">
        <span className="h-1.5 w-1.5 rounded-full bg-emerald-500" />
        İade edildi
      </span>
    );
  }
  if (status === "overdue") {
    return (
      <span className="inline-flex items-center gap-1.5 text-xs font-semibold text-red-700">
        <span className="h-1.5 w-1.5 rounded-full bg-red-500" />
        Gecikmiş
      </span>
    );
  }
  return (
    <span className="inline-flex items-center gap-1.5 text-xs font-medium text-accentDark">
      <span className="h-1.5 w-1.5 rounded-full bg-accent" />
      Ödünçte
    </span>
  );
}

function DaysLate({ dueDate }) {
  if (!dueDate) return null;
  const due = new Date(dueDate);
  if (Number.isNaN(due.getTime())) return null;
  const diff = Math.floor((Date.now() - due.getTime()) / 86400000);
  if (diff <= 0) return null;
  return (
    <span className="ml-1 inline-flex items-center rounded-full bg-red-100 px-2 py-0.5 text-[10px] font-semibold text-red-700">
      {diff} gün gecikme
    </span>
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

function CheckIcon() {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.4" strokeLinecap="round" strokeLinejoin="round" className="h-3.5 w-3.5" aria-hidden>
      <path d="M5 12.5l4 4L19 7" />
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
