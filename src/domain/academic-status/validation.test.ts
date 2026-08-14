import { describe, expect, it } from "vitest";
import {
  courseStatusFromAttemptResult,
  isCourseInCurriculum,
  isValidSemesterGpa,
} from "./validation";

describe("isValidSemesterGpa", () => {
  it("accepts zero and positive finite numbers", () => {
    expect(isValidSemesterGpa(0)).toBe(true);
    expect(isValidSemesterGpa(15.5)).toBe(true);
    expect(isValidSemesterGpa(20)).toBe(true);
  });

  it("does not enforce an invented upper bound", () => {
    // docs never specify a GPA scale — see Phase 5 plan report ambiguity #2.
    expect(isValidSemesterGpa(999)).toBe(true);
  });

  it("rejects negative numbers", () => {
    expect(isValidSemesterGpa(-1)).toBe(false);
  });

  it("rejects non-finite numbers", () => {
    expect(isValidSemesterGpa(NaN)).toBe(false);
    expect(isValidSemesterGpa(Infinity)).toBe(false);
  });
});

describe("isCourseInCurriculum", () => {
  it("accepts a course id present in the curriculum's course set", () => {
    const ids = new Set(["course-1", "course-2"]);
    expect(isCourseInCurriculum("course-1", ids)).toBe(true);
  });

  it("rejects a course id not in the curriculum's course set", () => {
    const ids = new Set(["course-1", "course-2"]);
    expect(isCourseInCurriculum("course-99", ids)).toBe(false);
  });
});

describe("courseStatusFromAttemptResult", () => {
  it("maps each attempt result to the identically-named course status", () => {
    expect(courseStatusFromAttemptResult("PASSED")).toBe("PASSED");
    expect(courseStatusFromAttemptResult("FAILED")).toBe("FAILED");
    expect(courseStatusFromAttemptResult("CURRENTLY_STUDYING")).toBe("CURRENTLY_STUDYING");
  });
});
