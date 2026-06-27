import { db } from "@/db";
import { clientSubClients } from "@/db/schema";
import { and, eq, isNull } from "drizzle-orm";

export async function GET(req) {
  try {
    const { searchParams } = new URL(req.url);

    const clientId = Number(searchParams.get("clientId"));

    if (!clientId) {
      return new Response("Client ID is required.", {
        status: 400,
      });
    }

    const subClients = await db
      .select()
      .from(clientSubClients)
      .where(
        and(
          eq(clientSubClients.clientId, clientId),
          isNull(clientSubClients.deletedAt),
        ),
      );

    const rows = [
      ["Company Name", "Company Code", "GST Number", "TDS Applicable"],
    ];

    subClients.forEach((subClient) => {
      rows.push([
        subClient.companyName ?? "",
        subClient.companyCode ?? "",
        subClient.gstNumber ?? "",
        subClient.tdsApplicable ? "Yes" : "No",
      ]);
    });

    const csv = rows
      .map((row) =>
        row.map((value) => `"${String(value).replace(/"/g, '""')}"`).join(","),
      )
      .join("\n");

    return new Response(csv, {
      headers: {
        "Content-Type": "text/csv",
        "Content-Disposition": 'attachment; filename="sub-clients.csv"',
      },
    });
  } catch (err) {
    console.error(err);

    return new Response("Failed to export sub clients.", {
      status: 500,
    });
  }
}
