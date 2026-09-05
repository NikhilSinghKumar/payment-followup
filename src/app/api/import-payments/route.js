import { db } from "@/db";
import {
  clients,
  clientSubClients,
  invoices,
  payments,
  paymentAllocations,
} from "@/db/schema";

import { parse } from "csv-parse/sync";
import { and, eq, isNull, inArray, or, ilike } from "drizzle-orm";

import { getCurrentUser } from "@/lib/auth/auth";
import { parseImportDate } from "@/lib/date-parser";
import { updateInvoiceFinancials } from "@/lib/invoice/updateInvoiceFinancials";

const VALID_METHODS = ["cash", "bank", "upi", "cheque", "adjustment"];

function getRowValue(row, ...keys) {
  if (!row || typeof row !== "object") return "";
  for (const k of keys) {
    if (
      row[k] !== undefined &&
      row[k] !== null &&
      String(row[k]).trim() !== ""
    ) {
      return String(row[k]).trim();
    }
  }
  const cleanKeys = keys.map((k) => k.toLowerCase().replace(/[^a-z0-9]/g, ""));
  for (const [rawKey, val] of Object.entries(row)) {
    if (val === undefined || val === null || String(val).trim() === "")
      continue;
    const cleanRawKey = rawKey.toLowerCase().replace(/[^a-z0-9]/g, "");
    if (cleanKeys.includes(cleanRawKey)) {
      return String(val).trim();
    }
  }
  return "";
}

