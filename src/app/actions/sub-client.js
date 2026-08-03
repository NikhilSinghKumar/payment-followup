"use server";

import { db } from "@/db";
import { revalidatePath } from "next/cache";
import { clients, clientSubClients } from "@/db/schema";
import { ilike, or, and, sql, eq, isNull } from "drizzle-orm";
import { redirect } from "next/navigation";
import { getCurrentUser } from "@/lib/auth/auth";

// =====================================================
// CREATE SUB CLIENT
// =====================================================

export async function createSubClient(clientId, prevState, formData) {
  const companyName = formData.get("companyName");
  const companyCode = formData.get("companyCode");
  const gstNumber = formData.get("gstNumber");

  const tdsApplicable = formData.get("tdsApplicable") === "on";

  if (!companyName) {
    return { error: "Company name is required" };
  }

  if (!gstNumber) {
    return { error: "GST Number is required" };
  }

  try {
    await db.insert(clientSubClients).values({
      clientId,

      companyName,
      companyCode,
      gstNumber,

      address: formData.get("address"),
      city: formData.get("city"),
      state: formData.get("state"),
      pincode: formData.get("pincode"),

      tdsApplicable,
    });

    return { success: true };
  } catch (err) {
    return {
      error: "Failed to create sub client",
    };
  }
}

// GET SUBCLIENT

export async function getSubClients() {
  const currentUser = await getCurrentUser();

  if (!currentUser.user || !currentUser.companyId) {
    return [];
  }

  const companyId = currentUser.companyId;

  return await db
    .select({
      id: clientSubClients.id,
      clientId: clientSubClients.clientId,
      companyName: clientSubClients.companyName,
      companyCode: clientSubClients.companyCode,
      gstNumber: clientSubClients.gstNumber,
      tdsApplicable: clientSubClients.tdsApplicable,
      isActive: clientSubClients.isActive,
    })
    .from(clientSubClients)
    .innerJoin(clients, eq(clientSubClients.clientId, clients.id))
    .where(
      and(
        eq(clients.companyId, companyId),
        eq(clientSubClients.isActive, true),
        isNull(clientSubClients.deletedAt),
      ),
    );
}

// =====================================================
// GET SUB CLIENTS OF A CLIENT
// =====================================================

export async function getSubClientsByClientId(
  clientId,
  search = "",
  letter = "",
) {
  const conditions = [
    eq(clientSubClients.clientId, clientId),
    isNull(clientSubClients.deletedAt),
  ];

  if (search) {
    conditions.push(
      or(
        ilike(clientSubClients.companyName, `%${search}%`),
        ilike(clientSubClients.companyCode, `%${search}%`),
        ilike(clientSubClients.gstNumber, `%${search}%`),
      ),
    );
  }

  if (letter && letter !== "ALL") {
    conditions.push(
      sql`UPPER(${clientSubClients.companyName}) LIKE ${letter + "%"}`,
    );
  }

  return await db
    .select()
    .from(clientSubClients)
    .where(and(...conditions))
    .orderBy(sql`LOWER(${clientSubClients.companyName})`);
}

// =====================================================
// GET SINGLE SUB CLIENT
// =====================================================

export async function getSubClientById(id) {
  return await db.query.clientSubClients.findFirst({
    where: (clientSubClients, { eq, and, isNull }) =>
      and(eq(clientSubClients.id, id), isNull(clientSubClients.deletedAt)),
  });
}

// =====================================================
// UPDATE SUB CLIENT
// =====================================================

export async function updateSubClient(prevState, formData) {
  const id = formData.get("id");
  const clientId = formData.get("clientId");

  const companyName = formData.get("companyName");
  const companyCode = formData.get("companyCode");
  const gstNumber = formData.get("gstNumber");
  const email = formData.get("email");
  const phone = formData.get("phone");
  const address = formData.get("address");
  const city = formData.get("city");
  const state = formData.get("state");
  const pincode = formData.get("pincode");
  const tdsApplicable = formData.get("tdsApplicable") === "on";

  if (!companyName) {
    return {
      success: false,
      message: "Company name is required.",
    };
  }

  await db
    .update(clientSubClients)
    .set({
      companyName,
      companyCode,
      gstNumber,
      email,
      phone,
      address,
      city,
      state,
      pincode,
      tdsApplicable,
      updatedAt: new Date(),
    })
    .where(eq(clientSubClients.id, id));

  revalidatePath(`/clients/${clientId}`);

  return {
    success: true,
    message: "Sub client updated successfully.",
  };
}

// =====================================================
// DELETE SUB CLIENT (SOFT DELETE)
// =====================================================

export async function deleteSubClient(clientId, subClientId) {
  try {
    await db
      .update(clientSubClients)
      .set({
        deletedAt: new Date(),
        updatedAt: new Date(),
      })
      .where(eq(clientSubClients.id, subClientId));

    revalidatePath(`/clients/${clientId}`);

    redirect(`/clients/${clientId}?tab=sub-clients`);
  } catch (error) {
    return {
      error: "Failed to delete sub client.",
    };
  }
}
