import { db } from "@/db";
import { clients, clientLocations } from "@/db/schema";
import { parse } from "csv-parse/sync";
import { and, eq, inArray, isNull } from "drizzle-orm";
import { CLIENT_LOCATION_TYPES } from "@/lib/validations/clientLocation";
export async function POST(req) {
  try {
    const formData = await req.formData();
    const file = formData.get("file");

    // =====================================
    // FILE VALIDATION
    // =====================================

    if (!file || file.size === 0) {
      return Response.json(
        {
          status: "error",
          message: "No file uploaded",
        },
        { status: 400 },
      );
    }

    if (!file.name.toLowerCase().endsWith(".csv")) {
      return Response.json(
        {
          status: "error",
          message: "Only CSV files are allowed",
        },
        { status: 400 },
      );
    }

    const text = await file.text();

    // =====================================
    // PARSE CSV
    // =====================================

    let records;

    try {
      records = parse(text, {
        columns: true,
        skip_empty_lines: true,
        trim: true,
      });
    } catch {
      return Response.json(
        {
          status: "error",
          message: "Invalid CSV format",
        },
        { status: 400 },
      );
    }

    if (!records.length) {
      return Response.json(
        {
          status: "error",
          message: "CSV is empty",
        },
        { status: 400 },
      );
    }

    // =====================================
    // HEADER VALIDATION
    // =====================================

    const requiredHeaders = ["client_code", "code"];
    const headers = Object.keys(records[0]);

    for (const header of requiredHeaders) {
      if (!headers.includes(header)) {
        return Response.json(
          {
            status: "error",
            message: `Missing column: ${header}`,
          },
          { status: 400 },
        );
      }
    }

    // =====================================
    // STATS
    // =====================================

    let inserted = 0;
    let skipped = 0;
    const errors = [];

    // =====================================
    // FETCH CLIENTS
    // =====================================

    const clientCodes = [
      ...new Set(records.map((r) => r.client_code?.trim()).filter(Boolean)),
    ];

    const clientList = clientCodes.length
      ? await db
          .select({
            id: clients.id,
            companyCode: clients.companyCode,
          })
          .from(clients)
          .where(inArray(clients.companyCode, clientCodes))
      : [];

    const clientMap = new Map(clientList.map((c) => [c.companyCode, c]));

    // =====================================
    // EXISTING LOCATIONS
    // =====================================

    const existingLocations = await db
      .select({
        clientId: clientLocations.clientId,
        city: clientLocations.city,
        locationCode: clientLocations.code,
      })
      .from(clientLocations)
      .where(isNull(clientLocations.deletedAt));

    const existingLocationSet = new Set(
      existingLocations.map((l) => `${l.clientId}-${l.code}`),
    );

    const existingLocationCodeSet = new Set(
      existingLocations
        .filter((l) => l.locationCode)
        .map((l) => `${l.clientId}-${l.locationCode}`),
    );

    // =====================================
    // PRIMARY TRACKER
    // =====================================

    const primaryTracker = new Set();

    // =====================================
    // CSV DUPLICATE TRACKER
    // =====================================

    const csvLocationSet = new Set();
    const toInsert = [];
    const gstRegex = /^[0-9]{2}[A-Z]{5}[0-9]{4}[A-Z]{1}[A-Z0-9]{3}$/;

    // =====================================
    // VALIDATION
    // =====================================

    for (let i = 0; i < records.length; i++) {
      const row = records[i];
      const rowNum = i + 2;
      const clientCode = row.client_code?.trim();
      const locationCode = row.code?.trim() || null;
      const type = row.type?.trim() || "branch";
      const city = row.city?.trim() || null;
      const state = row.state?.trim() || null;
      const address = row.address?.trim() || null;
      const pincode = row.pincode?.trim() || null;
      const country = row.country?.trim() || "India";
      const gstNumber = row.gst_number?.trim() || null;
      const isPrimary = String(row.is_primary).toLowerCase() === "true";
      const isActive = String(row.is_active).toLowerCase() !== "false";

      // ==========================
      // REQUIRED
      // ==========================

      if (!clientCode) {
        skipped++;

        errors.push(`Row ${rowNum}: Client Code is required`);
        continue;
      }

      // ==========================
      // CLIENT EXISTS
      // ==========================

      const client = clientMap.get(clientCode);

      if (!client) {
        skipped++;
        errors.push(`Row ${rowNum}: Client not found (${clientCode})`);
        continue;
      }

      if (isPrimary) {
        if (primaryTracker.has(client.id)) {
          skipped++;
          errors.push(
            `Row ${rowNum}: Multiple primary locations for client ${clientCode}`,
          );
          continue;
        }

        primaryTracker.add(client.id);
      }

      // ==========================
      // Duplicate Location Code
      // ==========================

      if (locationCode) {
        const codeKey = `${client.id}-${locationCode.toLowerCase()}`;

        if (existingLocationCodeSet.has(codeKey)) {
          skipped++;

          errors.push(
            `Row ${rowNum}: Location code already exists (${locationCode})`,
          );

          continue;
        }

        existingLocationCodeSet.add(codeKey);
      }

      // ==========================
      // LOCATION TYPE
      // ==========================

      if (type && !CLIENT_LOCATION_TYPES.includes(type)) {
        skipped++;
        errors.push(`Row ${rowNum}: Invalid location type (${type})`);
        continue;
      }

      // ==========================
      // GST
      // ==========================

      if (gstNumber && !gstRegex.test(gstNumber)) {
        skipped++;
        errors.push(`Row ${rowNum}: Invalid GST Number`);
        continue;
      }

      // ==========================
      // PINCODE
      // ==========================

      if (pincode && !/^\d{6}$/.test(pincode)) {
        skipped++;
        errors.push(`Row ${rowNum}: Invalid Pincode`);
        continue;
      }

      // ==========================
      // DUPLICATE IN CSV
      // ==========================

      const csvKey = `${client.id}-${locationCode}`;
      if (csvLocationSet.has(csvKey)) {
        skipped++;
        errors.push(`Row ${rowNum}: Duplicate location in CSV`);
        continue;
      }

      csvLocationSet.add(csvKey);

      // ==========================
      // DUPLICATE IN DB
      // ==========================

      if (existingLocationSet.has(csvKey)) {
        skipped++;
        errors.push(`Row ${rowNum}: Location already exists`);
        continue;
      }

      toInsert.push({
        clientId: client.id,
        code: locationCode,
        type,
        address,
        city,
        state,
        pincode,
        country,
        gstNumber,
        isPrimary,
        isActive,
      });
    }

    // =====================================
    // PRIMARY LOCATION HANDLING
    // =====================================

    for (const location of toInsert) {
      if (location.isPrimary) {
        await db
          .update(clientLocations)
          .set({
            isPrimary: false,
          })
          .where(
            and(
              eq(clientLocations.clientId, location.clientId),
              isNull(clientLocations.deletedAt),
            ),
          );
      }
    }

    // =====================================
    // INSERT
    // =====================================

    if (toInsert.length > 0) {
      await db.insert(clientLocations).values(toInsert);

      inserted = toInsert.length;
    }

    // =====================================
    // RESPONSE
    // =====================================

    return Response.json({
      status: "success",
      message: "Import completed",
      summary: {
        total: records.length,
        inserted,
        skipped,
      },

      errors: errors.slice(0, 20),
    });
  } catch (err) {
    console.error(err);

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
