import { NextResponse } from "next/server";

import { parse } from "csv-parse/sync";

import { revalidatePath } from "next/cache";

import { createClientContact } from "@/app/actions/clientContacts";

// =====================================================
// POST
// =====================================================

export async function POST(request) {
  try {
    const formData = await request.formData();

    const clientId = Number(formData.get("clientId"));

    const file = formData.get("file");

    if (!clientId) {
      return NextResponse.json(
        {
          success: false,
          error: "Client ID is required",
        },
        {
          status: 400,
        },
      );
    }

    if (!file) {
      return NextResponse.json(
        {
          success: false,
          error: "CSV file is required",
        },
        {
          status: 400,
        },
      );
    }

    // =====================================
    // READ FILE
    // =====================================

    const csvText = await file.text();

    // const parsed = parse(csvText, {
    //   columns: true,
    //   skip_empty_lines: true,
    // });

    const rows = parse(csvText, {
      columns: true,
      skip_empty_lines: true,
    });

    let successCount = 0;

    const errors = [];

    // =====================================
    // IMPORT ROWS
    // =====================================

    for (let index = 0; index < rows.length; index++) {
      const row = rows[index];

      try {
        const emails =
          row.email
            ?.split("|")
            .map((email, index) => ({
              email: email.trim(),
              label: index === 0 ? "work" : "billing",
              isPrimary: index === 0,
            }))
            .filter((email) => email.email.length > 0) || [];

        const numbers =
          row.number
            ?.split("|")
            .map((number, index) => ({
              number: number.trim(),
              type: "mobile",
              countryCode: "+91",
              isPrimary: index === 0,
              isWhatsapp: true,
            }))
            .filter((number) => number.number.length > 0) || [];

        const response = await createClientContact({
          clientId,
          name: row.name?.trim(),
          designation: row.designation?.trim(),
          department: row.department?.trim(),
          isPrimary: String(row.is_primary).toLowerCase() === "true",
          receivesInvoice:
            String(row.receives_invoice).toLowerCase() === "true",
          receivesFollowup:
            String(row.receives_followup).toLowerCase() === "true",
          receivesEscalation:
            String(row.receives_escalation).toLowerCase() === "true",
          status: row.status || "active",
          notes: row.notes?.trim(),
          emails,
          numbers,
          locationIds: [],
        });

        if (response.success) {
          successCount++;
        } else {
          errors.push({
            row: index + 1,
            error: response.error,
          });
        }
      } catch (error) {
        errors.push({
          row: index + 1,
          error: error.message,
        });
      }
    }

    revalidatePath(`/clients/${clientId}`);

    // =====================================
    // RESPONSE
    // =====================================

    return NextResponse.json({
      success: true,
      totalRows: rows.length,
      imported: successCount,
      failed: errors.length,
      errors,
    });
  } catch (error) {
    console.error("Import contacts error:", error);

    return NextResponse.json(
      {
        success: false,
        error: "Failed to import contacts",
      },
      {
        status: 500,
      },
    );
  }
}
