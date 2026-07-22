import "dotenv/config";
import bcrypt from "bcrypt";
import { eq } from "drizzle-orm";

import { db } from "../src/db";
import { users, companies } from "../src/db/schema";

import { seedPermissions } from "./seed-permissions";
import { seedNotificationTemplates } from "./seed-notification-templates";

async function seed() {
  const DEFAULT_PASSWORD = "Admin@123";
  const ADMIN_EMAIL = "nikhil@pafex.in";
  const SALT_ROUNDS = 12;

  console.log("🌱 Seeding database...");

  // -----------------------------------------
  // Super Admin
  // -----------------------------------------

  const existingAdmin = await db.query.users.findFirst({
    where: eq(users.email, ADMIN_EMAIL),
  });

  if (!existingAdmin) {
    const passwordHash = await bcrypt.hash(DEFAULT_PASSWORD, SALT_ROUNDS);

    await db.insert(users).values({
      firstName: "Super",
      lastName: "Admin",
      email: ADMIN_EMAIL,
      passwordHash,
      userType: "SUPER_ADMIN",
      isActive: true,
      emailVerified: true,
    });

    console.log("✅ Super Admin created");
  } else {
    console.log("ℹ️ Super Admin already exists");
  }

  // -----------------------------------------
  // Demo Company
  // -----------------------------------------

  const existingCompany = await db.query.companies.findFirst({
    where: eq(companies.companyCode, "PAFEX"),
  });

  if (!existingCompany) {
    await db.insert(companies).values({
      companyName: "Pafex",
      companyCode: "PAFEX",
      gstNumber: "22AAAAA0000A1Z5",
      email: "info@pafex.com",
      phone: "9999999999",
      city: "New Delhi",
      state: "Delhi",
      country: "India",
    });

    console.log("✅ Demo Company created");
  } else {
    console.log("ℹ️ Demo Company already exists");
  }

  // -----------------------------------------
  // Permissions
  // -----------------------------------------

  await seedPermissions();

  await seedNotificationTemplates();

  console.log("");
  console.log("===================================");
  console.log("✅ Database seeded successfully");
  console.log("===================================");
  console.log("");
  console.log(`Email    : ${ADMIN_EMAIL}`);
  console.log(`Password : ${DEFAULT_PASSWORD}`);
}

seed()
  .then(() => process.exit(0))
  .catch((err) => {
    console.error(err);
    process.exit(1);
  });
