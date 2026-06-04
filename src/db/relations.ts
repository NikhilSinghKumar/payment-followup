import { relations } from "drizzle-orm";
import {
  clients,
  clientLocations,
  clientContacts,
  clientContactEmails,
  clientContactNumbers,
  clientContactLocations,
  invoices,
  payments,
} from "./schema";

export const clientsRelations = relations(clients, ({ many }) => ({
  locations: many(clientLocations),
  contacts: many(clientContacts),
  invoices: many(invoices),
  payments: many(payments),
}));

export const clientLocationsRelations = relations(
  clientLocations,
  ({ one, many }) => ({
    client: one(clients, {
      fields: [clientLocations.clientId],
      references: [clients.id],
    }),

    contactLocations: many(clientContactLocations),
  }),
);

export const clientContactsRelations = relations(
  clientContacts,
  ({ one, many }) => ({
    client: one(clients, {
      fields: [clientContacts.clientId],
      references: [clients.id],
    }),

    emails: many(clientContactEmails),
    numbers: many(clientContactNumbers),
    contactLocations: many(clientContactLocations),
  }),
);

export const clientContactEmailsRelations = relations(
  clientContactEmails,
  ({ one }) => ({
    contact: one(clientContacts, {
      fields: [clientContactEmails.contactId],
      references: [clientContacts.id],
    }),
  }),
);

export const clientContactNumbersRelations = relations(
  clientContactNumbers,
  ({ one }) => ({
    contact: one(clientContacts, {
      fields: [clientContactNumbers.contactId],
      references: [clientContacts.id],
    }),
  }),
);

export const clientContactLocationsRelations = relations(
  clientContactLocations,
  ({ one }) => ({
    contact: one(clientContacts, {
      fields: [clientContactLocations.contactId],
      references: [clientContacts.id],
    }),

    location: one(clientLocations, {
      fields: [clientContactLocations.locationId],
      references: [clientLocations.id],
    }),
  }),
);
