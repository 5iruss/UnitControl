import type { AttemptResultValue, CourseStatusValue } from "./types";

// docs/04_Academic_Rules_Engine.md §12 / §11 — no GPA scale/range is
// specified anywhere in the current documentation (unlike course statuses,
// which are enumerated exhaustively). Validating only that it's a
// non-negative, finite number; NOT enforcing an invented upper bound
// (e.g. 0-20 or 0-4). See Phase 5 plan report, ambiguity #2.
export function isValidSemesterGpa(value: number): boolean {
  return Number.isFinite(value) && value >= 0;
}

// docs/10_Claude_Master_Prompt.md §10 / task Phase 5 §5 — a student may only
// reference courses that belong to their assigned curriculum.
export function isCourseInCurriculum(
  courseId: string,
  curriculumCourseIds: ReadonlySet<string>,
): boolean {
  return curriculumCourseIds.has(courseId);
}

// docs/07_Database_Schema.md §14.1/§14.2 — AttemptResult's three values
// share their names with three of CourseStatus's five values; recording an
// attempt sets the student's current status to match that attempt
// (last-write-wins — see Phase 5 plan report, ambiguity #4).
export function courseStatusFromAttemptResult(result: AttemptResultValue): CourseStatusValue {
  return result;
}
