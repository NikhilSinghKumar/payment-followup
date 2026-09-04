import {
  pgTable,
  pgEnum,
  serial,
  text,
  integer,
  numeric,
  varchar,
  timestamp,
  date,
  boolean,
  index,
  jsonb,
  uniqueIndex,
} from "drizzle-orm/pg-core";

export const userTypeEnum = pgEnum("user_type", ["SUPER_ADMIN", "USER"]);

// =========================
// USERS
// =========================

export const users = pgTable(
  "users",
  {
    id: serial("id").primaryKey(),
    firstName: text("first_name").notNull(),
    lastName: text("last_name"),
    email: text("email").notNull().unique(),
    mobile: text("mobile"),
    passwordHash: text("password_hash").notNull(),
    userType: userTypeEnum("user_type").default("USER").notNull(),
    // USER | SUPER_ADMIN
    isActive: boolean("is_active").default(true).notNull(),
    emailVerified: boolean("email_verified").default(false).notNull(),
    lastLoginAt: timestamp("last_login_at", { withTimezone: true }),
    createdAt: timestamp("created_at", { withTimezone: true })
      .defaultNow()
      .notNull(),
    updatedAt: timestamp("updated_at", { withTimezone: true })
      .defaultNow()
      .notNull(),
    deletedAt: timestamp("deleted_at", { withTimezone: true }),
  },
  (table) => ({
    emailIdx: uniqueIndex("users_email_idx").on(table.email),
  }),
);

// ==========================================
// SESSIONS
// ==========================================

export const sessions = pgTable(
  "sessions",
  {
    id: serial("id").primaryKey(),
    userId: integer("user_id")
      .notNull()
      .references(() => users.id, {
        onDelete: "cascade",
      }),

    tokenHash: text("token_hash").notNull(),
    ipAddress: text("ip_address"),
    userAgent: text("user_agent"),
    expiresAt: timestamp("expires_at", {
      withTimezone: true,
    }).notNull(),
    isRevoked: boolean("is_revoked").default(false).notNull(),
    revokedAt: timestamp("revoked_at", {
      withTimezone: true,
    }),
    lastSeenAt: timestamp("last_seen_at", {
      withTimezone: true,
    }),
    createdAt: timestamp("created_at", {
      withTimezone: true,
    })
      .defaultNow()
      .notNull(),
    updatedAt: timestamp("updated_at", {
      withTimezone: true,
    })
      .defaultNow()
      .notNull(),
  },
  (table) => ({
    userIdx: index("sessions_user_idx").on(table.userId),
    tokenIdx: uniqueIndex("sessions_token_idx").on(table.tokenHash),
  }),
);

export const companies = pgTable(
  "companies",
  {
    id: serial("id").primaryKey(),
    companyName: text("company_name").notNull(),
    companyCode: text("company_code").notNull(),
    gstNumber: text("gst_number"),
    email: text("email"),
    phone: text("phone"),
    address: text("address"),
    city: text("city"),
    state: text("state"),
    pincode: text("pincode"),
    country: text("country").default("India").notNull(),
    logo: text("logo"),
    isActive: boolean("is_active").default(true).notNull(),
    createdAt: timestamp("created_at", {
      withTimezone: true,
    })
      .defaultNow()
      .notNull(),
    updatedAt: timestamp("updated_at", {
      withTimezone: true,
    })
      .defaultNow()
      .notNull(),
    deletedAt: timestamp("deleted_at", {
      withTimezone: true,
    }),
  },
  (table) => ({
    companyCodeIdx: uniqueIndex("companies_company_code_idx").on(
      table.companyCode,
    ),
  }),
);

// ==========================================
// DEPARTMENTS
// ==========================================

