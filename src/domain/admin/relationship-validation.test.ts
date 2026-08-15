import { describe, expect, it } from "vitest";
import { validateCourseRelationshipInput } from "./relationship-validation";

describe("validateCourseRelationshipInput", () => {
  it("accepts two distinct courses", () => {
    expect(validateCourseRelationshipInput({ sourceCourseId: "a", targetCourseId: "b" })).toEqual({
      valid: true,
    });
  });

  it("rejects a self-referential relationship", () => {
    const result = validateCourseRelationshipInput({ sourceCourseId: "a", targetCourseId: "a" });
    expect(result.valid).toBe(false);
    expect(result.reason).toContain("itself");
  });
});
