"use server";

import { eq } from "drizzle-orm";
import { redirect } from "next/navigation";

import { db } from "@/db";
import { sessions } from "@/db/schema";

import { getSessionCookie, deleteSessionCookie } from "@/lib/auth/cookies";
import { hashSessionToken } from "@/lib/auth/session";

export async function logout() {
  const sessionToken = await getSessionCookie();

  if (sessionToken) {
    const tokenHash = hashSessionToken(sessionToken);

    await db.delete(sessions).where(eq(sessions.tokenHash, tokenHash));

    await deleteSessionCookie();
  }

  redirect("/login");
}