export const departments = pgTable(
  "departments",
  {
    id: serial("id").primaryKey(),
    companyId: integer("company_id")
      .notNull()
      .references(() => companies.id, {
        onDelete: "cascade",
      }),
    name: text("name").notNull(), // e.g. "Finance & Accounts", "Sales & Marketing", "Operations & Logistics", "Management & Executive", "Customer Support"
    code: text("code"), // e.g. "FIN", "SALES", "OPS", "MGMT", "SUPPORT"
    description: text("description"),
    isActive: boolean("is_active").default(true).notNull(),
    createdAt: timestamp("created_at", {
      withTimezone: true,
    })
      .defaultNow()
      .notNull(),
    updatedAt: timestamp("updated_at", {
      withTimezone: true,
    })
      .defaultNow()
      .$onUpdate(() => new Date())
      .notNull(),
    deletedAt: timestamp("deleted_at", {
      withTimezone: true,
    }),
  },
  (table) => ({
    companyIdx: index("departments_company_idx").on(table.companyId),
    uniqueNamePerCompany: uniqueIndex("departments_company_name_idx").on(
      table.companyId,
      table.name,
    ),
  }),
);

export const companyUsers = pgTable(
  "company_users",
  {
    id: serial("id").primaryKey(),
    companyId: integer("company_id")
      .notNull()
      .references(() => companies.id, {
        onDelete: "cascade",
      }),
    userId: integer("user_id")
      .notNull()
      .references(() => users.id, {
        onDelete: "cascade",
      }),
    roleId: integer("role_id").references(() => roles.id, {
      onDelete: "set null",
    }),
    departmentId: integer("department_id").references(() => departments.id, {
      onDelete: "set null",
    }),
    designation: text("designation"),
    isActive: boolean("is_active").default(true).notNull(),
    joinedAt: timestamp("joined_at", {
      withTimezone: true,
    })
      .defaultNow()
      .notNull(),
    createdAt: timestamp("created_at", {
      withTimezone: true,
    })
      .defaultNow()
      .notNull(),
    updatedAt: timestamp("updated_at", {
      withTimezone: true,
    })
      .defaultNow()
      .notNull(),
  },
  (table) => ({
    companyUserUnique: uniqueIndex("company_users_company_user_idx").on(
      table.companyId,
      table.userId,
    ),

    companyIdx: index("company_users_company_idx").on(table.companyId),
    userIdx: index("company_users_user_idx").on(table.userId),
    departmentIdx: index("company_users_department_idx").on(table.departmentId),
  }),
);

export const roles = pgTable(
  "roles",
  {
    id: serial("id").primaryKey(),

    companyId: integer("company_id")
      .notNull()
      .references(() => companies.id, {
        onDelete: "cascade",
      }),

    roleName: text("role_name").notNull(),

    description: text("description"),

    isSystem: boolean("is_system").default(false).notNull(),

    isActive: boolean("is_active").default(true).notNull(),

    createdAt: timestamp("created_at", {
      withTimezone: true,
    })
      .defaultNow()
      .notNull(),

    updatedAt: timestamp("updated_at", {
      withTimezone: true,
    })
      .defaultNow()
      .notNull(),

    deletedAt: timestamp("deleted_at", {
      withTimezone: true,
    }),
  },
  (table) => ({
    companyRoleUnique: uniqueIndex("roles_company_role_idx").on(
      table.companyId,
      table.roleName,
    ),

    companyIdx: index("roles_company_idx").on(table.companyId),
  }),
);

export const permissions = pgTable(
  "permissions",
  {
    id: serial("id").primaryKey(),

    permissionKey: text("permission_key").notNull().unique(),

    module: text("module").notNull(),

    action: text("action").notNull(),

    description: text("description"),

    createdAt: timestamp("created_at", {
      withTimezone: true,
    })
      .defaultNow()
      .notNull(),
  },
  (table) => ({
    permissionKeyIdx: uniqueIndex("permissions_key_idx").on(
      table.permissionKey,
    ),
  }),
);

