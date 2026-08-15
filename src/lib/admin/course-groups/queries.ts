import "server-only";
import { prisma } from "@/lib/prisma";

export async function getCourseGroupDetail(id: string) {
  const courseGroup = await prisma.courseGroup.findUnique({
    where: { id },
    include: {
      curriculum: true,
      courseGroupCourses: { include: { course: true }, orderBy: { course: { name: "asc" } } },
    },
  });
  return courseGroup;
}
