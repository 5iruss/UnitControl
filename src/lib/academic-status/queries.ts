import "server-only";
import { prisma } from "@/lib/prisma";

export async function getCurriculumCourseIds(curriculumId: string): Promise<Set<string>> {
  const rows = await prisma.curriculumCourse.findMany({
    where: { curriculumId },
    select: { courseId: true },
  });
  return new Set(rows.map((r) => r.courseId));
}

export function getCurriculumCoursesForDisplay(curriculumId: string) {
  return prisma.curriculumCourse.findMany({
    where: { curriculumId },
    include: { course: true },
    orderBy: { course: { name: "asc" } },
  });
}

export function getStudentCourses(studentId: string) {
  return prisma.studentCourse.findMany({
    where: { studentId },
    include: { academicTerm: true },
  });
}

export function getStudentSemesters(studentId: string) {
  return prisma.studentSemester.findMany({
    where: { studentId },
    include: { academicTerm: true },
    orderBy: { academicTerm: { termCode: "asc" } },
  });
}

export function getStudentCourseAttempts(studentId: string) {
  return prisma.studentCourseAttempt.findMany({
    where: { studentId },
    include: { course: true, academicTerm: true },
  });
}