export const rolePermissions = pgTable(
  "role_permissions",
  {
    id: serial("id").primaryKey(),

    roleId: integer("role_id")
      .notNull()
      .references(() => roles.id, {
        onDelete: "cascade",
      }),

    permissionId: integer("permission_id")
      .notNull()
      .references(() => permissions.id, {
        onDelete: "cascade",
      }),

    createdAt: timestamp("created_at", {
      withTimezone: true,
    })
      .defaultNow()
      .notNull(),
  },
  (table) => ({
    rolePermissionUnique: uniqueIndex("role_permissions_unique_idx").on(
      table.roleId,
      table.permissionId,
    ),

    roleIdx: index("role_permissions_role_idx").on(table.roleId),

    permissionIdx: index("role_permissions_permission_idx").on(
      table.permissionId,
    ),
  }),
);

// =========================
// CLIENTS
// =========================
export const clients = pgTable("clients", {
  id: serial("id").primaryKey(),
  companyId: integer("company_id")
    .notNull()
    .references(() => companies.id, {
      onDelete: "cascade",
    }),
  companyName: text("company_name").notNull(),
  email: text("email"),
  phone: text("phone"),
  companyCode: text("company_code").notNull().unique(),
  gstNumber: text("gst_number"),
  address: text("address"),

  // Status
  isActive: boolean("is_active").notNull().default(true),
  tdsApplicable: boolean("tds_applicable").notNull().default(false),
  createdAt: timestamp("created_at", { withTimezone: true }).defaultNow(),
  updatedAt: timestamp("updated_at", { withTimezone: true }).defaultNow(),
  deletedAt: timestamp("deleted_at", {
    withTimezone: true,
  }),
});

// =====================================================
// SUB CLIENTS
// =====================================================

