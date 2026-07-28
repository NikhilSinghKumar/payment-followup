"use server";

import { eq } from "drizzle-orm";
import { headers } from "next/headers";

import { db } from "@/db";
import { users } from "@/db/schema";

import { verifyPassword } from "@/lib/auth/password";
import { createSession } from "@/lib/auth/session";
import { setSessionCookie } from "@/lib/auth/cookies";
import { AUTH_MESSAGES } from "@/lib/auth/constants";

export async function login(prevState, formData) {
  try {
    // -----------------------------
    // Form Data
    // -----------------------------

    const emailValue = formData.get("email");
    const passwordValue = formData.get("password");

    const email =
      typeof emailValue === "string" ? emailValue.trim().toLowerCase() : "";

    const password = typeof passwordValue === "string" ? passwordValue : "";

    // -----------------------------
    // Validation
    // -----------------------------

    if (!email && !password) {
      return {
        success: false,
        message: AUTH_MESSAGES.LOGIN_CREDENTIALS_REQUIRED,
      };
    }

    if (!email) {
      return {
        success: false,
        message: AUTH_MESSAGES.EMAIL_REQUIRED,
      };
    }

    if (!password) {
      return {
        success: false,
        message: AUTH_MESSAGES.PASSWORD_REQUIRED,
      };
    }

    // -----------------------------
    // Request Information
    // -----------------------------

    const headersList = await headers();

    const forwardedFor = headersList.get("x-forwarded-for");

    const ipAddress = forwardedFor
      ? forwardedFor.split(",")[0].trim()
      : (headersList.get("x-real-ip") ?? null);

    const userAgent = headersList.get("user-agent") ?? null;

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
      ipAddress,
      userAgent,
    });

    // -----------------------------
    // Set Cookie
    // -----------------------------

    await setSessionCookie(sessionToken, expiresAt);

    // -----------------------------
    // Update Last Login
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
  } catch (error) {
    console.error("Login Error:", {
      message: error?.message,
      stack: error?.stack,
    });

    return {
      success: false,
      message:
        AUTH_MESSAGES.SOMETHING_WENT_WRONG ??
        "Something went wrong. Please try again.",
    };
  }
}
