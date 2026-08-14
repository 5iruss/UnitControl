// Domain types for the Academic Rules Engine.
//
// This module must stay framework-independent: no imports from Next.js,
// React, Prisma, or any UI/database package (docs/10_Claude_Master_Prompt.md
// §7; docs/09_Technical_Requirements.md §24 "Domain Layer Isolation"). Types
// here are plain data shapes; callers (Route Handlers/Server Actions) are
// responsible for mapping persistence-layer records into these shapes.

/// docs/07_Database_Schema.md §14.1
export type CourseStatus =
  | "NOT_COMPLETED"
  | "PASSED"
  | "FAILED"
  | "CURRENTLY_STUDYING"
  | "PLANNED";

/// docs/07_Database_Schema.md §14.2
export type AttemptResult = "PASSED" | "FAILED" | "CURRENTLY_STUDYING";

/// docs/05_Curriculum_Data_Model.md §10; docs/07_Database_Schema.md §12
export type RelationshipType = "PREREQUISITE" | "COREQUISITE";

/// docs/04_Academic_Rules_Engine.md §27
export type AvailabilityStatus = "AVAILABLE" | "BLOCKED" | "AVAILABLE_WITH_WARNING";

/// docs/04_Academic_Rules_Engine.md §20 — the Rules Engine's validation result shape.
export interface ValidationResult {
  allowed: boolean;
  status: AvailabilityStatus;
  reasons: string[];
  warnings: string[];
}

/// docs/07_Database_Schema.md §14.2 — one row of a student's course attempt
/// history. `termCode` is the original university term code (e.g. "4051"),
/// parsed on demand via domain/academic-status's parseTermCode rather than
/// stored pre-parsed here, since this type is the Rules Engine's input
/// contract, not a display shape.
export interface CourseAttemptRecord {
  courseId: string;
  termCode: string;
  result: AttemptResult;
}

/// docs/05_Curriculum_Data_Model.md §10; docs/07_Database_Schema.md §12 — the
/// model only stores the relationship; the Rules Engine decides what it means.
export interface CourseRelationshipRecord {
  sourceCourseId: string;
  targetCourseId: string;
  relationshipType: RelationshipType;
}

/// docs/04_Academic_Rules_Engine.md §19 — a structured academic warning.
/// FAILED_COURSE_RISK is the only type/severity combination documented; the
/// union is intentionally narrow rather than open-ended (do not invent
/// additional warning types not defined in the docs).
export interface AcademicWarning {
  type: "FAILED_COURSE_RISK";
  severity: "WARNING";
  courseId: string;
  reason: string;
  suggestedAction: string;
}

/// docs/04_Academic_Rules_Engine.md "RULE ENGINE INPUT" — contains only the
/// information required for the rules currently implemented (Phase 6 audit):
/// curriculum membership, current course status, attempt history, and course
/// relationships. Credit limits, semester GPA, and curriculum requirements
/// are deliberately excluded — no implemented rule consumes them yet (see
/// the Phase 6 audit's Blocked Rules section), and the input is meant to
/// carry only what evaluation actually uses.
export interface AcademicState {
  /// Course ids belonging to the student's assigned curriculum
  /// (docs/04_Academic_Rules_Engine.md §16 — curriculum isolation).
  curriculumCourseIds: ReadonlySet<string>;
  /// Current status per course id. A course absent from this map is treated
  /// as NOT_COMPLETED (docs/07_Database_Schema.md §14.1 default).
  courseStatuses: ReadonlyMap<string, CourseStatus>;
  /// Full attempt history for the student, across all courses.
  attempts: readonly CourseAttemptRecord[];
  /// Course relationships relevant to the student's curriculum.
  relationships: readonly CourseRelationshipRecord[];
}
