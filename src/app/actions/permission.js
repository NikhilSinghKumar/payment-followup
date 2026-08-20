"use server";

import { db } from "@/db";
import { permissions, rolePermissions } from "@/db/schema";
import { and, asc, desc, eq, ilike, sql } from "drizzle-orm";
import { revalidatePath } from "next/cache";

function fail(message) {
  return {
    success: false,
    message,
  };
}

function ok(message = null) {
  return {
    success: true,
    message,
  };
}

// ==========================================
// GET ALL PERMISSIONS
// ==========================================

export async function getPermissions({ search = "", module = "ALL" } = {}) {
  try {
    const conditions = [];

    if (search) {
      conditions.push(
        sql`(${permissions.permissionKey} ILIKE ${`%${search}%`} OR ${permissions.module} ILIKE ${`%${search}%`} OR ${permissions.action} ILIKE ${`%${search}%`} OR ${permissions.description} ILIKE ${`%${search}%`})`,
      );
    }

    if (module && module !== "ALL") {
      conditions.push(eq(permissions.module, module));
    }

    const list = await db
      .select({
        id: permissions.id,
        permissionKey: permissions.permissionKey,
        module: permissions.module,
        action: permissions.action,
        description: permissions.description,
        createdAt: permissions.createdAt,
        rolesCount: sql`count(${rolePermissions.roleId})`,
      })
      .from(permissions)
      .leftJoin(
        rolePermissions,
        eq(rolePermissions.permissionId, permissions.id),
      )
      .where(conditions.length ? and(...conditions) : undefined)
      .groupBy(permissions.id)
      .orderBy(asc(permissions.module), asc(permissions.action));

    // If database has 0 permissions, automatically seed standard defaults so the user has full functionality
    if (list.length === 0 && !search && module === "ALL") {
      await seedStandardPermissions();
      return await getPermissions();
    }

    return list;
  } catch (error) {
    console.error("getPermissions error:", error);
    return [];
  }
}

// ==========================================
// GET PERMISSION BY ID
// ==========================================

export async function getPermissionById(id) {
  try {
    const permission = await db.query.permissions.findFirst({
      where: eq(permissions.id, Number(id)),
    });

    return permission || null;
  } catch (error) {
    console.error("getPermissionById error:", error);
    return null;
  }
}

// ==========================================
// CREATE PERMISSION
// ==========================================

export async function createPermission(prevState, formData) {
  try {
    const moduleName = String(formData.get("module") || "")
      .trim()
      .toLowerCase();
    const actionName = String(formData.get("action") || "")
      .trim()
      .toLowerCase();
    let permissionKey = String(formData.get("permissionKey") || "")
      .trim()
      .toLowerCase();
    const description = String(formData.get("description") || "").trim();

    if (!moduleName) {
      return fail(
        "Module name is required (e.g. invoices, clients, payments).",
      );
    }

    if (!actionName) {
      return fail("Action name is required (e.g. view, create, edit, export).");
    }

    // Auto-generate key if not explicitly given
    if (!permissionKey) {
      permissionKey = `${moduleName}.${actionName}`;
    }

    // Check duplicate
    const existing = await db.query.permissions.findFirst({
      where: eq(permissions.permissionKey, permissionKey),
    });

    if (existing) {
      return fail(`Permission key '${permissionKey}' already exists.`);
    }

    await db.insert(permissions).values({
      module: moduleName,
      action: actionName,
      permissionKey,
      description: description || null,
    });

    revalidatePath("/permissions");
    revalidatePath("/roles/new");

    return ok("Permission created successfully.");
  } catch (error) {
    console.error("createPermission error:", error);
    return fail("Failed to create permission.");
  }
}

// ==========================================
// UPDATE PERMISSION
// ==========================================

export async function updatePermission(permissionId, prevState, formData) {
  try {
    const numericId = Number(permissionId);
    if (!numericId) {
      return fail("Invalid permission ID.");
    }

    const moduleName = String(formData.get("module") || "")
      .trim()
      .toLowerCase();
    const actionName = String(formData.get("action") || "")
      .trim()
      .toLowerCase();
    const permissionKey = String(formData.get("permissionKey") || "")
      .trim()
      .toLowerCase();
    const description = String(formData.get("description") || "").trim();

    if (!moduleName) {
      return fail("Module name is required.");
    }

    if (!actionName) {
      return fail("Action name is required.");
    }

    if (!permissionKey) {
      return fail("Permission key is required.");
    }

    // Check duplicate key for other permission
    const existing = await db.query.permissions.findFirst({
      where: and(
        eq(permissions.permissionKey, permissionKey),
        sql`${permissions.id} != ${numericId}`,
      ),
    });

    if (existing) {
      return fail(
        `Permission key '${permissionKey}' is already used by another permission.`,
      );
    }

    await db
      .update(permissions)
      .set({
        module: moduleName,
        action: actionName,
        permissionKey,
        description: description || null,
      })
      .where(eq(permissions.id, numericId));

    revalidatePath("/permissions");
    revalidatePath(`/permissions/${numericId}/edit`);
    revalidatePath("/roles");

    return ok("Permission updated successfully.");
  } catch (error) {
    console.error("updatePermission error:", error);
    return fail("Failed to update permission.");
  }
}

