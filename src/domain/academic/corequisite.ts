// docs/04_Academic_Rules_Engine.md §6 — corequisite relationships come only
// from the verified dataset (currently zero rows: docs/06_Curriculum_Dataset.md
// §5). Whether a corequisite must be taken in the same semester, or at the
// same time or earlier, is explicitly "TBD — Requires official academic
// verification." Rather than guess an enforcement rule, this function
// reports that a relationship exists and needs manual verification. It
// never blocks and never silently treats the relationship as satisfied.

import type { CourseRelationshipRecord } from "./types";

export interface CorequisiteCheckResult {
  hasRelationship: boolean;
  /// Set when a corequisite relationship exists, since its enforcement
  /// semantics are unverified (see module notes above).
  warning?: string;
}

/// `relationshipsForCourse` must already be filtered to COREQUISITE
/// relationships touching the course being evaluated (as either source or
/// target — the relationship is conceptually non-directional per §6).
export function evaluateCorequisite(
  relationshipsForCourse: readonly CourseRelationshipRecord[],
): CorequisiteCheckResult {
  if (relationshipsForCourse.length === 0) {
    return { hasRelationship: false };
  }
  return {
    hasRelationship: true,
    warning:
      "این درس هم‌نیاز دارد، اما نحوه دقیق اعمال آن (هم‌زمان یا زودتر) هنوز تأیید نشده است (docs/04_Academic_Rules_Engine.md §6). بررسی دستی توصیه می‌شود.",
  };
}
