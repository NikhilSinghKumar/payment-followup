import {
  pgTable,
  serial,
  text,
  integer,
  numeric,
  timestamp,
  date,
  boolean,
  uniqueIndex,
} from "drizzle-orm/pg-core";

// =========================
// USERS
// =========================
export const users = pgTable("users", {
  id: serial("id").primaryKey(),

  name: text("name"),
  email: text("email").notNull().unique(),

  createdAt: timestamp("created_at", { withTimezone: true }).defaultNow(),
});

// =========================
// CLIENTS
// =========================
export const clients = pgTable("clients", {
  id: serial("id").primaryKey(),

  companyName: text("company_name").notNull(),
  email: text("email"),
  phone: text("phone"),

  companyCode: text("company_code").notNull().unique(),
  gstNumber: text("gst_number"),

  address: text("address"),

  createdAt: timestamp("created_at", { withTimezone: true }).defaultNow(),
  updatedAt: timestamp("updated_at", { withTimezone: true }).defaultNow(),
});

// =========================
// INVOICES
// =========================
export const invoices = pgTable(
  "invoices",
  {
    id: serial("id").primaryKey(),

    clientId: integer("client_id")
      .references(() => clients.id)
      .notNull(),

    invoiceNumber: text("invoice_number"),

    amount: numeric("amount", { precision: 12, scale: 2 }).notNull(),

    status: text("status")
      .$type<"pending" | "partial" | "paid">()
      .default("pending"),

    // ✅ renamed
    invoiceFromDate: date("invoice_from_date"),

    // ✅ new column
    invoiceToDate: date("invoice_to_date"),

    dueDate: date("due_date"),

    notes: text("notes"),

    createdAt: timestamp("created_at", { withTimezone: true }).defaultNow(),
    updatedAt: timestamp("updated_at", { withTimezone: true }).defaultNow(),
  },
  (table) => {
    return {
      // ✅ updated uniqueness
      uniqueInvoice: uniqueIndex("unique_invoice").on(
        table.clientId,
        table.amount,
        table.invoiceFromDate,
        table.invoiceToDate,
      ),
    };
  },
);

// =========================
// PAYMENTS (IMPORTANT)
// =========================
export const payments = pgTable("payments", {
  id: serial("id").primaryKey(),

  invoiceId: integer("invoice_id")
    .references(() => invoices.id)
    .notNull(),

  amount: numeric("amount", { precision: 12, scale: 2 }).notNull(),

  paymentDate: timestamp("payment_date", { withTimezone: true }).defaultNow(),

  method: text("method"), // UPI, cash, bank
  reference: text("reference"),

  notes: text("notes"),

  isVoided: boolean("is_voided").default(false),

  createdAt: timestamp("created_at", { withTimezone: true }).defaultNow(),
});

// =========================
// FOLLOWUPS (CORE FEATURE)
// =========================
export const followups = pgTable("followups", {
  id: serial("id").primaryKey(),

  invoiceId: integer("invoice_id")
    .references(() => invoices.id)
    .notNull(),

  note: text("note").notNull(),

  followupDate: timestamp("followup_date", { withTimezone: true }),

  createdAt: timestamp("created_at", { withTimezone: true }).defaultNow(),
});
