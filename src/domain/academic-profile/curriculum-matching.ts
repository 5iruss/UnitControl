import type { CurriculumSummary, ProfileSelection } from "./types";

/// docs/04_Academic_Rules_Engine.md §15 — curriculum is determined by entry
/// year, major, and orientation. Null bounds are treated as unbounded.
export function resolveCurriculum(
  curricula: CurriculumSummary[],
  selection: ProfileSelection,
): CurriculumSummary | null {
  return (
    curricula.find(
      (curriculum) =>
        curriculum.major === selection.major &&
        curriculum.orientation === selection.orientation &&
        (curriculum.entryYearFrom === null || selection.entryYear >= curriculum.entryYearFrom) &&
        (curriculum.entryYearTo === null || selection.entryYear <= curriculum.entryYearTo),
    ) ?? null
  );
}

/// Distinct majors available across the seeded curricula, for building a
/// data-driven select instead of hardcoding options
/// (docs/09_Technical_Requirements.md §26 "Do Not Hardcode Curriculum Data in UI Components").
export function getMajors(curricula: CurriculumSummary[]): string[] {
  return [...new Set(curricula.map((curriculum) => curriculum.major))];
}

export function getOrientationsForMajor(
  curricula: CurriculumSummary[],
  major: string,
): string[] {
  return [
    ...new Set(
      curricula.filter((curriculum) => curriculum.major === major).map((c) => c.orientation),
    ),
  ];
}

/// docs/01_Product_Overview.md §12, docs/04_Academic_Rules_Engine.md §23 —
/// a curriculum change is defined by the *resolved* curriculum differing,
/// not by any individual field changing (e.g. entry year 1401 → 1400 still
/// resolves to the same curriculum and must not trigger a reset).
export function requiresCurriculumReset(
  previousCurriculumId: string,
  nextCurriculumId: string,
): boolean {
  return previousCurriculumId !== nextCurriculumId;
}
