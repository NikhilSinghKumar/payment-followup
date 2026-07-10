"use server";

import { eq } from "drizzle-orm";

import { db } from "@/db";
import { users } from "@/db/schema";

import { verifyPassword } from "@/lib/auth/password";
import { createSession } from "@/lib/auth/session";
import { setSessionCookie } from "@/lib/auth/cookies";
import { AUTH_MESSAGES } from "@/lib/auth/constants";

export async function login(prevState, formData) {
  const email = formData.get("email")?.trim().toLowerCase();
  const password = formData.get("password");

  // -----------------------------
  // Validation
  // -----------------------------

  if (!email || !password) {
    return {
      success: false,
      message: AUTH_MESSAGES.EMAIL_PASSWORD_REQUIRED,
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
      message: AUTH_MESSAGES.INVALID_CREDENTIALS,
    };
  }

  // -----------------------------
  // User Active
  // -----------------------------

  if (!user.isActive || user.deletedAt) {
    return {
      success: false,
      message: AUTH_MESSAGES.ACCOUNT_DISABLED,
    };
  }

  // -----------------------------
  // Verify Password
  // -----------------------------

  const validPassword = await verifyPassword(password, user.passwordHash);

  if (!validPassword) {
    return {
      success: false,
      message: AUTH_MESSAGES.INVALID_EMAIL_OR_PASSWORD,
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
    message: null,
  };
}
