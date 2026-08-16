import type { CourseStatus } from "@/domain/academic";

// docs/06_Curriculum_Dataset.md §7 — course credits and curriculum total
// required units are unverified/NULL in the current dataset, so no
// unit-based graduation percentage can be honestly calculated. This is a
// course-count-based progress metric instead ("course progress", never
// labeled as graduation progress). Kept as a single pure function so every
// place that shows overall progress (header, progress section) computes the
// exact same number, and so a future unit-based calculation can replace this
// one implementation without touching every call site.
export interface CourseProgressSummary {
  passedCount: number;
  totalCount: number;
  /// Rounded 0-100. 0 when totalCount is 0 (no curriculum courses configured).
  percentage: number;
}

export function calculateCourseProgress(
  statusCounts: ReadonlyMap<CourseStatus, number>,
  totalCount: number,
): CourseProgressSummary {
  const passedCount = statusCounts.get("PASSED") ?? 0;
  const percentage = totalCount === 0 ? 0 : Math.round((passedCount / totalCount) * 100);
  return { passedCount, totalCount, percentage };
}
