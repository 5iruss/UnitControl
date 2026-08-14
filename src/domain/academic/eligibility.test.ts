import { describe, expect, it } from "vitest";
import { evaluateCourseEligibility } from "./eligibility";
import type { AcademicState, CourseRelationshipRecord, CourseStatus } from "./types";

function buildState(overrides: Partial<AcademicState> = {}): AcademicState {
  return {
    curriculumCourseIds: new Set(["course-a", "course-b", "course-c"]),
    courseStatuses: new Map<string, CourseStatus>(),
    attempts: [],
    relationships: [],
    ...overrides,
  };
}

const PREREQ_A_FOR_B: CourseRelationshipRecord = {
  sourceCourseId: "course-a",
  targetCourseId: "course-b",
  relationshipType: "PREREQUISITE",
};

describe("evaluateCourseEligibility — curriculum membership", () => {
  it("blocks a course outside the student's curriculum", () => {
    const state = buildState({ curriculumCourseIds: new Set(["course-a"]) });
    const result = evaluateCourseEligibility(state, "course-outside");
    expect(result.allowed).toBe(false);
    expect(result.status).toBe("BLOCKED");
    expect(result.reasons[0]).toContain("not part of the student's curriculum");
  });
});

describe("evaluateCourseEligibility — course status", () => {
  it("blocks a course the student has already passed", () => {
    const state = buildState({
      courseStatuses: new Map([["course-a", "PASSED"]]),
    });
    const result = evaluateCourseEligibility(state, "course-a");
    expect(result.allowed).toBe(false);
    expect(result.status).toBe("BLOCKED");
    expect(result.reasons[0]).toContain("already been passed");
  });

  it("is AVAILABLE for a course with no prior status at all (NOT_COMPLETED default) and no relationships", () => {
    const state = buildState();
    const result = evaluateCourseEligibility(state, "course-a");
    expect(result).toEqual({ allowed: true, status: "AVAILABLE", reasons: [], warnings: [] });
  });

  it("is AVAILABLE for a course the student is currently studying, absent other blockers", () => {
    const state = buildState({ courseStatuses: new Map([["course-a", "CURRENTLY_STUDYING"]]) });
    const result = evaluateCourseEligibility(state, "course-a");
    expect(result.allowed).toBe(true);
    expect(result.status).toBe("AVAILABLE");
  });

  it("is AVAILABLE for a planned course, absent other blockers", () => {
    const state = buildState({ courseStatuses: new Map([["course-a", "PLANNED"]]) });
    const result = evaluateCourseEligibility(state, "course-a");
    expect(result.status).toBe("AVAILABLE");
  });
});

describe("evaluateCourseEligibility — prerequisites", () => {
  it("is AVAILABLE when there is no known prerequisite relationship at all (current real dataset: 0 relationships)", () => {
    const state = buildState();
    const result = evaluateCourseEligibility(state, "course-b");
    expect(result.status).toBe("AVAILABLE");
  });

  it("blocks when the prerequisite has not been previously attempted", () => {
    const state = buildState({
      relationships: [PREREQ_A_FOR_B],
      courseStatuses: new Map([["course-a", "NOT_COMPLETED"]]),
    });
    const result = evaluateCourseEligibility(state, "course-b");
    expect(result.allowed).toBe(false);
    expect(result.status).toBe("BLOCKED");
    expect(result.reasons[0]).toContain("course-a");
  });

  it("blocks when the prerequisite is only planned", () => {
    const state = buildState({
      relationships: [PREREQ_A_FOR_B],
      courseStatuses: new Map([["course-a", "PLANNED"]]),
    });
    expect(evaluateCourseEligibility(state, "course-b").allowed).toBe(false);
  });

  it("blocks when the prerequisite is being studied for the first time in the same semester", () => {
    const state = buildState({
      relationships: [PREREQ_A_FOR_B],
      courseStatuses: new Map([["course-a", "CURRENTLY_STUDYING"]]),
    });
    expect(evaluateCourseEligibility(state, "course-b").allowed).toBe(false);
  });

  it("allows and shows no warning when the prerequisite was passed", () => {
    const state = buildState({
      relationships: [PREREQ_A_FOR_B],
      courseStatuses: new Map([
        ["course-a", "PASSED"],
        ["course-b", "NOT_COMPLETED"],
      ]),
    });
    const result = evaluateCourseEligibility(state, "course-b");
    expect(result.allowed).toBe(true);
    expect(result.status).toBe("AVAILABLE");
  });

  it("allows with a warning when the prerequisite was failed (§4 academic risk)", () => {
    const state = buildState({
      relationships: [PREREQ_A_FOR_B],
      courseStatuses: new Map([["course-a", "FAILED"]]),
      attempts: [{ courseId: "course-a", termCode: "4051", result: "FAILED" }],
    });
    const result = evaluateCourseEligibility(state, "course-b");
    expect(result.allowed).toBe(true);
    expect(result.status).toBe("AVAILABLE_WITH_WARNING");
    expect(result.warnings.some((w) => w.includes("4051"))).toBe(true);
  });

  it("evaluates multiple prerequisites, blocking if any one is unmet", () => {
    const state = buildState({
      curriculumCourseIds: new Set(["course-a", "course-b", "course-c"]),
      relationships: [
        PREREQ_A_FOR_B,
        { sourceCourseId: "course-c", targetCourseId: "course-b", relationshipType: "PREREQUISITE" },
      ],
      courseStatuses: new Map([
        ["course-a", "PASSED"],
        ["course-c", "NOT_COMPLETED"],
      ]),
    });
    const result = evaluateCourseEligibility(state, "course-b");
    expect(result.allowed).toBe(false);
    expect(result.reasons[0]).toContain("course-c");
  });

  it("allows when all of multiple prerequisites are satisfied", () => {
    const state = buildState({
      relationships: [
        PREREQ_A_FOR_B,
        { sourceCourseId: "course-c", targetCourseId: "course-b", relationshipType: "PREREQUISITE" },
      ],
      courseStatuses: new Map([
        ["course-a", "PASSED"],
        ["course-c", "PASSED"],
      ]),
    });
    expect(evaluateCourseEligibility(state, "course-b").status).toBe("AVAILABLE");
  });
});

