import {
  pgTable,
  serial,
  text,
  integer,
  numeric,
  timestamp,
  date,
  boolean,
  index,
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
  deletedAt: timestamp("deleted_at", {
    withTimezone: true,
  }),
});

// =====================================================
// CLIENT LOCATIONS
// =====================================================

export const clientLocations = pgTable(
  "client_locations",
  {
    id: serial("id").primaryKey(),

    // =====================================================
    // CLIENT
    // =====================================================

    clientId: integer("client_id")
      .references(() => clients.id, {
        onDelete: "cascade",
      })
      .notNull(),

    // =====================================================
    // LOCATION INFO
    // =====================================================

    name: text("name").notNull(),
    // Example:
    // Delhi HO
    // Gurgaon Branch

    code: text("code"),

    type: text("type").$type<
      "head_office" | "branch" | "warehouse" | "billing"
    >(),

    // =====================================================
    // ADDRESS
    // =====================================================

    address: text("address"),

    city: text("city"),

    state: text("state"),

    pincode: text("pincode"),

    country: text("country").default("India"),

    // =====================================================
    // TAX
    // =====================================================

    gstNumber: text("gst_number"),

    // =====================================================
    // FLAGS
    // =====================================================

    isPrimary: boolean("is_primary").default(false),

    isActive: boolean("is_active").default(true),

    // =====================================================
    // AUDIT
    // =====================================================

    createdAt: timestamp("created_at", {
      withTimezone: true,
    }).defaultNow(),

    updatedAt: timestamp("updated_at", {
      withTimezone: true,
    }).defaultNow(),

    deletedAt: timestamp("deleted_at", {
      withTimezone: true,
    }),
  },
  (table) => {
    return {
      // =====================================================
      // INDEXES
      // =====================================================

      clientIdx: index("client_location_client_idx").on(table.clientId),

      cityIdx: index("client_location_city_idx").on(table.city),

      stateIdx: index("client_location_state_idx").on(table.state),

      gstIdx: index("client_location_gst_idx").on(table.gstNumber),

      primaryIdx: index("client_location_primary_idx").on(
        table.clientId,
        table.isPrimary,
      ),

      uniqueLocationCode: uniqueIndex("unique_client_location_code").on(
        table.clientId,
        table.code,
      ),
    };
  },
);

// =====================================================
// CLIENT CONTACTS
// =====================================================

export const clientContacts = pgTable(
  "client_contacts",
  {
    id: serial("id").primaryKey(),

    // =====================================================
    // CLIENT
    // =====================================================

    clientId: integer("client_id")
      .references(() => clients.id, {
        onDelete: "cascade",
      })
      .notNull(),

    // =====================================================
    // CONTACT INFO
    // =====================================================

    name: text("name").notNull(),

    designation: text("designation"),

    department: text("department"),

    // =====================================================
    // FLAGS
    // =====================================================

    isPrimary: boolean("is_primary").default(false),

    isActive: boolean("is_active").default(true),

    // =====================================================
    // NOTES
    // =====================================================

    notes: text("notes"),

    // =====================================================
    // AUDIT
    // =====================================================

    createdAt: timestamp("created_at", {
      withTimezone: true,
    }).defaultNow(),

    updatedAt: timestamp("updated_at", {
      withTimezone: true,
    }).defaultNow(),

    deletedAt: timestamp("deleted_at", {
      withTimezone: true,
    }),
  },
  (table) => {
    return {
      // =====================================================
      // INDEXES
      // =====================================================

      clientIdx: index("client_contact_client_idx").on(table.clientId),

      nameIdx: index("client_contact_name_idx").on(table.name),

      primaryIdx: index("client_contact_primary_idx").on(
        table.clientId,
        table.isPrimary,
      ),
    };
  },
);

// =====================================================
// CLIENT CONTACT LOCATIONS
// =====================================================

