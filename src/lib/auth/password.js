import bcrypt from "bcrypt";

const SALT_ROUNDS = 12;

/**
 * Hash a plain text password
 */
export async function hashPassword(password) {
  return bcrypt.hash(password, SALT_ROUNDS);
}

/**
 * Verify password against stored hash
 */
export async function verifyPassword(password, hash) {
  return bcrypt.compare(password, hash);
}
