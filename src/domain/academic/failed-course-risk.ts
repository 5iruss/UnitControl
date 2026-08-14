// docs/04_Academic_Rules_Engine.md §5 — the two-semester recovery window's
// exact counting mechanism, and whether an expired window blocks dependent
// courses, are both explicitly marked "TBD — Requires official academic
// verification" (repeated in §25). This module therefore NEVER produces a
// blocking result: it only ever returns an informational warning, matching
// §4 ("the failed course creates an academic risk that must be shown to the
// student") and the §19 FAILED_COURSE_RISK example.
//
// There is deliberately no "has the window elapsed" computation here: that
// would require knowing the student's current term, and no document defines
// a mapping from wall-clock time to an academic term code (term codes are
// entirely student-entered). Inventing a "latest mentioned term = now" proxy
// would be a guess, not a verified rule, so this only reports which term the
// course was failed in (when known) and leaves window-elapsed evaluation
// unimplemented pending that missing mapping.

import { compareTermCodes } from "./term-order";
import type { AcademicWarning, CourseAttemptRecord, CourseStatus } from "./types";

function mostRecentFailedTerm(
  courseId: string,
  attempts: readonly CourseAttemptRecord[],
): string | null {
  const failedTerms = attempts
    .filter((a) => a.courseId === courseId && a.result === "FAILED")
    .map((a) => a.termCode);

  let latest: string | null = null;
  for (const termCode of failedTerms) {
    if (latest === null) {
      latest = termCode;
      continue;
    }
    const cmp = compareTermCodes(termCode, latest);
    if (cmp !== null && cmp > 0) latest = termCode;
  }
  return latest;
}

/// Returns a FAILED_COURSE_RISK warning if the course's current status is
/// FAILED, or null otherwise. Never returns a blocking result (see module
/// notes above).
export function computeFailedCourseRisk(
  courseId: string,
  currentStatus: CourseStatus,
  attempts: readonly CourseAttemptRecord[],
): AcademicWarning | null {
  if (currentStatus !== "FAILED") return null;

  const failureTerm = mostRecentFailedTerm(courseId, attempts);
  const reason =
    failureTerm === null
      ? "This course was marked failed, but no academic term is recorded for the attempt (Simple Mode), so the recovery-window status cannot be determined."
      : `This course was failed in term ${failureTerm}. Project rule: two semesters to pass it (docs/04_Academic_Rules_Engine.md §5); the exact counting method and whether an expired window blocks later courses are unverified.`;

  return {
    type: "FAILED_COURSE_RISK",
    severity: "WARNING",
    courseId,
    reason,
    suggestedAction: "Retake the course within the permitted period.",
  };
}
