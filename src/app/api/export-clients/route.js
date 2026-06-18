import { db } from "@/db";
import { clients } from "@/db/schema";
import { isNull } from "drizzle-orm";

export async function GET() {
  const data = await db.select().from(clients).where(isNull(clients.deletedAt));

  // Header row
  const rows = [["company_name", "company_code"]];

  // Data rows
  data.forEach((client) => {
    rows.push([client.companyName ?? "", client.companyCode ?? ""]);
  });

  // Convert to CSV
  const csv = rows
    .map((row) =>
      row.map((value) => `"${String(value).replace(/"/g, '""')}"`).join(","),
    )
    .join("\n");

  return new Response(csv, {
    headers: {
      "Content-Type": "text/csv",
      "Content-Disposition": 'attachment; filename="clients.csv"',
    },
  });
}
