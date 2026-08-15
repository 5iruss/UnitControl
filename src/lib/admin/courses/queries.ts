import "server-only";
import { prisma } from "@/lib/prisma";

const LIST_LIMIT = 100;

// docs Phase 10 prompt §16 — server-side search/filter rather than loading
// the entire course table into the browser.
export async function searchCourses(query: string | undefined) {
  const where = query
    ? {
        OR: [
          { name: { contains: query, mode: "insensitive" as const } },
          { courseCode: { contains: query, mode: "insensitive" as const } },
        ],
      }
    : {};

  const [courses, total] = await Promise.all([
    prisma.course.findMany({ where, orderBy: { name: "asc" }, take: LIST_LIMIT }),
    prisma.course.count({ where }),
  ]);

  return { courses, total, truncated: total > courses.length };
}

export async function getCourseDetail(id: string) {
  const [course, relationshipsAsSource, relationshipsAsTarget, curriculumCourses] = await Promise.all([
    prisma.course.findUnique({ where: { id } }),
    prisma.courseRelationship.findMany({
      where: { sourceCourseId: id },
      include: { targetCourse: true },
    }),
    prisma.courseRelationship.findMany({
      where: { targetCourseId: id },
      include: { sourceCourse: true },
    }),
    prisma.curriculumCourse.findMany({
      where: { courseId: id },
      include: { curriculum: true },
    }),
  ]);

  if (!course) return null;
  return { course, relationshipsAsSource, relationshipsAsTarget, curriculumCourses };
}

// Simple all-active-courses list, used by "add course to X" pickers
// elsewhere in the Admin Panel (curriculum membership, relationships, group
// membership) — small enough (≤ ~170 rows in the current dataset) not to
// need its own search/pagination.
export function listActiveCoursesForPicker() {
  return prisma.course.findMany({
    where: { status: { not: "ARCHIVED" } },
    orderBy: { name: "asc" },
    select: { id: true, name: true, courseCode: true },
  });
}
