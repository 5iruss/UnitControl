// Domain types for the Recommendation / Warning Engine. Framework-independent
// — no React/Prisma/Next imports. This layer never re-decides eligibility;
// it only consumes ValidationResult/AcademicWarning already produced by the
// Rules Engine (docs/09_Technical_Requirements.md §2 architecture: ... ->
// Academic Rules Engine -> Recommendation / Warning Engine -> Structured
// RecommendationResult -> UI).

import type { AcademicWarning, CourseStatus, ValidationResult } from "@/domain/academic";

/// A course fact plus its already-computed Rules Engine eligibility — the
/// only input the candidate-selection logic needs.
export interface CandidateCourseInput {
  courseId: string;
  courseCode: string;
  name: string;
  status: CourseStatus;
  eligibility: ValidationResult;
}

/// A planned course plus its already-computed eligibility (docs/07_Database_Schema.md
/// §16 — PLANNED courses; eligibility here is re-evaluated against the
/// student's *current* academic state, so it can drift from AVAILABLE after
/// planning, e.g. a prerequisite later marked FAILED).
export interface PlannedCourseAlertInput {
  courseId: string;
  courseCode: string;
  name: string;
  termCode: string;
  eligibility: ValidationResult;
}

/// docs/04_Academic_Rules_Engine.md §10 — a candidate course worth
/// surfacing, with a human-readable reason. Never claims a course is "best";
/// only reports what the Rules Engine already established.
export interface CourseRecommendation {
  courseId: string;
  courseCode: string;
  name: string;
  eligibility: ValidationResult;
  reasons: string[];
}

/// docs/04_Academic_Rules_Engine.md §19 — reuses the engine's own
/// AcademicWarning shape (do not invent a competing warning taxonomy).
export interface FailedCourseWarningItem {
  warning: AcademicWarning;
  courseId: string;
  courseCode: string;
  courseName: string;
}

export interface PlannedCourseAlert {
  courseId: string;
  courseCode: string;
  name: string;
  termCode: string;
  eligibility: ValidationResult;
}

/// A non-blocking, non-academic notice about missing/unverified underlying
/// data (docs Phase 9 prompt §10) — never a claim about the student's
/// academic state.
export interface DataLimitationNotice {
  message: string;
}

export interface RecommendationsResult {
  courseRecommendations: CourseRecommendation[];
  failedCourseWarnings: FailedCourseWarningItem[];
  plannedCourseAlerts: PlannedCourseAlert[];
  dataLimitations: DataLimitationNotice[];
}
