import "server-only";
import { prisma } from "@/lib/prisma";
import { buildAcademicState } from "@/lib/academic-rules/queries";
import { getStudentCourses } from "@/lib/academic-status/queries";
import { evaluateCourseEligibility } from "@/domain/academic";
import { buildCurriculumMapViewModel } from "@/domain/curriculum-map";
import type { CurriculumMapCourseInput, CurriculumMapViewModel } from "@/domain/curriculum-map";

export interface CurriculumMapData {
  curriculumName: string;
  viewModel: CurriculumMapViewModel;
}

// docs/09_Technical_Requirements.md Phase 7 "Data Architecture" — the only
// Prisma-touching step. Fetches the student's curriculum courses, builds the
// Academic Rules Engine's AcademicState (Phase 6, reused as-is), evaluates
// eligibility per course (domain/academic, pure), and shapes the result into
// the domain/curriculum-map view model (pure). React components never see
// Prisma models or call the Rules Engine directly.
export async function getCurriculumMapData(
  studentId: string,
  curriculumId: string,
): Promise<CurriculumMapData> {
  const [curriculum, curriculumCourses, academicState, studentCourses] = await Promise.all([
    prisma.curriculum.findUniqueOrThrow({ where: { id: curriculumId }, select: { name: true } }),
    prisma.curriculumCourse.findMany({
      where: { curriculumId },
      select: {
        category: true,
        course: { select: { id: true, courseCode: true, name: true } },
      },
    }),
    buildAcademicState(studentId, curriculumId),
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
