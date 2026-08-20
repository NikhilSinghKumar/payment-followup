import "dotenv/config";
import { db } from "../src/db";
import { companies, departments, companyUsers, users } from "../src/db/schema";
import { eq, and, isNull } from "drizzle-orm";

async function run() {
  console.log("🏢 Seeding default departments...");

  const allCompanies = await db.select().from(companies);

  for (const comp of allCompanies) {
    const defaultDepts = [
      {
        name: "Finance & Accounts",
        code: "FIN",
        description:
          "Invoicing, accounts receivable, payment reconciliation, and follow-ups.",
      },
      {
        name: "Sales & Marketing",
        code: "SALES",
        description:
          "Key account management, client acquisition, and relationship management.",
      },
      {
        name: "Operations & Logistics",
        code: "OPS",
        description:
          "Courier dispatch, hub management, POD tracking, and shipment operations.",
      },
      {
        name: "Management & Executive",
        code: "MGMT",
        description:
          "Executive leadership, company directors, and escalation resolution.",
      },
      {
        name: "Customer Support",
        code: "SUPPORT",
        description: "Customer service, shipment queries, and billing support.",
      },
    ];

    for (const d of defaultDepts) {
      const existing = await db
        .select()
        .from(departments)
        .where(
          and(
            eq(departments.companyId, comp.id),
            eq(departments.name, d.name),
            isNull(departments.deletedAt),
          ),
        );

      if (existing.length === 0) {
        await db.insert(departments).values({
          companyId: comp.id,
          name: d.name,
          code: d.code,
          description: d.description,
          isActive: true,
        });
      }
    }

    // Now auto-assign any company user who doesn't have a department
    const createdDepts = await db
      .select()
      .from(departments)
      .where(
        and(eq(departments.companyId, comp.id), isNull(departments.deletedAt)),
      );

    const finDept =
      createdDepts.find((d) => d.code === "FIN") || createdDepts[0];
    const mgmtDept =
      createdDepts.find((d) => d.code === "MGMT") || createdDepts[0];

    const unassignedCompanyUsers = await db
      .select()
      .from(companyUsers)
      .where(
        and(
          eq(companyUsers.companyId, comp.id),
          isNull(companyUsers.departmentId),
        ),
      );

    for (const cu of unassignedCompanyUsers) {
      // Default to Finance & Accounts or Management
      const targetDeptId =
        cu.designation && /director|founder|ceo|owner/i.test(cu.designation)
          ? mgmtDept.id
          : finDept.id;

      await db
        .update(companyUsers)
        .set({ departmentId: targetDeptId })
        .where(eq(companyUsers.id, cu.id));
    }
  }

  console.log("✅ Default departments seeded successfully.");
}

run()
  .then(() => process.exit(0))
  .catch((err) => {
    console.error("Error seeding departments:", err);
    process.exit(1);
  });