describe("evaluateCourseEligibility — corequisites", () => {
  it("is AVAILABLE when there is no known corequisite relationship (current real dataset: 0 relationships)", () => {
    const state = buildState();
    expect(evaluateCourseEligibility(state, "course-a").status).toBe("AVAILABLE");
  });

  it("adds a non-blocking unverified-enforcement warning when a corequisite relationship exists", () => {
    const state = buildState({
      relationships: [
        { sourceCourseId: "course-a", targetCourseId: "course-b", relationshipType: "COREQUISITE" },
      ],
    });
    const result = evaluateCourseEligibility(state, "course-a");
    expect(result.allowed).toBe(true);
    expect(result.status).toBe("AVAILABLE_WITH_WARNING");
    expect(result.warnings.some((w) => w.includes("unverified"))).toBe(true);
  });
});

describe("evaluateCourseEligibility — own failed-course risk", () => {
  it("allows retaking a course the student directly failed, with a risk warning", () => {
    const state = buildState({
      courseStatuses: new Map([["course-a", "FAILED"]]),
      attempts: [{ courseId: "course-a", termCode: "4051", result: "FAILED" }],
    });
    const result = evaluateCourseEligibility(state, "course-a");
    expect(result.allowed).toBe(true);
    expect(result.status).toBe("AVAILABLE_WITH_WARNING");
    expect(result.warnings.some((w) => w.includes("4051"))).toBe(true);
  });

  it("surfaces an insufficient-data warning for a Simple Mode failure with no recorded term, without blocking", () => {
    const state = buildState({ courseStatuses: new Map([["course-a", "FAILED"]]) });
    const result = evaluateCourseEligibility(state, "course-a");
    expect(result.allowed).toBe(true);
    expect(result.status).toBe("AVAILABLE_WITH_WARNING");
    expect(result.warnings.some((w) => w.includes("no academic term is recorded"))).toBe(true);
  });
});

describe("evaluateCourseEligibility — missing/edge-case data", () => {
  it("treats a student with no academic history at all as AVAILABLE for an in-curriculum course with no relationships", () => {
    const state = buildState({ curriculumCourseIds: new Set(["course-a"]) });
    expect(evaluateCourseEligibility(state, "course-a")).toEqual({
      allowed: true,
      status: "AVAILABLE",
      reasons: [],
      warnings: [],
    });
  });

  it("does not let an unrelated relationship for a different target course affect this course", () => {
    const state = buildState({
      relationships: [
        { sourceCourseId: "course-a", targetCourseId: "course-c", relationshipType: "PREREQUISITE" },
      ],
      courseStatuses: new Map([["course-a", "NOT_COMPLETED"]]),
    });
    expect(evaluateCourseEligibility(state, "course-b").status).toBe("AVAILABLE");
  });
});
