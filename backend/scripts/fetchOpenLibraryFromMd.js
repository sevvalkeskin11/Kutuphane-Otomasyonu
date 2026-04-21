const fs = require("fs");
const path = require("path");

const MD_PATH =
  process.env.MD_PATH || path.join(__dirname, "..", "kitaplar.md");
const OUT_DIR = path.join(__dirname, "..", "public", "covers");
const DELAY_MS = Number(process.env.FETCH_COVER_DELAY_MS || 120);
const MAX_BYTES = 5 * 1024 * 1024;
const MIN_BYTES = Number(process.env.FETCH_MIN_BYTES || 800);
const REQUEST_TIMEOUT_MS = Number(process.env.FETCH_REQUEST_TIMEOUT_MS || 9000);

function sleep(ms) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

function parseIsbnsFromMd(text) {
  return text
    .split(/\r?\n/)
    .map((s) => s.trim())
    .filter((s) => /^\d{13}$|^\d{9}[\dX]$/i.test(s))
    .map((s) => s.toUpperCase());
}

function openLibraryCandidates(isbn) {
  const compact = String(isbn).replace(/[\s-]/g, "").toUpperCase();
  return [
    `https://covers.openlibrary.org/b/isbn/${compact}-L.jpg`,
    `https://covers.openlibrary.org/b/isbn/${compact}-M.jpg`,
    `https://covers.openlibrary.org/b/isbn/${compact}-S.jpg`,
  ];
}

function extFromContentType(contentType) {
  if (!contentType) return ".jpg";
  if (contentType.includes("png")) return ".png";
  if (contentType.includes("webp")) return ".webp";
  if (contentType.includes("gif")) return ".gif";
  return ".jpg";
}

async function downloadImage(url) {
  const ctrl = new AbortController();
  const timer = setTimeout(() => ctrl.abort(), REQUEST_TIMEOUT_MS);
  let res;
  try {
    res = await fetch(url, {
      headers: { "User-Agent": "Kutuphane-OpenLibraryFetcher/1.0" },
      redirect: "follow",
      signal: ctrl.signal,
    });
  } finally {
    clearTimeout(timer);
  }
  if (!res.ok) return null;
  const buf = Buffer.from(await res.arrayBuffer());
  if (buf.length < MIN_BYTES || buf.length > MAX_BYTES) return null;
  const ct = (res.headers.get("content-type") || "").toLowerCase();
  if (!ct.startsWith("image/")) return null;
  return { buf, ext: extFromContentType(ct) };
}

async function main() {
  if (!fs.existsSync(MD_PATH)) {
    throw new Error(`Dosya bulunamadı: ${MD_PATH}`);
  }
  if (!fs.existsSync(OUT_DIR)) {
    fs.mkdirSync(OUT_DIR, { recursive: true });
  }

  const raw = fs.readFileSync(MD_PATH, "utf8");
  const parsed = parseIsbnsFromMd(raw);
  const isbns = [...new Set(parsed)];

  let ok = 0;
  let miss = 0;
  let skip = 0;

  for (const isbn of isbns) {
    const existing = [".jpg", ".jpeg", ".png", ".webp", ".gif"].some((ext) =>
      fs.existsSync(path.join(OUT_DIR, `${isbn}${ext}`)),
    );
    if (existing) {
      skip++;
      continue;
    }

    let saved = false;
    for (const url of openLibraryCandidates(isbn)) {
      try {
        const downloaded = await downloadImage(url);
        if (downloaded) {
          fs.writeFileSync(
            path.join(OUT_DIR, `${isbn}${downloaded.ext}`),
            downloaded.buf,
          );
          ok++;
          saved = true;
          break;
        }
      } catch {
        // try next candidate
      }
      await sleep(DELAY_MS);
    }

    if (!saved) miss++;
    if ((ok + miss + skip) % 50 === 0) {
      console.log(`ilerleme: ${ok + miss + skip}/${isbns.length}`);
    }
    await sleep(DELAY_MS);
  }

  const report = [
    "# Open Library indirme raporu",
    "",
    `- kaynak: \`${MD_PATH}\``,
    `- toplam ISBN (benzersiz): ${isbns.length}`,
    `- indirilen: ${ok}`,
    `- zaten vardı (atlandı): ${skip}`,
    `- bulunamadı: ${miss}`,
    "",
  ].join("\n");
  const reportPath = path.join(__dirname, "..", "openlibrary-report.md");
  fs.writeFileSync(reportPath, report, "utf8");

  console.log(report);
  console.log(`Rapor: ${reportPath}`);
}

main().catch((err) => {
  console.error("Hata:", err.message);
  process.exit(1);
});
