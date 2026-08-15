import { describe, expect, it } from "vitest";
import { Prisma } from "@/generated/prisma/client";
import { isUniqueConstraintError } from "./db-errors";

describe("isUniqueConstraintError", () => {
  it("returns true for a Prisma P2002 unique-constraint violation", () => {
    const error = new Prisma.PrismaClientKnownRequestError("Unique constraint failed", {
      code: "P2002",
      clientVersion: "test",
    });
    expect(isUniqueConstraintError(error)).toBe(true);
  });

  it("returns false for a different Prisma error code", () => {
    const error = new Prisma.PrismaClientKnownRequestError("Record not found", {
      code: "P2025",
      clientVersion: "test",
    });
    expect(isUniqueConstraintError(error)).toBe(false);
  });

  it("returns false for a plain Error", () => {
    expect(isUniqueConstraintError(new Error("boom"))).toBe(false);
  });

  it("returns false for a non-error value", () => {
    expect(isUniqueConstraintError("not an error")).toBe(false);
    expect(isUniqueConstraintError(null)).toBe(false);
    expect(isUniqueConstraintError(undefined)).toBe(false);
  });
});
