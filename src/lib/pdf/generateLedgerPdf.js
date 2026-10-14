import { db } from "@/db";
import {
  clients,
  companies,
  invoices,
  payments,
  paymentAllocations,
} from "@/db/schema";
import { and, eq, isNull, asc } from "drizzle-orm";
import { jsPDF } from "jspdf";
import autoTable from "jspdf-autotable";
import fs from "fs";
import path from "path";

/**
 * Format date to DD-MM-YYYY as shown in the Ledger Account standard
 */
function formatLedgerDate(dateVal) {
  if (!dateVal) return "";
  const d = new Date(dateVal);
  if (isNaN(d.getTime())) return String(dateVal);
  const day = String(d.getDate()).padStart(2, "0");
  const month = String(d.getMonth() + 1).padStart(2, "0");
  const year = d.getFullYear();
  return `${day}-${month}-${year}`;
}

/**
 * Generate in-memory Ledger Account Statement PDF for a client
 *
 * @param {Object} params
 * @param {number|string} params.clientId - Client ID
 * @param {number|string} [params.companyId] - Company ID
 * @param {Date|string} [params.statementDate] - Statement Date (defaults to now)
 * @returns {Promise<{ buffer: Buffer, filename: string, summary: Object }>}
 */
export async function generateClientLedgerPdf({
  clientId,
  companyId = null,
  statementDate = new Date(),
}) {
  const parsedClientId = Number(clientId);
  if (!parsedClientId || isNaN(parsedClientId)) {
    throw new Error("Valid clientId is required to generate Ledger Statement");
  }

  const effectiveStatementDate = statementDate
    ? statementDate instanceof Date && !isNaN(statementDate.getTime())
      ? statementDate
      : new Date(statementDate)
    : new Date();
  const validStatementDate = !isNaN(effectiveStatementDate.getTime())
    ? effectiveStatementDate
    : new Date();

  // 1. Fetch Client info
  const clientRows = await db
    .select()
    .from(clients)
    .where(eq(clients.id, parsedClientId))
    .limit(1);

  let client = clientRows[0];
  const activeCompanyId = companyId || client?.companyId || 1;

  if (!client) {
    // If not found, use a fallback client profile so test modes and previews don't crash
    client = {
      id: parsedClientId,
      companyName: "Acme Global Logistics Pvt Ltd",
      companyCode: "ACME",
      companyId: activeCompanyId,
    };
  }

  // 2. Fetch Company info (sender / Pafex)
  let company = null;
  if (activeCompanyId) {
    const compRows = await db
      .select()
      .from(companies)
      .where(eq(companies.id, Number(activeCompanyId)))
      .limit(1);
    company = compRows[0] || null;
  }

  // 3. Fetch Client Invoices (including opening balance invoice and TDS fields)
  const clientInvoices = await db
    .select({
      id: invoices.id,
      invoiceNumber: invoices.invoiceNumber,
      invoiceDate: invoices.invoiceDate,
      invoiceAmount: invoices.invoiceAmount,
      netPayableAmount: invoices.netPayableAmount,
      paidAmount: invoices.paidAmount,
      outstandingAmount: invoices.outstandingAmount,
      isOpeningBalance: invoices.isOpeningBalance,
      isTdsVerified: invoices.isTdsVerified,
      tdsVerifiedAt: invoices.tdsVerifiedAt,
      tdsDeductedAmount: invoices.tdsDeductedAmount,
      tdsAmount: invoices.tdsAmount,
      tdsNotes: invoices.tdsNotes,
    })
    .from(invoices)
    .where(
      and(
        eq(invoices.clientId, parsedClientId),
        isNull(invoices.deletedAt),
        ...(activeCompanyId
          ? [eq(invoices.companyId, Number(activeCompanyId))]
          : []),
      ),
    )
    .orderBy(asc(invoices.invoiceDate), asc(invoices.id));

  // 4. Fetch Client Payments (including opening balance credit payment)
  const clientPayments = await db.query.payments.findMany({
    where: and(
      eq(payments.clientId, parsedClientId),
      isNull(payments.deletedAt),
      eq(payments.isVoided, false),
      ...(activeCompanyId
        ? [eq(payments.companyId, Number(activeCompanyId))]
        : []),
    ),
    with: {
      allocations: {
        where: isNull(paymentAllocations.deletedAt),
        with: {
          invoice: {
            columns: {
              id: true,
              invoiceNumber: true,
              isOpeningBalance: true,
            },
          },
        },
      },
    },
    orderBy: [asc(payments.paymentDate), asc(payments.id)],
  });

  // 5. Build and normalize transaction entries
  const transactions = [];

  // Add Invoices (Debits) and TDS Verified (Credits in separate rows)
  for (const inv of clientInvoices) {
    const isOpening = Boolean(inv.isOpeningBalance);
    const rawGross = Number(inv.invoiceAmount || 0);
    const rawNet = Number(inv.netPayableAmount || 0);
    // In Debit: Opening balance (if exists), Actual Invoice Amount (invoice wise)
    const debitAmount = isOpening
      ? rawNet > 0
        ? rawNet
        : rawGross
      : rawGross > 0
        ? rawGross
        : rawNet;

    transactions.push({
      dateStr: formatLedgerDate(inv.invoiceDate),
      sortDate: inv.invoiceDate ? new Date(inv.invoiceDate).getTime() : 0,
      isOpening,
      invoiceNo: isOpening
        ? "Open Balance"
        : inv.invoiceNumber || `INV-${inv.id}`,
      receiptNo: "",
      debit: debitAmount,
      credit: 0,
      type: isOpening ? "OPENING_DEBIT" : "INVOICE",
    });

    // In Credit: show TDS verified in separate rows
    const isTdsVerified = Boolean(inv.isTdsVerified);
    const tdsDeductedVal = Number(
      inv.tdsDeductedAmount !== undefined &&
        inv.tdsDeductedAmount !== null &&
        Number(inv.tdsDeductedAmount) > 0
        ? inv.tdsDeductedAmount
        : inv.tdsAmount || 0,
    );
    const verifiedTds = isTdsVerified && !isOpening ? tdsDeductedVal : 0;

    if (verifiedTds > 0) {
      const tdsDate = inv.tdsVerifiedAt || inv.invoiceDate;
      const invNum = inv.invoiceNumber || `INV-${inv.id}`;
      transactions.push({
        dateStr: formatLedgerDate(tdsDate),
        // Sort slightly after invoice date on same day
        sortDate: tdsDate ? new Date(tdsDate).getTime() + 1 : 1,
        isOpening: false,
        invoiceNo: "",
        receiptNo: invNum ? `TDS (${invNum})` : "TDS",
        debit: 0,
        credit: verifiedTds,
        type: "TDS_VERIFIED",
      });
    }
  }

  // Add Payments (Credits) - Actual payment received
  for (const p of clientPayments) {
    const isOpening = Boolean(p.isOpeningBalance);
    const amount = Number(p.amount || 0);

    const receiptNumber = isOpening
      ? p.receiptNumber || "Open Balance"
      : p.receiptNumber || p.reference || "-";

    transactions.push({
      dateStr: formatLedgerDate(p.paymentDate),
      sortDate: p.paymentDate ? new Date(p.paymentDate).getTime() : 0,
      isOpening,
      invoiceNo: "",
      receiptNo: receiptNumber || "",
      debit: 0,
      credit: amount,
      type: isOpening ? "OPENING_CREDIT" : "PAYMENT",
    });
  }

  // Sort transactions: Opening balance records first, then chronologically by sortDate
  transactions.sort((a, b) => {
    if (a.isOpening && !b.isOpening) return -1;
    if (!a.isOpening && b.isOpening) return 1;
    if (a.sortDate !== b.sortDate) {
      return a.sortDate - b.sortDate;
    }
    const order = {
      OPENING_DEBIT: 1,
      OPENING_CREDIT: 2,
      INVOICE: 3,
      TDS_VERIFIED: 4,
      PAYMENT: 5,
    };
    return (order[a.type] || 9) - (order[b.type] || 9);
  });

  // Calculate Running Debits, Credits, Running Balance, and Closing Balance
  let totalDebits = 0;
  let totalCredits = 0;
  let runningBalance = 0;
  const tableRows = [];

  if (transactions.length === 0) {
    tableRows.push([
      formatLedgerDate(validStatementDate),
      "-",
      "-",
      "0.00",
      "0.00",
      "0.00",
    ]);
  } else {
    for (const tx of transactions) {
      totalDebits += tx.debit;
      totalCredits += tx.credit;
      runningBalance += tx.debit - tx.credit;

      const balanceText =
        runningBalance > 0.001
          ? `${runningBalance.toFixed(2)} Dr`
          : runningBalance < -0.001
            ? `${Math.abs(runningBalance).toFixed(2)} Cr`
            : "0.00";

      tableRows.push([
        tx.dateStr || "",
        tx.invoiceNo || "",
        tx.receiptNo || "",
        tx.debit > 0 ? tx.debit.toFixed(2) : "",
        tx.credit > 0 ? tx.credit.toFixed(2) : "",
        balanceText,
      ]);
    }
  }

  const closingBalance = totalDebits - totalCredits;

  // Append Total Row
  tableRows.push([
    {
      content: "Total",
      styles: { fontStyle: "bold" },
    },
    "",
    "",
    {
      content: totalDebits.toFixed(2),
      styles: { fontStyle: "bold", halign: "right" },
    },
    {
      content: totalCredits.toFixed(2),
      styles: { fontStyle: "bold", halign: "right" },
    },
    "",
  ]);

  // Append Closing Balance row
  if (closingBalance >= 0) {
    tableRows.push([
      "",
      "",
      {
        content: "Closing Balance",
        styles: { fontStyle: "bold", halign: "right" },
      },
      {
        content: closingBalance.toFixed(2),
        styles: { fontStyle: "bold", halign: "right" },
      },
      "",
      {
        content: `${closingBalance.toFixed(2)} Dr`,
        styles: { fontStyle: "bold", halign: "right" },
      },
    ]);
  } else {
    tableRows.push([
      "",
      "",
      {
        content: "Closing Balance (Credit)",
        styles: { fontStyle: "bold", halign: "right" },
      },
      "",
      {
        content: Math.abs(closingBalance).toFixed(2),
        styles: { fontStyle: "bold", halign: "right" },
      },
      {
        content: `${Math.abs(closingBalance).toFixed(2)} Cr`,
        styles: { fontStyle: "bold", halign: "right" },
      },
    ]);
  }

  // 6. Generate PDF with jsPDF
  const doc = new jsPDF({
    orientation: "portrait",
    unit: "mm",
    format: "a4",
  });

  let curY = 16;

  // PAFEX Logo or fallback
  const logoPath = path.join(process.cwd(), "public", "pafex_logo.png");
  if (fs.existsSync(logoPath)) {
    try {
      const imgData = fs.readFileSync(logoPath).toString("base64");
      // Centered 38mm wide x 22mm high logo
      doc.addImage(`data:image/png;base64,${imgData}`, "PNG", 86, curY, 38, 22);
      curY += 26;
    } catch (e) {
      console.warn("Could not embed logo image in PDF:", e?.message);
      doc.setFontSize(14);
      doc.setFont("helvetica", "bold");
      doc.text("PAFEX LOGISTICS", 105, curY + 6, { align: "center" });
      curY += 12;
    }
  } else {
    doc.setFontSize(14);
    doc.setFont("helvetica", "bold");
    doc.text(
      company?.companyName
        ? company.companyName.toUpperCase()
        : "PAFEX LOGISTICS",
      105,
      curY + 6,
      { align: "center" },
    );
    curY += 12;
  }

  // Client Name
  doc.setFontSize(11);
  doc.setFont("helvetica", "bold");
  doc.setTextColor(20, 20, 20);
  doc.text(client.companyName || "Client Account", 105, curY + 6, {
    align: "center",
  });

  // Document Title: Ledger Account
  doc.setFontSize(10);
  doc.setFont("helvetica", "normal");
  doc.text("Ledger Account", 105, curY + 12, { align: "center" });

  // Statement Date
  doc.setFontSize(9);
  doc.setTextColor(60, 60, 60);
  doc.text(`Date: ${formatLedgerDate(validStatementDate)}`, 105, curY + 17, {
    align: "center",
  });

  // Horizontal divider rule
  curY += 21;
  doc.setDrawColor(40, 40, 40);
  doc.setLineWidth(0.35);
  doc.line(14, curY, 196, curY);

  // Table
  curY += 3;
  autoTable(doc, {
    startY: curY,
    margin: { left: 14, right: 14 },
    tableWidth: 182,
    theme: "grid",
    styles: {
      font: "helvetica",
      fontSize: 9,
      textColor: [0, 0, 0],
      lineColor: [40, 40, 40],
      lineWidth: 0.35,
      cellPadding: 3,
    },
    headStyles: {
      fillColor: [255, 255, 255],
      textColor: [0, 0, 0],
      fontStyle: "bold",
      lineColor: [40, 40, 40],
      lineWidth: 0.4,
    },
    columnStyles: {
      0: { cellWidth: 26, halign: "left" },
      1: { cellWidth: 34, halign: "left" },
      2: { cellWidth: 32, halign: "left" },
      3: { cellWidth: 30, halign: "right" },
      4: { cellWidth: 30, halign: "right" },
      5: { cellWidth: 30, halign: "right" },
    },
    didParseCell: function (data) {
      if (data.section === "head" && data.column.index >= 3) {
        data.cell.styles.halign = "right";
      }
    },
    head: [
      ["Date", "Invoice No.", "Receipt No.", "Debit", "Credit", "Balance"],
    ],
    body: tableRows,
  });

  const arrayBuffer = doc.output("arraybuffer");
  const buffer = Buffer.from(arrayBuffer);

  const cleanClientName = (client.companyName || "Client")
    .replace(/[^a-zA-Z0-9_-]/g, "_")
    .replace(/_+/g, "_");
  const dateSuffix = formatLedgerDate(validStatementDate).replace(/-/g, "");
  const filename = `Ledger_Account_${cleanClientName}_${dateSuffix}.pdf`;

  return {
    buffer,
    filename,
    summary: {
      clientName: client.companyName,
      totalDebits,
      totalCredits,
      closingBalance,
      rowCount: transactions.length,
    },
  };
}
