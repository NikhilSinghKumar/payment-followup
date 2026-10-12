import { Pool } from "pg";
import dotenv from "dotenv";

dotenv.config();

const connectionString = process.env.DATABASE_URL;

if (!connectionString) {
  console.error("DATABASE_URL not set");
  process.exit(1);
}

const pool = new Pool({
  connectionString,
  ssl: { rejectUnauthorized: false },
  connectionTimeoutMillis: 10000,
});

async function main() {
  console.log("Connecting to Postgres...");
  const client = await pool.connect();
  console.log("Connected successfully!");

  try {
    console.log("Adding missing columns to invoices table...");
    await client.query(`
      ALTER TABLE invoices
        ADD COLUMN IF NOT EXISTS tds_deducted_amount numeric(12, 2) DEFAULT 0,
        ADD COLUMN IF NOT EXISTS is_tds_verified boolean NOT NULL DEFAULT false,
        ADD COLUMN IF NOT EXISTS tds_verified_at timestamp with time zone,
        ADD COLUMN IF NOT EXISTS tds_notes text;
    `);
    console.log("Columns added successfully!");

    console.log("Backfilling existing invoices...");
    await client.query(`
      UPDATE invoices
      SET tds_deducted_amount = COALESCE(NULLIF(tds_deducted, 0), tds_amount, 0)
      WHERE (tds_deducted_amount IS NULL OR tds_deducted_amount = 0) AND tds_amount > 0;
    `);

    await client.query(`
      UPDATE invoices
      SET is_tds_verified = true,
          tds_verified_at = NOW()
      WHERE (is_tds_verified IS NULL OR is_tds_verified = false) AND recognized_tds > 0;
    `);
    console.log("Backfill completed!");

    // Verify columns exist now
    const res = await client.query(`
      SELECT column_name, data_type 
      FROM information_schema.columns 
      WHERE table_name = 'invoices' AND column_name IN ('tds_deducted_amount', 'is_tds_verified', 'tds_verified_at', 'tds_notes');
    `);
    console.log("Verified columns in DB:", res.rows);
  } finally {
    client.release();
    await pool.end();
  }
}

main()
  .then(() => {
    console.log("Done!");
    process.exit(0);
  })
  .catch((err) => {
    console.error("Migration error:", err);
    process.exit(1);
  });
