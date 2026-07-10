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
  paymentAllocations,
  clientSubClients,
  followups,
  invoiceAwbs,
  users,
  sessions,
  companies,
  companyUsers,
} from "./schema";

export const usersRelations = relations(users, ({ many }) => ({
  sessions: many(sessions),
  companyUsers: many(companyUsers),
}));

export const sessionsRelations = relations(sessions, ({ one }) => ({
  user: one(users, {
    fields: [sessions.userId],
    references: [users.id],
  }),
}));

export const companiesRelations = relations(companies, ({ many }) => ({
  companyUsers: many(companyUsers),
  clients: many(clients),
  invoices: many(invoices),
  payments: many(payments),
  followups: many(followups),
}));

export const companyUsersRelations = relations(companyUsers, ({ one }) => ({
  company: one(companies, {
    fields: [companyUsers.companyId],
    references: [companies.id],
  }),

  user: one(users, {
    fields: [companyUsers.userId],
    references: [users.id],
  }),

  // role: one(roles, {
  //   fields: [companyUsers.roleId],
  //   references: [roles.id],
  // }),
}));

export const clientsRelations = relations(clients, ({ one, many }) => ({
  company: one(companies, {
    fields: [clients.companyId],
    references: [companies.id],
  }),
  locations: many(clientLocations),
  contacts: many(clientContacts),
  invoices: many(invoices),
  payments: many(payments),
  subClients: many(clientSubClients),
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

export const clientSubClientsRelations = relations(
  clientSubClients,
  ({ one, many }) => ({
    client: one(clients, {
      fields: [clientSubClients.clientId],
      references: [clients.id],
    }),

    invoices: many(invoices),
  }),
);

export const invoicesRelations = relations(invoices, ({ one, many }) => ({
  company: one(companies, {
    fields: [invoices.companyId],
    references: [companies.id],
  }),
  client: one(clients, {
    fields: [invoices.clientId],
    references: [clients.id],
  }),

  subClient: one(clientSubClients, {
    fields: [invoices.subClientId],
    references: [clientSubClients.id],
  }),

  payments: many(payments),
  followups: many(followups),
  awbs: many(invoiceAwbs),
}));

export const paymentsRelations = relations(payments, ({ one, many }) => ({
  company: one(companies, {
    fields: [payments.companyId],
    references: [companies.id],
  }),

  client: one(clients, {
    fields: [payments.clientId],
    references: [clients.id],
  }),

  invoice: one(invoices, {
    fields: [payments.invoiceId],
    references: [invoices.id],
  }),

  allocations: many(paymentAllocations),
}));

export const paymentAllocationsRelations = relations(
  paymentAllocations,
  ({ one }) => ({
    payment: one(payments, {
      fields: [paymentAllocations.paymentId],
      references: [payments.id],
    }),

    invoice: one(invoices, {
      fields: [paymentAllocations.invoiceId],
      references: [invoices.id],
    }),
  }),
);

export const followupsRelations = relations(followups, ({ one }) => ({
  company: one(companies, {
    fields: [followups.companyId],
    references: [companies.id],
  }),

  invoice: one(invoices, {
    fields: [followups.invoiceId],
    references: [invoices.id],
  }),
}));

export const invoiceAwbsRelations = relations(invoiceAwbs, ({ one }) => ({
  invoice: one(invoices, {
    fields: [invoiceAwbs.invoiceId],
    references: [invoices.id],
  }),
}));
