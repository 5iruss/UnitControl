// Domain types for the curriculum map view model. Framework-independent —
// no React/@xyflow/react/Prisma imports. This is the shaping layer between
// the Academic Rules Engine's per-course ValidationResult and the graph
// library's node/edge shape (docs/09_Technical_Requirements.md §2 "Data
// Architecture": ... -> Academic Rules Engine -> Curriculum Map View Model
// -> React/React Flow).

import type { CourseStatus, RelationshipType, ValidationResult } from "@/domain/academic";

/// docs/05_Curriculum_Data_Model.md §7.
export type CourseCategory =
  | "GENERAL"
  | "BASIC"
  | "SPECIALIZED_REQUIRED"
  | "SPECIALIZED_ELECTIVE"
  | "ELECTIVE"
  | "PREPARATORY"
  | "SKILLS_EMPLOYABILITY"
  | "ORIENTATION_SPECIALIZED";

/// Plain course fact the view model is built from — deliberately excludes
/// credits/is_practical (unverified/NULL for every course in the current
/// dataset; docs/06_Curriculum_Dataset.md §7) rather than passing them
/// through as always-empty fields.
export interface CurriculumMapCourseInput {
  courseId: string;
  courseCode: string;
  name: string;
  category: CourseCategory;
  status: CourseStatus;
  /// The term associated with the current status row (docs/07_Database_Schema.md
  /// §14.1: null in Simple Mode; holds the intended term for PLANNED). Not an
  /// attempt-history term — just the current-state row's term, for prefilling
  /// the "intended term" field when editing a PLANNED course.
  termCode: string | null;
  eligibility: ValidationResult;
}

export interface CurriculumMapRelationshipInput {
  sourceCourseId: string;
  targetCourseId: string;
  relationshipType: RelationshipType;
}

export interface CourseNodeViewModel {
  courseId: string;
  courseCode: string;
  name: string;
  category: CourseCategory;
  status: CourseStatus;
  termCode: string | null;
  eligibility: ValidationResult;
  position: { x: number; y: number };
}

export interface RelationshipEdgeViewModel {
  id: string;
  sourceCourseId: string;
  targetCourseId: string;
  relationshipType: RelationshipType;
}

export interface CategoryGroupViewModel {
  category: CourseCategory;
  label: string;
  /// Where the category's header/label should be drawn, in the same
  /// coordinate space as the course nodes' positions.
  headerPosition: { x: number; y: number };
  nodes: CourseNodeViewModel[];
}

export interface CurriculumMapViewModel {
  categories: CategoryGroupViewModel[];
  nodes: CourseNodeViewModel[];
  edges: RelationshipEdgeViewModel[];
}
