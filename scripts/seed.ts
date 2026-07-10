import "dotenv/config";
import bcrypt from "bcrypt";
import { eq } from "drizzle-orm";

import { db } from "../src/db";
import { users, companies } from "../src/db/schema";

async function seed() {
  const DEFAULT_PASSWORD = "Admin@123";
  const ADMIN_EMAIL = "nikhil@pafex.in";
  const SALT_ROUNDS = 12;

  const existingAdmin = await db.query.users.findFirst({
    where: eq(users.email, ADMIN_EMAIL),
  });

  if (existingAdmin) {
    console.log("Super Admin already exists.");
    return;
  }
  console.log("🌱 Seeding database...");

  // -----------------------------------------
  // Password
  // -----------------------------------------

  const passwordHash = await bcrypt.hash(DEFAULT_PASSWORD, SALT_ROUNDS);

  // -----------------------------------------
  // Create Super Admin
  // -----------------------------------------

  await db
    .insert(users)
    .values({
      name: "Super Admin",
      email: "nikhil@pafex.in",
      passwordHash,
      userType: "SUPER_ADMIN",
      isActive: true,
      emailVerified: true,
    })
    .returning();

  console.log("✅ Super Admin created");

  // -----------------------------------------
  // Create Demo Company
  // -----------------------------------------

  await db
    .insert(companies)
    .values({
      companyName: "Pafex",
      companyCode: "PAFEX",
      gstNumber: "22AAAAA0000A1Z5",
      email: "info@pafex.com",
      phone: "9999999999",
      city: "New Delhi",
      state: "Delhi",
      country: "India",
    })
    .returning();

  console.log("✅ Company created");

  console.log("");
  console.log("===================================");
  console.log("Seed completed successfully");
  console.log("===================================");
  console.log("");
  console.log("Login");
  console.log(`Email    : ${ADMIN_EMAIL}`);
  console.log(`Password : ${DEFAULT_PASSWORD}`);
}

seed()
  .then(() => process.exit(0))
  .catch((err) => {
    console.error(err);
    process.exit(1);
  });
