import bcrypt from "bcryptjs";

// docs/07_Database_Schema.md §4 / docs/09_Technical_Requirements.md §9, §24 —
// passwords must be securely hashed and never stored in plain text.
const SALT_ROUNDS = 12;

export function hashPassword(plainPassword: string): Promise<string> {
  return bcrypt.hash(plainPassword, SALT_ROUNDS);
}

export function verifyPassword(plainPassword: string, passwordHash: string): Promise<boolean> {
  return bcrypt.compare(plainPassword, passwordHash);
}
