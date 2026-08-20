"use server";

import { db } from "@/db";
import { departments, companyUsers } from "@/db/schema";
import { and, eq, isNull, asc, ilike, count } from "drizzle-orm";
import { getCurrentUser } from "@/lib/auth/auth";
import { revalidatePath } from "next/cache";

const DEFAULT_DEPARTMENTS = [
  {
    name: "Finance & Accounts",
    code: "FIN",
    description:
      "Invoicing, accounts receivable, reconciliation, and payment collections.",
  },
  {
    name: "Sales & Marketing",
    code: "SALES",
    description:
      "Account managers, client acquisition, and client relationship owners.",
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
      "Directors, company leadership, and final escalation authorities.",
  },
  {
    name: "Customer Support",
    code: "SUPPORT",
    description: "Client queries, tracking assistance, and billing disputes.",
  },
];

/**
 * Ensures a company has the standard departments created
 */
export async function ensureDefaultDepartments(companyId) {
  try {
    const existing = await db
      .select()
      .from(departments)
      .where(
        and(
          eq(departments.companyId, companyId),
          isNull(departments.deletedAt),
        ),
      );

    if (existing.length > 0) {
      return existing;
    }

    const toInsert = DEFAULT_DEPARTMENTS.map((d) => ({
      companyId,
      name: d.name,
      code: d.code,
      description: d.description,
      isActive: true,
    }));

    const inserted = await db.insert(departments).values(toInsert).returning();
    return inserted;
  } catch (error) {
    console.error("ensureDefaultDepartments error:", error);
    return [];
  }
}

/**
 * Get all departments for the current user's company
 */
export async function getDepartments({ activeOnly = false } = {}) {
  try {
    const currentUser = await getCurrentUser();
    if (!currentUser?.companyId) {
      return [];
    }

    const companyId = currentUser.companyId;

    // Ensure defaults exist
    await ensureDefaultDepartments(companyId);

    const conditions = [
      eq(departments.companyId, companyId),
      isNull(departments.deletedAt),
    ];

    if (activeOnly) {
      conditions.push(eq(departments.isActive, true));
    }

    const deptList = await db
      .select({
        id: departments.id,
        name: departments.name,
        code: departments.code,
        description: departments.description,
        isActive: departments.isActive,
        createdAt: departments.createdAt,
      })
      .from(departments)
      .where(and(...conditions))
      .orderBy(asc(departments.name));

    // Get user counts per department
    const usersInDept = await db
      .select({
        departmentId: companyUsers.departmentId,
        userCount: count(companyUsers.id),
      })
      .from(companyUsers)
      .where(eq(companyUsers.companyId, companyId))
      .groupBy(companyUsers.departmentId);

    const countMap = new Map();
    usersInDept.forEach((u) => {
      if (u.departmentId) {
        countMap.set(u.departmentId, Number(u.userCount));
      }
    });

    return deptList.map((d) => ({
      ...d,
      userCount: countMap.get(d.id) || 0,
    }));
  } catch (error) {
    console.error("getDepartments error:", error);
    return [];
  }
}

/**
 * Create a new department
 */
export async function createDepartment(formData) {
  try {
    const currentUser = await getCurrentUser();
    if (!currentUser?.companyId) {
      return { success: false, error: "Unauthorized" };
    }

    const name = String(formData.get("name") || "").trim();
    const code = String(formData.get("code") || "")
      .trim()
      .toUpperCase();
    const description = String(formData.get("description") || "").trim();
    const isActive = formData.get("isActive") !== "false";

    if (!name) {
      return { success: false, error: "Department name is required." };
    }

    // Check duplicate
    const existing = await db
      .select()
      .from(departments)
      .where(
        and(
          eq(departments.companyId, currentUser.companyId),
          eq(departments.name, name),
          isNull(departments.deletedAt),
        ),
      )
      .limit(1);

    if (existing.length > 0) {
      return {
        success: false,
        error: "A department with this name already exists.",
      };
    }

    await db.insert(departments).values({
      companyId: currentUser.companyId,
      name,
      code: code || null,
      description: description || null,
      isActive,
    });

    revalidatePath("/settings");
    revalidatePath("/users");

    return { success: true, message: "Department created successfully." };
  } catch (error) {
    console.error("createDepartment error:", error);
    return {
      success: false,
      error: error?.message || "Failed to create department.",
    };
  }
}

/**
 * Update a department
 */
export async function updateDepartment(departmentId, formData) {
  try {
    const currentUser = await getCurrentUser();
    if (!currentUser?.companyId) {
      return { success: false, error: "Unauthorized" };
    }

    const name = String(formData.get("name") || "").trim();
    const code = String(formData.get("code") || "")
      .trim()
      .toUpperCase();
    const description = String(formData.get("description") || "").trim();
    const isActive =
      formData.get("isActive") === "true" || formData.get("isActive") === "on";

    if (!name) {
      return { success: false, error: "Department name is required." };
    }

    await db
      .update(departments)
      .set({
        name,
        code: code || null,
        description: description || null,
        isActive,
        updatedAt: new Date(),
      })
      .where(
        and(
          eq(departments.id, Number(departmentId)),
          eq(departments.companyId, currentUser.companyId),
        ),
      );

    revalidatePath("/settings");
    revalidatePath("/users");

    return { success: true, message: "Department updated successfully." };
  } catch (error) {
    console.error("updateDepartment error:", error);
    return {
      success: false,
      error: error?.message || "Failed to update department.",
    };
  }
}

/**
 * Delete a department
 */
export async function deleteDepartment(departmentId) {
  try {
    const currentUser = await getCurrentUser();
    if (!currentUser?.companyId) {
      return { success: false, error: "Unauthorized" };
    }

    // Soft delete
    await db
      .update(departments)
      .set({
        deletedAt: new Date(),
        isActive: false,
      })
      .where(
        and(
          eq(departments.id, Number(departmentId)),
          eq(departments.companyId, currentUser.companyId),
        ),
      );

    revalidatePath("/settings");
    revalidatePath("/users");

    return { success: true, message: "Department removed successfully." };
  } catch (error) {
    console.error("deleteDepartment error:", error);
    return {
      success: false,
      error: error?.message || "Failed to delete department.",
    };
  }
}
