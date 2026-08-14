import "server-only";
import { prisma } from "@/lib/prisma";
import type { CurriculumSummary } from "@/domain/academic-profile";

export async function getCurricula(): Promise<CurriculumSummary[]> {
  return prisma.curriculum.findMany({
    select: {
      id: true,
      name: true,
      major: true,
      orientation: true,
      entryYearFrom: true,
      entryYearTo: true,
    },
  });
}

export function getStudentProfile(userId: string) {
  return prisma.studentProfile.findUnique({ where: { userId } });
}
