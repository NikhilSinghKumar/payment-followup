"use server";

import { db } from "@/db";
import { clients, invoices } from "@/db/schema";
import { ilike, or, and, sql, eq, isNull } from "drizzle-orm";
import { getCurrentUser } from "@/lib/auth/auth";
import { getFinancialYear } from "@/lib/financial-year";
import { calculateInvoiceStatus } from "@/lib/invoice-status";

// Create client
export async function createClient(prevState, formData) {
  const companyName = formData.get("companyName");
  const companyCode = formData.get("companyCode")?.trim().toUpperCase();
  const email = formData.get("email");
  const phone = formData.get("phone");
  const gstNumber = formData.get("gstNumber")?.trim().toUpperCase();

  const tdsApplicable = formData.get("tdsApplicable") === "on";

  const rawOpeningBalance = formData.get("openingBalance");
  const openingBalance = rawOpeningBalance ? parseFloat(rawOpeningBalance) : 0;
  const openingBalanceDateStr = formData.get("openingBalanceDate");
  const openingBalanceNotes =
    formData.get("openingBalanceNotes")?.trim() || "Opening Balance";

  const currentUser = await getCurrentUser();

  if (!currentUser.user) {
    return {
      error: "Unauthorized",
    };
  }

  if (!currentUser.companyId) {
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

  if (!gstNumber) {
    return { error: "GST No. is required" };
  }

  try {
    const [newClient] = await db
      .insert(clients)
      .values({
        companyId: currentUser.companyId,
        companyName,
        companyCode,
        email,
        phone,
        gstNumber,
        tdsApplicable,
      })
      .returning({
        id: clients.id,
      });

    // Automatically create opening balance virtual invoice if specified
    if (newClient?.id && openingBalance > 0) {
      const asOfDate = openingBalanceDateStr
        ? new Date(openingBalanceDateStr)
        : new Date();
      const validDate = isNaN(asOfDate.getTime()) ? new Date() : asOfDate;
      const financialYear = getFinancialYear(validDate);
      const invoiceNumber = `OPENING-BAL-${companyCode}-${financialYear}`;

      const statusResult = calculateInvoiceStatus({
        netPayable: openingBalance,
        paid: 0,
        dueDate: validDate,
      });

      await db.insert(invoices).values({
        companyId: currentUser.companyId,
        clientId: newClient.id,
        subClientId: null,
        financialYear,
        invoiceNumber,
        invoiceDate: validDate,
        dueDate: validDate,
        paymentTerms: 0,
        invoiceAmount: openingBalance.toFixed(2),
        basicAmount: openingBalance.toFixed(2),
        cgstAmount: "0.00",
        sgstAmount: "0.00",
        igstAmount: "0.00",
        tdsAmount: "0.00",
        deductionAmount: "0.00",
        otherCharges: "0.00",
        netPayableAmount: openingBalance.toFixed(2),
        paidAmount: "0.00",
        outstandingAmount: openingBalance.toFixed(2),
        gstNumberUsed: gstNumber || null,
        tdsApplicableUsed: tdsApplicable || false,
        status: statusResult.status,
        isOpeningBalance: true,
        notes: openingBalanceNotes,
      });
    }

    return { success: true };
  } catch (err) {
    console.error("Create Client Error:");
    console.error(err);

    return {
      error: err.message,
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
        isActive: formData.get("isActive") === "true",
        updatedAt: new Date(),
      })
      .where(eq(clients.id, id));

    return { success: true };
  } catch (err) {
    return { error: "Failed to update client" };
  }
}
