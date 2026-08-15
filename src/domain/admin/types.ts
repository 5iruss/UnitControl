// Domain types for Admin Panel data-shape validation (docs/08_Admin_Panel.md,
// docs/07_Database_Schema.md §11). Framework-independent — no Prisma/React/
// Next imports (docs/09_Technical_Requirements.md §24 domain isolation).
//
// This module validates STRUCTURE (does this requirement/relationship shape
// make sense per the schema), never ACADEMIC MEANING (docs/08_Admin_Panel.md
// §7 "The Admin Panel should not invent the academic rule associated with a
// relationship. The Rules Engine remains responsible for interpreting the
// relationship."). Existence/uniqueness checks that need the database (does
// this course id exist, is this relationship a duplicate) live in the lib
// layer, not here.

export interface AdminValidationResult {
  valid: boolean;
  reason?: string;
}

/// docs/07_Database_Schema.md §11 — the five requirement types the schema
/// defines. Do not add types beyond these (docs Phase 10 prompt §10).
export type RequirementType =
  | "TOTAL_UNITS"
  | "CATEGORY_UNITS"
  | "ELECTIVE_UNITS"
  | "PRACTICAL_UNITS"
  | "COURSE_GROUP";

export interface CurriculumRequirementInput {
  requirementType: RequirementType;
  category: string | null;
  requiredUnits: number | null;
  minimumPracticalUnits: number | null;
  courseGroupId: string | null;
}
