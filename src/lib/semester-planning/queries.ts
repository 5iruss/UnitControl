import "server-only";
import { prisma } from "@/lib/prisma";
import { evaluateCourseEligibility } from "@/domain/academic";
import type { AcademicState } from "@/domain/academic";
import { buildSemesterPlanViewModel } from "@/domain/semester-planning";
import type { PlannedCourseInput, PlannedSemesterViewModel } from "@/domain/semester-planning";

// docs/07_Database_Schema.md §16 — planned courses are student_courses rows
// with status = PLANNED; this is the only Prisma-touching step, mapping
// those rows (plus the caller-supplied Phase 6 AcademicState/eligibility
// pass — see docs Phase 9 prompt §22 on assembling academic state once per
// request) into the domain's semester-grouped view model.
export async function getSemesterPlan(
  studentId: string,
  academicState: AcademicState,
): Promise<PlannedSemesterViewModel[]> {
  const plannedCourses = await prisma.studentCourse.findMany({
    where: { studentId, status: "PLANNED" },
    select: {
      courseId: true,
      course: { select: { courseCode: true, name: true } },
      academicTerm: { select: { termCode: true } },
    },
  });

  const courseInputs: PlannedCourseInput[] = plannedCourses
    // PLANNED always has a term at the mutation layer (docs/05_Curriculum_Data_Model.md
    // §14.1); the null case is defensive, not an expected state.
    .filter((planned) => planned.academicTerm !== null)
    .map((planned) => ({
      courseId: planned.courseId,
      courseCode: planned.course.courseCode,
      name: planned.course.name,
      termCode: planned.academicTerm!.termCode,
      eligibility: evaluateCourseEligibility(academicState, planned.courseId),
    }));

  return buildSemesterPlanViewModel(courseInputs);
}
