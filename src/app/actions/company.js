"use server";

import { db } from "@/db";
import { companies, companyUsers } from "@/db/schema";
import { and, asc, desc, eq, ilike, sql } from "drizzle-orm";
import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";

import { AUTH_MESSAGES } from "@/lib/auth/constants";

function fail(message) {
  return {
    success: false,
    message,
  };
}

function ok(message = null) {
  return {
    success: true,
    message,
  };
}

export async function getCompanies({
  search = "",
  activeOnly = false,
  sort = "name",
} = {}) {
  const conditions = [];

  if (search) {
    conditions.push(ilike(companies.companyName, `%${search}%`));
  }

  if (activeOnly) {
    conditions.push(eq(companies.isActive, true));
  }

  const orderBy =
    sort === "name" ? asc(companies.companyName) : desc(companies.createdAt);

  return await db
    .select({
      ...companies,
      userCount: sql`count(${companyUsers.id})`,
    })
    .from(companies)
    .leftJoin(
      companyUsers,
      and(
        eq(companyUsers.companyId, companies.id),
        eq(companyUsers.isActive, true),
      ),
    )
    .where(conditions.length ? and(...conditions) : undefined)
    .groupBy(companies.id)
    .orderBy(orderBy);
}

// ==========================================
// CREATE COMPANY
// ==========================================

export async function createCompany(prevState, formData) {
  try {
    // -----------------------------------------
    // Get Form Values
    // -----------------------------------------

    const companyName = String(formData.get("companyName") || "").trim();

    const companyCode = String(formData.get("companyCode") || "")
      .trim()
      .toUpperCase();

    const gstNumber = String(formData.get("gstNumber") || "").trim();

    const email = String(formData.get("email") || "")
      .trim()
      .toLowerCase();

    const phone = String(formData.get("phone") || "").trim();

    const address = String(formData.get("address") || "").trim();

    const city = String(formData.get("city") || "").trim();

    const state = String(formData.get("state") || "").trim();
    const pincode = String(formData.get("pincode") || "").trim();
    const country = String(formData.get("country") || "").trim() || "India";

    const isActive = formData.get("isActive") === "on";

    // -----------------------------------------
    // Validation
    // -----------------------------------------

    if (!companyName) {
      return fail("Company name is required.");
    }

    if (!companyCode) {
      return fail("Company code is required.");
    }

    // -----------------------------------------
    // Duplicate Company Code
    // -----------------------------------------

    const existingCompany = await db.query.companies.findFirst({
      where: eq(companies.companyCode, companyCode),
    });

    if (existingCompany) {
      return fail("Company code already exists.");
    }

    // -----------------------------------------
    // Create Company
    // -----------------------------------------

    await db.insert(companies).values({
      companyName,
      companyCode,
      gstNumber: gstNumber || null,
      email: email || null,
      phone: phone || null,
      address: address || null,
      city: city || null,
      state: state || null,
      pincode: pincode || null,
      country,
      isActive,
    });

    // -----------------------------------------
    // Refresh Companies Page
    // -----------------------------------------

    revalidatePath("/companies");

    return ok("Company created successfully.");
  } catch (error) {
    console.error("Create Company Error:", error);

    return fail("Unable to create company.");
  }
}

// ==========================================
// GET COMPANY BY ID
// ==========================================

export async function getCompanyById(id) {
  try {
    const company = await db.query.companies.findFirst({
      where: eq(companies.id, Number(id)),
    });

    return company || null;
  } catch (error) {
    console.error("getCompanyById error:", error);
    return null;
  }
}

// ==========================================
// UPDATE COMPANY
// ==========================================

export async function updateCompany(companyId, prevState, formData) {
  try {
    const numericId = Number(companyId);
    if (!numericId) {
      return fail("Invalid company ID.");
    }

    const companyName = String(formData.get("companyName") || "").trim();
    const companyCode = String(formData.get("companyCode") || "")
      .trim()
      .toUpperCase();
    const gstNumber = String(formData.get("gstNumber") || "").trim();
    const email = String(formData.get("email") || "")
      .trim()
      .toLowerCase();
    const phone = String(formData.get("phone") || "").trim();
    const address = String(formData.get("address") || "").trim();
    const city = String(formData.get("city") || "").trim();
    const state = String(formData.get("state") || "").trim();
    const pincode = String(formData.get("pincode") || "").trim();
    const country = String(formData.get("country") || "").trim() || "India";
    const isActive = formData.get("isActive") === "on";

    const bankName = String(formData.get("bankName") || "").trim();
    const bankAccountNumber = String(
      formData.get("bankAccountNumber") || "",
    ).trim();
    const bankIfsc = String(formData.get("bankIfsc") || "").trim();
    const bankBranch = String(formData.get("bankBranch") || "").trim();
    const bankUpi = String(formData.get("bankUpi") || "").trim();

    if (!companyName) {
      return fail("Company name is required.");
    }

    if (!companyCode) {
      return fail("Company code is required.");
    }

    // Check duplicate code for different company
    const existing = await db.query.companies.findFirst({
      where: and(
        eq(companies.companyCode, companyCode),
        sql`${companies.id} != ${numericId}`,
      ),
    });

    if (existing) {
      return fail("Company code already used by another company.");
    }

    await db
      .update(companies)
      .set({
        companyName,
        companyCode,
        gstNumber: gstNumber || null,
        email: email || null,
        phone: phone || null,
        address: address || null,
        city: city || null,
        state: state || null,
        pincode: pincode || null,
        country,
        isActive,
        bankName: bankName || null,
        bankAccountNumber: bankAccountNumber || null,
        bankIfsc: bankIfsc || null,
        bankBranch: bankBranch || null,
        bankUpi: bankUpi || null,
        updatedAt: new Date(),
      })
      .where(eq(companies.id, numericId));

    revalidatePath("/companies");
    revalidatePath(`/companies/${numericId}`);
    revalidatePath(`/companies/${numericId}/edit`);

    return ok("Company updated successfully.");
  } catch (error) {
    console.error("Update Company Error:", error);
    return fail("Unable to update company details.");
  }
}