export const clientSubClients = pgTable(
  "client_sub_clients",
  {
    id: serial("id").primaryKey(),

    // Parent Client
    clientId: integer("client_id")
      .references(() => clients.id, {
        onDelete: "cascade",
      })
      .notNull(),

    // Business Unit / GST Entity
    companyName: text("company_name").notNull(),

    companyCode: text("company_code"),

    gstNumber: text("gst_number"),

    address: text("address"),

    city: text("city"),

    state: text("state"),

    pincode: text("pincode"),

    country: text("country").default("India"),

    tdsApplicable: boolean("tds_applicable").notNull().default(false),

    isActive: boolean("is_active").notNull().default(true),

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
  (table) => ({
    clientIdx: index("sub_client_client_idx").on(table.clientId),

    gstIdx: index("sub_client_gst_idx").on(table.gstNumber),

    companyIdx: index("sub_client_company_idx").on(table.companyName),

    uniqueCompanyPerClient: uniqueIndex("unique_sub_client_company").on(
      table.clientId,
      table.companyName,
    ),

    uniqueCodePerClient: uniqueIndex("unique_sub_client_code").on(
      table.clientId,
      table.companyCode,
    ),
  }),
);

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

    status: text("status")
      .$type<"active" | "inactive" | "left_company" | "do_not_contact">()
      .default("active"),

    receivesInvoice: boolean("receives_invoice").default(false),

    receivesFollowup: boolean("receives_followup").default(false),

    receivesEscalation: boolean("receives_escalation").default(false),

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

      statusIdx: index("client_contact_status_idx").on(table.status),
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

    companyId: integer("company_id")
      .notNull()
      .references(() => companies.id, {
        onDelete: "cascade",
      }),

    // =====================================
    // CLIENT
    // =====================================

    clientId: integer("client_id")
      .references(() => clients.id)
      .notNull(),

    subClientId: integer("sub_client_id").references(() => clientSubClients.id),

    // =====================================
    // INVOICE INFO
    // =====================================

    // Example: 2026-27
    financialYear: text("financial_year").notNull(),

    // Example: INV-0001
    invoiceNumber: text("invoice_number").notNull(),

    invoiceDate: date("invoice_date").notNull(),

    dueDate: date("due_date").notNull(),

    // Optional (15 / 30 / 45 / 60 / 90)
    paymentTerms: integer("payment_terms"),

    // =====================================
    // AMOUNTS
    // =====================================

    // Entered by user
    invoiceAmount: numeric("invoice_amount", {
      precision: 12,
      scale: 2,
    }).notNull(),

    // Calculated
    basicAmount: numeric("basic_amount", {
      precision: 12,
      scale: 2,
    }).notNull(),

    cgstAmount: numeric("cgst_amount", {
      precision: 12,
      scale: 2,
    }).notNull(),

    sgstAmount: numeric("sgst_amount", {
      precision: 12,
      scale: 2,
    }).notNull(),

    igstAmount: numeric("igst_amount", {
      precision: 12,
      scale: 2,
    }).notNull(),

    tdsAmount: numeric("tds_amount", {
      precision: 12,
      scale: 2,
    }).notNull(),

    // User entered
    deductionAmount: numeric("deduction_amount", {
      precision: 12,
      scale: 2,
    }).default("0"),

    otherCharges: numeric("other_charges", {
      precision: 12,
      scale: 2,
    }).default("0"),

    // Final payable amount
    netPayableAmount: numeric("net_payable_amount", {
      precision: 12,
      scale: 2,
    }).notNull(),

    // =====================================
    // TAX SNAPSHOT
    // =====================================

    // GST used while creating invoice
    gstNumberUsed: text("gst_number_used"),

    // TDS setting used while creating invoice
    tdsApplicableUsed: boolean("tds_applicable_used").notNull().default(false),

    // Snapshot of opening balance status
    isOpeningBalance: boolean("is_opening_balance").notNull().default(false),

    // paid
    paidAmount: numeric("paid_amount", {
      precision: 12,
      scale: 2,
    }).default("0"),

    outstandingAmount: numeric("outstanding_amount", {
      precision: 12,
      scale: 2,
    }).notNull(),

    // =====================================
    // STATUS
    // =====================================

    status: text("status")
      .$type<
        "pending" | "partial" | "paid" | "overdue" | "disputed" | "cancelled"
      >()
      .default("pending"),

    // =====================================
    // NOTES
    // =====================================

    notes: text("notes"),

    // =====================================
    // AUDIT
    // =====================================

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

      uniqueInvoiceNumber: uniqueIndex("unique_invoice_number").on(
        table.clientId,
        table.financialYear,
        table.invoiceNumber,
      ),

      // =====================================
      // INDEXES
      // =====================================

      clientIdx: index("invoice_client_idx").on(table.clientId),

      statusIdx: index("invoice_status_idx").on(table.status),

      invoiceDateIdx: index("invoice_date_idx").on(table.invoiceDate),

      dueDateIdx: index("invoice_due_date_idx").on(table.dueDate),

      invoiceNumberIdx: index("invoice_number_idx").on(table.invoiceNumber),

      financialYearIdx: index("invoice_financial_year_idx").on(
        table.financialYear,
      ),

      netPayableIdx: index("invoice_net_payable_idx").on(
        table.netPayableAmount,
      ),

      outstandingAmountIdx: index("invoice_outstanding_amount_idx").on(
        table.outstandingAmount,
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

    companyId: integer("company_id")
      .notNull()
      .references(() => companies.id, {
        onDelete: "cascade",
      }),

    invoiceId: integer("invoice_id").references(() => invoices.id),

    // =====================================
    // CLIENT (IMPORTANT)
    // =====================================

    // Future-safe:
    // One payment can cover multiple invoices
    clientId: integer("client_id")
      .references(() => clients.id)
      .notNull(),

    // Optional: sub-client who made this payment
    subClientId: integer("sub_client_id").references(
      () => clientSubClients.id,
      { onDelete: "set null" },
    ),

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

    companyId: integer("company_id")
      .notNull()
      .references(() => companies.id, {
        onDelete: "cascade",
      }),

    // Follow-up belongs primarily to a client
    clientId: integer("client_id")
      .notNull()
      .references(() => clients.id, {
        onDelete: "cascade",
      }),

    note: text("note").notNull(),

    followupDate: timestamp("followup_date", {
      withTimezone: true,
    }),

    nextFollowupDate: timestamp("next_followup_date", {
      withTimezone: true,
    }),

    createdAt: timestamp("created_at", {
      withTimezone: true,
    }).defaultNow(),

    deletedAt: timestamp("deleted_at", {
      withTimezone: true,
    }),
  },
  (table) => ({
    clientIdx: index("followup_client_idx").on(table.clientId),

    followupDateIdx: index("followup_date_idx").on(table.followupDate),
  }),
);