export const clientContactLocations = pgTable(
  "client_contact_locations",
  {
    id: serial("id").primaryKey(),

    // =====================================================
    // CONTACT
    // =====================================================

    contactId: integer("contact_id")
      .references(() => clientContacts.id, {
        onDelete: "cascade",
      })
      .notNull(),

    // =====================================================
    // LOCATION
    // =====================================================

    locationId: integer("location_id")
      .references(() => clientLocations.id, {
        onDelete: "cascade",
      })
      .notNull(),

    // =====================================================
    // FLAGS
    // =====================================================

    isPrimary: boolean("is_primary").default(false),

    // =====================================================
    // AUDIT
    // =====================================================

    createdAt: timestamp("created_at", {
      withTimezone: true,
    }).defaultNow(),
  },
  (table) => {
    return {
      // =====================================================
      // UNIQUENESS
      // =====================================================

      uniqueContactLocation: uniqueIndex("unique_contact_location").on(
        table.contactId,
        table.locationId,
      ),

      // =====================================================
      // INDEXES
      // =====================================================

      contactIdx: index("client_contact_location_contact_idx").on(
        table.contactId,
      ),

      locationIdx: index("client_contact_location_location_idx").on(
        table.locationId,
      ),

      primaryIdx: index("client_contact_location_primary_idx").on(
        table.contactId,
        table.isPrimary,
      ),
    };
  },
);

// =====================================================
// CLIENT CONTACT NUMBERS
// =====================================================

export const clientContactNumbers = pgTable(
  "client_contact_numbers",
  {
    id: serial("id").primaryKey(),

    // =====================================================
    // CONTACT
    // =====================================================

    contactId: integer("contact_id")
      .references(() => clientContacts.id, {
        onDelete: "cascade",
      })
      .notNull(),

    // =====================================================
    // NUMBER INFO
    // =====================================================

    number: text("number").notNull(),

    type: text("type").$type<"mobile" | "whatsapp" | "landline" | "office">(),

    countryCode: text("country_code").default("+91"),

    // =====================================================
    // FLAGS
    // =====================================================

    isPrimary: boolean("is_primary").default(false),

    isWhatsapp: boolean("is_whatsapp").default(false),

    isActive: boolean("is_active").default(true),

    // =====================================================
    // AUDIT
    // =====================================================

    createdAt: timestamp("created_at", {
      withTimezone: true,
    }).defaultNow(),

    deletedAt: timestamp("deleted_at", {
      withTimezone: true,
    }),
  },
  (table) => {
    return {
      // =====================================================
      // INDEXES
      // =====================================================

      contactIdx: index("client_contact_number_contact_idx").on(
        table.contactId,
      ),

      numberIdx: index("client_contact_number_idx").on(table.number),

      primaryIdx: index("client_contact_number_primary_idx").on(
        table.contactId,
        table.isPrimary,
      ),
    };
  },
);

// =====================================================
// CLIENT CONTACT EMAILS
// =====================================================

