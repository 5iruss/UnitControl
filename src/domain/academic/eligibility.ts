// docs/04_Academic_Rules_Engine.md §27 — composite course eligibility,
// evaluated in the documented priority order:
//
//   Curriculum -> Course exists in curriculum -> Course status ->
//   Prerequisites -> Corequisites -> Semester constraints -> Credit limit ->
//   Other verified rules -> Final result
//
// "Semester constraints" and "Credit limit" are not evaluated: exact
// thresholds are undocumented/unverified (§11, §13, §25 — Phase 6 audit,
// Blocked Rules), and there is no semester-plan concept yet (planner is a
// later phase) for a credit limit to apply against. This function never
// silently treats an unevaluated step as "satisfied" — it simply does not
// claim to evaluate it, and callers must not infer credit-limit clearance
// from an AVAILABLE result.

import { computeFailedCourseRisk } from "./failed-course-risk";
import { evaluateCorequisite } from "./corequisite";
import { evaluatePrerequisite } from "./prerequisite";
import type { AcademicState, CourseStatus, ValidationResult } from "./types";

function statusOf(state: AcademicState, courseId: string): CourseStatus {
  return state.courseStatuses.get(courseId) ?? "NOT_COMPLETED";
}

export function evaluateCourseEligibility(state: AcademicState, courseId: string): ValidationResult {
  // §27 step 1-2: curriculum membership (§16 curriculum isolation).
  if (!state.curriculumCourseIds.has(courseId)) {
    return {
      allowed: false,
      status: "BLOCKED",
      reasons: ["این درس در برنامه تحصیلی شما وجود ندارد."],
      warnings: [],
    };
  }

  const currentStatus = statusOf(state, courseId);

  // §27 step 3 / §21 item 2 / §10 — an already-passed course is not
  // re-selectable.
  if (currentStatus === "PASSED") {
    return {
      allowed: false,
      status: "BLOCKED",
      reasons: ["این درس قبلاً گذرانده شده است."],
      warnings: [],
    };
  }

  const reasons: string[] = [];
  const warnings: string[] = [];

  // §27 step 4 / §3, §4, §7 — prerequisites.
  for (const rel of state.relationships) {
    if (rel.relationshipType !== "PREREQUISITE" || rel.targetCourseId !== courseId) continue;
    const prereqStatus = statusOf(state, rel.sourceCourseId);
    const result = evaluatePrerequisite(rel.sourceCourseId, prereqStatus, state.attempts);
    if (!result.satisfied) {
      reasons.push(result.reason as string);
    } else if (result.warning) {
      warnings.push(result.warning);
    }
  }

  // §27 step 5 / §6 — corequisites.
  const corequisiteRelationships = state.relationships.filter(
    (rel) =>
      rel.relationshipType === "COREQUISITE" &&
      (rel.sourceCourseId === courseId || rel.targetCourseId === courseId),
  );
  const corequisiteResult = evaluateCorequisite(corequisiteRelationships);
  if (corequisiteResult.warning) warnings.push(corequisiteResult.warning);

  // §4, §19 — failed-course risk on the course itself (informational only,
  // never blocking; see failed-course-risk.ts).
  const ownRisk = computeFailedCourseRisk(courseId, currentStatus, state.attempts);
  if (ownRisk) warnings.push(ownRisk.reason);

  if (reasons.length > 0) {
    return { allowed: false, status: "BLOCKED", reasons, warnings };
  }
  if (warnings.length > 0) {
    return { allowed: true, status: "AVAILABLE_WITH_WARNING", reasons: [], warnings };
  }
  return { allowed: true, status: "AVAILABLE", reasons: [], warnings: [] };
}
