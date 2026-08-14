import { describe, expect, it } from "vitest";
import { courseAttemptSchema, courseStatusSchema, semesterSchema } from "./schemas";

describe("courseStatusSchema", () => {
  it("accepts a valid non-planned status", () => {
    const result = courseStatusSchema.safeParse({ courseId: "course-1", status: "PASSED" });
    expect(result.success).toBe(true);
  });

  it("accepts PLANNED with a term code", () => {
    const result = courseStatusSchema.safeParse({
      courseId: "course-1",
      status: "PLANNED",
      plannedTermCode: "4051",
    });
    expect(result.success).toBe(true);
  });

  it("rejects an invalid status value", () => {
    const result = courseStatusSchema.safeParse({ courseId: "course-1", status: "GRADUATED" });
    expect(result.success).toBe(false);
  });

  it("rejects a missing course id", () => {
    const result = courseStatusSchema.safeParse({ courseId: "", status: "PASSED" });
    expect(result.success).toBe(false);
  });
});

describe("semesterSchema", () => {
  it("accepts a valid term code and GPA", () => {
    const result = semesterSchema.safeParse({ termCode: "4051", semesterGpa: "17.5" });
    expect(result.success).toBe(true);
  });

  it("rejects an invalid term code", () => {
    const result = semesterSchema.safeParse({ termCode: "abcd", semesterGpa: "17.5" });
    expect(result.success).toBe(false);
  });

  it("rejects a term code with an invalid semester digit", () => {
    const result = semesterSchema.safeParse({ termCode: "4054", semesterGpa: "17.5" });
    expect(result.success).toBe(false);
  });

  it("rejects a negative GPA", () => {
    const result = semesterSchema.safeParse({ termCode: "4051", semesterGpa: "-1" });
    expect(result.success).toBe(false);
  });

  it("rejects a non-numeric GPA", () => {
    const result = semesterSchema.safeParse({ termCode: "4051", semesterGpa: "not-a-number" });
    expect(result.success).toBe(false);
  });
});

describe("courseAttemptSchema", () => {
  it("accepts a valid attempt", () => {
    const result = courseAttemptSchema.safeParse({
      termCode: "4052",
      courseId: "course-1",
      result: "FAILED",
    });
    expect(result.success).toBe(true);
  });

  it("rejects an invalid result value", () => {
    const result = courseAttemptSchema.safeParse({
      termCode: "4052",
      courseId: "course-1",
      result: "WITHDRAWN",
    });
    expect(result.success).toBe(false);
  });

  it("rejects an invalid term code", () => {
    const result = courseAttemptSchema.safeParse({
      termCode: "99",
      courseId: "course-1",
      result: "PASSED",
    });
    expect(result.success).toBe(false);
  });
});
