import { getCurrentUser } from "@/lib/auth/auth";
import { getPayments } from "@/app/actions/payment";

export const dynamic = "force-dynamic";

export async function GET(req) {
  try {
    const currentUser = await getCurrentUser();

    if (!currentUser?.user || !currentUser?.companyId) {
      return new Response("Unauthorized", { status: 401 });
    }

    const { searchParams } = new URL(req.url);
    const scope = searchParams.get("scope") || "";
    const isAll = scope === "all" || searchParams.get("all") === "true";

    const query = isAll ? "" : searchParams.get("q") || "";
    const date = isAll ? "" : searchParams.get("date") || "";
    const startDate = isAll ? "" : searchParams.get("startDate") || "";
    const endDate = isAll ? "" : searchParams.get("endDate") || "";
    const clientId = searchParams.get("clientId") || null;

    const paymentList = await getPayments({
      query,
      date,
      startDate,
      endDate,
      clientId,
      scope: isAll ? "all" : "",
    });

    // CSV Header row
    const headers = [
      "Payment ID",
      "Client Name",
      "Company Code",
      "Sub-Client Name",
      "Sub-Client Code",
      "Payment Date",
      "Receipt Number",
      "Amount",
      "Payment Method",
      "Reference No",
      "Allocated Amount",
      "Unallocated / On Account",
      "Allocation Status",
      "Invoices",
      "Allocation Breakdown",
      "Payment Type",
      "Notes",
      "Created At",
    ];

    const rows = [headers];

    for (const payment of paymentList) {
      const clientName = payment.client?.companyName ?? "";
      const companyCode = payment.client?.companyCode ?? "";
      const subClientName = payment.subClient?.companyName ?? "";
      const subClientCode = payment.subClient?.companyCode ?? "";

      let formattedDate = "";
      if (payment.paymentDate) {
        try {
          const d = new Date(payment.paymentDate);
          if (!isNaN(d.getTime())) {
            formattedDate = d.toISOString().slice(0, 10);
          }
        } catch {
          formattedDate = String(payment.paymentDate);
        }
      }

      const receiptNumber = payment.receiptNumber ?? "";
      const amount = Number(payment.amount || 0).toFixed(2);
      const method = payment.method ? payment.method.toUpperCase() : "";
      const reference = payment.reference ?? "";

      const allocatedAmount = Number(payment.allocatedAmount || 0).toFixed(2);
      const unallocatedAmount = Number(payment.unallocatedAmount || 0).toFixed(
        2,
      );

      const isCredit =
        Boolean(payment.isOpeningBalance) ||
        (typeof payment.notes === "string" &&
          /credit|advance|surplus/i.test(payment.notes));

      let allocationStatus = "Fully Allocated";
      if (Number(payment.unallocatedAmount || 0) > 0.001) {
        if (Number(payment.allocatedAmount || 0) > 0.001) {
          allocationStatus = isCredit
            ? "Settled + Credit Surplus"
            : "Partially Allocated";
        } else {
          allocationStatus = isCredit
            ? "Credit / Advance (No Due)"
            : "Unallocated (On Account)";
        }
      }

      const invoiceList = (payment.allocations || [])
        .map((a) => a.invoice?.invoiceNumber)
        .filter(Boolean)
        .join(", ");

      const allocationDetails = (payment.allocations || [])
        .map(
          (a) =>
            `${a.invoice?.invoiceNumber || "Invoice"}: ${Number(a.allocatedAmount || 0).toFixed(2)}`,
        )
        .join("; ");

      const paymentType = payment.isOpeningBalance
        ? "Opening Balance (Credit)"
        : isCredit
          ? "Advance / Credit Payment"
          : "Regular Payment";

      const notes = payment.notes ?? "";

      let createdAtStr = "";
      if (payment.createdAt) {
        try {
          const cd = new Date(payment.createdAt);
          if (!isNaN(cd.getTime())) {
            createdAtStr = cd.toISOString().slice(0, 10);
          }
        } catch {
          createdAtStr = String(payment.createdAt);
        }
      }

      rows.push([
        payment.id ?? "",
        clientName,
        companyCode,
        subClientName,
        subClientCode,
        formattedDate,
        receiptNumber,
        amount,
        method,
        reference,
        allocatedAmount,
        unallocatedAmount,
        allocationStatus,
        invoiceList,
        allocationDetails,
        paymentType,
        notes,
        createdAtStr,
      ]);
    }

    // Convert rows to RFC 4180 CSV
    const csvContent = rows
      .map((row) =>
        row
          .map((cell) => `"${String(cell ?? "").replace(/"/g, '""')}"`)
          .join(","),
      )
      .join("\r\n");

    const todayStr = new Date().toISOString().slice(0, 10);
    const filename = isAll
      ? `all-payments-export-${todayStr}.csv`
      : query || date || startDate || endDate
        ? `payments-filtered-export-${todayStr}.csv`
        : `payments-export-${todayStr}.csv`;

    return new Response("\uFEFF" + csvContent, {
      headers: {
        "Content-Type": "text/csv; charset=utf-8",
        "Content-Disposition": `attachment; filename="${filename}"`,
        "Cache-Control": "no-store, no-cache, must-revalidate",
      },
    });
  } catch (error) {
    console.error("Export payments error:", error);
    return new Response(
      JSON.stringify({ error: "Failed to export payments" }),
      {
        status: 500,
        headers: { "Content-Type": "application/json" },
      },
    );
  }
}
