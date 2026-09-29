import { NextResponse } from "next/server";
import { generateInvoiceBillPdf } from "@/lib/pdf/generateBillPdf";

/**
 * GET /api/invoice-bill-pdf?invoiceId=123&download=1
 * Generates and streams in-memory Bill / Tax Invoice PDF for an invoice
 */
export async function GET(request) {
  try {
    const { searchParams } = new URL(request.url);
    const invoiceId = searchParams.get("invoiceId");
    const isDownload = searchParams.get("download") === "1";

    if (!invoiceId || isNaN(Number(invoiceId))) {
      return NextResponse.json(
        { error: "Valid invoiceId parameter is required" },
        { status: 400 },
      );
    }

    const { buffer, filename } = await generateInvoiceBillPdf({
      invoiceId: Number(invoiceId),
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
        "Cache-Control": "no-store, max-age=0",
      },
    });
  } catch (error) {
    console.error("[invoice-bill-pdf GET Error]:", error);
    return NextResponse.json(
      { error: error?.message || "Failed to generate bill PDF" },
      { status: 500 },
    );
  }
}
