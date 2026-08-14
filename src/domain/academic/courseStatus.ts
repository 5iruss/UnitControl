import type { CourseStatus } from "./types";

const COURSE_STATUSES: readonly CourseStatus[] = [
  "NOT_COMPLETED",
  "PASSED",
  "FAILED",
  "CURRENTLY_STUDYING",
  "PLANNED",
];

export function isCourseStatus(value: string): value is CourseStatus {
  return (COURSE_STATUSES as readonly string[]).includes(value);
}

/// docs/04_Academic_Rules_Engine.md §3, §4, §18 — a prerequisite is satisfied by
/// a *previous attempt*, not by being planned or newly in progress.
export function isPreviouslyAttempted(status: CourseStatus): boolean {
  return status === "PASSED" || status === "FAILED";
}
