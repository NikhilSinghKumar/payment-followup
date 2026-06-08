"use server";

import { db } from "@/db";

import {
  clientContacts,
  clientContactEmails,
  clientContactNumbers,
  clientContactLocations,
} from "@/db/schema";

import { and, eq, isNull } from "drizzle-orm";
import { revalidatePath } from "next/cache";

export async function createClientContact(data) {
  try {
    await db.transaction(async (tx) => {
      if (data.isPrimary) {
        await tx
          .update(clientContacts)
          .set({
            isPrimary: false,
          })
          .where(eq(clientContacts.clientId, data.clientId));
      }

      if (!data.name?.trim()) {
        return {
          success: false,
          error: "Contact name is required",
        };
      }

      const [contact] = await tx
        .insert(clientContacts)
        .values({
          clientId: data.clientId,
          name: data.name,
          designation: data.designation,
          department: data.department,
          status: data.status,
          isPrimary: data.isPrimary,
          receivesInvoice: data.receivesInvoice,
          receivesFollowup: data.receivesFollowup,
          receivesEscalation: data.receivesEscalation,
          notes: data.notes,
        })
        .returning();

      if (data.emails?.length) {
        await tx.insert(clientContactEmails).values(
          data.emails.map((email) => ({
            contactId: contact.id,
            email: email.email,
            label: email.label,
            isPrimary: email.isPrimary,
          })),
        );
      }

      if (data.numbers?.length) {
        await tx.insert(clientContactNumbers).values(
          data.numbers.map((number) => ({
            contactId: contact.id,
            number: number.number,
            type: number.type,
            countryCode: number.countryCode,
            isPrimary: number.isPrimary,
            isWhatsapp: number.isWhatsapp,
          })),
        );
      }

      if (data.locationIds?.length) {
        await tx.insert(clientContactLocations).values(
          data.locationIds.map((locationId) => ({
            contactId: contact.id,
            locationId,
          })),
        );
      }
    });
    revalidatePath(`/clients/${data.clientId}`);

    return {
      success: true,
    };
  } catch (error) {
    console.error("Create contact error:", error);

    return {
      success: false,
      error: "Failed to create contact",
    };
  }
}

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

export async function updateClientContact(contactId, data) {
  try {
    if (!contactId) {
      return {
        success: false,
        error: "Contact ID is required",
      };
    }
    await db.transaction(async (tx) => {
      // =====================================
      // PRIMARY CONTACT
      // =====================================

      if (data.isPrimary) {
        await tx
          .update(clientContacts)
          .set({
            isPrimary: false,
          })
          .where(eq(clientContacts.clientId, data.clientId));
      }

      // =====================================
      // UPDATE CONTACT
      // =====================================

      await tx
        .update(clientContacts)
        .set({
          name: data.name,
          designation: data.designation,
          department: data.department,

          status: data.status,

          isPrimary: data.isPrimary,

          receivesInvoice: data.receivesInvoice,
          receivesFollowup: data.receivesFollowup,
          receivesEscalation: data.receivesEscalation,

          notes: data.notes,

          updatedAt: new Date(),
        })
        .where(eq(clientContacts.id, contactId));

      // =====================================
      // EMAILS
      // =====================================

      await tx
        .update(clientContactEmails)
        .set({
          deletedAt: new Date(),
        })
        .where(
          and(
            eq(clientContactEmails.contactId, contactId),
            isNull(clientContactEmails.deletedAt),
          ),
        );

      if (data.emails?.length) {
        await tx.insert(clientContactEmails).values(
          data.emails.map((email) => ({
            contactId,

            email: email.email,

            label: email.label,

            isPrimary: email.isPrimary,
          })),
        );
      }

      // =====================================
      // NUMBERS
      // =====================================

      await tx
        .update(clientContactNumbers)
        .set({
          deletedAt: new Date(),
        })
        .where(
          and(
            eq(clientContactNumbers.contactId, contactId),
            isNull(clientContactNumbers.deletedAt),
          ),
        );

      if (data.numbers?.length) {
        await tx.insert(clientContactNumbers).values(
          data.numbers.map((number) => ({
            contactId,

            number: number.number,

            type: number.type,

            countryCode: number.countryCode,

            isPrimary: number.isPrimary,

            isWhatsapp: number.isWhatsapp,
          })),
        );
      }

      // =====================================
      // LOCATIONS
      // =====================================

      await tx
        .delete(clientContactLocations)
        .where(eq(clientContactLocations.contactId, contactId));

      if (data.locationIds?.length) {
        await tx.insert(clientContactLocations).values(
          data.locationIds.map((locationId) => ({
            contactId,

            locationId,
          })),
        );
      }
    });

    revalidatePath(`/clients/${data.clientId}`);

    return {
      success: true,
    };
  } catch (error) {
    console.error("Update contact error:", error);

    return {
      success: false,
      error: error?.message || "Failed to update contact",
    };
  }
}
