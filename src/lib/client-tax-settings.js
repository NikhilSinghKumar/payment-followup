import { db } from "@/db";
import { clients } from "@/db/schema";
import { eq } from "drizzle-orm";

/**
 * Fetch GST & TDS settings for a client.
 *
 * @param {number} clientId
 * @returns {Promise<{
 *   gstNumber: string | null,
 *   tdsApplicable: boolean,
 *   tdsRate: string | number | null
 * }>}
 */
export async function getClientTaxSettings(clientId) {
  const client = await db.query.clients.findFirst({
    where: eq(clients.id, clientId),
    columns: {
      gstNumber: true,
      tdsApplicable: true,
      tdsRate: true,
    },
  });

  if (!client) {
    throw new Error(`Client with ID ${clientId} not found.`);
  }

  return {
    ...client,
    tdsRate: client.tdsRate ? Number(client.tdsRate) : 2.0,
  };
}
