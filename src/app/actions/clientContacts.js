"use server";

import { db } from "@/db";
import {
  clientContacts,
  clientContactEmails,
  clientContactNumbers,
  clientContactLocations,
  clientLocations,
} from "@/db/schema";

import { and, eq, isNull } from "drizzle-orm";

import { revalidatePath } from "next/cache";

export async function getClientContactsByClientId(clientId) {
  try {
    return await db.query.clientContacts.findMany({
      where: and(
        eq(clientContacts.clientId, Number(clientId)),
        isNull(clientContacts.deletedAt),
      ),

      with: {
        emails: {
          where: isNull(clientContactEmails.deletedAt),
        },

        numbers: {
          where: isNull(clientContactNumbers.deletedAt),
        },

        contactLocations: {
          with: {
            location: true,
          },
        },
      },

      orderBy: (contacts, { asc }) => [asc(contacts.name)],
    });
  } catch (error) {
    console.error("Get client contacts error:", error);
    throw error;
  }
}

export async function getClientContactById(contactId) {
  try {
    return await db.query.clientContacts.findFirst({
      where: and(
        eq(clientContacts.id, Number(contactId)),
        isNull(clientContacts.deletedAt),
      ),

      with: {
        emails: {
          where: isNull(clientContactEmails.deletedAt),
        },

        numbers: {
          where: isNull(clientContactNumbers.deletedAt),
        },

        contactLocations: {
          with: {
            location: true,
          },
        },
      },
    });
  } catch (error) {
    console.error("Get client contact error:", error);
    throw error;
  }
}
