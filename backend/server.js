const path = require("path");
const crypto = require("crypto");
require("dotenv").config({ path: path.join(__dirname, ".env") });

const express = require("express");
const cors = require("cors");
const { Pool } = require("pg");

const PORT = Number(process.env.PORT) || 5050;
const DEFAULT_BORROW_DAYS = Number.parseInt(process.env.DEFAULT_BORROW_DAYS || "14", 10) || 14;
const TOKEN_EXPIRES_HOURS = Number.parseInt(process.env.TOKEN_EXPIRES_HOURS || "168", 10) || 168;
const AUTH_SECRET = String(process.env.AUTH_SECRET || "").trim() || "dev-only-change-this-secret";
const ALLOW_GUEST_BORROW = process.env.ALLOW_GUEST_BORROW !== "false";

const connectionString = (process.env.SUPABASE_DB_URL || process.env.DATABASE_URL || "").trim();

const pool = connectionString
  ? new Pool({
      connectionString,
      ssl: process.env.PG_SSL === "false" ? false : { rejectUnauthorized: false },
    })
  : new Pool({
      user: process.env.PGUSER || "postgres",
      password: process.env.PGPASSWORD || "",
      host: process.env.PGHOST || "localhost",
      port: Number(process.env.PGPORT) || 5432,
      database: process.env.PGDATABASE || "KutuphaneOtomasyon",
    });

pool.on("error", (error) => {
  console.error("[db] unexpected pool error:", error.message);
});

const app = express();
app.use(
  cors({
    origin: process.env.CORS_ORIGIN ? process.env.CORS_ORIGIN.split(",").map((x) => x.trim()) : true,
    credentials: true,
  }),
);
app.use(express.json({ limit: "1mb" }));
app.use((req, _res, next) => {
  const header = String(req.headers.authorization || "");
  const token = header.startsWith("Bearer ") ? header.slice(7).trim() : "";
  const payload = verifyToken(token);
  if (payload) req.auth = payload;
  next();
});

if (!process.env.AUTH_SECRET) {
  console.warn("[auth] AUTH_SECRET tanimli degil. Gelistirme modu secret kullaniliyor.");
}

function asyncHandler(fn) {
  return (req, res, next) => Promise.resolve(fn(req, res, next)).catch(next);
}

function parsePositiveInt(value, fallback, min = 1, max = Number.MAX_SAFE_INTEGER) {
  const parsed = Number.parseInt(String(value ?? ""), 10);
  if (!Number.isFinite(parsed)) return fallback;
  return Math.min(Math.max(parsed, min), max);
}

function normalizeEmail(value) {
  return String(value || "").trim().toLowerCase();
}

function asIsoDate(value) {
  if (!value) return null;
  if (value instanceof Date && !Number.isNaN(value.getTime())) {
    return value.toISOString().slice(0, 10);
  }
  const asDate = new Date(value);
  if (Number.isNaN(asDate.getTime())) return null;
  return asDate.toISOString().slice(0, 10);
}

function toDisplayUser(row) {
  return {
    id: String(row.id),
    name: row.full_name,
    email: row.email,
    status: row.is_active ? "active" : "inactive",
    joined: asIsoDate(row.created_at),
    role: row.role,
  };
}

function toBorrowStatusForUi(status) {
  if (status === "gecikti") return "overdue";
  if (status === "iade_edildi") return "returned";
  return "borrowed";
}

function toDisplayTransaction(row) {
  const dueDate = asIsoDate(row.due_date);
  const returnDate = asIsoDate(row.return_date);
  const overdue = !returnDate && dueDate && dueDate < asIsoDate(new Date());
  const normalizedStatus = overdue ? "gecikti" : row.status;
  return {
    id: String(row.id),
    userId: String(row.user_id),
    userName: row.user_name,
    bookIsbn: row.kitap_isbn,
    bookTitle: row.book_title,
    borrowDate: asIsoDate(row.borrow_date),
    dueDate,
    returnDate,
    status: toBorrowStatusForUi(normalizedStatus),
    rawStatus: normalizedStatus,
  };
}

function base64UrlEncode(value) {
  return Buffer.from(value, "utf8").toString("base64url");
}

function base64UrlDecode(value) {
  return Buffer.from(value, "base64url").toString("utf8");
}

function signToken(payload) {
  const body = base64UrlEncode(JSON.stringify(payload));
  const signature = crypto.createHmac("sha256", AUTH_SECRET).update(body).digest("base64url");
  return `${body}.${signature}`;
}

