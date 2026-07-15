"use server";

import { and, asc, desc, eq, ilike, isNull, or } from "drizzle-orm";

import { db } from "@/db";
import { roles, rolePermissions, companies, permissions } from "@/db/schema";
import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";

// ==========================================
// GET ROLES
// ==========================================

export async function getRoles({
  search = "",
  activeOnly = false,
  sort = "name",
} = {}) {
  const conditions = [];

  // Ignore deleted roles
  conditions.push(isNull(roles.deletedAt));

  // Search
  if (search) {
    conditions.push(
      or(
        ilike(roles.roleName, `%${search}%`),
        ilike(roles.description, `%${search}%`),
        ilike(companies.companyName, `%${search}%`),
      ),
    );
  }

  // Active only
  if (activeOnly) {
    conditions.push(eq(roles.isActive, true));
  }

  const orderBy = sort === "name" ? asc(roles.roleName) : desc(roles.createdAt);

  return await db
    .select({
      id: roles.id,

      roleName: roles.roleName,

      description: roles.description,

      isSystem: roles.isSystem,

      isActive: roles.isActive,

      companyId: companies.id,

      companyName: companies.companyName,

      createdAt: roles.createdAt,
    })
    .from(roles)
    .leftJoin(companies, eq(companies.id, roles.companyId))
    .where(and(...conditions))
    .orderBy(orderBy);
}

// ==========================================
// CREATE ROLE
// ==========================================

// ------------------------------------------
// Helpers
// ------------------------------------------

function fail(message) {
  return {
    success: false,
    message,
  };
}

// ==========================================
// CREATE ROLE
// ==========================================

export async function createRole(formData) {
  try {
    // -----------------------------------------
    // Form Values
    // -----------------------------------------

    const roleName = String(formData.get("roleName") || "").trim();

    const companyId = Number(formData.get("companyId"));

    const description = String(formData.get("description") || "").trim();

    const isActive = formData.get("isActive") === "on";

    // -----------------------------------------
    // Validation
    // -----------------------------------------

    if (!roleName) {
      return fail("Role name is required.");
    }

    if (!companyId) {
      return fail("Company is required.");
    }

    // -----------------------------------------
    // Duplicate Role
    // -----------------------------------------

    const existingRole = await db.query.roles.findFirst({
      where: and(
        eq(roles.companyId, companyId),
        eq(roles.roleName, roleName),
        isNull(roles.deletedAt),
      ),
    });

    if (existingRole) {
      return fail("Role already exists for this company.");
    }

    // -----------------------------------------
    // Create Role
    // -----------------------------------------

    await db.insert(roles).values({
      companyId,
      roleName,
      description: description || null,
      isSystem: false,
      isActive,
    });

    // -----------------------------------------
    // Refresh
    // -----------------------------------------

    revalidatePath("/roles");
  } catch (error) {
    console.error("Create Role Error:", error);

    return fail("Unable to create role.");
  }

  redirect("/roles");
}

// ==========================================
// GET ROLE BY ID
// ==========================================

export async function getRoleById(id) {
  const role = await db.query.roles.findFirst({
    where: and(eq(roles.id, Number(id)), isNull(roles.deletedAt)),
  });

  if (!role) {
    return null;
  }

  const assignedPermissions = await db
    .select({
      permissionId: rolePermissions.permissionId,
    })
    .from(rolePermissions)
    .where(eq(rolePermissions.roleId, Number(id)));

  return {
    ...role,

    permissionIds: assignedPermissions.map((p) => p.permissionId),
  };
}

export async function updateRole(roleId, formData) {
  try {
    // -----------------------------------------
    // Form Values
    // -----------------------------------------

    const roleName = String(formData.get("roleName") || "").trim();

    const companyId = Number(formData.get("companyId"));

    const description = String(formData.get("description") || "").trim();

    const isActive = formData.get("isActive") === "on";

    const permissionIds = formData.getAll("permissionIds").map(Number);

    // -----------------------------------------
    // Validation
    // -----------------------------------------

    if (!roleName) {
      return fail("Role name is required.");
    }

    if (!companyId) {
      return fail("Company is required.");
    }

    // -----------------------------------------
    // Duplicate Role
    // -----------------------------------------

    const existingRole = await db.query.roles.findFirst({
      where: and(
        eq(roles.companyId, companyId),
        eq(roles.roleName, roleName),
        ne(roles.id, Number(roleId)),
        isNull(roles.deletedAt),
      ),
    });

    if (existingRole) {
      return fail("Role already exists for this company.");
    }

    // -----------------------------------------
    // Transaction
    // -----------------------------------------

    await db.transaction(async (tx) => {
      // Update Role

      await tx
        .update(roles)
        .set({
          roleName,
          companyId,
          description: description || null,
          isActive,
          updatedAt: new Date(),
        })
        .where(eq(roles.id, Number(roleId)));

      // -------------------------------------
      // Remove Existing Permissions
      // -------------------------------------

      await tx
        .delete(rolePermissions)
        .where(eq(rolePermissions.roleId, Number(roleId)));

      // -------------------------------------
      // Insert Selected Permissions
      // -------------------------------------

      if (permissionIds.length > 0) {
        await tx.insert(rolePermissions).values(
          permissionIds.map((permissionId) => ({
            roleId: Number(roleId),
            permissionId,
          })),
        );
      }
    });

    // -----------------------------------------
    // Refresh
    // -----------------------------------------

    revalidatePath("/roles");
    revalidatePath(`/roles/${roleId}/edit`);
  } catch (error) {
    console.error("Update Role Error:", error);

    return fail("Unable to update role.");
  }

  redirect("/roles");
}
