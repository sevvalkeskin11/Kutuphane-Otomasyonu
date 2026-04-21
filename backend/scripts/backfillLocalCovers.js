const fs = require("fs");
const path = require("path");
require("dotenv").config({ path: path.join(__dirname, "..", ".env") });
const { Pool } = require("pg");

const COVERS_DIR = path.join(__dirname, "..", "public", "covers");

function createPool() {
  const dbUrl = (
    process.env.DATABASE_URL ||
    process.env.SUPABASE_DB_URL ||
    ""
  ).trim();
  const useSsl =
    process.env.DB_SSL === "false" ? false : { rejectUnauthorized: false };
  if (dbUrl) {
    return new Pool({ connectionString: dbUrl, ssl: useSsl });
  }
  return new Pool({
    user: process.env.PGUSER || "postgres",
    password: process.env.PGPASSWORD || "123456",
    host: process.env.PGHOST || "localhost",
    port: Number(process.env.PGPORT) || 5432,
    database: process.env.PGDATABASE || "KutuphaneOtomasyon",
    ssl: process.env.PGHOST ? useSsl : false,
  });
}

async function main() {
  if (!fs.existsSync(COVERS_DIR)) {
    throw new Error(`Klasor yok: ${COVERS_DIR}`);
  }

  const files = fs
    .readdirSync(COVERS_DIR)
    .filter((f) => /\.(jpg|jpeg|png|webp|gif)$/i.test(f));

  const pool = createPool();
  await pool.query("ALTER TABLE kitaplar ADD COLUMN IF NOT EXISTS kapak_url TEXT");

  let updated = 0;
  for (const f of files) {
    const isbnBase = f.replace(/\.(jpg|jpeg|png|webp|gif)$/i, "");
    const relPath = `/covers/${f}`;
    const r = await pool.query(
      "UPDATE kitaplar SET kapak_url = $1 WHERE regexp_replace(isbn::text, '[^0-9Xx]', '', 'g') ILIKE $2",
      [relPath, isbnBase],
    );
    updated += r.rowCount || 0;
  }

  const countResult = await pool.query(
    "SELECT COUNT(*)::int AS c FROM kitaplar WHERE kapak_url IS NOT NULL AND trim(kapak_url) <> ''",
  );

  await pool.end();
  console.log("covers_files:", files.length);
  console.log("updated_rows:", updated);
  console.log("kapak_url_dolu:", countResult.rows[0].c);
}

main().catch((err) => {
  console.error(err.message);
  process.exit(1);
});
