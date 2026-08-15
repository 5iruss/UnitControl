import "server-only";
import { prisma } from "@/lib/prisma";
import { getStudentCourses } from "@/lib/academic-status/queries";
import { evaluateCourseEligibility } from "@/domain/academic";
import type { AcademicState } from "@/domain/academic";
import { buildCurriculumMapViewModel } from "@/domain/curriculum-map";
import type { CurriculumMapCourseInput, CurriculumMapViewModel } from "@/domain/curriculum-map";

export interface CurriculumMapData {
  curriculumName: string;
  viewModel: CurriculumMapViewModel;
}

// docs/09_Technical_Requirements.md Phase 7 "Data Architecture" — the only
// Prisma-touching step. Fetches the student's curriculum courses, evaluates
// eligibility per course (domain/academic, pure) against the caller-supplied
// AcademicState (Phase 6, built once per request — docs Phase 9 prompt §22
// "avoid N+1 queries... assemble the academic state once" — rather than
// each view-model query rebuilding it), and shapes the result into the
// domain/curriculum-map view model (pure). React components never see
// Prisma models or call the Rules Engine directly.
export async function getCurriculumMapData(
  studentId: string,
  curriculumId: string,
  academicState: AcademicState,
): Promise<CurriculumMapData> {
  const [curriculum, curriculumCourses, studentCourses] = await Promise.all([
    prisma.curriculum.findUniqueOrThrow({ where: { id: curriculumId }, select: { name: true } }),
    prisma.curriculumCourse.findMany({
      where: { curriculumId },
      select: {
        category: true,
        course: { select: { id: true, courseCode: true, name: true } },
      },
    }),
    getStudentCourses(studentId),
  ]);

  const termCodeByCourseId = new Map(
    studentCourses.map((sc) => [sc.courseId, sc.academicTerm?.termCode ?? null]),
  );

  const courseInputs: CurriculumMapCourseInput[] = curriculumCourses.map((curriculumCourse) => {
    const courseId = curriculumCourse.course.id;
    return {
      courseId,
      courseCode: curriculumCourse.course.courseCode,
      name: curriculumCourse.course.name,
      category: curriculumCourse.category,
      status: academicState.courseStatuses.get(courseId) ?? "NOT_COMPLETED",
      termCode: termCodeByCourseId.get(courseId) ?? null,
      eligibility: evaluateCourseEligibility(academicState, courseId),
    };
  });

  const viewModel = buildCurriculumMapViewModel(courseInputs, academicState.relationships);

  return { curriculumName: curriculum.name, viewModel };
}
