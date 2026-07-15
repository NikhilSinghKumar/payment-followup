"use server";
import { db } from "@/db";
import { revalidatePath } from "next/cache";
import { and, or, asc, desc, eq, ilike, isNull, ne } from "drizzle-orm";
import { users, roles, companyUsers, companies } from "@/db/schema";

import { redirect } from "next/navigation";

import { hashPassword } from "@/lib/auth/password";

// ==========================================
// HELPERS
// ==========================================

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
// CREATE USER
// ==========================================

export async function createUser(formData) {
  try {
    // -----------------------------------------
    // Form Values
    // -----------------------------------------

    const firstName = String(formData.get("firstName") || "").trim();

    const lastName = String(formData.get("lastName") || "").trim();

    const email = String(formData.get("email") || "")
      .trim()
      .toLowerCase();

    const mobile = String(formData.get("mobile") || "").trim();

    const companyId = Number(formData.get("companyId"));
    const roleId = Number(formData.get("roleId"));

    const designation = String(formData.get("designation") || "").trim();

    const password = String(formData.get("password") || "");

    const confirmPassword = String(formData.get("confirmPassword") || "");

    const isActive = formData.get("isActive") === "on";

    // -----------------------------------------
    // Validation
    // -----------------------------------------

    if (!firstName) {
      return fail("First name is required.");
    }

    if (!email) {
      return fail("Email is required.");
    }

    if (!companyId) {
      return fail("Company is required.");
    }
    if (!roleId) {
      return fail("Role is required.");
    }
    if (!password) {
      return fail("Password is required.");
    }

    if (password !== confirmPassword) {
      return fail("Passwords do not match.");
    }

    // -----------------------------------------
    // Duplicate Email
    // -----------------------------------------

    const existingUser = await db.query.users.findFirst({
      where: eq(users.email, email),
    });

    if (existingUser) {
      return fail("Email already exists.");
    }

    // -----------------------------------------
    // Hash Password
    // -----------------------------------------

    const passwordHash = await hashPassword(password);

    // -----------------------------------------
    // Transaction
    // -----------------------------------------

    await db.transaction(async (tx) => {
      const [user] = await tx
        .insert(users)
        .values({
          firstName,
          lastName: lastName || null,
          email,
          mobile: mobile || null,
          passwordHash,
          isActive,
        })
        .returning({
          id: users.id,
        });

      await tx.insert(companyUsers).values({
        companyId,
        roleId,
        userId: user.id,
        designation: designation || null,
        isActive,
      });
    });

    // -----------------------------------------
    // Refresh
    // -----------------------------------------

    revalidatePath("/users");

    return ok("User created successfully.");
  } catch (error) {
    console.error("Create User Error:", error);

    return fail("Unable to create user.");
  }
}

// ==========================================
// GET USERS
// ==========================================

export async function getUsers({
  search = "",
  activeOnly = false,
  sort = "name",
} = {}) {
  const conditions = [];

  conditions.push(isNull(users.deletedAt));

  if (search) {
    conditions.push(
      or(
        ilike(users.firstName, `%${search}%`),
        ilike(users.lastName, `%${search}%`),
        ilike(users.email, `%${search}%`),
        ilike(companies.companyName, `%${search}%`),
      ),
    );
  }

  if (activeOnly) {
    conditions.push(eq(users.isActive, true));
  }

  const orderBy =
    sort === "name" ? asc(users.firstName) : desc(users.createdAt);

  return await db
    .select({
      id: users.id,
      firstName: users.firstName,
      lastName: users.lastName,
      email: users.email,
      mobile: users.mobile,
      isActive: users.isActive,
      lastLoginAt: users.lastLoginAt,

      companyId: companies.id,
      companyName: companies.companyName,
      roleId: roles.id,

      roleName: roles.roleName,

      designation: companyUsers.designation,
    })
    .from(users)
    .leftJoin(companyUsers, eq(companyUsers.userId, users.id))
    .leftJoin(roles, eq(roles.id, companyUsers.roleId))
    .leftJoin(companies, eq(companies.id, companyUsers.companyId))
    .where(conditions.length ? and(...conditions) : undefined)
    .orderBy(orderBy);
}

export async function getUserById(id) {
  return await db
    .select({
      id: users.id,

      firstName: users.firstName,
      lastName: users.lastName,

      email: users.email,
      mobile: users.mobile,

      isActive: users.isActive,

      companyId: companyUsers.companyId,
      roleId: companyUsers.roleId,

      designation: companyUsers.designation,
    })
    .from(users)
    .leftJoin(companyUsers, eq(companyUsers.userId, users.id))
    .where(and(eq(users.id, Number(id)), isNull(users.deletedAt)))
    .limit(1)
    .then((rows) => rows[0] ?? null);
}

// ==========================================
// UPDATE USER
// ==========================================

export async function updateUser(userId, formData) {
  try {
    // -----------------------------------------
    // Form Values
    // -----------------------------------------

    const firstName = String(formData.get("firstName") || "").trim();

    const lastName = String(formData.get("lastName") || "").trim();

    const email = String(formData.get("email") || "")
      .trim()
      .toLowerCase();

    const mobile = String(formData.get("mobile") || "").trim();

    const companyId = Number(formData.get("companyId"));
    const roleId = Number(formData.get("roleId"));
    const designation = String(formData.get("designation") || "").trim();

    const isActive = formData.get("isActive") === "on";

    // -----------------------------------------
    // Validation
    // -----------------------------------------

    if (!firstName) {
      return fail("First name is required.");
    }

    if (!email) {
      return fail("Email is required.");
    }

    if (!companyId) {
      return fail("Company is required.");
    }

    if (!roleId) {
      return fail("Role is required.");
    }

    // -----------------------------------------
    // Duplicate Email
    // -----------------------------------------

    const existingUser = await db.query.users.findFirst({
      where: and(
        eq(users.email, email),
        ne(users.id, Number(userId)),
        isNull(users.deletedAt),
      ),
    });

    if (existingUser) {
      return fail("Email already exists.");
    }

    const role = await db.query.roles.findFirst({
      where: and(
        eq(roles.id, roleId),
        eq(roles.companyId, companyId),
        isNull(roles.deletedAt),
      ),
    });

    if (!role) {
      return fail("Invalid role selected.");
    }

    // -----------------------------------------
    // Transaction
    // -----------------------------------------

    await db.transaction(async (tx) => {
      // Update users table

      await tx
        .update(users)
        .set({
          firstName,
          lastName: lastName || null,
          email,
          mobile: mobile || null,
          isActive,
          updatedAt: new Date(),
        })
        .where(eq(users.id, Number(userId)));

      // Update company_users table

      await tx
        .update(companyUsers)
        .set({
          companyId,
          roleId,
          designation: designation || null,
          isActive,
          updatedAt: new Date(),
        })
        .where(eq(companyUsers.userId, Number(userId)));
    });

    // -----------------------------------------
    // Refresh
    // -----------------------------------------

    revalidatePath("/users");
    revalidatePath(`/users/${userId}`);
    revalidatePath(`/users/${userId}/edit`);
  } catch (error) {
    console.error("Update User Error:", error);

    return fail("Unable to update user.");
  }

  redirect("/users");
}
