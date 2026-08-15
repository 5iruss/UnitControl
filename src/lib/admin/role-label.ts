import type { Role } from "@/generated/prisma/client";

// Single source for Role -> display label, reused by the admin nav header,
// the administrators list, and the "create administrator" role picker, so a
// role can't render as a human-readable label in one place and the raw enum
// value (e.g. "ACADEMIC_GROUP_MANAGER") in another.
export const ROLE_LABEL: Record<Role, string> = {
  STUDENT: "Student",
  SUPER_ADMIN: "Super Admin",
  ACADEMIC_GROUP_MANAGER: "Academic Group Manager",
  SUPPORT: "Support",
};

// The 3 roles an administrator account can be assigned (docs/08_Admin_Panel.md
// §2 — STUDENT is a separate, non-administrative role and is never offered
// here).
export const ADMIN_ROLE_OPTIONS = ["SUPER_ADMIN", "ACADEMIC_GROUP_MANAGER", "SUPPORT"] as const satisfies readonly Role[];
