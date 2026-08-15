// Recommendation / Warning Engine (docs/04_Academic_Rules_Engine.md §10,
// §19; docs/02_User_Flow.md §9, §10). Pure and framework-independent — every
// function here only reshapes/filters/sorts ValidationResult and
// AcademicWarning values the Rules Engine already produced. It never calls
// evaluateCourseEligibility or computeFailedCourseRisk with different logic,
// and never invents a second eligibility decision.

import { computeFailedCourseRisk } from "@/domain/academic";
import type { CourseAttemptRecord } from "@/domain/academic";
import type {
  CandidateCourseInput,
  CourseRecommendation,
  FailedCourseWarningItem,
  PlannedCourseAlert,
  PlannedCourseAlertInput,
} from "./types";

function courseSortKey(courseId: string, name: string): string {
  return `${name} ${courseId}`;
}

function compareBySortKey<T extends { courseId: string; name: string }>(a: T, b: T): number {
  const ka = courseSortKey(a.courseId, a.name);
  const kb = courseSortKey(b.courseId, b.name);
  return ka < kb ? -1 : ka > kb ? 1 : 0;
}

const RECOMMENDATION_PRIORITY: Record<string, number> = {
  AVAILABLE: 0,
  AVAILABLE_WITH_WARNING: 1,
};

const ALERT_PRIORITY: Record<string, number> = {
  BLOCKED: 0,
  AVAILABLE_WITH_WARNING: 1,
};

// docs/04_Academic_Rules_Engine.md §10 — a course can be recommended when it
// belongs to the curriculum, has not been passed, and prerequisites/
// corequisites are satisfied (i.e. the Rules Engine did not return BLOCKED).
// CURRENTLY_STUDYING and PLANNED are excluded: the student is already
// committed to those, so recommending them again is not useful (docs Phase 9
// prompt §14 candidate-selection rules). FAILED remains a candidate —
// retaking a failed course is a legitimate, useful next step and nothing in
// the docs excludes it.
export function buildCourseRecommendations(
  candidates: readonly CandidateCourseInput[],
): CourseRecommendation[] {
  return candidates
    .filter(
      (c) =>
        (c.status === "NOT_COMPLETED" || c.status === "FAILED") &&
        c.eligibility.status !== "BLOCKED",
    )
    .map((c) => ({
      courseId: c.courseId,
      courseCode: c.courseCode,
      name: c.name,
      eligibility: c.eligibility,
      // AVAILABLE: the engine found no blocking condition — say exactly
      // that, rather than the docs' illustrative "Prerequisites satisfied"
      // wording, which would overclaim when there are zero verified
      // relationships to have satisfied.
      reasons:
        c.eligibility.status === "AVAILABLE"
          ? ["No prerequisite or corequisite restriction currently blocks this course."]
          : c.eligibility.warnings,
    }))
    .sort((a, b) => {
      const pa = RECOMMENDATION_PRIORITY[a.eligibility.status] ?? 2;
      const pb = RECOMMENDATION_PRIORITY[b.eligibility.status] ?? 2;
      return pa !== pb ? pa - pb : compareBySortKey(a, b);
    });
}

// docs/04_Academic_Rules_Engine.md §19, §4, §5 — surfaces the FAILED_COURSE_RISK
// warning (the only documented warning type) for every currently-FAILED
// curriculum course. Reuses computeFailedCourseRisk unchanged; this function
// only enumerates which courses to call it for.
export function buildFailedCourseWarnings(
  candidates: readonly CandidateCourseInput[],
  attempts: readonly CourseAttemptRecord[],
): FailedCourseWarningItem[] {
  const items: FailedCourseWarningItem[] = [];
  for (const c of candidates) {
    if (c.status !== "FAILED") continue;
    const warning = computeFailedCourseRisk(c.courseId, c.status, attempts);
    if (warning) {
      items.push({ warning, courseId: c.courseId, courseCode: c.courseCode, courseName: c.name });
    }
  }
  return items.sort((a, b) =>
    compareBySortKey({ courseId: a.courseId, name: a.courseName }, { courseId: b.courseId, name: b.courseName }),
  );
}

// docs Phase 9 prompt §9 — a planned course whose eligibility is no longer
// AVAILABLE (it may have been AVAILABLE when planned, then drifted, e.g. a
// prerequisite was later marked FAILED) is an unresolved risk worth
// surfacing. Reuses the eligibility already computed for the semester-plan
// view (Phase 8) rather than re-deciding anything. AVAILABLE planned courses
// are not alerts — nothing is wrong with them.
export function buildPlannedCourseAlerts(
  planned: readonly PlannedCourseAlertInput[],
): PlannedCourseAlert[] {
  return planned
    .filter((p) => p.eligibility.status !== "AVAILABLE")
    .map((p) => ({ ...p }))
    .sort((a, b) => {
      const pa = ALERT_PRIORITY[a.eligibility.status] ?? 2;
      const pb = ALERT_PRIORITY[b.eligibility.status] ?? 2;
      return pa !== pb ? pa - pb : compareBySortKey(a, b);
    });
}
