"use server";

import { eq } from "drizzle-orm";

import { db } from "@/db";
import { users } from "@/db/schema";

import { verifyPassword } from "@/lib/auth/password";
import { createSession } from "@/lib/auth/session";
import { setSessionCookie } from "@/lib/auth/cookies";

export async function login(prevState, formData) {
  const email = formData.get("email")?.trim().toLowerCase();
  const password = formData.get("password");

  console.log("Email:", formData.get("email"));
  console.log("Password:", formData.get("password"));

  for (const [key, value] of formData.entries()) {
    console.log(key, value);
  }

  // -----------------------------
  // Validation
  // -----------------------------

  if (!email || !password) {
    return {
      success: false,
      error: "Email and password are required.",
    };
  }

  // -----------------------------
  // Find User
  // -----------------------------

  const user = await db.query.users.findFirst({
    where: eq(users.email, email),
  });

  if (!user) {
    return {
      success: false,
      error: "Invalid email or password.",
    };
  }

  // -----------------------------
  // User Active
  // -----------------------------

  if (!user.isActive || user.deletedAt) {
    return {
      success: false,
      error: "Your account has been disabled.",
    };
  }

  // -----------------------------
  // Verify Password
  // -----------------------------

  const validPassword = await verifyPassword(password, user.passwordHash);

  if (!validPassword) {
    return {
      success: false,
      error: "Invalid email or password.",
    };
  }

  // -----------------------------
  // Create Session
  // -----------------------------

  const { sessionToken, expiresAt } = await createSession({
    userId: user.id,
  });

  // -----------------------------
  // Cookie
  // -----------------------------

  await setSessionCookie(sessionToken, expiresAt);

  // -----------------------------
  // Update Login Time
  // -----------------------------

  await db
    .update(users)
    .set({
      lastLoginAt: new Date(),
    })
    .where(eq(users.id, user.id));

  return {
    success: true,
    error: null,
  };
}
