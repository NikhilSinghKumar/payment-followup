import crypto from "crypto";

import { db } from "@/db";
import { sessions, companyUsers } from "@/db/schema";
import { and, eq } from "drizzle-orm";

import { SESSION_DURATION_DAYS, SESSION_TOKEN_BYTES } from "./constants";

const INVALID_SESSION = {
  session: null,
  user: null,
};

export function generateSessionToken() {
  return crypto.randomBytes(SESSION_TOKEN_BYTES).toString("hex");
}

export function hashSessionToken(token) {
  return crypto.createHash("sha256").update(token).digest("hex");
}

export async function createSession({
  userId,
  ipAddress = null,
  userAgent = null,
}) {
  // Generate session token
  const sessionToken = generateSessionToken();

  // Hash token before storing
  const tokenHash = hashSessionToken(sessionToken);

  // Session expiry
  const expiresAt = new Date(
    Date.now() + SESSION_DURATION_DAYS * 24 * 60 * 60 * 1000,
  );

  // Save session
  await db.insert(sessions).values({
    userId,
    tokenHash,
    ipAddress,
    userAgent,
    expiresAt,
  });

  return {
    sessionToken,
    expiresAt,
  };
}

export async function validateSession(sessionToken) {
  if (!sessionToken) {
    return INVALID_SESSION;
  }

  const tokenHash = hashSessionToken(sessionToken);

  const session = await db.query.sessions.findFirst({
    where: eq(sessions.tokenHash, tokenHash),

    with: {
      user: true,
    },
  });

  // Session not found
  if (!session) {
    return INVALID_SESSION;
  }

  if (session.user.deletedAt) {
    return INVALID_SESSION;
  }

  // Session revoked
  if (session.isRevoked) {
    return INVALID_SESSION;
  }

  // Session expired
  if (session.expiresAt < new Date()) {
    await db.delete(sessions).where(eq(sessions.id, session.id));

    return INVALID_SESSION;
  }

  // User inactive
  if (!session.user.isActive) {
    return INVALID_SESSION;
  }

  const companyUser = await db.query.companyUsers.findFirst({
    where: and(
      eq(companyUsers.userId, session.user.id),
      eq(companyUsers.isActive, true),
    ),
  });

  return {
    session,
    user: session.user,
    companyId: companyUser?.companyId ?? null,
  };
}
