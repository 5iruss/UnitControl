import { describe, expect, it } from "vitest";
import {
  buildCourseRecommendations,
  buildFailedCourseWarnings,
  buildPlannedCourseAlerts,
} from "./engine";
import type { CandidateCourseInput, PlannedCourseAlertInput } from "./types";
import type { ValidationResult } from "@/domain/academic";

const AVAILABLE: ValidationResult = { allowed: true, status: "AVAILABLE", reasons: [], warnings: [] };
const AVAILABLE_WITH_WARNING = (warnings: string[]): ValidationResult => ({
  allowed: true,
  status: "AVAILABLE_WITH_WARNING",
  reasons: [],
  warnings,
});
const BLOCKED = (reasons: string[]): ValidationResult => ({
  allowed: false,
  status: "BLOCKED",
  reasons,
  warnings: [],
});

function candidate(overrides: Partial<CandidateCourseInput>): CandidateCourseInput {
  return {
    courseId: "course-1",
    courseCode: "CS101",
    name: "Course One",
    status: "NOT_COMPLETED",
    eligibility: AVAILABLE,
    ...overrides,
  };
}

describe("buildCourseRecommendations", () => {
  it("recommends an AVAILABLE not-completed course with a truthful reason", () => {
    const result = buildCourseRecommendations([candidate({})]);
    expect(result).toHaveLength(1);
    expect(result[0].reasons).toEqual([
      "هیچ محدودیت پیش‌نیاز یا هم‌نیازی این درس را مسدود نکرده است.",
    ]);
  });

  it("recommends an AVAILABLE_WITH_WARNING course, surfacing the engine's own warning as the reason", () => {
    const result = buildCourseRecommendations([
      candidate({ eligibility: AVAILABLE_WITH_WARNING(["A prerequisite was previously failed."]) }),
    ]);
    expect(result).toHaveLength(1);
    expect(result[0].reasons).toEqual(["A prerequisite was previously failed."]);
  });

  it("excludes a BLOCKED course", () => {
    const result = buildCourseRecommendations([
      candidate({ eligibility: BLOCKED(["Prerequisite has not been previously attempted."]) }),
    ]);
    expect(result).toEqual([]);
  });

  it("excludes a PASSED course", () => {
    const result = buildCourseRecommendations([candidate({ status: "PASSED" })]);
    expect(result).toEqual([]);
  });

  it("excludes a CURRENTLY_STUDYING course", () => {
    const result = buildCourseRecommendations([candidate({ status: "CURRENTLY_STUDYING" })]);
    expect(result).toEqual([]);
  });

  it("excludes an already-PLANNED course", () => {
    const result = buildCourseRecommendations([candidate({ status: "PLANNED" })]);
    expect(result).toEqual([]);
  });

  it("includes a FAILED course as a candidate (retaking is a legitimate next step)", () => {
    const result = buildCourseRecommendations([candidate({ status: "FAILED" })]);
    expect(result).toHaveLength(1);
  });

  it("sorts AVAILABLE before AVAILABLE_WITH_WARNING, then deterministically by name", () => {
    const result = buildCourseRecommendations([
      candidate({ courseId: "b", name: "Bravo", eligibility: AVAILABLE_WITH_WARNING(["w"]) }),
      candidate({ courseId: "a", name: "Alpha", eligibility: AVAILABLE }),
      candidate({ courseId: "c", name: "Charlie", eligibility: AVAILABLE }),
    ]);
    expect(result.map((r) => r.courseId)).toEqual(["a", "c", "b"]);
  });

  it("is stable/deterministic across repeated calls with the same input", () => {
    const input = [
      candidate({ courseId: "z", name: "Zed" }),
      candidate({ courseId: "a", name: "Alpha" }),
    ];
    expect(buildCourseRecommendations(input)).toEqual(buildCourseRecommendations(input));
  });
});

describe("buildFailedCourseWarnings", () => {
  it("produces a FAILED_COURSE_RISK warning for a FAILED course", () => {
    const result = buildFailedCourseWarnings(
      [candidate({ status: "FAILED", courseId: "f1", name: "Failed Course" })],
      [{ courseId: "f1", termCode: "4041", result: "FAILED" }],
    );
    expect(result).toHaveLength(1);
    expect(result[0].warning.type).toBe("FAILED_COURSE_RISK");
    expect(result[0].warning.reason).toContain("4041");
  });

  it("does not block — the warning is informational only", () => {
    const result = buildFailedCourseWarnings(
      [candidate({ status: "FAILED", courseId: "f1" })],
      [{ courseId: "f1", termCode: "4041", result: "FAILED" }],
    );
    expect(result[0].warning.severity).toBe("WARNING");
  });

  it("handles missing term information safely (Simple Mode — no attempt row)", () => {
    const result = buildFailedCourseWarnings(
      [candidate({ status: "FAILED", courseId: "f1" })],
      [],
    );
    expect(result).toHaveLength(1);
    expect(result[0].warning.reason).toContain("ترمی برای این تلاش ثبت نشده است");
  });

  it("does not warn for a non-FAILED course", () => {
    const result = buildFailedCourseWarnings(
      [candidate({ status: "NOT_COMPLETED" }), candidate({ status: "PASSED", courseId: "p1" })],
      [],
    );
    expect(result).toEqual([]);
  });
});

describe("buildPlannedCourseAlerts", () => {
  function plannedInput(overrides: Partial<PlannedCourseAlertInput>): PlannedCourseAlertInput {
    return {
      courseId: "course-1",
      courseCode: "CS101",
      name: "Course One",
      termCode: "4051",
      eligibility: AVAILABLE,
      ...overrides,
    };
  }

  it("excludes an AVAILABLE planned course", () => {
    expect(buildPlannedCourseAlerts([plannedInput({})])).toEqual([]);
  });

  it("includes an AVAILABLE_WITH_WARNING planned course", () => {
    const result = buildPlannedCourseAlerts([
      plannedInput({ eligibility: AVAILABLE_WITH_WARNING(["A prerequisite was previously failed."]) }),
    ]);
    expect(result).toHaveLength(1);
  });

  it("includes a BLOCKED planned course (eligibility drifted after planning)", () => {
    const result = buildPlannedCourseAlerts([
      plannedInput({ eligibility: BLOCKED(["Prerequisite has not been previously attempted."]) }),
    ]);
    expect(result).toHaveLength(1);
  });

  it("sorts BLOCKED before AVAILABLE_WITH_WARNING", () => {
    const result = buildPlannedCourseAlerts([
      plannedInput({
        courseId: "warned",
        name: "Warned",
        eligibility: AVAILABLE_WITH_WARNING(["w"]),
      }),
      plannedInput({ courseId: "blocked", name: "Blocked", eligibility: BLOCKED(["r"]) }),
    ]);
    expect(result.map((r) => r.courseId)).toEqual(["blocked", "warned"]);
  });
});
