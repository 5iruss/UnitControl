// docs/08_Admin_Panel.md §7 — "Prevent invalid/self-referential relationships
// if the schema/documentation prohibits them." A course cannot be its own
// prerequisite/corequisite; this is a structural rule, not an academic one.
import type { AdminValidationResult } from "./types";

export function validateCourseRelationshipInput(input: {
  sourceCourseId: string;
  targetCourseId: string;
}): AdminValidationResult {
  if (input.sourceCourseId === input.targetCourseId) {
    return { valid: false, reason: "A course cannot have a relationship with itself." };
  }
  return { valid: true };
}
