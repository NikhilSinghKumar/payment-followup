"use server";

import { db } from "@/db";
import {
  clientContacts,
  clientContactEmails,
  clientContactNumbers,
} from "@/db/schema";

import { and, eq, isNull } from "drizzle-orm";

export async function getClientContactsByClientId(clientId) {
  try {
    const contacts = await db.query.clientContacts.findMany({
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

    return contacts.map(({ contactLocations, ...contact }) => ({
      ...contact,

      locations:
        contactLocations?.map((contactLocation) => contactLocation.location) ||
        [],
    }));
  } catch (error) {
    console.error("Get client contacts error:", error);
    throw error;
  }
}

export async function getClientContactById(contactId) {
  try {
    const contact = await db.query.clientContacts.findFirst({
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

    if (!contact) return null;

    const { contactLocations, ...contactData } = contact;

    return {
      ...contactData,

      locations:
        contactLocations?.map((contactLocation) => contactLocation.location) ||
        [],
    };
  } catch (error) {
    console.error("Get client contact error:", error);
    throw error;
  }
}
