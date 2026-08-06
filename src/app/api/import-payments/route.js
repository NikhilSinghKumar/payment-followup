import { db } from "@/db";
import { clients, payments } from "@/db/schema";

import { parse } from "csv-parse/sync";
import { and, eq, isNull } from "drizzle-orm";

import { getCurrentUser } from "@/lib/auth/auth";
import { parseImportDate } from "@/lib/date-parser";

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

        const clientCode = row.client_code?.trim() || "";

        const paymentDate = parseImportDate(row.payment_date);

        const amount = parseFloat(
          String(row.amount || "0")
            .replace(/,/g, "")
            .trim(),
        );

        const method = row.method?.trim().toLowerCase() || "";

        const reference = row.reference?.trim() || "";

        const receiptNumber = row.receipt_number?.trim() || "";

        const notes = row.notes?.trim() || "";

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

        await db.insert(payments).values({
          companyId,

          clientId: clientData.id,

          // Legacy invoice relationship
          invoiceId: null,

          amount: amount.toFixed(2),

          paymentDate,

          receiptNumber: receiptNumber || null,

          method,

          reference: reference || null,

          notes,

          createdBy: userId,
          updatedBy: userId,
        });

        inserted++;
      } catch (err) {
        console.error(`Payment Import Error (Row ${csvRow})`, err);

        skipped++;

        errors.push({
          row: csvRow,
          companyCode: row.client_code || "",
          reference: row.reference || "",
          reason: "Unexpected server error",
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
