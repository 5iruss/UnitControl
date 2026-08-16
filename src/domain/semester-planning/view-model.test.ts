import { describe, expect, it } from "vitest";
import { buildSemesterPlanViewModel } from "./view-model";
import type { PlannedCourseInput } from "./types";

const AVAILABLE = { allowed: true, status: "AVAILABLE" as const, reasons: [], warnings: [] };

function planned(overrides: Partial<PlannedCourseInput> = {}): PlannedCourseInput {
  return {
    courseId: "course-a",
    courseCode: "1000",
    name: "Course A",
    termCode: "4051",
    eligibility: AVAILABLE,
    ...overrides,
  };
}

describe("buildSemesterPlanViewModel", () => {
  it("returns an empty list when there are no planned courses", () => {
    expect(buildSemesterPlanViewModel([])).toEqual([]);
  });

  it("groups courses by term", () => {
    const result = buildSemesterPlanViewModel([
      planned({ courseId: "a", termCode: "4051" }),
      planned({ courseId: "b", termCode: "4052" }),
      planned({ courseId: "c", termCode: "4051" }),
    ]);
    expect(result).toHaveLength(2);
    expect(result[0].termCode).toBe("4051");
    expect(result[0].courses.map((c) => c.courseId).sort()).toEqual(["a", "c"]);
    expect(result[1].termCode).toBe("4052");
  });

  it("orders semesters chronologically (Mehr < Bahman < Summer, year takes priority) regardless of input order", () => {
    const result = buildSemesterPlanViewModel([
      planned({ courseId: "a", termCode: "4061" }),
      planned({ courseId: "b", termCode: "4053" }),
      planned({ courseId: "c", termCode: "4051" }),
      planned({ courseId: "d", termCode: "4052" }),
    ]);
    expect(result.map((s) => s.termCode)).toEqual(["4051", "4052", "4053", "4061"]);
  });

  it("does not sort term codes lexicographically", () => {
    // Lexicographic order of "4091" vs "4052" would be wrong (9 < 5 as a
    // string prefix comparison quirk isn't at play here, but year-crossing
    // is): 4052 (Bahman 1405) must come before 4091 (Mehr 1409).
    const result = buildSemesterPlanViewModel([
      planned({ courseId: "a", termCode: "4091" }),
      planned({ courseId: "b", termCode: "4052" }),
    ]);
    expect(result.map((s) => s.termCode)).toEqual(["4052", "4091"]);
  });

  it("produces a human-readable term label", () => {
    const result = buildSemesterPlanViewModel([planned({ termCode: "4051" })]);
    expect(result[0].termLabel).toBe("مهر 1405");
  });

  it("sorts courses within a semester deterministically by name", () => {
    const result = buildSemesterPlanViewModel([
      planned({ courseId: "a", name: "Zeta" }),
      planned({ courseId: "b", name: "Alpha" }),
    ]);
    expect(result[0].courses.map((c) => c.courseId)).toEqual(["b", "a"]);
  });

  it("carries eligibility through unchanged", () => {
    const blocked = { allowed: false, status: "BLOCKED" as const, reasons: ["x"], warnings: [] };
    const result = buildSemesterPlanViewModel([planned({ eligibility: blocked })]);
    expect(result[0].courses[0].eligibility).toEqual(blocked);
  });
});