export async function POST(req) {
  try {
    // =====================================
    // AUTH
    // =====================================

    const currentUser = await getCurrentUser();

    if (!currentUser?.user) {
      return Response.json({ error: "Unauthorized" }, { status: 401 });
    }

    if (!currentUser?.companyId) {
      return Response.json(
        {
          error: "User is not associated with any company.",
        },
        { status: 400 },
      );
    }

    const companyId = currentUser.companyId;
    const userId = currentUser.user.id;

    // =====================================
    // FILE
    // =====================================

    const formData = await req.formData();
    const file = formData.get("file");

    if (!file) {
      return Response.json({ error: "No file uploaded" }, { status: 400 });
    }

    const text = await file.text();

    let records;
    try {
      records = parse(text, {
        columns: true,
        skip_empty_lines: true,
        trim: true,
      });
    } catch (parseErr) {
      return Response.json(
        {
          error: `CSV Parsing Error: ${parseErr?.message || "Invalid CSV format"}`,
        },
        { status: 400 },
      );
    }

    let inserted = 0;
    let skipped = 0;
    const insertedPaymentIds = [];

    const total = records.length;
    const errors = [];

    // =====================================
    // PROCESS ROWS
    // =====================================

    for (let i = 0; i < records.length; i++) {
      const row = records[i];
      const csvRow = i + 2;

      const clientCode = getRowValue(
        row,
        "client_code",
        "Client Code",
        "company_code",
        "Company Code",
        "client",
        "company",
      );

      const subClientCode = getRowValue(
        row,
        "sub_client_code",
        "Subclient Code",
        "Sub Client Code",
        "subclient_code",
        "sub_client",
        "subclient",
        "Sub Client",
        "Subclient",
      );

      const invoiceCell = getRowValue(
        row,
        "invoices",
        "Invoice Number",
        "invoice_number",
        "Invoice No",
        "invoice_no",
      );

      const invoiceNumbers = invoiceCell
        .split(",")
        .map((x) => x.trim())
        .filter(Boolean);

      const rawDate = getRowValue(
        row,
        "payment_date",
        "Payment Date",
        "date",
        "Date",
      );
      const paymentDate = parseImportDate(rawDate);

      const rawAmount = getRowValue(
        row,
        "amount",
        "Amount",
        "payment_amount",
        "Payment Amount",
      );
      const amount = parseFloat(rawAmount.replace(/,/g, "") || "0");

      const rawMethod = getRowValue(
        row,
        "method",
        "Method",
        "payment_method",
        "Payment Method",
      );
      const method = rawMethod.toLowerCase();

      const receiptNumber = getRowValue(
        row,
        "receipt_number",
        "Receipt Number",
        "Receipt",
        "receipt",
        "Receipt No",
      );

      const reference = getRowValue(
        row,
        "reference",
        "Reference",
        "transaction_id",
        "Transaction ID",
        "utr",
        "UTR",
      );

      const notes = getRowValue(
        row,
        "notes",
        "Notes",
        "remark",
        "remarks",
        "Remarks",
      );

      try {
        // ---------------------------------
        // Validation
        // ---------------------------------

        const rowErrors = [];

        if (!clientCode) {
          rowErrors.push("Client Code is required");
        }

        if (!paymentDate || isNaN(paymentDate.getTime())) {
          rowErrors.push(`Invalid Payment Date '${rawDate || "empty"}'`);
        }

        if (isNaN(amount) || amount <= 0) {
          rowErrors.push("Payment Amount must be greater than 0");
        }

        if (!method) {
          rowErrors.push("Payment Method is required");
        } else if (!VALID_METHODS.includes(method)) {
          rowErrors.push(
            `Invalid Payment Method '${method}'. Allowed: ${VALID_METHODS.join(", ")}`,
          );
        }

        if (rowErrors.length > 0) {
          skipped++;

          errors.push({
            row: csvRow,
            clientCode: clientCode || "",
            subClientCode: subClientCode || "",
            invoices: invoiceNumbers.join(", ") || "",
            reference: reference || receiptNumber || "",
            reason: rowErrors.join("; "),
          });

          continue;
        }

        // =====================================
        // FIND CLIENT
        // =====================================

        const client = await db
          .select({
            id: clients.id,
            companyName: clients.companyName,
            companyCode: clients.companyCode,
            isActive: clients.isActive,
          })
          .from(clients)
          .where(
            and(
              eq(clients.companyId, companyId),
              isNull(clients.deletedAt),
              or(
                eq(clients.companyCode, clientCode),
                ilike(clients.companyCode, clientCode),
                ilike(clients.companyName, clientCode),
              ),
            ),
          )
          .limit(1);

        if (!client.length) {
          skipped++;

          errors.push({
            row: csvRow,
            clientCode,
            subClientCode: subClientCode || "",
            invoices: invoiceNumbers.join(", ") || "",
            reference: reference || receiptNumber || "",
            reason: `Client with code or name '${clientCode}' does not exist.`,
          });

          continue;
        }

        const clientData = client[0];

        // Check if active
        if (clientData.isActive === false) {
          skipped++;

          errors.push({
            row: csvRow,
            clientCode: clientData.companyCode || clientCode,
            subClientCode: subClientCode || "",
            invoices: invoiceNumbers.join(", ") || "",
            reference: reference || receiptNumber || "",
            reason: `Client '${clientData.companyName}' (${clientData.companyCode || clientCode}) is inactive.`,
          });

          continue;
        }

        // =====================================
        // FIND & VALIDATE INVOICES
        // =====================================

        let invoiceRows = [];

        if (invoiceNumbers.length > 0) {
          invoiceRows = await db
            .select({
              id: invoices.id,
              invoiceNumber: invoices.invoiceNumber,
              subClientId: invoices.subClientId,
              outstandingAmount: invoices.outstandingAmount,
            })
            .from(invoices)
            .where(
              and(
                eq(invoices.companyId, companyId),
                eq(invoices.clientId, clientData.id),
                inArray(invoices.invoiceNumber, invoiceNumbers),
                isNull(invoices.deletedAt),
              ),
            );

          // Preserve the order entered in the CSV
          invoiceRows = invoiceNumbers
            .map((invoiceNumber) =>
              invoiceRows.find((i) => i.invoiceNumber === invoiceNumber),
            )
            .filter(Boolean);

          if (invoiceRows.length !== invoiceNumbers.length) {
            const foundNumbers = invoiceRows.map((x) => x.invoiceNumber);
            const missing = invoiceNumbers.filter(
              (x) => !foundNumbers.includes(x),
            );

            skipped++;

            errors.push({
              row: csvRow,
              clientCode: clientData.companyCode || clientCode,
              subClientCode: subClientCode || "",
              invoices: invoiceNumbers.join(", "),
              reference: reference || receiptNumber || "",
              reason: `Invoice(s) not found for this client: ${missing.join(", ")}`,
            });

            continue;
          }
        }

        // =====================================
        // RESOLVE SUBCLIENT (IF ANY)
        // =====================================
        let targetSubClientId = null;
        let matchedSubClientLabel = subClientCode;

        if (subClientCode) {
          const subClientRows = await db
            .select({
              id: clientSubClients.id,
              companyName: clientSubClients.companyName,
              companyCode: clientSubClients.companyCode,
            })
            .from(clientSubClients)
            .where(
              and(
                eq(clientSubClients.clientId, clientData.id),
                isNull(clientSubClients.deletedAt),
                or(
                  eq(clientSubClients.companyCode, subClientCode),
                  ilike(clientSubClients.companyCode, subClientCode),
                  ilike(clientSubClients.companyName, subClientCode),
                ),
              ),
            )
            .limit(1);

          if (subClientRows.length === 0) {
            skipped++;

            errors.push({
              row: csvRow,
              clientCode: clientData.companyCode || clientCode,
              subClientCode,
              invoices: invoiceNumbers.join(", ") || "",
              reference: reference || receiptNumber || "",
              reason: `Subclient '${subClientCode}' does not exist for client '${clientData.companyName}' (${clientData.companyCode || clientCode}).`,
            });

            continue;
          }

          targetSubClientId = subClientRows[0].id;
          matchedSubClientLabel = subClientRows[0].companyCode
            ? `${subClientRows[0].companyName} (${subClientRows[0].companyCode})`
            : subClientRows[0].companyName;
        } else if (invoiceRows.length > 0 && invoiceRows[0].subClientId) {
          // If no subclient specified explicitly, check if all invoices belong to one subclient
          const commonSubId = invoiceRows[0].subClientId;
          const allSameSubclient = invoiceRows.every(
            (inv) => inv.subClientId === commonSubId,
          );
          if (allSameSubclient) {
            targetSubClientId = commonSubId;
          }
        }

        // Validate invoice subclient affinity if subclient is specified
        if (targetSubClientId && invoiceRows.length > 0) {
          const conflictingInvoices = invoiceRows.filter(
            (inv) => inv.subClientId && inv.subClientId !== targetSubClientId,
          );
          if (conflictingInvoices.length > 0) {
            skipped++;

            errors.push({
              row: csvRow,
              clientCode: clientData.companyCode || clientCode,
              subClientCode: matchedSubClientLabel || subClientCode,
              invoices: invoiceNumbers.join(", "),
              reference: reference || receiptNumber || "",
              reason: `Invoice(s) ${conflictingInvoices.map((inv) => inv.invoiceNumber).join(", ")} belong to a different subclient than '${matchedSubClientLabel}'.`,
            });

            continue;
          }
        }

        // =====================================
        // DUPLICATE RECEIPT CHECK
        // =====================================

        if (receiptNumber) {
          const existingReceipt = await db
            .select({
              id: payments.id,
            })
            .from(payments)
            .where(
              and(
                eq(payments.companyId, companyId),
                eq(payments.receiptNumber, receiptNumber),
                isNull(payments.deletedAt),
              ),
            )
            .limit(1);

          if (existingReceipt.length) {
            skipped++;

            errors.push({
              row: csvRow,
              clientCode: clientData.companyCode || clientCode,
              subClientCode: matchedSubClientLabel || subClientCode || "",
              invoices: invoiceNumbers.join(", ") || "",
              reference: reference || receiptNumber,
              reason: `Receipt number '${receiptNumber}' already exists in system.`,
            });

            continue;
          }
        }

        // =====================================
        // REFERENCE DUPLICATE CHECK
        // =====================================

        if (reference) {
          const existingReference = await db
            .select({
              id: payments.id,
            })
            .from(payments)
            .where(
              and(
                eq(payments.companyId, companyId),
                eq(payments.clientId, clientData.id),
                eq(payments.reference, reference),
                isNull(payments.deletedAt),
              ),
            )
            .limit(1);

          if (existingReference.length) {
            skipped++;

            errors.push({
              row: csvRow,
              clientCode: clientData.companyCode || clientCode,
              subClientCode: matchedSubClientLabel || subClientCode || "",
              invoices: invoiceNumbers.join(", ") || "",
              reference,
              reason: `Payment reference '${reference}' already exists for this client.`,
            });

            continue;
          }
        }

        // =====================================
        // INSERT PAYMENT
        // =====================================

        let affectedInvoiceIds = [];
        let createdPaymentId = null;

        await db.transaction(async (tx) => {
          // =====================================
          // CREATE PAYMENT
          // =====================================

          const [payment] = await tx
            .insert(payments)
            .values({
              companyId,

              clientId: clientData.id,
              subClientId: targetSubClientId || null,

              invoiceId: null,

              amount: amount.toFixed(2),

              paymentDate,

              receiptNumber: receiptNumber || null,

              method,

              reference: reference || null,

              notes,

              createdBy: userId,
              updatedBy: userId,
            })
            .returning({
              id: payments.id,
            });

          createdPaymentId = payment?.id;

          // =====================================
          // CREATE ALLOCATIONS
          // =====================================

          let remaining = amount;

          for (const invoice of invoiceRows) {
            if (remaining <= 0) break;

            const outstanding = Number(invoice.outstandingAmount);

            if (outstanding <= 0) continue;

            const allocation = Math.min(remaining, outstanding);

            await tx.insert(paymentAllocations).values({
              paymentId: payment.id,

              invoiceId: invoice.id,

              allocatedAmount: allocation.toFixed(2),

              createdBy: userId,
            });

            affectedInvoiceIds.push(invoice.id);

            remaining -= allocation;
          }
        });

        // =====================================
        // UPDATE INVOICE FINANCIALS
        // =====================================

        for (const invoiceId of affectedInvoiceIds) {
          await updateInvoiceFinancials(invoiceId);
        }

        if (createdPaymentId) {
          insertedPaymentIds.push(createdPaymentId);
        }

        inserted++;
      } catch (err) {
        console.error(`Payment Import Error (Row ${csvRow})`, err);

        skipped++;

        errors.push({
          row: csvRow,
          clientCode: clientCode || "",
          subClientCode: subClientCode || "",
          invoices: invoiceNumbers.join(", ") || "",
          reference: reference || receiptNumber || "",
          reason: err?.message || "Unexpected row processing error",
        });
      }
    }

    // =====================================
    // RESPONSE
    // =====================================

    return Response.json({
      status: "success",

      summary: {
        inserted,
        skipped,
        total,
      },

      insertedPaymentIds,

      errors,
    });
  } catch (err) {
    console.error("Payment Import Critical Error:", err);

    return Response.json(
      {
        status: "error",
        error:
          err?.message ||
          "Payment import failed due to an unexpected server error.",
      },
      {
        status: 500,
      },
    );
  }
}
