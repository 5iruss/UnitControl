import "server-only";
import { prisma } from "@/lib/prisma";

export function listCurricula() {
  return prisma.curriculum.findMany({ orderBy: { name: "asc" } });
}

export async function getCurriculumDetail(id: string) {
  const [curriculum, curriculumCourses, courseGroups, requirements] = await Promise.all([
    prisma.curriculum.findUnique({ where: { id } }),
    prisma.curriculumCourse.findMany({
      where: { curriculumId: id },
      include: { course: true },
      orderBy: { course: { name: "asc" } },
    }),
    prisma.courseGroup.findMany({
      where: { curriculumId: id },
      orderBy: { name: "asc" },
      include: { courseGroupCourses: { include: { course: true } } },
    }),
    prisma.curriculumRequirement.findMany({
      where: { curriculumId: id },
      include: { courseGroup: true },
      orderBy: { name: "asc" },
    }),
  ]);

  if (!curriculum) return null;
  return { curriculum, curriculumCourses, courseGroups, requirements };
}
