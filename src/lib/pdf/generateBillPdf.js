import { db } from "@/db";
import { clients, companies, invoices, invoiceAwbs } from "@/db/schema";
import { and, eq, isNull, asc } from "drizzle-orm";
import { jsPDF } from "jspdf";
import autoTable from "jspdf-autotable";
import fs from "fs";
import path from "path";

/**
 * Format date to DD-MM-YYYY
 */
function formatBillDate(dateVal) {
  if (!dateVal) return "";
  const d = new Date(dateVal);
  if (isNaN(d.getTime())) return String(dateVal);
  const day = String(d.getDate()).padStart(2, "0");
  const month = String(d.getMonth() + 1).padStart(2, "0");
  const year = d.getFullYear();
  return `${day}-${month}-${year}`;
}

/**
 * Format currency with Indian grouping
 */
function formatCurrency(val) {
  const num = Number(val || 0);
  return `₹${num.toLocaleString("en-IN", {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  })}`;
}

/**
 * Generate in-memory Bill / Tax Invoice PDF for an invoice
 *
 * @param {Object} params
 * @param {number|string} params.invoiceId - Invoice ID
 * @param {number|string} [params.companyId] - Company ID override
 * @returns {Promise<{ buffer: Buffer, filename: string, invoice: Object, client: Object, company: Object }>}
 */
