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
      invoiceDate: "2026-02-15",
      dueDate: "2026-03-15",
      totalAmount: "125000.00",
      paidAmount: "25000.00",
      outstandingAmount: "100000.00",
      status: "PARTIALLY_PAID",
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
      invoiceDate: "2026-02-20",
      dueDate: "2026-03-20",
      totalAmount: "85000.00",
      paidAmount: "85000.00",
      outstandingAmount: "0.00",
      status: "PAID",
      isOpeningBalance: false,
      createdAt: new Date(),
      updatedAt: new Date(),
      deletedAt: null,
    },
    {
      id: 3,
      companyId: 1,
      clientId: 3,
      invoiceNumber: "INV-2026-003",
      invoiceDate: "2026-01-10",
      dueDate: "2026-02-10",
      totalAmount: "45000.00",
      paidAmount: "0.00",
      outstandingAmount: "45000.00",
      status: "OVERDUE",
      isOpeningBalance: false,
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
          where: () => {
            const list = mockStore[tableName] || [];
            if (list.length > 0) {
              Object.assign(list[0], data, { updatedAt: new Date() });
            }
            const chainable = {
              returning: () => Promise.resolve(list),
              then: (resolve: any) => resolve(list),
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
      connectionTimeoutMillis: 1500,
      idleTimeoutMillis: 5000,
      max: 5,
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
