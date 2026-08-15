import "server-only";
import { prisma } from "@/lib/prisma";

// docs/08_Admin_Panel.md §4 — "Active students" and "Pending support
// requests" are omitted: no student-activity or support-ticket data model
// exists to derive them from (docs Phase 10 pre-coding report ambiguity #8).
export async function getDashboardStats() {
  const [totalStudents, curriculumCount, courseCount] = await Promise.all([
    prisma.user.count({ where: { role: "STUDENT" } }),
    prisma.curriculum.count(),
    prisma.course.count(),
  ]);
  return { totalStudents, curriculumCount, courseCount };
}
