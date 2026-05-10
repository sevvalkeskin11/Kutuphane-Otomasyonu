export function apiUrl(path) {
  const base = (import.meta.env.VITE_API_BASE_URL || "").replace(/\/$/, "");
  return base ? `${base}${path}` : path;
}