// =========================
// FOLLOWUP INVOICES
// =========================

export const followupInvoices = pgTable(
  "followup_invoices",
  {
    id: serial("id").primaryKey(),

    followupId: integer("followup_id")
      .notNull()
      .references(() => followups.id, {
        onDelete: "cascade",
      }),

    invoiceId: integer("invoice_id")
      .notNull()
      .references(() => invoices.id, {
        onDelete: "cascade",
      }),

    createdAt: timestamp("created_at", {
      withTimezone: true,
    }).defaultNow(),
  },
  (table) => ({
    uniqueFollowupInvoice: uniqueIndex("unique_followup_invoice").on(
      table.followupId,
      table.invoiceId,
    ),

    followupIdx: index("followup_invoice_followup_idx").on(table.followupId),

    invoiceIdx: index("followup_invoice_invoice_idx").on(table.invoiceId),
  }),
);
// =========================
// NOTIFICATIONS
// =========================

export const notificationTypeEnum = pgEnum("notification_type", [
  // Invoice
  "INVOICE_CREATED",
  "BILL_SUBMITTED",
  "INVOICE_DUE",
  "DUE_REMINDER",
  "OVERDUE_REMINDER",
  "FINAL_REMINDER",

  // Payment
  "PAYMENT_RECEIVED",
  "PAYMENT_CLEARED",

  // Client
  "CLIENT_CREATED",
  "CLIENT_UPDATED",
  "CLIENT_OVERDUE",
  "SERVICE_SUSPENSION_NOTICE",
  "SERVICE_SUSPENSION_ALERT",

  // Followup
  "FOLLOWUP_CREATED",
  "FOLLOWUP_DUE",
  "FOLLOWUP_COMPLETED",

  // Email
  "EMAIL_SENT",
  "EMAIL_FAILED",

  // System
  "SYSTEM",
]);

export const notificationPriorityEnum = pgEnum("notification_priority", [
  "LOW",
  "MEDIUM",
  "HIGH",
  "CRITICAL",
]);

export const notifications = pgTable(
  "notifications",
  {
    id: serial("id").primaryKey(),

    companyId: integer("company_id")
      .notNull()
      .references(() => companies.id, { onDelete: "cascade" }),

    userId: integer("user_id").references(() => users.id, {
      onDelete: "cascade",
    }),

    clientId: integer("client_id").references(() => clients.id, {
      onDelete: "set null",
    }),

    invoiceId: integer("invoice_id").references(() => invoices.id, {
      onDelete: "set null",
    }),

    paymentId: integer("payment_id").references(() => payments.id, {
      onDelete: "set null",
    }),

    type: notificationTypeEnum("type").notNull(),

    priority: notificationPriorityEnum("priority").default("LOW").notNull(),

    title: text("title").notNull(),

    message: text("message").notNull(),

    actionUrl: text("action_url"),

    icon: varchar("icon", { length: 50 }),

    color: varchar("color", { length: 20 }),

    isRead: boolean("is_read").default(false).notNull(),

    readAt: timestamp("read_at"),

    createdAt: timestamp("created_at").defaultNow().notNull(),
    archivedAt: timestamp("archived_at"),
  },
  (table) => ({
    companyIdx: index("notifications_company_idx").on(table.companyId),
    userIdx: index("notifications_user_idx").on(table.userId),
    readIdx: index("notifications_read_idx").on(table.isRead),
    createdIdx: index("notifications_created_idx").on(table.createdAt),
  }),
);

