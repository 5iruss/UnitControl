import { describe, expect, it } from "vitest";
import { evaluatePrerequisite } from "./prerequisite";

// docs/04_Academic_Rules_Engine.md §3 table.
describe("evaluatePrerequisite", () => {
  it("is satisfied when the prerequisite was PASSED", () => {
    const result = evaluatePrerequisite("course-a", "PASSED", []);
    expect(result.satisfied).toBe(true);
    expect(result.warning).toBeUndefined();
  });

  it("is satisfied, with a risk warning, when the prerequisite was FAILED (§4 — failed is still attempted)", () => {
    const result = evaluatePrerequisite("course-a", "FAILED", [
      { courseId: "course-a", termCode: "4051", result: "FAILED" },
    ]);
    expect(result.satisfied).toBe(true);
    expect(result.warning).toContain("4051");
  });

  it("is not satisfied when the prerequisite is CURRENTLY_STUDYING for the first time", () => {
    const result = evaluatePrerequisite("course-a", "CURRENTLY_STUDYING", []);
    expect(result.satisfied).toBe(false);
    expect(result.reason).toContain("course-a");
  });

  it("is satisfied when CURRENTLY_STUDYING but a prior FAILED attempt exists (retake)", () => {
    const result = evaluatePrerequisite("course-a", "CURRENTLY_STUDYING", [
      { courseId: "course-a", termCode: "4051", result: "FAILED" },
    ]);
    expect(result.satisfied).toBe(true);
  });

  it("is not satisfied when the prerequisite is only PLANNED", () => {
    const result = evaluatePrerequisite("course-a", "PLANNED", []);
    expect(result.satisfied).toBe(false);
  });

  it("is not satisfied when the prerequisite is NOT_COMPLETED", () => {
    const result = evaluatePrerequisite("course-a", "NOT_COMPLETED", []);
    expect(result.satisfied).toBe(false);
  });
});
