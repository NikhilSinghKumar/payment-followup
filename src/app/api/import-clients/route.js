import { db } from "@/db";
import { clients } from "@/db/schema";
import { parse } from "csv-parse/sync";
import { and, eq, inArray, isNull } from "drizzle-orm";
import { getCurrentUser } from "@/lib/auth/auth";
import { setOrUpdateClientOpeningBalance } from "@/lib/client-opening-balance";
import { parseImportDate } from "@/lib/date-parser";
import { revalidatePath } from "next/cache";

export async function POST(req) {
  const currentUser = await getCurrentUser();

  if (!currentUser.user) {
    return Response.json(
      { status: "error", message: "Unauthorized" },
      { status: 401 },
    );
  }

  if (!currentUser.companyId) {
    return Response.json(
      { status: "error", message: "User is not associated with a company." },
      { status: 400 },
    );
  }

  try {
    const formData = await req.formData();
    const file = formData.get("file");

    // ✅ File validation
    if (!file || file.size === 0) {
      return Response.json(
        { status: "error", message: "No file uploaded" },
        { status: 400 },
      );
    }

    if (!file.name.toLowerCase().endsWith(".csv")) {
      return Response.json(
        { status: "error", message: "Only CSV files are allowed" },
        { status: 400 },
      );
    }

    const text = await file.text();

    // ✅ Parse CSV
    let records;
    try {
      records = parse(text, {
        columns: true,
        skip_empty_lines: true,
        trim: true,
      });
    } catch (err) {
      return Response.json(
        { status: "error", message: "Invalid CSV format" },
        { status: 400 },
      );
    }

    if (!records.length) {
      return Response.json(
        { status: "error", message: "CSV is empty" },
        { status: 400 },
      );
    }

    // ✅ Header validation
    const requiredHeaders = ["company_name", "company_code"];
    const headers = Object.keys(records[0]);

    for (const h of requiredHeaders) {
      if (!headers.includes(h)) {
        return Response.json(
          { status: "error", message: `Missing column: ${h}` },
          { status: 400 },
        );
      }
    }

    // ✅ Prepare stats
    let inserted = 0;
    let updated = 0;
    let skipped = 0;
    const errors = [];

    // ✅ Normalize + collect company codes
    const codes = records.map((r) => r.company_code?.trim()).filter(Boolean);

    // ✅ Fetch existing clients in this company
    const existingClients = codes.length
      ? await db
          .select({
            id: clients.id,
            companyCode: clients.companyCode,
            companyName: clients.companyName,
            gstNumber: clients.gstNumber,
            email: clients.email,
            phone: clients.phone,
            address: clients.address,
            tdsApplicable: clients.tdsApplicable,
            tdsRate: clients.tdsRate,
          })
          .from(clients)
          .where(
            and(
              eq(clients.companyId, currentUser.companyId),
              inArray(clients.companyCode, codes),
              isNull(clients.deletedAt),
            ),
          )
      : [];

    const existingClientsMap = new Map(
      existingClients.map((c) => [c.companyCode, c]),
    );

    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

    // ✅ Process each row (Insert or Update)
    for (let i = 0; i < records.length; i++) {
      const row = records[i];
      const rowNum = i + 2; // header is row 1

      const companyName = row.company_name?.trim();
      const companyCode = row.company_code?.trim();
      const email = row.email?.trim() || null;
      const phone = row.phone?.trim() || null;
      const gstNumber = row.gst_number?.trim() || null;
      const address = row.address?.trim() || null;

      const rawTdsApplicable = row.tds_applicable
        ?.toString()
        .trim()
        .toLowerCase();
      const hasTdsApplicableCol =
        row.tds_applicable !== undefined &&
        row.tds_applicable !== null &&
        row.tds_applicable.toString().trim() !== "";
      const tdsApplicable =
        rawTdsApplicable === "true" ||
        rawTdsApplicable === "yes" ||
        rawTdsApplicable === "1";

      const rawTdsRate = row.tds_rate?.toString().trim();
      const parsedTdsRate = rawTdsRate ? parseFloat(rawTdsRate) : 2.0;
      const tdsRate = !isNaN(parsedTdsRate) ? parsedTdsRate.toFixed(2) : "2.00";

      // Required validation
      if (!companyName || !companyCode) {
        skipped++;
        errors.push(
          `Row ${rowNum}: Missing required company_name or company_code`,
        );
        continue;
      }

      // Email validation (only if provided)
      if (email && !emailRegex.test(email)) {
        skipped++;
        errors.push(`Row ${rowNum}: Invalid email (${email})`);
        continue;
      }

      const hasOpeningBalanceInRow =
        row.opening_balance !== undefined &&
        row.opening_balance !== null &&
        row.opening_balance.toString().trim() !== "";

      const rawOpeningBalance = hasOpeningBalanceInRow
        ? row.opening_balance.toString().trim()
        : null;
      const parsedOpeningBalance = rawOpeningBalance
        ? parseFloat(rawOpeningBalance)
        : 0;
      const openingBalance =
        !isNaN(parsedOpeningBalance) && parsedOpeningBalance >= 0
          ? parsedOpeningBalance
          : 0;

      const rawType =
        row.opening_balance_type?.toString().trim().toUpperCase() || "DEBIT";
      const openingBalanceType =
        rawType === "CREDIT" || rawType === "CR" ? "CREDIT" : "DEBIT";

      const openingBalanceDate = row.opening_balance_date?.toString().trim();
      const parsedDate = parseImportDate(openingBalanceDate);
      const validDate = parsedDate || new Date();
      const openingBalanceNotes =
        row.opening_balance_notes?.toString().trim() || "";

      // ----------------------------------------------------
      // CASE 1: EXISTING CLIENT -> UPDATE (UPSERT)
      // ----------------------------------------------------
      if (existingClientsMap.has(companyCode)) {
        const existingClient = existingClientsMap.get(companyCode);

        const updateData = {
          companyName,
          updatedAt: new Date(),
        };

        if (row.email !== undefined) updateData.email = email;
        if (row.phone !== undefined) updateData.phone = phone;
        if (row.gst_number !== undefined) updateData.gstNumber = gstNumber;
        if (row.address !== undefined) updateData.address = address;

        if (hasTdsApplicableCol) {
          updateData.tdsApplicable = tdsApplicable;
          updateData.tdsRate = tdsApplicable ? tdsRate : "2.00";
        } else if (rawTdsRate !== undefined && rawTdsRate !== "") {
          updateData.tdsRate = tdsRate;
        }

        try {
          await db
            .update(clients)
            .set(updateData)
            .where(eq(clients.id, existingClient.id));

          // Update opening balance if specified in the CSV row
          if (hasOpeningBalanceInRow) {
            await setOrUpdateClientOpeningBalance({
              companyId: currentUser.companyId,
              clientId: existingClient.id,
              amount: openingBalance,
              type: openingBalanceType,
              asOfDate: validDate,
              notes:
                openingBalanceNotes ||
                (openingBalanceType === "CREDIT"
                  ? "Opening Balance (Credit) / Advance Carried Forward"
                  : "Imported Opening Balance"),
              gstNumber: updateData.gstNumber ?? existingClient.gstNumber,
              tdsApplicable:
                updateData.tdsApplicable ?? existingClient.tdsApplicable,
              tdsRate: updateData.tdsRate ?? existingClient.tdsRate,
            });
          }

          // Update map with new values
          existingClientsMap.set(companyCode, {
            ...existingClient,
            ...updateData,
          });

          updated++;
        } catch (updateErr) {
          errors.push(
            `Row ${rowNum} (${companyCode}): ${updateErr.message || "Failed to update client"}`,
          );
          skipped++;
        }
      } else {
        // ----------------------------------------------------
        // CASE 2: NEW CLIENT -> INSERT
        // ----------------------------------------------------
        const newClientData = {
          companyId: currentUser.companyId,
          companyName,
          email,
          phone,
          companyCode,
          gstNumber,
          address,
          tdsApplicable,
          tdsRate: tdsApplicable ? tdsRate : "2.00",
        };

        try {
          const [insertedClient] = await db
            .insert(clients)
            .values(newClientData)
            .returning({ id: clients.id });

          if (insertedClient?.id) {
            existingClientsMap.set(companyCode, {
              id: insertedClient.id,
              ...newClientData,
            });

            if (hasOpeningBalanceInRow && openingBalance > 0) {
              await setOrUpdateClientOpeningBalance({
                companyId: currentUser.companyId,
                clientId: insertedClient.id,
                amount: openingBalance,
                type: openingBalanceType,
                asOfDate: validDate,
                notes:
                  openingBalanceNotes ||
                  (openingBalanceType === "CREDIT"
                    ? "Opening Balance (Credit) / Advance Carried Forward"
                    : "Imported Opening Balance"),
                gstNumber,
                tdsApplicable,
                tdsRate: tdsApplicable ? tdsRate : "2.00",
              });
            }

            inserted++;
          } else {
            skipped++;
            errors.push(
              `Row ${rowNum} (${companyCode}): Could not insert client`,
            );
          }
        } catch (insertErr) {
          errors.push(
            `Row ${rowNum} (${companyCode}): ${insertErr.message || "Failed to insert client"}`,
          );
          skipped++;
        }
      }
    }

    revalidatePath("/clients");
    revalidatePath("/invoices");
    revalidatePath("/payments");

    // ✅ Final response
    return Response.json({
      status: "success",
      message: "Import completed",
      summary: {
        total: records.length,
        inserted,
        updated,
        skipped,
      },
      errors: errors.slice(0, 15),
    });
  } catch (err) {
    console.error("Client Import Error:", err);

    return Response.json(
      {
        status: "error",
        message: "Import failed",
        error: err.message,
      },
      { status: 500 },
    );
  }
}
