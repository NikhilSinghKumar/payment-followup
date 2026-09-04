import { db } from "@/db";
import {
  clients,
  clientSubClients,
  invoices,
  payments,
  paymentAllocations,
} from "@/db/schema";

import { parse } from "csv-parse/sync";
import { and, eq, isNull, inArray } from "drizzle-orm";

import { getCurrentUser } from "@/lib/auth/auth";
import { parseImportDate } from "@/lib/date-parser";
import { updateInvoiceFinancials } from "@/lib/invoice/updateInvoiceFinancials";

const VALID_METHODS = ["cash", "bank", "upi", "cheque", "adjustment"];

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

    const records = parse(text, {
      columns: true,
      skip_empty_lines: true,
      trim: true,
    });

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

      try {
        // ---------------------------------
        // Read CSV
        // ---------------------------------

        const clientCode = row.client_code ?? row["Client Code"] ?? "";

        const subClientCode = (
          row.sub_client_code ??
          row["Subclient Code"] ??
          row["Sub Client Code"] ??
          row.subclient_code ??
          ""
        ).trim();

        const invoiceCell = row.invoices ?? row["Invoice Number"] ?? "";

        const invoiceNumbers = invoiceCell
          .split(",")
          .map((x) => x.trim())
          .filter(Boolean);

        const paymentDate = parseImportDate(
          row.payment_date ?? row["Payment Date"] ?? row["Date"],
        );

        const amount = parseFloat(
          String(row.amount ?? row.Amount ?? "0")
            .replace(/,/g, "")
            .trim(),
        );

        const method = (row.method ?? row.Method ?? "").trim().toLowerCase();

        const receiptNumber = (
          row.receipt_number ??
          row.Receipt ??
          row["Receipt Number"] ??
          ""
        ).trim();

        const reference = (row.reference ?? row.Reference ?? "").trim();

        const notes = (row.notes ?? row.Notes ?? "").trim();

        // ---------------------------------
        // Validation
        // ---------------------------------

        const rowErrors = [];

        if (!clientCode) {
          rowErrors.push("Client Code is required");
        }

        if (!paymentDate || isNaN(paymentDate.getTime())) {
          rowErrors.push("Invalid Payment Date");
        }

        if (isNaN(amount) || amount <= 0) {
          rowErrors.push("Payment Amount must be greater than 0");
        }

        if (!method) {
          rowErrors.push("Payment Method is required");
        } else if (!VALID_METHODS.includes(method)) {
          rowErrors.push(`Invalid Payment Method '${method}'`);
        }

        if (rowErrors.length > 0) {
          skipped++;

          errors.push({
            row: csvRow,
            clientCode,
            reference,
            reason: rowErrors.join(", "),
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
          })
          .from(clients)
          .where(
            and(
              eq(clients.companyId, companyId),
              eq(clients.companyCode, clientCode),
              isNull(clients.deletedAt),
            ),
          )
          .limit(1);

        if (!client.length) {
          skipped++;

          errors.push({
            row: csvRow,
            clientCode,
            reference,
            reason: "Client not found",
          });

          continue;
        }

        const clientData = client[0];

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
            skipped++;

            errors.push({
              row: csvRow,
              clientCode,
              reference,
              reason: "One or more invoice numbers are invalid.",
            });

            continue;
          }
        }

        // =====================================
        // RESOLVE SUBCLIENT (IF ANY)
        // =====================================
        let targetSubClientId = null;

        if (subClientCode) {
          const subClientRows = await db
            .select({
              id: clientSubClients.id,
            })
            .from(clientSubClients)
            .where(
              and(
                eq(clientSubClients.companyId, companyId),
                eq(clientSubClients.clientId, clientData.id),
                eq(clientSubClients.companyCode, subClientCode),
                isNull(clientSubClients.deletedAt),
              ),
            )
            .limit(1);

          if (subClientRows.length === 0) {
            skipped++;

            errors.push({
              row: csvRow,
              clientCode,
              reference,
              reason: `Subclient with code '${subClientCode}' does not exist for this client.`,
            });

            continue;
          }

          targetSubClientId = subClientRows[0].id;
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
              clientCode,
              reference,
              reason: `Receipt '${receiptNumber}' already exists`,
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
              clientCode,
              reference,
              reason: `Payment reference '${reference}' already exists for this client`,
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
          clientCode: clientCode || row.client_code || "",
          reference: reference || row.reference || "",
          reason: err?.message || "Unexpected server error",
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
    console.error("Payment Import Error:", err);

    return Response.json(
      {
        status: "error",
        error: "Import failed.",
      },
      {
        status: 500,
      },
    );
  }
}