export async function generateInvoiceBillPdf({ invoiceId, companyId = null }) {
  const parsedInvoiceId = Number(invoiceId);
  if (!parsedInvoiceId || isNaN(parsedInvoiceId)) {
    throw new Error("Valid invoiceId is required to generate Bill PDF");
  }

  // 1. Fetch Invoice
  const invoiceRows = await db
    .select()
    .from(invoices)
    .where(and(eq(invoices.id, parsedInvoiceId), isNull(invoices.deletedAt)))
    .limit(1);

  const invoice = invoiceRows[0];
  if (!invoice) {
    throw new Error(`Invoice #${parsedInvoiceId} not found`);
  }

  const activeCompanyId = companyId || invoice.companyId || 1;

  // 2. Fetch Client
  let client = null;
  if (invoice.clientId) {
    const clientRows = await db
      .select()
      .from(clients)
      .where(eq(clients.id, invoice.clientId))
      .limit(1);
    client = clientRows[0] || null;
  }

  if (!client) {
    client = {
      id: invoice.clientId || 0,
      companyName: "Client Account",
      companyCode: "CLIENT",
    };
  }

  // 3. Fetch Company (Sender / PAFEX)
  let company = null;
  if (activeCompanyId) {
    const compRows = await db
      .select()
      .from(companies)
      .where(eq(companies.id, Number(activeCompanyId)))
      .limit(1);
    company = compRows[0] || null;
  }

  // 4. Fetch AWBs if attached to this invoice
  let awbs = [];
  try {
    awbs = await db
      .select()
      .from(invoiceAwbs)
      .where(
        and(
          eq(invoiceAwbs.invoiceId, parsedInvoiceId),
          isNull(invoiceAwbs.deletedAt),
        ),
      )
      .orderBy(asc(invoiceAwbs.id));
  } catch (err) {
    console.warn(
      `[generateInvoiceBillPdf] Could not load AWBs for invoice #${parsedInvoiceId}:`,
      err?.message,
    );
  }

  // 5. Build PDF with jsPDF
  const doc = new jsPDF({
    orientation: "portrait",
    unit: "mm",
    format: "a4",
  });

  let curY = 14;

  // ----------------------------------------------------
  // PAFEX Logo
  // ----------------------------------------------------
  const logoPath = path.join(process.cwd(), "public", "pafex_logo.png");
  if (fs.existsSync(logoPath)) {
    try {
      const imgData = fs.readFileSync(logoPath).toString("base64");
      // Centered 38mm wide x 22mm high logo
      doc.addImage(`data:image/png;base64,${imgData}`, "PNG", 86, curY, 38, 22);
      curY += 25;
    } catch (e) {
      console.warn("Could not embed logo image in Bill PDF:", e?.message);
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

  // ----------------------------------------------------
  // Company Name
  // ----------------------------------------------------
  doc.setFontSize(12);
  doc.setFont("helvetica", "bold");
  doc.setTextColor(20, 20, 20);
  doc.text(company?.companyName || "PAFEX LOGISTICS", 105, curY + 4, {
    align: "center",
  });

  // Document Title: Tax Invoice / Bill
  doc.setFontSize(10);
  doc.setFont("helvetica", "bold");
  doc.setTextColor(50, 50, 50);
  doc.text("TAX INVOICE / BILL", 105, curY + 9, { align: "center" });

  // Date
  doc.setFontSize(9);
  doc.setFont("helvetica", "normal");
  doc.setTextColor(80, 80, 80);
  doc.text(
    `Date: ${formatBillDate(invoice.invoiceDate || new Date())}`,
    105,
    curY + 14,
    {
      align: "center",
    },
  );

  // Divider Rule
  curY += 18;
  doc.setDrawColor(40, 40, 40);
  doc.setLineWidth(0.35);
  doc.line(14, curY, 196, curY);

  // ----------------------------------------------------
  // Metadata Grid: Billed To (Left) & Invoice Info (Right)
  // ----------------------------------------------------
  curY += 4;
  const leftX = 14;
  const rightX = 110;

  // Left Column: Client Details
  doc.setFontSize(9);
  doc.setFont("helvetica", "bold");
  doc.setTextColor(20, 20, 20);
  doc.text("BILLED TO:", leftX, curY + 4);

  doc.setFont("helvetica", "bold");
  doc.setFontSize(10);
  doc.text(client.companyName || "Client Account", leftX, curY + 9);

  doc.setFont("helvetica", "normal");
  doc.setFontSize(8.5);
  doc.setTextColor(60, 60, 60);

  let clientY = curY + 14;
  const addressParts = [
    client.address,
    client.city,
    client.state,
    client.pincode,
  ].filter(Boolean);
  if (addressParts.length > 0) {
    const addressStr = addressParts.join(", ");
    const splitAddress = doc.splitTextToSize(addressStr, 85);
    doc.text(splitAddress, leftX, clientY);
    clientY += splitAddress.length * 4;
  }
  if (client.gstNumber) {
    doc.text(`GSTIN: ${client.gstNumber}`, leftX, clientY);
    clientY += 4;
  }
  if (client.panNumber) {
    doc.text(`PAN: ${client.panNumber}`, leftX, clientY);
    clientY += 4;
  }
  if (client.email || client.phone) {
    const contactStr = [client.phone, client.email].filter(Boolean).join(" | ");
    doc.text(contactStr, leftX, clientY);
    clientY += 4;
  }

  // Right Column: Invoice Details
  doc.setFontSize(9);
  doc.setFont("helvetica", "bold");
  doc.setTextColor(20, 20, 20);
  doc.text("INVOICE DETAILS:", rightX, curY + 4);

  doc.setFont("helvetica", "normal");
  doc.setFontSize(8.5);
  doc.setTextColor(40, 40, 40);

  let invY = curY + 9;
  const printInvRow = (label, val) => {
    doc.setFont("helvetica", "bold");
    doc.text(`${label}:`, rightX, invY);
    doc.setFont("helvetica", "normal");
    doc.text(String(val || "—"), rightX + 35, invY);
    invY += 4.5;
  };

  printInvRow("Invoice No.", invoice.invoiceNumber);
  printInvRow("Invoice Date", formatBillDate(invoice.invoiceDate));
  printInvRow("Due Date", formatBillDate(invoice.dueDate));
  if (invoice.financialYear) {
    printInvRow("Financial Year", invoice.financialYear);
  }
  if (invoice.gstNumberUsed) {
    printInvRow("GSTIN Used", invoice.gstNumberUsed);
  }
  printInvRow("Payment Status", (invoice.status || "Pending").toUpperCase());

  curY = Math.max(clientY, invY) + 4;

  // ----------------------------------------------------
  // Items / AWBs Table
  // ----------------------------------------------------
  let tableHead = [];
  let tableBody = [];
  let columnStyles = {};

  if (awbs.length > 0) {
    tableHead = [
      [
        "#",
        "AWB Number",
        "Shipment Date",
        "Origin",
        "Destination",
        "Weight (kg)",
        "Amount (₹)",
      ],
    ];
    columnStyles = {
      0: { cellWidth: 10, halign: "center" },
      1: { cellWidth: 35, halign: "left" },
      2: { cellWidth: 26, halign: "center" },
      3: { cellWidth: 28, halign: "left" },
      4: { cellWidth: 28, halign: "left" },
      5: { cellWidth: 25, halign: "right" },
      6: { cellWidth: 30, halign: "right" },
    };
    tableBody = awbs.map((a, idx) => [
      String(idx + 1),
      a.awbNumber || "—",
      formatBillDate(a.shipmentDate) || "—",
      a.origin || "—",
      a.destination || "—",
      a.weight ? Number(a.weight).toFixed(2) : "—",
      a.amount ? Number(a.amount).toFixed(2) : "0.00",
    ]);
  } else {
    tableHead = [
      [
        "#",
        "Description / Service Particulars",
        "SAC Code",
        "Taxable Value (₹)",
      ],
    ];
    columnStyles = {
      0: { cellWidth: 14, halign: "center" },
      1: { cellWidth: 105, halign: "left" },
      2: { cellWidth: 30, halign: "center" },
      3: { cellWidth: 33, halign: "right" },
    };
    const basicAmt = Number(invoice.basicAmount || invoice.invoiceAmount || 0);
    tableBody = [
      [
        "1",
        "Express Courier & Logistics Transportation Services",
        "996812",
        basicAmt.toLocaleString("en-IN", {
          minimumFractionDigits: 2,
          maximumFractionDigits: 2,
        }),
      ],
    ];
  }

  autoTable(doc, {
    startY: curY,
    margin: { left: 14, right: 14 },
    tableWidth: 182,
    theme: "grid",
    styles: {
      font: "helvetica",
      fontSize: 8.5,
      textColor: [20, 20, 20],
      lineColor: [40, 40, 40],
      lineWidth: 0.35,
      cellPadding: 2.8,
    },
    headStyles: {
      fillColor: [248, 250, 252],
      textColor: [15, 23, 42],
      fontStyle: "bold",
      lineColor: [40, 40, 40],
      lineWidth: 0.4,
    },
    columnStyles,
    head: tableHead,
    body: tableBody,
  });

  curY = doc.lastAutoTable.finalY + 4;

  // ----------------------------------------------------
  // Financial Summary Breakdown (Right-aligned Box)
  // ----------------------------------------------------
  const basicVal = Number(invoice.basicAmount || 0);
  const cgstVal = Number(invoice.cgstAmount || 0);
  const sgstVal = Number(invoice.sgstAmount || 0);
  const igstVal = Number(invoice.igstAmount || 0);
  const grossVal = Number(invoice.invoiceAmount || 0);
  const tdsVal = Number(invoice.tdsAmount || 0);
  const deductionVal = Number(invoice.deductionAmount || 0);
  const otherChargesVal = Number(invoice.otherCharges || 0);
  const netPayableVal = Number(invoice.netPayableAmount || 0);

  const summaryRows = [];
  if (basicVal > 0) {
    summaryRows.push(["Basic Amount", formatCurrency(basicVal)]);
  }
  if (cgstVal > 0) {
    summaryRows.push(["CGST", formatCurrency(cgstVal)]);
  }
  if (sgstVal > 0) {
    summaryRows.push(["SGST", formatCurrency(sgstVal)]);
  }
  if (igstVal > 0) {
    summaryRows.push(["IGST", formatCurrency(igstVal)]);
  }
  summaryRows.push(["Gross Invoice Amount", formatCurrency(grossVal)]);
  if (tdsVal > 0) {
    summaryRows.push(["Less: TDS Deducted", `-${formatCurrency(tdsVal)}`]);
  }
  if (deductionVal > 0) {
    summaryRows.push(["Less: Deductions", `-${formatCurrency(deductionVal)}`]);
  }
  if (otherChargesVal > 0) {
    summaryRows.push(["Other Charges", formatCurrency(otherChargesVal)]);
  }
  summaryRows.push(["Net Payable Amount", formatCurrency(netPayableVal)]);

  autoTable(doc, {
    startY: curY,
    margin: { left: 95, right: 14 },
    tableWidth: 101,
    theme: "grid",
    styles: {
      font: "helvetica",
      fontSize: 8.5,
      textColor: [20, 20, 20],
      lineColor: [40, 40, 40],
      lineWidth: 0.35,
      cellPadding: 2.2,
    },
    columnStyles: {
      0: { cellWidth: 55, halign: "left" },
      1: { cellWidth: 46, halign: "right", fontStyle: "bold" },
    },
    body: summaryRows,
    didParseCell: (data) => {
      // Highlight Net Payable row
      if (data.row.index === summaryRows.length - 1) {
        data.cell.styles.fillColor = [238, 242, 255];
        data.cell.styles.textColor = [37, 99, 235];
        data.cell.styles.fontStyle = "bold";
        data.cell.styles.fontSize = 9.5;
      }
    },
  });

  // Left side: Bank & Payment Instructions
  const bankX = 14;
  const bankBoxY = curY;
  doc.setFontSize(8.5);
  doc.setFont("helvetica", "bold");
  doc.setTextColor(20, 20, 20);
  doc.text("BANK & PAYMENT DETAILS:", bankX, bankBoxY + 4);

  doc.setFont("helvetica", "normal");
  doc.setFontSize(8);
  doc.setTextColor(50, 50, 50);

  let bY = bankBoxY + 9;
  const printBankLine = (label, val) => {
    if (!val) return;
    doc.setFont("helvetica", "bold");
    doc.text(`${label}:`, bankX, bY);
    doc.setFont("helvetica", "normal");
    doc.text(String(val), bankX + 28, bY);
    bY += 4;
  };

  printBankLine("Bank Name", company?.bankName || "HDFC Bank");
  printBankLine("A/C Number", company?.bankAccountNumber || "50200084920194");
  printBankLine("IFSC Code", company?.bankIfscCode || "HDFC0000240");
  printBankLine("Branch", company?.bankBranch || "Nariman Point, Mumbai");
  printBankLine("Account Name", company?.companyName || "PAFEX LOGISTICS");

  bY += 3;
  doc.setFontSize(7.5);
  doc.setTextColor(100, 100, 100);
  doc.text(
    "Please mention Invoice Number in payment narration / reference.",
    bankX,
    bY,
  );

  curY = Math.max(doc.lastAutoTable.finalY, bY) + 12;

  // ----------------------------------------------------
  // Signatory & Footer
  // ----------------------------------------------------
  // Check if we need a new page for footer
  if (curY > 260) {
    doc.addPage();
    curY = 20;
  }

  const compDisplayName = company?.companyName || "PAFEX LOGISTICS";
  doc.setFontSize(8.5);
  doc.setFont("helvetica", "bold");
  doc.setTextColor(20, 20, 20);
  doc.text(`For ${compDisplayName.toUpperCase()}`, 196, curY, {
    align: "right",
  });

  curY += 16;
  doc.setFont("helvetica", "normal");
  doc.setFontSize(8);
  doc.setTextColor(80, 80, 80);
  doc.text("Authorized Signatory", 196, curY, { align: "right" });

  curY += 8;
  doc.setFontSize(7);
  doc.setTextColor(140, 140, 140);
  doc.text(
    "This is a computer-generated tax invoice and does not require a physical signature.",
    105,
    curY,
    {
      align: "center",
    },
  );

  const arrayBuffer = doc.output("arraybuffer");
  const buffer = Buffer.from(arrayBuffer);

  const cleanInvNum = (invoice.invoiceNumber || `INV_${invoice.id}`).replace(
    /[^a-zA-Z0-9_-]/g,
    "_",
  );
  const dateSuffix = formatBillDate(invoice.invoiceDate || new Date()).replace(
    /-/g,
    "",
  );
  const filename = `Bill_${cleanInvNum}_${dateSuffix}.pdf`;

  return {
    buffer,
    filename,
    invoice,
    client,
    company,
  };
}
