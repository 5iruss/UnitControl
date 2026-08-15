// Domain types for the semester-planning view model. Framework-independent
// — no React/Prisma imports. docs/07_Database_Schema.md §16: planning is
// the student's PLANNED courses (student_courses), each with an intended
// term — this module only groups and orders that existing data; it does
// not introduce a new planning concept or table.

import type { ValidationResult } from "@/domain/academic";

/// A single PLANNED course fact the view model is built from.
export interface PlannedCourseInput {
  courseId: string;
  courseCode: string;
  name: string;
  /// The course's intended term (docs/07_Database_Schema.md §14.1 —
  /// always present for a PLANNED row; enforced at the mutation layer).
  termCode: string;
  eligibility: ValidationResult;
}

export interface PlannedCourseViewModel {
  courseId: string;
  courseCode: string;
  name: string;
  eligibility: ValidationResult;
}

export interface PlannedSemesterViewModel {
  termCode: string;
  /// Human-readable label, e.g. "Mehr 1405" (docs/06_Curriculum_Dataset.md §6).
  termLabel: string;
  courses: PlannedCourseViewModel[];
}
