const path = require("path");
require("dotenv").config({ path: path.join(__dirname, "..", ".env") });
const { Pool } = require("pg");

function createPool() {
  const cs = (process.env.DATABASE_URL || process.env.SUPABASE_DB_URL || "").trim();
  if (cs) return new Pool({ connectionString: cs, ssl: { rejectUnauthorized: false } });
  return new Pool({
    user: process.env.PGUSER || "postgres",
    password: process.env.PGPASSWORD || "123456",
    host: process.env.PGHOST || "localhost",
    port: Number(process.env.PGPORT) || 5432,
    database: process.env.PGDATABASE || "KutuphaneOtomasyon",
  });
}

async function main() {
  const pool = createPool();
  const dup = await pool.query(`
    SELECT isbn, COUNT(*)::int AS c
    FROM kitaplar
    GROUP BY isbn
    HAVING COUNT(*) > 1
    ORDER BY c DESC, isbn
    LIMIT 10
  `);
  console.log("duplicate_isbn_examples:", JSON.stringify(dup.rows, null, 2));

  const mapped = await pool.query(`
    SELECT isbn, kitap_adi, kapak_url
    FROM kitaplar
    WHERE kapak_url LIKE '/covers/%'
    ORDER BY isbn
    LIMIT 30
  `);
  console.log("mapped_examples:", JSON.stringify(mapped.rows, null, 2));

  await pool.end();
}

main().catch((e) => {
  console.error(e.message);
  process.exit(1);
});