export const clientContactEmails = pgTable(
  "client_contact_emails",
  {
    id: serial("id").primaryKey(),

    // =====================================================
    // CONTACT
    // =====================================================

    contactId: integer("contact_id")
      .references(() => clientContacts.id, {
        onDelete: "cascade",
      })
      .notNull(),

    // =====================================================
    // EMAIL INFO
    // =====================================================

    email: text("email").notNull(),

    label: text("label").$type<"work" | "personal" | "billing" | "accounts">(),

    // =====================================================
    // FLAGS
    // =====================================================

    isPrimary: boolean("is_primary").default(false),

    isActive: boolean("is_active").default(true),

    // =====================================================
    // AUDIT
    // =====================================================

    createdAt: timestamp("created_at", {
      withTimezone: true,
    }).defaultNow(),

    deletedAt: timestamp("deleted_at", {
      withTimezone: true,
    }),
  },
  (table) => {
    return {
      // =====================================================
      // INDEXES
      // =====================================================

      contactIdx: index("client_contact_email_contact_idx").on(table.contactId),

      emailIdx: index("client_contact_email_idx").on(table.email),

      primaryIdx: index("client_contact_email_primary_idx").on(
        table.contactId,
        table.isPrimary,
      ),

      uniqueEmailPerContact: uniqueIndex("unique_email_per_contact").on(
        table.contactId,
        table.email,
      ),
    };
  },
);

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

    // Example: 2025-26
    financialYear: text("financial_year").notNull(),

    // Example: INV-001
    invoiceNumber: text("invoice_number").notNull(),

    amount: numeric("amount", {
      precision: 12,
      scale: 2,
    }).notNull(),

    status: text("status")
      .$type<"pending" | "partial" | "paid" | "disputed">()
      .default("pending"),

    invoiceFromDate: date("invoice_from_date"),

    invoiceToDate: date("invoice_to_date"),

    dueDate: date("due_date"),

    notes: text("notes"),

    createdAt: timestamp("created_at", {
      withTimezone: true,
    }).defaultNow(),

    updatedAt: timestamp("updated_at", {
      withTimezone: true,
    }).defaultNow(),

    deletedAt: timestamp("deleted_at", {
      withTimezone: true,
    }),
  },
  (table) => {
    return {
      // =========================
      // UNIQUENESS
      // =========================

      uniqueInvoiceNumber: uniqueIndex("unique_invoice_number").on(
        table.clientId,
        table.financialYear,
        table.invoiceNumber,
      ),

      // =========================
      // INDEXES
      // =========================

      clientIdx: index("invoice_client_idx").on(table.clientId),

      statusIdx: index("invoice_status_idx").on(table.status),

      dueDateIdx: index("invoice_due_date_idx").on(table.dueDate),

      invoiceNumberIdx: index("invoice_number_idx").on(table.invoiceNumber),

      financialYearIdx: index("invoice_financial_year_idx").on(
        table.financialYear,
      ),
    };
  },
);

// =========================
// INVOICE AWBS
// =========================
export const invoiceAwbs = pgTable(
  "invoice_awbs",
  {
    id: serial("id").primaryKey(),

    invoiceId: integer("invoice_id")
      .references(() => invoices.id)
      .notNull(),

    awbNumber: text("awb_number").notNull(),

    shipmentDate: date("shipment_date"),

    origin: text("origin"),

    destination: text("destination"),

    weight: numeric("weight", {
      precision: 10,
      scale: 2,
    }),

    amount: numeric("amount", {
      precision: 12,
      scale: 2,
    }),

    remarks: text("remarks"),

    createdAt: timestamp("created_at", {
      withTimezone: true,
    }).defaultNow(),
    deletedAt: timestamp("deleted_at", {
      withTimezone: true,
    }),
  },
  (table) => {
    return {
      // =========================
      // UNIQUENESS
      // =========================

      uniqueAwbPerInvoice: uniqueIndex("unique_awb_per_invoice").on(
        table.invoiceId,
        table.awbNumber,
      ),

      // =========================
      // INDEXES
      // =========================

      invoiceIdx: index("invoice_awb_invoice_idx").on(table.invoiceId),

      awbIdx: index("invoice_awb_number_idx").on(table.awbNumber),

      shipmentDateIdx: index("invoice_awb_shipment_date_idx").on(
        table.shipmentDate,
      ),
    };
  },
);

// =========================
// PAYMENTS
// =========================

