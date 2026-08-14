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
