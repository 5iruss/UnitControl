// Groups a student's PLANNED courses into semesters, ordered chronologically
// using Phase 6's term-ordering utility (docs/04_Academic_Rules_Engine.md
// §17 — never compare term codes as strings). Pure, deterministic: the same
// input always produces the same grouping/order.

import { compareTermCodes } from "@/domain/academic";
import { parseTermCode } from "@/domain/academic-status/term";
import type { TermTypeValue } from "@/domain/academic-status/types";
import type { PlannedCourseInput, PlannedSemesterViewModel } from "./types";

const TERM_TYPE_LABEL: Record<TermTypeValue, string> = {
  MEHR: "Mehr",
  BAHMAN: "Bahman",
  SUMMER: "Summer",
};

function termLabel(termCode: string): string {
  const parsed = parseTermCode(termCode);
  if (!parsed) return termCode;
  return `${TERM_TYPE_LABEL[parsed.termType]} ${parsed.academicYear}`;
}

function courseSortKey(course: PlannedCourseInput): string {
  return `${course.name} ${course.courseId}`;
}

export function buildSemesterPlanViewModel(
  courses: readonly PlannedCourseInput[],
): PlannedSemesterViewModel[] {
  const byTerm = new Map<string, PlannedCourseInput[]>();
  for (const course of courses) {
    const list = byTerm.get(course.termCode);
    if (list) list.push(course);
    else byTerm.set(course.termCode, [course]);
  }

  const termCodes = [...byTerm.keys()].sort((a, b) => compareTermCodes(a, b) ?? 0);

  return termCodes.map((termCode) => {
    const coursesInTerm = [...byTerm.get(termCode)!].sort((a, b) => {
      const ka = courseSortKey(a);
      const kb = courseSortKey(b);
      return ka < kb ? -1 : ka > kb ? 1 : 0;
    });

    return {
      termCode,
      termLabel: termLabel(termCode),
      courses: coursesInTerm.map((course) => ({
        courseId: course.courseId,
        courseCode: course.courseCode,
        name: course.name,
        eligibility: course.eligibility,
      })),
    };
  });
}
