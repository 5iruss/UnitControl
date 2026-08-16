// docs/04_Academic_Rules_Engine.md §3, §4, §7 — prerequisite evaluation.
// Course B may only be taken if course A (the prerequisite) has been
// previously attempted (PASSED or FAILED, in current status or history). A
// failed prerequisite still satisfies the requirement but carries an
// academic-risk warning (§4).

import { classifyAttemptState } from "./attempt-history";
import { computeFailedCourseRisk } from "./failed-course-risk";
import type { CourseAttemptRecord, CourseStatus } from "./types";

export interface PrerequisiteCheckResult {
  satisfied: boolean;
  /// Set when not satisfied.
  reason?: string;
  /// Set when satisfied via a previously failed attempt (§4 academic risk).
  warning?: string;
}

export function evaluatePrerequisite(
  prerequisiteCourseId: string,
  prerequisiteStatus: CourseStatus,
  attempts: readonly CourseAttemptRecord[],
): PrerequisiteCheckResult {
  const state = classifyAttemptState(prerequisiteCourseId, prerequisiteStatus, attempts);

  if (!state.everAttempted) {
    // docs/04_Academic_Rules_Engine.md §20's own example uses this exact,
    // course-id-free wording — reasons are user-facing text, not debug logs.
    return {
      satisfied: false,
      reason: "پیش‌نیاز این درس تاکنون اخذ نشده است.",
    };
  }

  const risk = computeFailedCourseRisk(prerequisiteCourseId, prerequisiteStatus, attempts);
  return risk ? { satisfied: true, warning: risk.reason } : { satisfied: true };
}
