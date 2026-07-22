import { db } from "../src/db";
import { permissions } from "../src/db/schema";
import { PERMISSIONS } from "../src/lib/auth/permissions";

import { eq } from "drizzle-orm";

export async function seedPermissions() {
  console.log("🌱 Seeding permissions...");

  let created = 0;
  let skipped = 0;

  for (const permissionModule of PERMISSIONS) {
    const moduleKey = permissionModule.module
      .toLowerCase()
      .replace(/\s+/g, "_");

    for (const action of permissionModule.actions) {
      const permissionKey = `${moduleKey}.${action}`;

      const existing = await db.query.permissions.findFirst({
        where: eq(permissions.permissionKey, permissionKey),
      });

      if (existing) {
        skipped++;
        continue;
      }

      await db.insert(permissions).values({
        permissionKey,
        module: permissionModule.module,
        action,
        description: `${action} ${permissionModule.module}`,
      });

      created++;
    }
  }

  console.log("==================================");
  console.log(`✅ Created : ${created}`);
  console.log(`⏭️  Skipped : ${skipped}`);
  console.log("==================================");
}