// ==========================================
// DELETE PERMISSION
// ==========================================

export async function deletePermission(permissionId) {
  try {
    const numericId = Number(permissionId);
    if (!numericId) {
      return fail("Invalid permission ID.");
    }

    await db.delete(permissions).where(eq(permissions.id, numericId));

    revalidatePath("/permissions");
    revalidatePath("/roles");

    return ok("Permission deleted successfully.");
  } catch (error) {
    console.error("deletePermission error:", error);
    return fail("Failed to delete permission.");
  }
}

// ==========================================
// SEED DEFAULT PERMISSIONS
// ==========================================

export async function seedStandardPermissions() {
  try {
    const defaultList = [
      // Invoices
      {
        module: "invoices",
        action: "view",
        permissionKey: "invoices.view",
        description: "View invoices list and invoice details",
      },
      {
        module: "invoices",
        action: "create",
        permissionKey: "invoices.create",
        description: "Create and import invoices",
      },
      {
        module: "invoices",
        action: "edit",
        permissionKey: "invoices.edit",
        description: "Edit invoice terms and line items",
      },
      {
        module: "invoices",
        action: "delete",
        permissionKey: "invoices.delete",
        description: "Cancel or delete invoices",
      },
      {
        module: "invoices",
        action: "reminders",
        permissionKey: "invoices.reminders",
        description: "Trigger single and bulk email reminders",
      },
      {
        module: "invoices",
        action: "export",
        permissionKey: "invoices.export",
        description: "Export invoices to Excel / CSV",
      },

      // Clients
      {
        module: "clients",
        action: "view",
        permissionKey: "clients.view",
        description: "View clients list and statement ledgers",
      },
      {
        module: "clients",
        action: "create",
        permissionKey: "clients.create",
        description: "Create new clients and contacts",
      },
      {
        module: "clients",
        action: "edit",
        permissionKey: "clients.edit",
        description: "Edit client profiles and credit limits",
      },
      {
        module: "clients",
        action: "delete",
        permissionKey: "clients.delete",
        description: "Archive or delete client records",
      },

      // Payments
      {
        module: "payments",
        action: "view",
        permissionKey: "payments.view",
        description: "View payment transactions and receipts",
      },
      {
        module: "payments",
        action: "create",
        permissionKey: "payments.create",
        description: "Record incoming client payments",
      },
      {
        module: "payments",
        action: "allocate",
        permissionKey: "payments.allocate",
        description: "Allocate payments against invoices",
      },

      // Followups
      {
        module: "followups",
        action: "view",
        permissionKey: "followups.view",
        description: "View payment follow-up timeline",
      },
      {
        module: "followups",
        action: "create",
        permissionKey: "followups.create",
        description: "Log phone calls and remarks",
      },
      {
        module: "followups",
        action: "edit",
        permissionKey: "followups.edit",
        description: "Update follow-up status and promises",
      },

      // Users & Roles
      {
        module: "users",
        action: "manage",
        permissionKey: "users.manage",
        description: "Create and manage system user accounts",
      },
      {
        module: "roles",
        action: "manage",
        permissionKey: "roles.manage",
        description: "Configure roles and assign permissions",
      },
      {
        module: "companies",
        action: "manage",
        permissionKey: "companies.manage",
        description: "Manage companies and bank details",
      },

      // System Settings
      {
        module: "settings",
        action: "notifications",
        permissionKey: "settings.notifications",
        description: "Manage reminder rules and automation schedules",
      },
      {
        module: "reports",
        action: "view",
        permissionKey: "reports.view",
        description: "Access analytics and aging reports",
      },
    ];

    for (const item of defaultList) {
      const existing = await db.query.permissions.findFirst({
        where: eq(permissions.permissionKey, item.permissionKey),
      });

      if (!existing) {
        await db.insert(permissions).values(item);
      }
    }

    return ok("Standard permissions seeded.");
  } catch (error) {
    console.error("seedStandardPermissions error:", error);
    return fail("Failed to seed default permissions.");
  }
}