function verifyToken(token) {
  if (!token || typeof token !== "string") return null;
  const parts = token.split(".");
  if (parts.length !== 2) return null;
  const [body, signature] = parts;
  const expected = crypto.createHmac("sha256", AUTH_SECRET).update(body).digest("base64url");
  const sigBuf = Buffer.from(signature);
  const expectedBuf = Buffer.from(expected);
  if (sigBuf.length !== expectedBuf.length || !crypto.timingSafeEqual(sigBuf, expectedBuf)) {
    return null;
  }
  let payload;
  try {
    payload = JSON.parse(base64UrlDecode(body));
  } catch {
    return null;
  }
  if (!payload || typeof payload !== "object") return null;
  if (!payload.exp || Date.now() > payload.exp * 1000) return null;
  return payload;
}

function hashPassword(password) {
  const salt = crypto.randomBytes(16).toString("hex");
  const iterations = 120000;
  const hash = crypto.pbkdf2Sync(password, salt, iterations, 32, "sha256").toString("hex");
  return `pbkdf2$${iterations}$${salt}$${hash}`;
}

function verifyPassword(password, storedHash) {
  if (!storedHash || typeof storedHash !== "string") return false;
  const parts = storedHash.split("$");
  if (parts.length !== 4 || parts[0] !== "pbkdf2") return false;
  const iterations = Number.parseInt(parts[1], 10);
  const salt = parts[2];
  const hash = parts[3];
  if (!Number.isFinite(iterations) || iterations < 1000 || !salt || !hash) return false;
  const candidate = crypto.pbkdf2Sync(password, salt, iterations, 32, "sha256").toString("hex");
  const candBuf = Buffer.from(candidate);
  const hashBuf = Buffer.from(hash);
  if (candBuf.length !== hashBuf.length) return false;
  return crypto.timingSafeEqual(candBuf, hashBuf);
}

function authRequired(req, res, next) {
  const payload = req.auth;
  if (!payload) {
    return res.status(401).json({ error: "Yetkisiz erisim" });
  }
  req.auth = payload;
  return next();
}

function adminRequired(req, res, next) {
  if (!req.auth || req.auth.role !== "admin") {
    return res.status(403).json({ error: "Admin yetkisi gerekli" });
  }
  return next();
}

async function syncOverdueLoans() {
  await pool.query(
    `
      UPDATE odunc_islemleri
      SET status = 'gecikti'
      WHERE return_date IS NULL
        AND due_date < CURRENT_DATE
        AND status = 'oduncte'
    `,
  );
}

function toAuthResponse(userRow) {
  const nowSec = Math.floor(Date.now() / 1000);
  const tokenPayload = {
    sub: String(userRow.id),
    email: userRow.email,
    role: userRow.role,
    exp: nowSec + TOKEN_EXPIRES_HOURS * 60 * 60,
  };
  return {
    token: signToken(tokenPayload),
    user: {
      id: String(userRow.id),
      fullName: userRow.full_name,
      email: userRow.email,
      role: userRow.role,
      isActive: userRow.is_active,
    },
  };
}

function normalizeIsbn(value) {
  return String(value || "").trim().slice(0, 64);
}

const coverCache = new Map();

