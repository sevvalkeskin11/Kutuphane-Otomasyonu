import { apiUrl } from "./apiUrl.js";

const TOKEN_KEY = "token";

let unauthorizedHandler = null;
let redirectInProgress = false;

/**
 * 401 (Bearer ile yapılmış isteklerde) çağrılacak handler'ı kaydeder.
 * Genelde AuthProvider içinde logout + /giris yönlendirmesi için kullanılır.
 */
export function setUnauthorizedHandler(handler) {
  unauthorizedHandler = typeof handler === "function" ? handler : null;
}

function resolveInput(input) {
  if (typeof input === "string" && !/^https?:\/\//i.test(input)) {
    return apiUrl(input);
  }
  return input;
}

function mergeHeaders(initHeaders, auth) {
  const headers = new Headers(initHeaders ?? undefined);
  if (auth !== false) {
    const existing = headers.get("Authorization");
    if (!existing || !String(existing).trim()) {
      try {
        const token = localStorage.getItem(TOKEN_KEY);
        if (token) headers.set("Authorization", `Bearer ${token}`);
      } catch {
        /* localStorage yok (SSR vb.) */
      }
    }
  }
  return headers;
}

function hadBearerAuth(headers) {
  const v = headers.get("Authorization");
  return typeof v === "string" && v.trim().toLowerCase().startsWith("bearer ");
}

async function runUnauthorizedHandler() {
  if (!unauthorizedHandler || redirectInProgress) return;
  redirectInProgress = true;
  try {
    await unauthorizedHandler();
  } finally {
    window.setTimeout(() => {
      redirectInProgress = false;
    }, 1200);
  }
}

/**
 * Merkezi fetch: isteğe göre Bearer ekler; yanıt 401 ise ve istek
 * kimlik doğrulamalıysa (Authorization: Bearer … gönderildiyse)
 * oturumu kapatıp giriş sayfasına yönlendirir.
 *
 * @param {RequestInfo} input - Göreli yol (örn. "/api/...") veya tam URL
 * @param {RequestInit} [init]
 * @param {{ auth?: boolean }} [options] - auth: false ile Bearer eklenmez
 * @returns {Promise<Response>}
 */
export async function apiFetch(input, init = {}, options = {}) {
  const { auth = true } = options;
  const url = resolveInput(input);
  const headers = mergeHeaders(init.headers, auth);
  const response = await fetch(url, { ...init, headers });

  if (
    response.status === 401 &&
    hadBearerAuth(headers) &&
    unauthorizedHandler
  ) {
    await runUnauthorizedHandler();
    const err = new Error("Oturum süresi doldu veya yetkiniz yok.");
    err.status = 401;
    throw err;
  }

  return response;
}
