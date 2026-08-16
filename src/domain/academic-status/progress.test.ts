import { describe, expect, it } from "vitest";
import { calculateCourseProgress } from "./progress";
import type { CourseStatus } from "@/domain/academic";

describe("calculateCourseProgress", () => {
  it("calculates the rounded percentage of passed courses out of the total", () => {
    const statusCounts = new Map<CourseStatus, number>([["PASSED", 42]]);
    expect(calculateCourseProgress(statusCounts, 156)).toEqual({
      passedCount: 42,
      totalCount: 156,
      percentage: 27,
    });
  });

  it("returns 0 when there are no curriculum courses (avoids division by zero)", () => {
    expect(calculateCourseProgress(new Map(), 0)).toEqual({
      passedCount: 0,
      totalCount: 0,
      percentage: 0,
    });
  });

  it("returns 0 when no course is passed yet", () => {
    const statusCounts = new Map<CourseStatus, number>([["NOT_COMPLETED", 10]]);
    expect(calculateCourseProgress(statusCounts, 10)).toEqual({
      passedCount: 0,
      totalCount: 10,
      percentage: 0,
    });
  });

  it("returns 100 when every course is passed", () => {
    const statusCounts = new Map<CourseStatus, number>([["PASSED", 5]]);
    expect(calculateCourseProgress(statusCounts, 5)).toEqual({
      passedCount: 5,
      totalCount: 5,
      percentage: 100,
    });
  });
});