function pickCoverFromVolumeInfo(volumeInfo) {
  const links = volumeInfo?.imageLinks;
  const picked =
    links?.extraLarge ||
    links?.large ||
    links?.medium ||
    links?.thumbnail ||
    links?.smallThumbnail ||
    null;
  return picked ? String(picked).replace(/^http:\/\//i, "https://") : null;
}

function normalizeTr(value) {
  return String(value || "")
    .toLowerCase()
    .normalize("NFD")
    .replace(/\p{M}/gu, "")
    .replace(/ı/g, "i")
    .replace(/ğ/g, "g")
    .replace(/ü/g, "u")
    .replace(/ş/g, "s")
    .replace(/ö/g, "o")
    .replace(/ç/g, "c")
    .replace(/[^a-z0-9\s]/g, " ")
    .replace(/\s+/g, " ")
    .trim();
}

function pickBestGoogleItem(items, wantTitle, wantAuthor) {
  if (!items?.length) return null;
  const normalizedTitle = normalizeTr(wantTitle);
  const normalizedAuthor = normalizeTr(wantAuthor);
  const titleTokens = normalizedTitle.split(/\s+/).filter((part) => part.length >= 3);
  const authorTokens = normalizedAuthor.split(/\s+/).filter((part) => part.length >= 2);
  const requiresAuthorMatch = authorTokens.length > 0;

  const scored = [];
  for (const item of items) {
    const volumeInfo = item.volumeInfo;
    if (!volumeInfo) continue;
    const coverUrl = pickCoverFromVolumeInfo(volumeInfo);
    if (!coverUrl) continue;
    const candidateTitle = normalizeTr(volumeInfo.title);
    const candidateAuthors = normalizeTr((volumeInfo.authors || []).join(" "));
    let score = 0;

    if (normalizedTitle.length >= 4 && candidateTitle.includes(normalizedTitle)) score += 100;
    if (normalizedTitle.length >= 4 && normalizedTitle.includes(candidateTitle) && candidateTitle.length >= 5)
      score += 70;
    for (const token of titleTokens) {
      if (candidateTitle.includes(token)) score += 14;
    }
    const authorMatched =
      !requiresAuthorMatch ||
      authorTokens.some((token) => token.length >= 2 && candidateAuthors.includes(token));
    if (requiresAuthorMatch && !authorMatched) score -= 80;
    for (const token of authorTokens) {
      if (candidateAuthors.includes(token)) score += 28;
    }
    scored.push({ score, coverUrl });
  }

  if (!scored.length) return null;
  scored.sort((left, right) => right.score - left.score);
  if (scored[0].score < 12) return null;
  return scored[0].coverUrl;
}

async function openLibrarySearchCover(title, author) {
  const normalizedTitle = String(title || "").trim();
  if (normalizedTitle.length < 2) return null;

  const searchText = [normalizedTitle, String(author || "").trim()]
    .filter((x) => x.length >= 1)
    .join(" ");
  try {
    const url = `https://openlibrary.org/search.json?q=${encodeURIComponent(searchText)}&limit=20`;
    const response = await fetch(url);
    if (!response.ok) return null;
    const data = await response.json();
    const docs = data.docs || [];

    const wantedTitle = normalizeTr(normalizedTitle);
    const authorTokens = normalizeTr(author)
      .split(/\s+/)
      .filter((part) => part.length >= 2);

    for (const doc of docs) {
      const docTitle = normalizeTr(doc.title || "");
      const docAuthors = normalizeTr((doc.author_name || []).join(" "));
      const titleMatched =
        (wantedTitle.length >= 4 && docTitle.includes(wantedTitle)) ||
        (wantedTitle.length >= 4 && wantedTitle.includes(docTitle) && docTitle.length >= 4) ||
        wantedTitle
          .split(/\s+/)
          .filter((part) => part.length >= 3)
          .some((part) => docTitle.includes(part));
      if (!titleMatched) continue;
      if (authorTokens.length && !authorTokens.some((token) => docAuthors.includes(token))) continue;
      if (doc.cover_i) return `https://covers.openlibrary.org/b/id/${doc.cover_i}-L.jpg`;
    }
  } catch (error) {
    console.error("[kapak] openlibrary error:", error.message);
  }
  return null;
}

async function fetchGoogleVolumes(searchUrl) {
  const response = await fetch(searchUrl);
  const text = await response.text();
  let data = {};
  try {
    data = text ? JSON.parse(text) : {};
  } catch {
    console.error("[kapak] google returned non-json body");
    return { ok: false, data: {} };
  }
  if (!response.ok || data.error) {
    return { ok: false, data };
  }
  return { ok: true, data };
}

async function resolveCoverFromGoogle({ isbnDigits, title, author }) {
  const apiKey = process.env.GOOGLE_BOOKS_API_KEY?.trim();
  if (!apiKey) return { url: null, needsApiKey: true };

  const safeTitle = String(title || "").trim();
  const safeAuthor = String(author || "").trim();
  const cacheKey = `${String(isbnDigits || "").replace(/\D/g, "")}|${safeTitle}|${safeAuthor}`;
  if (coverCache.has(cacheKey)) {
    return { url: coverCache.get(cacheKey), needsApiKey: false };
  }

  const baseUrl = "https://www.googleapis.com/books/v1/volumes";
  const keyParam = `&key=${encodeURIComponent(apiKey)}`;
  const trParam = "&langRestrict=tr";

  const googleTry = async (query, maxResults, withLangRestrict = true) => {
    const lang = withLangRestrict ? trParam : "";
    const { ok, data } = await fetchGoogleVolumes(
      `${baseUrl}?q=${encodeURIComponent(query)}&maxResults=${maxResults}${lang}${keyParam}`,
    );
    if (!ok || !data.items?.length) return null;
    return pickBestGoogleItem(data.items, safeTitle || query, safeAuthor);
  };

  let found = null;
  if (isbnDigits && String(isbnDigits).replace(/\D/g, "").length >= 10) {
    const digits = String(isbnDigits).replace(/\D/g, "");
    const { ok, data } = await fetchGoogleVolumes(
      `${baseUrl}?q=isbn:${encodeURIComponent(digits)}${keyParam}`,
    );
    if (ok && data.items?.length) {
      if (safeTitle.length >= 3) {
        found = pickBestGoogleItem(data.items, safeTitle, safeAuthor);
      }
      if (!found) found = pickCoverFromVolumeInfo(data.items[0].volumeInfo);
    }
  }
  if (!found && safeTitle.length >= 2) {
    const query = safeAuthor.length >= 2 ? `intitle:${safeTitle} inauthor:${safeAuthor}` : `intitle:${safeTitle}`;
    found = await googleTry(query, 15, true);
  }
  if (!found && safeTitle.length >= 2) {
    found = await googleTry(`intitle:${safeTitle}`, 15, true);
  }
  if (!found && safeTitle.length >= 2) {
    found = await googleTry(safeAuthor.length >= 2 ? `${safeTitle} ${safeAuthor}` : safeTitle, 12, false);
  }
  if (!found && safeTitle.length >= 2) {
    found = await openLibrarySearchCover(safeTitle, safeAuthor);
  }

  coverCache.set(cacheKey, found || null);
  return { url: found || null, needsApiKey: false };
}

app.get(
  "/api/health",
  asyncHandler(async (_req, res) => {
    await pool.query("SELECT 1");
    res.json({ ok: true, timestamp: new Date().toISOString() });
  }),
);

app.post(
  "/api/auth/register",
  asyncHandler(async (req, res) => {
    const fullName = String(req.body.fullName ?? req.body.name ?? "").trim();
    const email = normalizeEmail(req.body.email);
    const password = String(req.body.password || "");
    const phoneNumber = String(req.body.phoneNumber || "").trim() || null;
    const address = String(req.body.address || "").trim() || null;

    if (!fullName) return res.status(400).json({ error: "Ad soyad zorunlu" });
    if (!email || !email.includes("@")) return res.status(400).json({ error: "Gecerli e-posta girin" });
    if (password.length < 8) return res.status(400).json({ error: "Sifre en az 8 karakter olmali" });

    const existing = await pool.query(
      "SELECT id FROM kullanicilar WHERE LOWER(email) = $1 LIMIT 1",
      [email],
    );
    if (existing.rows.length > 0) {
      return res.status(409).json({ error: "Bu e-posta ile kayitli kullanici var" });
    }

    const passwordHash = hashPassword(password);
    const insert = await pool.query(
      `
        INSERT INTO kullanicilar (full_name, email, password_hash, phone_number, address, role, is_active)
        VALUES ($1, $2, $3, $4, $5, 'uye', true)
        RETURNING id, full_name, email, role, is_active
      `,
      [fullName, email, passwordHash, phoneNumber, address],
    );

    return res.status(201).json(toAuthResponse(insert.rows[0]));
  }),
);

app.post(
  "/api/auth/login",
  asyncHandler(async (req, res) => {
    const email = normalizeEmail(req.body.email);
    const password = String(req.body.password || "");
    if (!email || !password) {
      return res.status(400).json({ error: "E-posta ve sifre zorunlu" });
    }

    const result = await pool.query(
      `
        SELECT id, full_name, email, role, is_active, password_hash
        FROM kullanicilar
        WHERE LOWER(email) = $1
        LIMIT 1
      `,
      [email],
    );
    if (!result.rows.length) {
      return res.status(401).json({ error: "E-posta veya sifre hatali" });
    }
    const user = result.rows[0];
    if (!user.is_active) {
      return res.status(403).json({ error: "Hesap pasif durumda" });
    }
    let passwordOk = verifyPassword(password, user.password_hash);
    if (!passwordOk && user.password_hash === password) {
      passwordOk = true;
      await pool.query("UPDATE kullanicilar SET password_hash = $2 WHERE id = $1", [
        user.id,
        hashPassword(password),
      ]);
    }
    if (!passwordOk) {
      return res.status(401).json({ error: "E-posta veya sifre hatali" });
    }

    return res.json(toAuthResponse(user));
  }),
);

app.get(
  "/api/auth/me",
  authRequired,
  asyncHandler(async (req, res) => {
    const result = await pool.query(
      "SELECT id, full_name, email, role, is_active FROM kullanicilar WHERE id = $1 LIMIT 1",
      [req.auth.sub],
    );
    if (!result.rows.length) return res.status(401).json({ error: "Kullanici bulunamadi" });
    res.json({
      id: String(result.rows[0].id),
      fullName: result.rows[0].full_name,
      email: result.rows[0].email,
      role: result.rows[0].role,
      isActive: result.rows[0].is_active,
    });
  }),
);

app.get(
  "/api/kapak/lookup",
  asyncHandler(async (req, res) => {
    const isbnDigits = String(req.query.isbn || "").replace(/\D/g, "");
    const title = typeof req.query.baslik === "string" ? req.query.baslik : "";
    const author = typeof req.query.yazar === "string" ? req.query.yazar : "";
    if (isbnDigits.length < 10 && String(title).trim().length < 2) {
      return res.json({
        url: null,
        needsApiKey: !process.env.GOOGLE_BOOKS_API_KEY?.trim(),
      });
    }
    const output = await resolveCoverFromGoogle({ isbnDigits, title, author });
    return res.json(output);
  }),
);

app.get(
  "/api/kapak/:isbn",
  asyncHandler(async (req, res) => {
    const digits = String(req.params.isbn || "").replace(/\D/g, "");
    if (digits.length < 10) {
      return res.json({ url: null, needsApiKey: !process.env.GOOGLE_BOOKS_API_KEY?.trim() });
    }
    if (!process.env.GOOGLE_BOOKS_API_KEY?.trim()) {
      return res.json({ url: null, needsApiKey: true });
    }
    const output = await resolveCoverFromGoogle({
      isbnDigits: digits,
      title: "",
      author: "",
    });
    return res.json({ ...output, needsApiKey: false });
  }),
);

app.get(
  "/api/kitaplar",
  asyncHandler(async (req, res) => {
    const limit = parsePositiveInt(req.query.limit, 50, 1, 200);
    const offset = parsePositiveInt(req.query.offset, 0, 0, 1000000);
    const result = await pool.query(
      `
        SELECT *
        FROM kitaplar
        ORDER BY kitap_adi NULLS LAST, isbn
        LIMIT $1 OFFSET $2
      `,
      [limit, offset],
    );
    res.json(result.rows);
  }),
);

app.get(
  "/api/kitaplar/ara",
  asyncHandler(async (req, res) => {
    const query = typeof req.query.q === "string" ? req.query.q.trim() : "";
    const limit = parsePositiveInt(req.query.limit, 40, 1, 200);
    if (!query) {
      const fallback = await pool.query(
        `
          SELECT *
          FROM kitaplar
          ORDER BY kitap_adi NULLS LAST, isbn
          LIMIT $1
        `,
        [limit],
      );
      return res.json(fallback.rows);
    }
    const search = `%${query}%`;
    const result = await pool.query(
      `
        SELECT *
        FROM kitaplar
        WHERE
          isbn ILIKE $1 OR
          kitap_adi ILIKE $1 OR
          yazar ILIKE $1 OR
          COALESCE(ilgili_kategoriler, '') ILIKE $1 OR
          COALESCE(kategoriler, '') ILIKE $1
        ORDER BY kitap_adi NULLS LAST, isbn
        LIMIT $2
      `,
      [search, limit],
    );
    return res.json(result.rows);
  }),
);

app.get(
  "/api/kitaplar/:isbn/stok",
  asyncHandler(async (req, res) => {
    const isbn = normalizeIsbn(req.params.isbn);
    if (!isbn) return res.status(400).json({ error: "Gecerli ISBN gerekli" });
    const result = await pool.query(
      "SELECT isbn, stok_adedi FROM kitaplar WHERE isbn = $1 LIMIT 1",
      [isbn],
    );
    if (!result.rows.length) return res.status(404).json({ error: "Kitap bulunamadi" });
    const copies = Number(result.rows[0].stok_adedi) || 0;
    return res.json({
      isbn: result.rows[0].isbn,
      inStock: copies > 0,
      copies,
    });
  }),
);

app.get(
  "/api/kitaplar/:isbn",
  asyncHandler(async (req, res) => {
    const isbn = normalizeIsbn(req.params.isbn);
    const result = await pool.query("SELECT * FROM kitaplar WHERE isbn = $1 LIMIT 1", [isbn]);
    if (!result.rows.length) return res.status(404).json({ mesaj: "Kitap bulunamadi" });
    res.json(result.rows[0]);
  }),
);

app.post(
  "/api/odunc",
  asyncHandler(async (req, res) => {
    const rawIsbn = normalizeIsbn(req.body.kitapIsbn || req.body.isbn);
    if (!rawIsbn) return res.status(400).json({ error: "kitapIsbn zorunlu" });

    let userId = req.auth?.sub || req.body.userId || req.body.user_id;
    if (!userId && ALLOW_GUEST_BORROW) {
      const firstUser = await pool.query(
        "SELECT id FROM kullanicilar WHERE is_active = true ORDER BY id ASC LIMIT 1",
      );
      if (firstUser.rows.length) userId = String(firstUser.rows[0].id);
    }
    if (!userId) {
      return res.status(401).json({ error: "Kullanici bilgisi gerekli (login veya userId)" });
    }

    const dueInput = req.body.dueDate || req.body.due_date;
    const dueDate =
      asIsoDate(dueInput) || asIsoDate(new Date(Date.now() + DEFAULT_BORROW_DAYS * 24 * 60 * 60 * 1000));
    if (dueDate < asIsoDate(new Date())) {
      return res.status(400).json({ error: "dueDate bugunden once olamaz" });
    }

    const client = await pool.connect();
    try {
      await client.query("BEGIN");

      const userResult = await client.query(
        "SELECT id, full_name, is_active FROM kullanicilar WHERE id = $1 FOR UPDATE",
        [userId],
      );
      if (!userResult.rows.length) {
        await client.query("ROLLBACK");
        return res.status(404).json({ error: "Kullanici bulunamadi" });
      }
      if (!userResult.rows[0].is_active) {
        await client.query("ROLLBACK");
        return res.status(403).json({ error: "Pasif kullanici odunc alamaz" });
      }

      const bookResult = await client.query(
        "SELECT isbn, kitap_adi, stok_adedi FROM kitaplar WHERE isbn = $1 FOR UPDATE",
        [rawIsbn],
      );
      if (!bookResult.rows.length) {
        await client.query("ROLLBACK");
        return res.status(404).json({ error: "Kitap bulunamadi" });
      }
      const copies = Number(bookResult.rows[0].stok_adedi) || 0;
      if (copies <= 0) {
        await client.query("ROLLBACK");
        return res.status(409).json({ error: "Kitap stokta yok" });
      }

      const insertLoan = await client.query(
        `
          INSERT INTO odunc_islemleri (user_id, kitap_isbn, borrow_date, due_date, status, fine_amount)
          VALUES ($1, $2, CURRENT_DATE, $3::date, 'oduncte', 0)
          RETURNING id, user_id, kitap_isbn, borrow_date, due_date, return_date, status
        `,
        [userId, rawIsbn, dueDate],
      );

      await client.query("UPDATE kitaplar SET stok_adedi = stok_adedi - 1 WHERE isbn = $1", [rawIsbn]);
      await client.query("COMMIT");

      return res.status(201).json({
        message: "Odunc islemi olusturuldu",
        transaction: {
          id: String(insertLoan.rows[0].id),
          userId: String(insertLoan.rows[0].user_id),
          bookIsbn: insertLoan.rows[0].kitap_isbn,
          borrowDate: asIsoDate(insertLoan.rows[0].borrow_date),
          dueDate: asIsoDate(insertLoan.rows[0].due_date),
          status: "borrowed",
        },
        stock: {
          inStock: copies - 1 > 0,
          copies: Math.max(0, copies - 1),
        },
      });
    } catch (error) {
      try {
        await client.query("ROLLBACK");
      } catch {
        // ignore rollback error
      }
      throw error;
    } finally {
      client.release();
    }
  }),
);

app.get(
  "/api/admin/dashboard",
  authRequired,
  adminRequired,
  asyncHandler(async (_req, res) => {
    await syncOverdueLoans();

    const [booksCount, activeLoansCount, overdueCount, weeklyRows] = await Promise.all([
      pool.query("SELECT COUNT(*)::int AS total FROM kitaplar"),
      pool.query(
        `
          SELECT COUNT(*)::int AS total
          FROM odunc_islemleri
          WHERE return_date IS NULL AND status IN ('oduncte', 'gecikti')
        `,
      ),
      pool.query(
        `
          SELECT COUNT(*)::int AS total
          FROM odunc_islemleri
          WHERE return_date IS NULL AND due_date < CURRENT_DATE
        `,
      ),
      pool.query(
        `
          SELECT day::date AS gun, COALESCE(COUNT(o.id), 0)::int AS adet
          FROM generate_series(CURRENT_DATE - INTERVAL '6 days', CURRENT_DATE, INTERVAL '1 day') day
          LEFT JOIN odunc_islemleri o ON o.borrow_date = day::date
          GROUP BY day
          ORDER BY day
        `,
      ),
    ]);

    const formatter = new Intl.DateTimeFormat("tr-TR", { weekday: "short" });
    const weekData = weeklyRows.rows.map((row) => ({
      label: formatter.format(new Date(row.gun)),
      v: Number(row.adet) || 0,
    }));

    return res.json({
      totalBooks: Number(booksCount.rows[0].total) || 0,
      activeBorrows: Number(activeLoansCount.rows[0].total) || 0,
      overdue: Number(overdueCount.rows[0].total) || 0,
      weekData,
    });
  }),
);

app.get(
  "/api/admin/users",
  authRequired,
  adminRequired,
  asyncHandler(async (req, res) => {
    const query = String(req.query.q || "").trim();
    const limit = parsePositiveInt(req.query.limit, 100, 1, 500);
    const offset = parsePositiveInt(req.query.offset, 0, 0, 1000000);

    let result;
    if (query) {
      const search = `%${query}%`;
      result = await pool.query(
        `
          SELECT id, full_name, email, role, is_active, created_at
          FROM kullanicilar
          WHERE full_name ILIKE $1 OR email ILIKE $1
          ORDER BY created_at DESC, id DESC
          LIMIT $2 OFFSET $3
        `,
        [search, limit, offset],
      );
    } else {
      result = await pool.query(
        `
          SELECT id, full_name, email, role, is_active, created_at
          FROM kullanicilar
          ORDER BY created_at DESC, id DESC
          LIMIT $1 OFFSET $2
        `,
        [limit, offset],
      );
    }

    return res.json(result.rows.map(toDisplayUser));
  }),
);

app.patch(
  "/api/admin/users/:id/status",
  authRequired,
  adminRequired,
  asyncHandler(async (req, res) => {
    const id = parsePositiveInt(req.params.id, NaN, 1);
    if (!Number.isFinite(id)) return res.status(400).json({ error: "Gecersiz kullanici id" });

    const current = await pool.query(
      "SELECT id, full_name, email, role, is_active, created_at FROM kullanicilar WHERE id = $1 LIMIT 1",
      [id],
    );
    if (!current.rows.length) return res.status(404).json({ error: "Kullanici bulunamadi" });

    let nextActive = current.rows[0].is_active;
    if (typeof req.body.isActive === "boolean") {
      nextActive = req.body.isActive;
    } else if (typeof req.body.status === "string") {
      nextActive = req.body.status.toLowerCase() === "active";
    } else {
      nextActive = !current.rows[0].is_active;
    }

    const updated = await pool.query(
      `
        UPDATE kullanicilar
        SET is_active = $2
        WHERE id = $1
        RETURNING id, full_name, email, role, is_active, created_at
      `,
      [id, nextActive],
    );

    return res.json(toDisplayUser(updated.rows[0]));
  }),
);

app.post(
  "/api/admin/users/:id/reset-password",
  authRequired,
  adminRequired,
  asyncHandler(async (req, res) => {
    const id = parsePositiveInt(req.params.id, NaN, 1);
    if (!Number.isFinite(id)) return res.status(400).json({ error: "Gecersiz kullanici id" });

    const userResult = await pool.query("SELECT id, email FROM kullanicilar WHERE id = $1 LIMIT 1", [id]);
    if (!userResult.rows.length) return res.status(404).json({ error: "Kullanici bulunamadi" });

    const temporaryPassword = crypto.randomBytes(8).toString("base64url");
    const passwordHash = hashPassword(temporaryPassword);
    await pool.query("UPDATE kullanicilar SET password_hash = $2 WHERE id = $1", [id, passwordHash]);

    return res.json({
      message: "Gecici sifre olusturuldu",
      email: userResult.rows[0].email,
      temporaryPassword,
    });
  }),
);

app.get(
  "/api/admin/transactions",
  authRequired,
  adminRequired,
  asyncHandler(async (req, res) => {
    await syncOverdueLoans();
    const mode = String(req.query.status || "active").trim().toLowerCase();
    const limit = parsePositiveInt(req.query.limit, 200, 1, 500);

    let whereSql = "WHERE 1=1";
    if (mode === "active") {
      whereSql += " AND o.return_date IS NULL AND o.status IN ('oduncte', 'gecikti')";
    } else if (mode === "borrowed") {
      whereSql += " AND o.return_date IS NULL AND o.status = 'oduncte'";
    } else if (mode === "overdue") {
      whereSql += " AND o.return_date IS NULL AND (o.status = 'gecikti' OR o.due_date < CURRENT_DATE)";
    } else if (mode === "returned") {
      whereSql += " AND o.status = 'iade_edildi'";
    } else if (mode === "all") {
      whereSql += "";
    } else {
      return res.status(400).json({ error: "Gecersiz status filtresi" });
    }

    const query = `
      SELECT
        o.id,
        o.user_id,
        o.kitap_isbn,
        o.borrow_date,
        o.due_date,
        o.return_date,
        o.status,
        u.full_name AS user_name,
        k.kitap_adi AS book_title
      FROM odunc_islemleri o
      INNER JOIN kullanicilar u ON u.id = o.user_id
      INNER JOIN kitaplar k ON k.isbn = o.kitap_isbn
      ${whereSql}
      ORDER BY o.borrow_date DESC, o.id DESC
      LIMIT $1
    `;
    const result = await pool.query(query, [limit]);
    return res.json(result.rows.map(toDisplayTransaction));
  }),
);

app.post(
  "/api/admin/transactions/:id/return",
  authRequired,
  adminRequired,
  asyncHandler(async (req, res) => {
    const id = parsePositiveInt(req.params.id, NaN, 1);
    if (!Number.isFinite(id)) return res.status(400).json({ error: "Gecersiz islem id" });

    const client = await pool.connect();
    try {
      await client.query("BEGIN");

      const loanResult = await client.query(
        `
          SELECT id, user_id, kitap_isbn, borrow_date, due_date, return_date, status
          FROM odunc_islemleri
          WHERE id = $1
          FOR UPDATE
        `,
        [id],
      );
      if (!loanResult.rows.length) {
        await client.query("ROLLBACK");
        return res.status(404).json({ error: "Odunc islemi bulunamadi" });
      }

      const loan = loanResult.rows[0];
      if (loan.return_date || loan.status === "iade_edildi") {
        await client.query("COMMIT");
        return res.json({
          message: "Islem zaten iade edilmis",
          transaction: {
            id: String(loan.id),
            userId: String(loan.user_id),
            bookIsbn: loan.kitap_isbn,
            borrowDate: asIsoDate(loan.borrow_date),
            dueDate: asIsoDate(loan.due_date),
            returnDate: asIsoDate(loan.return_date),
            status: "returned",
          },
        });
      }

      const updatedLoan = await client.query(
        `
          UPDATE odunc_islemleri
          SET return_date = CURRENT_DATE, status = 'iade_edildi'
          WHERE id = $1
          RETURNING id, user_id, kitap_isbn, borrow_date, due_date, return_date, status
        `,
        [id],
      );

      const stockUpdate = await client.query(
        `
          UPDATE kitaplar
          SET stok_adedi = COALESCE(stok_adedi, 0) + 1
          WHERE isbn = $1
          RETURNING isbn, stok_adedi
        `,
        [loan.kitap_isbn],
      );

      await client.query("COMMIT");

      return res.json({
        message: "Kitap teslim alindi ve stok guncellendi",
        transaction: {
          id: String(updatedLoan.rows[0].id),
          userId: String(updatedLoan.rows[0].user_id),
          bookIsbn: updatedLoan.rows[0].kitap_isbn,
          borrowDate: asIsoDate(updatedLoan.rows[0].borrow_date),
          dueDate: asIsoDate(updatedLoan.rows[0].due_date),
          returnDate: asIsoDate(updatedLoan.rows[0].return_date),
          status: "returned",
        },
        stock: {
          isbn: stockUpdate.rows[0]?.isbn || loan.kitap_isbn,
          copies: Number(stockUpdate.rows[0]?.stok_adedi || 0),
        },
      });
    } catch (error) {
      try {
        await client.query("ROLLBACK");
      } catch {
        // ignore rollback error
      }
      throw error;
    } finally {
      client.release();
    }
  }),
);

app.use((_req, res) => {
  res.status(404).json({ error: "Rota bulunamadi" });
});

app.use((error, _req, res, _next) => {
  console.error("[api]", error);
  if (error?.code === "23505") {
    return res.status(409).json({ error: "Kayit zaten mevcut" });
  }
  if (error?.code === "22P02") {
    return res.status(400).json({ error: "Gecersiz parametre" });
  }
  return res.status(500).json({ error: "Sunucu hatasi", detail: error?.message || "Bilinmeyen hata" });
});

app.listen(PORT, () => {
  console.log(`Backend sunucusu http://localhost:${PORT} adresinde calisiyor.`);
  if (!process.env.GOOGLE_BOOKS_API_KEY?.trim()) {
    console.warn("[kapak] GOOGLE_BOOKS_API_KEY yok, otomatik kapak endpointi bos donebilir.");
  }
});
