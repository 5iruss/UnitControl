import "server-only";
import { prisma } from "@/lib/prisma";
import {
  buildCourseRecommendations,
  buildFailedCourseWarnings,
  buildPlannedCourseAlerts,
} from "@/domain/recommendations";
import type {
  CandidateCourseInput,
  DataLimitationNotice,
  PlannedCourseAlertInput,
  RecommendationsResult,
} from "@/domain/recommendations";
import type { AcademicState } from "@/domain/academic";
import type { CurriculumMapViewModel } from "@/domain/curriculum-map";
import type { PlannedSemesterViewModel } from "@/domain/semester-planning";

// docs Phase 9 prompt §10 — data-driven, not hardcoded: each notice is only
// produced when the underlying data is actually missing for *this*
// curriculum, and only covers gaps that materially affect a recommendation/
// warning decision (credit-limit rules, prerequisite/corequisite coverage).
async function getDataLimitations(
  curriculumId: string,
  relationshipCount: number,
): Promise<DataLimitationNotice[]> {
  const [curriculum, courseWithCredits] = await Promise.all([
    prisma.curriculum.findUniqueOrThrow({
      where: { id: curriculumId },
      select: { totalRequiredUnits: true },
    }),
    prisma.curriculumCourse.findFirst({
      where: { curriculumId, course: { credits: { not: null } } },
      select: { id: true },
    }),
  ]);

  const notices: DataLimitationNotice[] = [];
  if (curriculum.totalRequiredUnits === null || courseWithCredits === null) {
    notices.push({
      message:
        "Unit-limit validation is unavailable because verified credit and total-required-unit information is not currently available for your curriculum.",
    });
  }
  if (relationshipCount === 0) {
    notices.push({
      message:
        "Prerequisite and corequisite validation currently has no verified relationships for your curriculum, so availability reflects course-status rules only.",
    });
  }
  return notices;
}

// docs/09_Technical_Requirements.md §2, §13, §17 — the Recommendation /
// Warning Engine layer. Takes the curriculum map and semester plan view
// models the dashboard already builds (both carry per-course
// ValidationResult from Phase 6) rather than re-fetching course data or
// re-evaluating eligibility — the only new Prisma access here is the
// data-limitation check, which nothing upstream already computes.
export async function getRecommendations(
  curriculumId: string,
  academicState: AcademicState,
  mapViewModel: CurriculumMapViewModel,
  semesters: readonly PlannedSemesterViewModel[],
): Promise<RecommendationsResult> {
  const candidates: CandidateCourseInput[] = mapViewModel.nodes.map((node) => ({
    courseId: node.courseId,
    courseCode: node.courseCode,
    name: node.name,
    status: node.status,
    eligibility: node.eligibility,
  }));

  const plannedInputs: PlannedCourseAlertInput[] = semesters.flatMap((semester) =>
    semester.courses.map((course) => ({
      courseId: course.courseId,
      courseCode: course.courseCode,
      name: course.name,
      termCode: semester.termCode,
      eligibility: course.eligibility,
    })),
  );

  const dataLimitations = await getDataLimitations(curriculumId, academicState.relationships.length);

  return {
    courseRecommendations: buildCourseRecommendations(candidates),
    failedCourseWarnings: buildFailedCourseWarnings(candidates, academicState.attempts),
    plannedCourseAlerts: buildPlannedCourseAlerts(plannedInputs),
    dataLimitations,
  };
}
