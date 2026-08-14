// Domain types for academic-status logic (course status, term parsing,
// GPA/course-membership validation). Framework-independent — no Next.js/
// Prisma imports, mirroring domain/academic-profile and domain/curriculum-data.

/// docs/07_Database_Schema.md §14.1.
export type CourseStatusValue =
  | "NOT_COMPLETED"
  | "PASSED"
  | "FAILED"
  | "CURRENTLY_STUDYING"
  | "PLANNED";

export const COURSE_STATUS_VALUES: readonly CourseStatusValue[] = [
  "NOT_COMPLETED",
  "PASSED",
  "FAILED",
  "CURRENTLY_STUDYING",
  "PLANNED",
];

/// docs/07_Database_Schema.md §14.2.
export type AttemptResultValue = "PASSED" | "FAILED" | "CURRENTLY_STUDYING";

export const ATTEMPT_RESULT_VALUES: readonly AttemptResultValue[] = [
  "PASSED",
  "FAILED",
  "CURRENTLY_STUDYING",
];

/// docs/04_Academic_Rules_Engine.md §17 — final digit of the term code.
export type TermTypeValue = "MEHR" | "BAHMAN" | "SUMMER";

export interface ParsedTerm {
  /// Original code, preserved exactly as supplied (docs/07_Database_Schema.md §13).
  termCode: string;
  /// Reconstructed full 4-digit year (e.g. 1405 from code "4051"), for
  /// consistency with entryYear/entryYearFrom/entryYearTo elsewhere in the
  /// app. See Phase 5 plan report, ambiguity #1.
  academicYear: number;
  termType: TermTypeValue;
}
