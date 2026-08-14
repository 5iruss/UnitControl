import type { Role } from "@/generated/prisma/client";

export function homePathForRole(role: Role): string {
  return role === "STUDENT" ? "/dashboard" : "/admin";
}
