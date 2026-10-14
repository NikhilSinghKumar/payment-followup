import { NextResponse } from "next/server";
import { generateClientLedgerPdf } from "@/lib/pdf/generateLedgerPdf";

export const dynamic = "force-dynamic";
export const revalidate = 0;

/**
 * GET /api/client-ledger-pdf?clientId=123&date=YYYY-MM-DD&download=1
 * Generates and streams in-memory Ledger Account Statement PDF for a client
 */
export async function GET(request) {
  try {
    const { searchParams } = new URL(request.url);
    const clientId = searchParams.get("clientId");
    const isDownload = searchParams.get("download") === "1";
    const dateParam =
      searchParams.get("date") ||
      searchParams.get("statementDate") ||
      searchParams.get("asOfDate");

    if (!clientId || isNaN(Number(clientId))) {
      return NextResponse.json(
        { error: "Valid clientId parameter is required" },
        { status: 400 },
      );
    }

    const { buffer, filename } = await generateClientLedgerPdf({
      clientId: Number(clientId),
      statementDate: dateParam || new Date(),
    });

    const disposition = isDownload
      ? `attachment; filename="${filename}"`
      : `inline; filename="${filename}"`;

    return new Response(buffer, {
      status: 200,
      headers: {
        "Content-Type": "application/pdf",
        "Content-Disposition": disposition,
        "Content-Length": String(buffer.length),
        "Cache-Control":
          "no-store, no-cache, must-revalidate, proxy-revalidate, max-age=0",
        Pragma: "no-cache",
        Expires: "0",
      },
    });
  } catch (error) {
    console.error("[client-ledger-pdf GET Error]:", error);
    return NextResponse.json(
      { error: error?.message || "Failed to generate ledger PDF" },
      { status: 500 },
    );
  }
}
