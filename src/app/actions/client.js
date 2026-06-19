"use server";

import { db } from "@/db";
import { clients } from "@/db/schema";
import { ilike, or, and, sql, eq, isNull } from "drizzle-orm";

// Create client
export async function createClient(prevState, formData) {
  const companyName = formData.get("companyName");
  const companyCode = formData.get("companyCode");
  const email = formData.get("email");
  const phone = formData.get("phone");
  const gstNumber = formData.get("gstNumber");

  if (!companyName) {
    throw new Error("Company name is required");
  }

  if (!companyCode) {
    throw new Error("Company code is required");
  }

  try {
    await db.insert(clients).values({
      companyName: formData.get("companyName"),
      companyCode: formData.get("companyCode"),
      email: formData.get("email"),
      phone: formData.get("phone"),
      gstNumber: formData.get("gstNumber"),
    });

    return { success: true };
  } catch (err) {
    return { error: "Client already exists or failed" };
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
        isActive: formData.get("isActive") === "true",
        updatedAt: new Date(),
      })
      .where(eq(clients.id, id));

    return { success: true };
  } catch (err) {
    return { error: "Failed to update client" };
  }
}
