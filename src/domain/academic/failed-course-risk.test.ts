import { describe, expect, it } from "vitest";
import { computeFailedCourseRisk } from "./failed-course-risk";

describe("computeFailedCourseRisk", () => {
  it("returns null when the course was never failed", () => {
    expect(computeFailedCourseRisk("course-a", "NOT_COMPLETED", [])).toBeNull();
    expect(computeFailedCourseRisk("course-a", "PASSED", [])).toBeNull();
    expect(computeFailedCourseRisk("course-a", "PLANNED", [])).toBeNull();
  });

  it("returns null once the course is being currently retaken, even with a past failed attempt", () => {
    // docs/04_Academic_Rules_Engine.md §5's "last write wins" course-status
    // design (Phase 5): current status is the system's authoritative signal
    // for whether a failure is still unresolved.
    expect(
      computeFailedCourseRisk("course-a", "CURRENTLY_STUDYING", [
        { courseId: "course-a", termCode: "4051", result: "FAILED" },
      ]),
    ).toBeNull();
  });

  it("returns a non-blocking FAILED_COURSE_RISK warning with the failure term when history is available", () => {
    const risk = computeFailedCourseRisk("course-a", "FAILED", [
      { courseId: "course-a", termCode: "4051", result: "FAILED" },
    ]);
    expect(risk).not.toBeNull();
    expect(risk?.type).toBe("FAILED_COURSE_RISK");
    expect(risk?.severity).toBe("WARNING");
    expect(risk?.courseId).toBe("course-a");
    expect(risk?.reason).toContain("4051");
  });

  it("returns a warning noting missing term data when Simple Mode recorded FAILED with no attempt history", () => {
    const risk = computeFailedCourseRisk("course-a", "FAILED", []);
    expect(risk).not.toBeNull();
    expect(risk?.reason).toContain("no academic term is recorded");
  });

  it("uses the most recent failed term when multiple failed attempts exist for the course", () => {
    const risk = computeFailedCourseRisk("course-a", "FAILED", [
      { courseId: "course-a", termCode: "4051", result: "FAILED" },
      { courseId: "course-a", termCode: "4052", result: "CURRENTLY_STUDYING" },
      { courseId: "course-a", termCode: "4053", result: "FAILED" },
    ]);
    expect(risk?.reason).toContain("4053");
    expect(risk?.reason).not.toContain("4051");
  });

  it("ignores attempt records for other courses", () => {
    const risk = computeFailedCourseRisk("course-a", "FAILED", [
      { courseId: "course-b", termCode: "4051", result: "FAILED" },
    ]);
    expect(risk?.reason).toContain("no academic term is recorded");
  });

  it("never sets a blocking status: the warning contract has no allowed/status field", () => {
    const risk = computeFailedCourseRisk("course-a", "FAILED", [
      { courseId: "course-a", termCode: "4051", result: "FAILED" },
    ]);
    expect(risk).not.toHaveProperty("allowed");
    expect(risk).not.toHaveProperty("status");
  });
});
