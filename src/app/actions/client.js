"use server";

import { db } from "@/db";
import { clients, invoices, payments } from "@/db/schema";
import { ilike, or, and, sql, eq, isNull } from "drizzle-orm";
import { revalidatePath } from "next/cache";
import { getCurrentUser } from "@/lib/auth/auth";
import { getFinancialYear } from "@/lib/financial-year";
import { calculateInvoiceStatus } from "@/lib/invoice-status";
import { parseImportDate } from "@/lib/date-parser";
import { setOrUpdateClientOpeningBalance } from "@/lib/client-opening-balance";

// Create client
export async function createClient(prevState, formData) {
  const companyName = formData.get("companyName")?.trim();
  const companyCode = formData.get("companyCode")?.trim().toUpperCase();
  const email = formData.get("email")?.trim() || null;
  const phone = formData.get("phone")?.trim() || null;
  const address = formData.get("address")?.trim() || null;
  const rawGst = formData.get("gstNumber")?.trim().toUpperCase();
  const gstNumber = rawGst && rawGst.length > 0 ? rawGst : null;

  const tdsApplicable = formData.get("tdsApplicable") === "on";
  const rawTdsRate = formData.get("tdsRate");
  const parsedTdsRate = rawTdsRate ? parseFloat(rawTdsRate) : 2.0;
  const tdsRate = !isNaN(parsedTdsRate) ? parsedTdsRate.toFixed(2) : "2.00";

  const rawOpeningBalance = formData.get("openingBalance");
  const openingBalance = rawOpeningBalance ? parseFloat(rawOpeningBalance) : 0;
  const openingBalanceType = (
    formData.get("openingBalanceType") || "DEBIT"
  ).toUpperCase();
  const openingBalanceDateStr = formData.get("openingBalanceDate");
  const openingBalanceNotes =
    formData.get("openingBalanceNotes")?.trim() || "Opening Balance";

  const currentUser = await getCurrentUser();

  if (!currentUser?.user) {
    return {
      error: "Unauthorized",
    };
  }

  if (!currentUser?.companyId) {
    return {
      error: "User is not associated with a company.",
    };
  }

  if (!companyName) {
    return { error: "Company name is required" };
  }

  if (!companyCode) {
    return { error: "Company code is required" };
  }

  try {
    // Check for duplicate company code
    const existingCode = await db.query.clients.findFirst({
      where: eq(clients.companyCode, companyCode),
    });

    if (existingCode) {
      return {
        error: `A client with Company Code "${companyCode}" already exists (${existingCode.companyName}). Please use a unique code.`,
      };
    }

    const [newClient] = await db
      .insert(clients)
      .values({
        companyId: currentUser.companyId,
        companyName,
        companyCode,
        email,
        phone,
        address,
        gstNumber,
        tdsApplicable,
        tdsRate: tdsApplicable ? tdsRate : "2.00",
      })
      .returning({
        id: clients.id,
      });

    // Automatically create opening balance if specified
    if (newClient?.id && openingBalance > 0) {
      const parsedDate = parseImportDate(openingBalanceDateStr);
      const validDate = parsedDate || new Date();

      await setOrUpdateClientOpeningBalance({
        companyId: currentUser.companyId,
        clientId: newClient.id,
        amount: openingBalance,
        type: openingBalanceType,
        asOfDate: validDate,
        notes: openingBalanceNotes,
        gstNumber,
        tdsApplicable,
        tdsRate: tdsApplicable ? tdsRate : "2.00",
      });
    }

    revalidatePath("/clients");
    return { success: true, clientId: newClient.id, companyName };
  } catch (err) {
    console.error("Create Client Error:", err);
    if (err.message && err.message.includes("clients_company_code_unique")) {
      return {
        error: `Company Code "${companyCode}" is already in use by another client.`,
      };
    }
    return {
      error: err.message || "Failed to create client",
    };
  }
}

// Get clients
export async function getClients(search = "", letter = "") {
  const conditions = [];

  /* SEARCH CONDITION */
  if (search) {
    conditions.push(
      or(
        ilike(clients.companyName, `%${search}%`),
        ilike(clients.companyCode, `%${search}%`),
        ilike(clients.gstNumber, `%${search}%`),
      ),
    );
  }

  /* ALPHABET CONDITION */
  if (letter && letter !== "ALL") {
    conditions.push(sql`UPPER(${clients.companyName}) LIKE ${letter + "%"}`);
  }

  return await db
    .select()
    .from(clients)
    .where(conditions.length ? and(...conditions) : undefined)
    .orderBy(sql`LOWER(${clients.companyName})`);
}

export async function getClientById(id) {
  const client = await db
    .select()
    .from(clients)
    .where(and(eq(clients.id, id), isNull(clients.deletedAt)))
    .limit(1);

  return client[0] || null;
}

// Update client
export async function updateClient(id, prevState, formData) {
  const companyName = formData.get("companyName");
  const companyCode = formData.get("companyCode");
  const gstNumber = formData.get("gstNumber");
  const tdsApplicable = formData.get("tdsApplicable") === "on";
  const rawTdsRate = formData.get("tdsRate");
  const parsedTdsRate = rawTdsRate ? parseFloat(rawTdsRate) : 2.0;
  const tdsRate = !isNaN(parsedTdsRate) ? parsedTdsRate.toFixed(2) : "2.00";

  if (!companyName) {
    return { error: "Company name is required" };
  }

  if (!companyCode) {
    return { error: "Company code is required" };
  }

  try {
    await db
      .update(clients)
      .set({
        companyName,
        companyCode,
        email: formData.get("email"),
        phone: formData.get("phone"),
        gstNumber,
        tdsApplicable,
        tdsRate: tdsApplicable ? tdsRate : "2.00",
        isActive: formData.get("isActive") === "true",
        updatedAt: new Date(),
      })
      .where(eq(clients.id, id));

    revalidatePath(`/clients/${id}`);
    revalidatePath("/clients");
    return { success: true };
  } catch (err) {
    return { error: "Failed to update client" };
  }
}
