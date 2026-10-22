import { Pool } from "pg";
import { drizzle } from "drizzle-orm/node-postgres";
import * as schema from "./schema-with-relations";
import bcrypt from "bcryptjs";

const isDbConfigured = Boolean(
  process.env.DATABASE_URL &&
  !process.env.DATABASE_URL.includes("localhost:5432") &&
  (process.env.DATABASE_URL.includes("/cloudsql/") ||
    process.env.DATABASE_URL.startsWith("postgres")),
);

// ============================================================================
// IN-MEMORY MOCK STORE FOR LOCAL / OFFLINE PREVIEW
// ============================================================================
const adminPasswordHash = bcrypt.hashSync("Admin@123", 10);

const mockStore: Record<string, any[]> = {
  users: [
    {
      id: 1,
      firstName: "Super",
      lastName: "Admin",
      email: "nikhil@pafex.in",
      mobile: "9999999999",
      passwordHash: adminPasswordHash,
      userType: "SUPER_ADMIN",
      isActive: true,
      emailVerified: true,
      createdAt: new Date(),
      updatedAt: new Date(),
      deletedAt: null,
    },
    {
      id: 2,
      firstName: "Pafex",
      lastName: "Admin",
      email: "admin@pafex.com",
      mobile: "9888888888",
      passwordHash: adminPasswordHash,
      userType: "SUPER_ADMIN",
      isActive: true,
      emailVerified: true,
      createdAt: new Date(),
      updatedAt: new Date(),
      deletedAt: null,
    },
  ],
  companies: [
    {
      id: 1,
      companyName: "PAFEX Express Courier & Cargo",
      companyCode: "PAFEX",
      gstNumber: "07AAAAA0000A1Z5",
      email: "info@pafex.com",
      phone: "9999999999",
      address: "IGI Cargo Terminal",
      city: "New Delhi",
      state: "Delhi",
      country: "India",
      pincode: "110037",
      isActive: true,
      createdAt: new Date(),
      updatedAt: new Date(),
      deletedAt: null,
    },
  ],
  companyUsers: [
    {
      id: 1,
      companyId: 1,
      userId: 1,
      roleId: 1,
      departmentId: 1,
      designation: "Super Administrator",
      isActive: true,
      joinedAt: new Date(),
      createdAt: new Date(),
      updatedAt: new Date(),
    },
    {
      id: 2,
      companyId: 1,
      userId: 2,
      roleId: 1,
      departmentId: 1,
      designation: "Administrator",
      isActive: true,
      joinedAt: new Date(),
      createdAt: new Date(),
      updatedAt: new Date(),
    },
  ],
  sessions: [],
  roles: [
    {
      id: 1,
      companyId: 1,
      roleName: "Super Admin",
      description: "Full system access",
      isSystem: true,
      isActive: true,
      createdAt: new Date(),
      updatedAt: new Date(),
      deletedAt: null,
    },
  ],
  departments: [
    {
      id: 1,
      companyId: 1,
      name: "Finance & Accounts",
      code: "FIN",
      description: "Finance & Accounts Department",
      isActive: true,
      createdAt: new Date(),
      updatedAt: new Date(),
      deletedAt: null,
    },
    {
      id: 2,
      companyId: 1,
      name: "Operations & Logistics",
      code: "OPS",
      description: "Air freight & courier dispatch",
      isActive: true,
      createdAt: new Date(),
      updatedAt: new Date(),
      deletedAt: null,
    },
  ],
  clients: [
    {
      id: 1,
      companyId: 1,
      companyName: "Acme Logistics Global Pvt Ltd",
      companyCode: "ACME",
      gstNumber: "07AAACA1234A1Z1",
      email: "accounts@acmelogistics.com",
      phone: "+91 9811122334",
      address: "Plot 42, Okhla Industrial Area Ph-III",
      isActive: true,
      tdsApplicable: true,
      tdsRate: "2.00",
      createdAt: new Date(),
      updatedAt: new Date(),
      deletedAt: null,
    },
    {
      id: 2,
      companyId: 1,
      companyName: "Blue Dart Worldwide Express",
      companyCode: "BLUEDART",
      gstNumber: "07AAACB5678B1Z2",
      email: "finance@bluedart-global.com",
      phone: "+91 9822233445",
      address: "Tower B, Cyber City, Gurugram",
      isActive: true,
      tdsApplicable: true,
      tdsRate: "2.00",
      createdAt: new Date(),
      updatedAt: new Date(),
      deletedAt: null,
    },
    {
      id: 3,
      companyId: 1,
      companyName: "Speedy Cargo Cargo Movers",
      companyCode: "SPEEDY",
      gstNumber: "07AAACC9012C1Z3",
      email: "billing@speedycargo.in",
      phone: "+91 9833344556",
      address: "Warehouse 12, Transport Nagar, Delhi",
      isActive: true,
      tdsApplicable: false,
      tdsRate: "2.00",
      createdAt: new Date(),
      updatedAt: new Date(),
      deletedAt: null,
    },
  ],
  clientSubClients: [],
  invoices: [
    {
      id: 1,
      companyId: 1,
      clientId: 1,
      invoiceNumber: "INV-2026-001",
      financialYear: "2025-26",
      invoiceDate: "2026-02-15",
      dueDate: "2026-03-15",
      invoiceAmount: "125000.00",
      basicAmount: "105932.20",
      totalAmount: "125000.00",
      netPayableAmount: "122881.36",
      paidAmount: "25000.00",
      tdsAmount: "2118.64",
      tdsDeductedAmount: "2118.64",
      isTdsVerified: false,
      outstandingAmount: "97881.36",
      status: "partial",
      isOpeningBalance: false,
      tdsApplicableUsed: true,
      tdsRateUsed: "2.00",
      createdAt: new Date(),
      updatedAt: new Date(),
      deletedAt: null,
    },
    {
      id: 2,
      companyId: 1,
      clientId: 2,
      invoiceNumber: "INV-2026-002",
      financialYear: "2025-26",
      invoiceDate: "2026-02-20",
      dueDate: "2026-03-20",
      invoiceAmount: "85000.00",
      basicAmount: "72033.90",
      totalAmount: "85000.00",
      netPayableAmount: "83559.32",
      paidAmount: "83559.32",
      tdsAmount: "1440.68",
      tdsDeductedAmount: "1440.68",
      isTdsVerified: true,
      tdsVerifiedAt: new Date(),
      outstandingAmount: "0.00",
      status: "paid",
      isOpeningBalance: false,
      tdsApplicableUsed: true,
      tdsRateUsed: "2.00",
      createdAt: new Date(),
      updatedAt: new Date(),
      deletedAt: null,
    },
    {
      id: 3,
      companyId: 1,
      clientId: 3,
      invoiceNumber: "INV-2026-003",
      financialYear: "2025-26",
      invoiceDate: "2026-01-10",
      dueDate: "2026-02-10",
      invoiceAmount: "45000.00",
      basicAmount: "38135.59",
      totalAmount: "45000.00",
      netPayableAmount: "45000.00",
      paidAmount: "0.00",
      tdsAmount: "0.00",
      tdsDeductedAmount: "0.00",
      isTdsVerified: false,
      outstandingAmount: "45000.00",
      status: "overdue",
      isOpeningBalance: false,
      tdsApplicableUsed: false,
      tdsRateUsed: "0.00",
      createdAt: new Date(),
      updatedAt: new Date(),
      deletedAt: null,
    },
  ],
  payments: [
    {
      id: 1,
      companyId: 1,
      clientId: 1,
      paymentNumber: "PAY-2026-001",
      paymentDate: "2026-03-01",
      amount: "25000.00",
      paymentMode: "NEFT",
      referenceNumber: "NEFT98234723",
      createdAt: new Date(),
      updatedAt: new Date(),
      deletedAt: null,
    },
  ],
  paymentAllocations: [],
  followups: [],
  notificationSettings: [
    {
      id: 1,
      companyId: 1,
      sendBillSubmission: true,
      reminderBeforeDue: true,
      reminderDaysBefore: 2,
      sendDueTodayNotification: true,
      sendOverdueReminder: true,
      overdueReminderDays: 7,
      sendPaymentConfirmation: true,
      autoSendSuspensionNotice: false,
      sendInternalSuspensionAlert: true,
      sendInvoicePdf: true,
      ccAccountsEmail: "accounts@pafex.in",
      ccSalesEmail: "sales@pafex.com",
      notifyManager: false,
      businessStartHour: 9,
      businessEndHour: 18,
      skipWeekends: false,
      createdAt: new Date(),
      updatedAt: new Date(),
    },
  ],
  notificationTemplates: [],
  notificationLogs: [],
};

