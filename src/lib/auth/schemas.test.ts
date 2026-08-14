import { describe, expect, it } from "vitest";
import { loginSchema, registerSchema, supportResetPasswordSchema } from "./schemas";

describe("registerSchema", () => {
  const valid = {
    studentNumber: "40012345",
    password: "CorrectPass123!",
    firstName: "Sara",
    lastName: "Ahmadi",
    phoneNumber: "09123456789",
  };

  it("accepts a fully valid registration payload", () => {
    expect(registerSchema.safeParse(valid).success).toBe(true);
  });

  it("rejects a missing student number", () => {
    const result = registerSchema.safeParse({ ...valid, studentNumber: "" });
    expect(result.success).toBe(false);
  });

  it("rejects a password shorter than 8 characters", () => {
    const result = registerSchema.safeParse({ ...valid, password: "short1" });
    expect(result.success).toBe(false);
  });

  it("rejects a malformed phone number", () => {
    const result = registerSchema.safeParse({ ...valid, phoneNumber: "12345" });
    expect(result.success).toBe(false);
  });

  it("rejects a phone number missing the 09 prefix", () => {
    const result = registerSchema.safeParse({ ...valid, phoneNumber: "19123456789" });
    expect(result.success).toBe(false);
  });
});

describe("loginSchema", () => {
  it("accepts student number or phone number as the identifier", () => {
    expect(loginSchema.safeParse({ identifier: "40012345", password: "x" }).success).toBe(true);
    expect(
      loginSchema.safeParse({ identifier: "09123456789", password: "x" }).success,
    ).toBe(true);
  });

  it("rejects an empty identifier", () => {
    expect(loginSchema.safeParse({ identifier: "", password: "x" }).success).toBe(false);
  });
});

describe("supportResetPasswordSchema", () => {
  it("accepts a valid reset payload", () => {
    const result = supportResetPasswordSchema.safeParse({
      identifier: "40012345",
      newPassword: "CorrectPass123!",
    });
    expect(result.success).toBe(true);
  });

  it("rejects a new password shorter than 8 characters", () => {
    const result = supportResetPasswordSchema.safeParse({
      identifier: "40012345",
      newPassword: "short1",
    });
    expect(result.success).toBe(false);
  });
});