// =========================
// NOTIFICATION LOGS
// =========================

export const notificationChannelEnum = pgEnum("notification_channel", [
  "EMAIL",
  "SMS",
  "WHATSAPP",
  "IN_APP",
]);

export const notificationStatusEnum = pgEnum("notification_status", [
  "PENDING",
  "SENT",
  "DELIVERED",
  "FAILED",
  "OPENED",
]);

export const emailTypeEnum = pgEnum("email_type", [
  "BILL_SUBMITTED",
  "DUE_REMINDER",
  "OVERDUE_REMINDER",
  "FINAL_REMINDER",
  "PAYMENT_RECEIVED",
  "PAYMENT_CLEARED",
  "BLOCK_NOTICE",
]);

export const notificationLogs = pgTable(
  "notification_logs",
  {
    id: serial("id").primaryKey(),

    companyId: integer("company_id")
      .notNull()
      .references(() => companies.id, { onDelete: "cascade" }),

    clientId: integer("client_id").references(() => clients.id),

    invoiceId: integer("invoice_id").references(() => invoices.id),

    paymentId: integer("payment_id").references(() => payments.id),

    channel: notificationChannelEnum("channel").default("EMAIL").notNull(),

    emailType: emailTypeEnum("email_type"),

    recipient: text("recipient").notNull(),

    subject: text("subject"),

    status: notificationStatusEnum("status").default("PENDING").notNull(),

    errorMessage: text("error_message"),

    sentAt: timestamp("sent_at"),

    deliveredAt: timestamp("delivered_at"),

    openedAt: timestamp("opened_at"),

    provider: varchar("provider", { length: 50 }),

    providerMessageId: text("provider_message_id"),

    attempts: integer("attempts").default(1).notNull(),

    metadata: jsonb("metadata"),

    createdAt: timestamp("created_at").defaultNow().notNull(),
  },
  (table) => ({
    companyIdx: index("notification_logs_company_idx").on(table.companyId),
    invoiceIdx: index("notification_logs_invoice_idx").on(table.invoiceId),
    clientIdx: index("notification_logs_client_idx").on(table.clientId),
    statusIdx: index("notification_logs_status_idx").on(table.status),
    createdIdx: index("notification_logs_created_idx").on(table.createdAt),
  }),
);

// =========================
// NOTIFICATIONS SETTINGS
// =========================
export const notificationSettings = pgTable(
  "notification_settings",
  {
    id: serial("id").primaryKey(),

    companyId: integer("company_id")
      .notNull()
      .references(() => companies.id, {
        onDelete: "cascade",
      }),

    sendBillSubmission: boolean("send_bill_submission").default(true).notNull(),

    reminderBeforeDue: boolean("reminder_before_due").default(true).notNull(),

    reminderDaysBefore: integer("reminder_days_before").default(2).notNull(),

    sendDueTodayNotification: boolean("send_due_today_notification")
      .default(true)
      .notNull(),

    sendOverdueReminder: boolean("send_overdue_reminder")
      .default(true)
      .notNull(),

    overdueReminderDays: integer("overdue_reminder_days").default(10).notNull(),

    sendPaymentConfirmation: boolean("send_payment_confirmation")
      .default(true)
      .notNull(),

    autoSendSuspensionNotice: boolean("auto_send_suspension_notice")
      .default(false)
      .notNull(),

    sendInternalSuspensionAlert: boolean("send_internal_suspension_alert")
      .default(true)
      .notNull(),

    sendInvoicePdf: boolean("send_invoice_pdf").default(true).notNull(),

    ccAccountsEmail: text("cc_accounts_email"),

    ccSalesEmail: text("cc_sales_email"),

    notifyManager: boolean("notify_manager").default(false).notNull(),

    businessStartHour: integer("business_start_hour").default(9).notNull(),

    businessEndHour: integer("business_end_hour").default(18).notNull(),

    skipWeekends: boolean("skip_weekends").default(false).notNull(),

    createdAt: timestamp("created_at").defaultNow().notNull(),
    updatedAt: timestamp("updated_at")
      .defaultNow()
      .$onUpdate(() => new Date())
      .notNull(),
  },
  (table) => ({
    companyUnique: uniqueIndex("notification_settings_company_uidx").on(
      table.companyId,
    ),
  }),
);

