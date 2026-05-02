"use server";

import { db } from "@/db";
import { clients } from "@/db/schema";

// ✅ Create client
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

// ✅ Get clients
export async function getClients() {
  return await db.select().from(clients);
}
