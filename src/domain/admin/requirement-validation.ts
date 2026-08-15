// docs/07_Database_Schema.md §11 — field comments state "category [set] only
// when requirementType = CATEGORY_UNITS" and "course_group_id [set] only
// when requirementType = COURSE_GROUP." This module applies that same
// per-type "set only when relevant" discipline consistently across all five
// documented requirement types (docs Phase 10 pre-coding report ambiguity
// #8) — it does not invent new requirement semantics, only enforces the
// shape the schema's own comments already describe.
import type { AdminValidationResult, CurriculumRequirementInput } from "./types";

export function validateCurriculumRequirementInput(
  input: CurriculumRequirementInput,
): AdminValidationResult {
  const { requirementType, category, requiredUnits, minimumPracticalUnits, courseGroupId } = input;

  if (requirementType !== "CATEGORY_UNITS" && category !== null) {
    return { valid: false, reason: "Category may only be set for a CATEGORY_UNITS requirement." };
  }
  if (requirementType === "CATEGORY_UNITS" && category === null) {
    return { valid: false, reason: "A CATEGORY_UNITS requirement must specify a category." };
  }

  if (requirementType !== "COURSE_GROUP" && courseGroupId !== null) {
    return { valid: false, reason: "Course group may only be set for a COURSE_GROUP requirement." };
  }
  if (requirementType === "COURSE_GROUP" && courseGroupId === null) {
    return { valid: false, reason: "A COURSE_GROUP requirement must specify a course group." };
  }

  if (requirementType !== "PRACTICAL_UNITS" && minimumPracticalUnits !== null) {
    return {
      valid: false,
      reason: "Minimum practical units may only be set for a PRACTICAL_UNITS requirement.",
    };
  }
  if (requirementType === "PRACTICAL_UNITS" && minimumPracticalUnits === null) {
    return {
      valid: false,
      reason: "A PRACTICAL_UNITS requirement must specify the minimum practical units.",
    };
  }

  const needsRequiredUnits =
    requirementType === "TOTAL_UNITS" ||
    requirementType === "CATEGORY_UNITS" ||
    requirementType === "ELECTIVE_UNITS";
  if (needsRequiredUnits && requiredUnits === null) {
    return { valid: false, reason: `A ${requirementType} requirement must specify required units.` };
  }

  if (requiredUnits !== null && requiredUnits <= 0) {
    return { valid: false, reason: "Required units must be a positive number." };
  }
  if (minimumPracticalUnits !== null && minimumPracticalUnits <= 0) {
    return { valid: false, reason: "Minimum practical units must be a positive number." };
  }

  return { valid: true };
}
