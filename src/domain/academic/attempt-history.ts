// docs/04_Academic_Rules_Engine.md §18 — "For prerequisite evaluation, the
// Rules Engine must distinguish between: Never Attempted / Previously
// Attempted / Currently Being Attempted / Previously Passed / Previously
// Failed." These facts are not mutually exclusive (a student can be
// currently retaking a course they previously failed), so they are exposed
// as independent booleans rather than a single lossy classification.

import type { CourseAttemptRecord, CourseStatus } from "./types";

export interface AttemptState {
  /// A prerequisite is satisfied by a previous attempt (§3, §4, §18) — either
  /// the course's current status is PASSED/FAILED, or attempt history
  /// contains a PASSED/FAILED record even if the student is now retaking it
  /// (current status CURRENTLY_STUDYING).
  everAttempted: boolean;
  /// Current status is CURRENTLY_STUDYING. Independent of `everAttempted`:
  /// a student can be currently studying a course they previously failed.
  currentlyStudying: boolean;
  previouslyPassed: boolean;
  previouslyFailed: boolean;
}

/// docs/07_Database_Schema.md §17 — Simple Mode may have current state with
/// no attempt history at all; Advanced Mode records attempts per term. Both
/// are handled: `attempts` may be empty, in which case only `currentStatus`
/// is consulted.
export function classifyAttemptState(
  courseId: string,
  currentStatus: CourseStatus,
  attempts: readonly CourseAttemptRecord[],
): AttemptState {
  const relevant = attempts.filter((a) => a.courseId === courseId);
  const historyHasPassed = relevant.some((a) => a.result === "PASSED");
  const historyHasFailed = relevant.some((a) => a.result === "FAILED");

  const previouslyPassed = currentStatus === "PASSED" || historyHasPassed;
  const previouslyFailed = currentStatus === "FAILED" || historyHasFailed;

  return {
    everAttempted: previouslyPassed || previouslyFailed,
    currentlyStudying: currentStatus === "CURRENTLY_STUDYING",
    previouslyPassed,
    previouslyFailed,
  };
}
