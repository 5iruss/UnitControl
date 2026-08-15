import "server-only";
import { prisma } from "@/lib/prisma";

export function listAdmins() {
  return prisma.user.findMany({
    where: { role: { in: ["SUPER_ADMIN", "ACADEMIC_GROUP_MANAGER", "SUPPORT"] } },
    select: {
      id: true,
      studentNumber: true,
      phoneNumber: true,
      firstName: true,
      lastName: true,
      role: true,
      createdAt: true,
    },
    orderBy: { createdAt: "asc" },
  });
}