// =========================
// NOTIFICATION TEMPLATES
// =========================

export const templateTypeEnum = pgEnum("template_type", [
  "BILL_SUBMITTED",
  "DUE_REMINDER",
  "DUE_TODAY",
  "OVERDUE_REMINDER",
  "FINAL_REMINDER",
  "PAYMENT_RECEIVED",
  "PAYMENT_CLEARED",
  "INTERNAL_DUE_TODAY",
  "SERVICE_SUSPENSION_NOTICE",
  "SERVICE_SUSPENSION_ALERT",
]);

export const notificationTemplates = pgTable(
  "notification_templates",
  {
    id: serial("id").primaryKey(),

    companyId: integer("company_id").references(() => companies.id, {
      onDelete: "cascade",
    }),

    type: templateTypeEnum("type").notNull(),

    name: varchar("name", { length: 100 }).notNull(),

    subject: text("subject").notNull(),

    body: text("body").notNull(),

    isDefault: boolean("is_default").default(false).notNull(),

    isActive: boolean("is_active").default(true).notNull(),

    createdAt: timestamp("created_at").defaultNow().notNull(),

    updatedAt: timestamp("updated_at")
      .defaultNow()
      .$onUpdate(() => new Date())
      .notNull(),
  },
  (table) => ({
    companyIdx: index("notification_templates_company_idx").on(table.companyId),

    typeIdx: index("notification_templates_type_idx").on(table.type),

    activeIdx: index("notification_templates_active_idx").on(table.isActive),
  }),
);

// =========================
// NOTIFICATION PREFRENCES
// =========================

export const notificationPreferenceTypeEnum = pgEnum(
  "notification_preference_type",
  [
    // Invoice
    "INVOICE_CREATED",
    "BILL_SUBMITTED",
    "INVOICE_DUE",
    "DUE_REMINDER",
    "OVERDUE_REMINDER",
    "FINAL_REMINDER",

    // Payment
    "PAYMENT_RECEIVED",
    "PAYMENT_CLEARED",

    // Client
    "CLIENT_CREATED",
    "CLIENT_UPDATED",
    "CLIENT_OVERDUE",
    "SERVICE_SUSPENSION_NOTICE",
    "SERVICE_SUSPENSION_ALERT",

    // Followup
    "FOLLOWUP_CREATED",
    "FOLLOWUP_DUE",
    "FOLLOWUP_COMPLETED",

    // Email
    "EMAIL_SENT",
    "EMAIL_FAILED",

    // System
    "SYSTEM",
  ],
);

export const notificationDeliveryChannelEnum = pgEnum(
  "notification_delivery_channel",
  ["IN_APP", "EMAIL", "SMS", "WHATSAPP"],
);

