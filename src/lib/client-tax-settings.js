import { db } from "@/db";
import { clients } from "@/db/schema";
import { eq } from "drizzle-orm";

/**
 * Fetch GST & TDS settings for a client.
 *
 * @param {number} clientId
 * @returns {Promise<{
 *   gstNumber: string | null,
 *   tdsApplicable: boolean
 * }>}
 */
export async function getClientTaxSettings(clientId) {
  const client = await db.query.clients.findFirst({
    where: eq(clients.id, clientId),
    columns: {
      gstNumber: true,
      tdsApplicable: true,
    },
  });

  if (!client) {
    throw new Error(`Client with ID ${clientId} not found.`);
  }

  return client;
}
