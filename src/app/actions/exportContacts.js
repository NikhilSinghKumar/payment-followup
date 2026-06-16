"use server";

import { getClientContactsByClientId } from "./clientContacts";

export async function exportContacts(clientId) {
  try {
    const contacts = await getClientContactsByClientId(clientId);

    return contacts.map((contact) => ({
      name: contact.name || "",
      designation: contact.designation || "",
      department: contact.department || "",
      emails: contact.emails?.map((email) => email.email).join("|") || "",
      numbers: contact.numbers?.map((number) => number.number).join("|") || "",
      is_primary: contact.isPrimary,
      receives_invoice: contact.receivesInvoice,
      receives_followup: contact.receivesFollowup,
      receives_escalation: contact.receivesEscalation,
      status: contact.status,
      notes: contact.notes || "",
    }));
  } catch (error) {
    console.error("Export contacts error:", error);

    return [];
  }
}
