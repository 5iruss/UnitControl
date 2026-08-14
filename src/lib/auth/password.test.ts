import { describe, expect, it } from "vitest";
import { hashPassword, verifyPassword } from "./password";

describe("password hashing", () => {
  it("never stores the plain-text password in the hash", async () => {
    const hash = await hashPassword("CorrectPass123!");
    expect(hash).not.toBe("CorrectPass123!");
    expect(hash).not.toContain("CorrectPass123!");
  });

  it("verifies a matching password", async () => {
    const hash = await hashPassword("CorrectPass123!");
    expect(await verifyPassword("CorrectPass123!", hash)).toBe(true);
  });

  it("rejects a non-matching password", async () => {
    const hash = await hashPassword("CorrectPass123!");
    expect(await verifyPassword("WrongPassword!", hash)).toBe(false);
  });

  it("produces a different hash each time (random salt)", async () => {
    const [a, b] = await Promise.all([
      hashPassword("CorrectPass123!"),
      hashPassword("CorrectPass123!"),
    ]);
    expect(a).not.toBe(b);
  });
});