export const payments = pgTable(
  "payments",
  {
    id: serial("id").primaryKey(),

    invoiceId: integer("invoice_id").references(() => invoices.id),

    // =====================================
    // CLIENT (IMPORTANT)
    // =====================================

    // Future-safe:
    // One payment can cover multiple invoices
    clientId: integer("client_id")
      .references(() => clients.id)
      .notNull(),

    // =====================================
    // PAYMENT INFO
    // =====================================

    amount: numeric("amount", {
      precision: 12,
      scale: 2,
    }).notNull(),

    paymentDate: timestamp("payment_date", {
      withTimezone: true,
    }).defaultNow(),

    // receipt number
    // Example:
    // RCPT/2025-26/0001
    receiptNumber: text("receipt_number"),

    // cash | bank | upi | cheque | adjustment
    method: text("method").$type<
      "cash" | "bank" | "upi" | "cheque" | "adjustment"
    >(),

    // UPI ref / bank txn / cheque no
    reference: text("reference"),

    notes: text("notes"),

    // =====================================
    // VOIDING
    // =====================================

    isVoided: boolean("is_voided").default(false),

    voidReason: text("void_reason"),

    voidedAt: timestamp("voided_at", {
      withTimezone: true,
    }),

    voidedBy: integer("voided_by").references(() => users.id),

    // =====================================
    // AUDIT
    // =====================================

    createdBy: integer("created_by").references(() => users.id),

    updatedBy: integer("updated_by").references(() => users.id),

    createdAt: timestamp("created_at", {
      withTimezone: true,
    }).defaultNow(),

    updatedAt: timestamp("updated_at", {
      withTimezone: true,
    }).defaultNow(),

    // OPTIONAL
    deletedAt: timestamp("deleted_at", {
      withTimezone: true,
    }),
  },
  (table) => {
    return {
      // =====================================
      // UNIQUENESS
      // =====================================

      uniqueReceiptNumber: uniqueIndex("unique_receipt_number").on(
        table.receiptNumber,
      ),

      // =====================================
      // INDEXES
      // =====================================

      clientIdx: index("payment_client_idx").on(table.clientId),

      invoiceLegacyIdx: index("payment_invoice_legacy_idx").on(table.invoiceId),

      paymentDateIdx: index("payment_date_idx").on(table.paymentDate),

      referenceIdx: index("payment_reference_idx").on(table.reference),

      receiptIdx: index("payment_receipt_idx").on(table.receiptNumber),

      voidedIdx: index("payment_voided_idx").on(table.isVoided),

      createdByIdx: index("payment_created_by_idx").on(table.createdBy),
    };
  },
);

// =========================
// PAYMENT ALLOCATIONS
// =========================

export const paymentAllocations = pgTable(
  "payment_allocations",
  {
    id: serial("id").primaryKey(),

    // =====================================
    // PAYMENT
    // =====================================

    paymentId: integer("payment_id")
      .references(() => payments.id)
      .notNull(),

    // =====================================
    // INVOICE
    // =====================================

    invoiceId: integer("invoice_id")
      .references(() => invoices.id)
      .notNull(),

    // =====================================
    // ALLOCATION AMOUNT
    // =====================================

    allocatedAmount: numeric("allocated_amount", {
      precision: 12,
      scale: 2,
    }).notNull(),

    notes: text("notes"),

    // =====================================
    // AUDIT
    // =====================================

    createdBy: integer("created_by").references(() => users.id),

    createdAt: timestamp("created_at", {
      withTimezone: true,
    }).defaultNow(),

    updatedAt: timestamp("updated_at", {
      withTimezone: true,
    }).defaultNow(),

    deletedAt: timestamp("deleted_at", {
      withTimezone: true,
    }),
  },
  (table) => {
    return {
      // =====================================
      // UNIQUENESS
      // =====================================

      uniquePaymentInvoice: uniqueIndex("unique_payment_invoice").on(
        table.paymentId,
        table.invoiceId,
      ),

      // =====================================
      // INDEXES
      // =====================================

      paymentIdx: index("payment_allocation_payment_idx").on(table.paymentId),

      invoiceIdx: index("payment_allocation_invoice_idx").on(table.invoiceId),
    };
  },
);

// =========================
// FOLLOWUPS
// =========================
export const followups = pgTable(
  "followups",
  {
    id: serial("id").primaryKey(),

    invoiceId: integer("invoice_id")
      .references(() => invoices.id)
      .notNull(),

    note: text("note").notNull(),

    followupDate: timestamp("followup_date", {
      withTimezone: true,
    }),

    createdAt: timestamp("created_at", {
      withTimezone: true,
    }).defaultNow(),
    deletedAt: timestamp("deleted_at", {
      withTimezone: true,
    }),
  },
  (table) => {
    return {
      // =========================
      // INDEXES
      // =========================

      invoiceIdx: index("followup_invoice_idx").on(table.invoiceId),

      followupDateIdx: index("followup_date_idx").on(table.followupDate),
    };
  },
);
