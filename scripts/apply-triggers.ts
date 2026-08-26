import fs from "fs";
import path from "path";
import { Pool } from "pg";
import dotenv from "dotenv";

dotenv.config();

async function applyTriggers() {
  const connectionString = process.env.DATABASE_URL;
  if (!connectionString) {
    console.error("❌ DATABASE_URL is not defined in environment.");
    process.exit(1);
  }

  const pool = new Pool({ connectionString });
  const sqlFilePath = path.join(__dirname, "sync_invoice_payment_trigger.sql");

  try {
    console.log("🔄 Reading SQL script from:", sqlFilePath);
    const sql = fs.readFileSync(sqlFilePath, "utf-8");

    console.log("⚡ Executing database trigger and reconciliation script...");
    await pool.query(sql);

    console.log(
      "✅ Success! Database trigger `trg_sync_invoice_totals` created and invoice balances reconciled.",
    );
  } catch (error) {
    console.error("❌ Error applying SQL triggers:", error);
    process.exit(1);
  } finally {
    await pool.end();
  }
}

applyTriggers();
