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
    .where(conditions.length ? and(...conditions) : undefined);
}

export async function getClientById(id) {
  const client = await db
    .select()
    .from(clients)
    .where(and(eq(clients.id, id), isNull(clients.deletedAt)))
    .limit(1);

  return client[0] || null;
}