// Auto-increment ID generator
let nextId = 100;

function resolveTableName(target: any): string {
  if (typeof target === "string") return target;
  if (target?._?.name) return target._.name;
  if (target?.name) return target.name;
  return String(target);
}

function createChainableQuery(targetTable: string, initialData: any[] = []) {
  let data = [...initialData];
  const chain: any = {
    from: (table: any) => {
      const name = resolveTableName(table);
      data = mockStore[name] || [];
      return chain;
    },
    where: (_condition: any) => {
      // Return filtered data or all data
      return chain;
    },
    leftJoin: () => chain,
    innerJoin: () => chain,
    groupBy: () => chain,
    orderBy: () => chain,
    limit: (n: number) => {
      data = data.slice(0, n);
      return chain;
    },
    offset: (n: number) => {
      data = data.slice(n);
      return chain;
    },
    then: (resolve: any) => resolve(data),
    catch: () => chain,
    finally: () => chain,
  };
  return chain;
}

function createMockDb() {
  const queryProxy = new Proxy(
    {},
    {
      get(_, modelName: string) {
        const table = mockStore[modelName] || [];
        return {
          findMany: async (options?: any) => {
            let res = [...table];
            if (options?.where) {
              // Basic filtering if needed
            }
            if (options?.limit) {
              res = res.slice(0, options.limit);
            }
            return res;
          },
          findFirst: async (options?: any) => {
            if (modelName === "users" && options?.where) {
              return table[0] || null;
            }
            if (modelName === "sessions") {
              const session = table[table.length - 1];
              if (!session) return null;
              return {
                ...session,
                user:
                  mockStore.users.find((u) => u.id === session.userId) ||
                  mockStore.users[0],
              };
            }
            if (modelName === "companies") {
              return table[0] || null;
            }
            if (modelName === "companyUsers") {
              return table[0] || null;
            }
            return table[0] || null;
          },
          findUnique: async () => table[0] || null,
          count: async () => table.length,
        };
      },
    },
  );

  return {
    query: queryProxy,
    select: (fields?: any) => {
      // Always return a row with safe defaults for aggregations
      const defaultRow: Record<string, any> = {
        total: "145000.00",
        count: 3,
        notDue: "100000.00",
        days1to30: "0.00",
        days31to60: "45000.00",
        days61to90: "0.00",
        days90Plus: "0.00",
        todayCollection: "0.00",
        periodCollection: "25000.00",
      };
      if (fields && typeof fields === "object") {
        for (const k of Object.keys(fields)) {
          if (defaultRow[k] === undefined) {
            defaultRow[k] = 0;
          }
        }
      }
      return createChainableQuery("", [defaultRow]);
    },
    insert: (table: any) => {
      const tableName = resolveTableName(table);
      return {
        values: (record: any) => {
          const arr = Array.isArray(record) ? record : [record];
          const createdRecords = arr.map((item) => {
            const newItem = {
              id: ++nextId,
              createdAt: new Date(),
              updatedAt: new Date(),
              ...item,
            };
            if (!mockStore[tableName]) {
              mockStore[tableName] = [];
            }
            mockStore[tableName].push(newItem);
            return newItem;
          });
          const chainable = {
            returning: () => Promise.resolve(createdRecords),
            then: (resolve: any) => resolve(createdRecords),
            catch: () => chainable,
            finally: () => chainable,
          };
          return chainable;
        },
      };
    },
    update: (table: any) => {
      const tableName = resolveTableName(table);
      return {
        set: (data: any) => ({
          where: (condition?: any) => {
            const list = mockStore[tableName] || [];
            let targetId: any = condition?.val ?? condition?.value;
            if (
              targetId === undefined &&
              condition?.right?.value !== undefined
            ) {
              targetId = condition.right.value;
            }
            if (targetId === undefined && condition?.queryChunks) {
              const numChunk = condition.queryChunks.find(
                (c: any) => typeof c?.value === "number",
              );
              if (numChunk) targetId = numChunk.value;
            }
            const targets = targetId
              ? list.filter((item) => item.id === targetId)
              : list.slice(0, 1);
            if (targets.length === 0 && list.length > 0) {
              targets.push(list[0]);
            }
            targets.forEach((item) =>
              Object.assign(item, data, { updatedAt: new Date() }),
            );
            const chainable = {
              returning: () => Promise.resolve(targets),
              then: (resolve: any) => resolve(targets),
              catch: () => chainable,
              finally: () => chainable,
            };
            return chainable;
          },
        }),
      };
    },
    delete: (table: any) => {
      return {
        where: () => Promise.resolve({ count: 1 }),
        then: (resolve: any) => resolve({ count: 1 }),
      };
    },
    execute: async () => ({ rows: [] }),
    transaction: async (cb: any) => cb(mockDb),
  };
}

const mockDb = createMockDb();

let db: any;

if (isDbConfigured) {
  try {
    const pool = new Pool({
      connectionString: process.env.DATABASE_URL,
      ssl: { rejectUnauthorized: false },
      connectionTimeoutMillis: 10000,
      idleTimeoutMillis: 30000,
      max: 10,
    });

    pool.on("error", (err) => {
      console.warn("[AI Studio] Database pool error:", err.message);
    });

    db = drizzle(pool, { schema });
  } catch (err: any) {
    console.warn(
      "[AI Studio] Failed to init Postgres client, using mock:",
      err?.message,
    );
    db = mockDb;
  }
} else {
  db = mockDb;
}

export { db };
