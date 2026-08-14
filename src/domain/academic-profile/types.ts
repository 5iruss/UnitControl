// Domain types for academic-profile logic (curriculum matching, reset
// detection). Framework-independent — no Next.js/Prisma imports, mirroring
// domain/academic/ (docs/09_Technical_Requirements.md §24 "Domain Layer
// Isolation"). Callers map Prisma records into these plain shapes.

export interface CurriculumSummary {
  id: string;
  name: string;
  major: string;
  orientation: string;
  /// Null means unbounded (docs/06_Curriculum_Dataset.md §2 — no lower
  /// bound is documented for "entry year 1402 and before").
  entryYearFrom: number | null;
  entryYearTo: number | null;
}

/// docs/02_User_Flow.md §4 — the fields the student provides to identify
/// their curriculum.
export interface ProfileSelection {
  entryYear: number;
  major: string;
  orientation: string;
}
