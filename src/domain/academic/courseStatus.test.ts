import { describe, expect, it } from "vitest";
import { isCourseStatus, isPreviouslyAttempted } from "./courseStatus";

describe("isCourseStatus", () => {
  it("accepts every documented course status", () => {
    expect(isCourseStatus("NOT_COMPLETED")).toBe(true);
    expect(isCourseStatus("PASSED")).toBe(true);
    expect(isCourseStatus("FAILED")).toBe(true);
    expect(isCourseStatus("CURRENTLY_STUDYING")).toBe(true);
    expect(isCourseStatus("PLANNED")).toBe(true);
  });

  it("rejects values outside the documented set", () => {
    expect(isCourseStatus("WITHDRAWN")).toBe(false);
  });
});

// docs/04_Academic_Rules_Engine.md §3
describe("isPreviouslyAttempted", () => {
  it("treats PASSED and FAILED as previously attempted", () => {
    expect(isPreviouslyAttempted("PASSED")).toBe(true);
    expect(isPreviouslyAttempted("FAILED")).toBe(true);
  });

  it("does not treat CURRENTLY_STUDYING, PLANNED, or NOT_COMPLETED as previously attempted", () => {
    expect(isPreviouslyAttempted("CURRENTLY_STUDYING")).toBe(false);
    expect(isPreviouslyAttempted("PLANNED")).toBe(false);
    expect(isPreviouslyAttempted("NOT_COMPLETED")).toBe(false);
  });
});