export const notificationPreferences = pgTable(
  "notification_preferences",
  {
    id: serial("id").primaryKey(),

    companyId: integer("company_id")
      .notNull()
      .references(() => companies.id, {
        onDelete: "cascade",
      }),

    userId: integer("user_id")
      .notNull()
      .references(() => users.id, {
        onDelete: "cascade",
      }),

    type: notificationPreferenceTypeEnum("type").notNull(),

    channel: notificationDeliveryChannelEnum("channel")
      .default("IN_APP")
      .notNull(),

    enabled: boolean("enabled").default(true).notNull(),

    createdAt: timestamp("created_at").defaultNow().notNull(),

    updatedAt: timestamp("updated_at")
      .defaultNow()
      .$onUpdate(() => new Date())
      .notNull(),
  },
  (table) => ({
    companyIdx: index("notification_preferences_company_idx").on(
      table.companyId,
    ),

    userIdx: index("notification_preferences_user_idx").on(table.userId),

    uniquePreference: uniqueIndex("notification_preferences_unique").on(
      table.userId,
      table.type,
      table.channel,
    ),
  }),
);

// =====================================================
// NOTIFICATION ESCALATION RULES (TIER DEFINITIONS)
// =====================================================

export const notificationEscalationRules = pgTable(
  "notification_escalation_rules",
  {
    id: serial("id").primaryKey(),

    companyId: integer("company_id")
      .notNull()
      .references(() => companies.id, { onDelete: "cascade" }),

    tierLevel: integer("tier_level").notNull(), // 1, 2, 3...

    daysAfterDue: integer("days_after_due").notNull(), // e.g. 1 day, 4 days, 7 days overdue

    targetRoleId: integer("target_role_id").references(() => roles.id, {
      onDelete: "set null",
    }),

    targetDepartmentId: integer("target_department_id").references(
      () => departments.id,
      {
        onDelete: "set null",
      },
    ),

    targetUserId: integer("target_user_id").references(() => users.id, {
      onDelete: "set null",
    }),

    notifyAccountManager: boolean("notify_account_manager").default(false),

    customEmail: text("custom_email"), // Optional external CC or direct email

    emailTemplateKey: text("email_template_key").default("STANDARD_ESCALATION"),

    description: text("description"),

    isActive: boolean("is_active").default(true).notNull(),

    createdAt: timestamp("created_at", { withTimezone: true })
      .defaultNow()
      .notNull(),

    updatedAt: timestamp("updated_at", { withTimezone: true })
      .defaultNow()
      .$onUpdate(() => new Date())
      .notNull(),
  },
  (table) => ({
    companyIdx: index("escalation_rules_company_idx").on(table.companyId),
    tierIdx: index("escalation_rules_tier_idx").on(
      table.companyId,
      table.tierLevel,
    ),
  }),
);

// =====================================================
// INVOICE ESCALATION STATES (ACTIVE TRACKER PER INVOICE)
// =====================================================

export const invoiceEscalationStates = pgTable(
  "invoice_escalation_states",
  {
    id: serial("id").primaryKey(),

    invoiceId: integer("invoice_id")
      .notNull()
      .references(() => invoices.id, { onDelete: "cascade" }),

    companyId: integer("company_id")
      .notNull()
      .references(() => companies.id, { onDelete: "cascade" }),

    currentTier: integer("current_tier").default(0).notNull(),

    lastEscalatedAt: timestamp("last_escalated_at", { withTimezone: true }),

    nextEscalationDueAt: timestamp("next_escalation_due_at", {
      withTimezone: true,
    }),

    status: text("status").default("PENDING").notNull(), // 'PENDING', 'MAX_TIER_REACHED', 'RESOLVED_PAID'

    notes: text("notes"),

    createdAt: timestamp("created_at", { withTimezone: true })
      .defaultNow()
      .notNull(),

    updatedAt: timestamp("updated_at", { withTimezone: true })
      .defaultNow()
      .$onUpdate(() => new Date())
      .notNull(),
  },
  (table) => ({
    invoiceIdx: uniqueIndex("invoice_escalation_unique_idx").on(
      table.invoiceId,
    ),
    companyStatusIdx: index("invoice_escalation_status_idx").on(
      table.companyId,
      table.status,
    ),
  }),
);
