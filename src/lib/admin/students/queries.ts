import "server-only";
import { prisma } from "@/lib/prisma";

const SEARCH_LIMIT = 50;

// docs/08_Admin_Panel.md §10 — search by student number, phone number, or
// name. Read-only; never returns passwordHash (docs §11).
export async function searchStudents(query: string | undefined) {
  if (!query || query.trim() === "") return [];

  const q = query.trim();
  const users = await prisma.user.findMany({
    where: {
      role: "STUDENT",
      OR: [
        { studentNumber: { contains: q, mode: "insensitive" } },
        { phoneNumber: { contains: q, mode: "insensitive" } },
        { firstName: { contains: q, mode: "insensitive" } },
        { lastName: { contains: q, mode: "insensitive" } },
      ],
    },
    select: {
      id: true,
      studentNumber: true,
      phoneNumber: true,
      firstName: true,
      lastName: true,
      createdAt: true,
    },
    orderBy: { lastName: "asc" },
    take: SEARCH_LIMIT,
  });
  return users;
}

// docs/08_Admin_Panel.md §12 — basic account info + academic profile fields
// only (student number, entry year, major, orientation, study type,
// assigned curriculum); never the password hash.
export async function getStudentAccountDetail(userId: string) {
  const user = await prisma.user.findUnique({
    where: { id: userId },
    select: {
      id: true,
      studentNumber: true,
      phoneNumber: true,
      firstName: true,
      lastName: true,
      role: true,
      createdAt: true,
      studentProfile: {
        select: {
          entryYear: true,
          major: true,
          orientation: true,
          studyType: true,
          academicSetupCompletedAt: true,
          curriculum: { select: { id: true, name: true } },
        },
      },
    },
  });
  if (!user || user.role !== "STUDENT") return null;
  return user;
}
