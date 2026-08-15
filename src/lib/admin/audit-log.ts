import "server-only";
import { prisma } from "@/lib/prisma";
import type { Prisma, Role } from "@/generated/prisma/client";

// docs/08_Admin_Panel.md §15 — the single audit system (do not create a
// second one; docs Phase 10 prompt §12). Every Admin Panel mutation that the
// docs require to be audited goes through this one function, including the
// pre-existing Phase 2 support password reset (see lib/auth/actions.ts).
export type AdminAuditAction =
  | "CURRICULUM_CREATED"
  | "CURRICULUM_UPDATED"
  | "COURSE_CREATED"
  | "COURSE_UPDATED"
  | "COURSE_STATUS_CHANGED"
  | "CURRICULUM_COURSE_ADDED"
  | "CURRICULUM_COURSE_UPDATED"
  | "CURRICULUM_COURSE_REMOVED"
  | "RELATIONSHIP_CREATED"
  | "RELATIONSHIP_DELETED"
  | "COURSE_GROUP_CREATED"
  | "COURSE_GROUP_UPDATED"
  | "COURSE_GROUP_DELETED"
  | "GROUP_COURSE_ADDED"
  | "GROUP_COURSE_REMOVED"
  | "REQUIREMENT_CREATED"
  | "REQUIREMENT_UPDATED"
  | "REQUIREMENT_DELETED"
  | "ADMIN_CREATED"
  | "PASSWORD_RESET";

/// docs/08_Admin_Panel.md §16 "View system activity ... Limited" for
/// Academic Manager/Support (undocumented specifics — Phase 10 pre-coding
/// report ambiguity #8): each role sees audit entries only for actions
/// within its own permission scope. Super Admin sees everything (no filter).
const SUPPORT_ACTIONS: readonly AdminAuditAction[] = ["PASSWORD_RESET"];
const ADMIN_MANAGEMENT_ACTIONS: readonly AdminAuditAction[] = ["ADMIN_CREATED"];

export function visibleAuditActionsForRole(role: Role): AdminAuditAction[] | undefined {
  if (role === "SUPER_ADMIN") return undefined; // no filter
  if (role === "SUPPORT") return [...SUPPORT_ACTIONS];
  // ACADEMIC_GROUP_MANAGER: everything except support/admin-management actions.
  const excluded = new Set<string>([...SUPPORT_ACTIONS, ...ADMIN_MANAGEMENT_ACTIONS]);
  return (
    [
      "CURRICULUM_CREATED",
      "CURRICULUM_UPDATED",
      "COURSE_CREATED",
      "COURSE_UPDATED",
      "COURSE_STATUS_CHANGED",
      "CURRICULUM_COURSE_ADDED",
      "CURRICULUM_COURSE_UPDATED",
      "CURRICULUM_COURSE_REMOVED",
      "RELATIONSHIP_CREATED",
      "RELATIONSHIP_DELETED",
      "COURSE_GROUP_CREATED",
      "COURSE_GROUP_UPDATED",
      "COURSE_GROUP_DELETED",
      "GROUP_COURSE_ADDED",
      "GROUP_COURSE_REMOVED",
      "REQUIREMENT_CREATED",
      "REQUIREMENT_UPDATED",
      "REQUIREMENT_DELETED",
      "ADMIN_CREATED",
      "PASSWORD_RESET",
    ] satisfies AdminAuditAction[]
  ).filter((action) => !excluded.has(action));
}

// docs/09_Technical_Requirements.md §22 — "Where useful, the previous and
// new values should also be recorded." `details` must never contain
// passwords, tokens, or secrets (docs/08_Admin_Panel.md §11, §15).
export async function recordAuditLog(params: {
  adminId: string;
  action: AdminAuditAction;
  target: string;
  details?: Record<string, unknown>;
}): Promise<void> {
  await prisma.auditLog.create({
    data: {
      adminId: params.adminId,
      action: params.action,
      target: params.target,
      details: (params.details as Prisma.InputJsonValue | undefined) ?? undefined,
    },
  });
}

const RECENT_LIMIT = 50;

// docs/08_Admin_Panel.md §16 "View system activity ... Limited" — filtered
// by visibleAuditActionsForRole (see comment above).
export async function listAuditLog(role: Role, limit: number = RECENT_LIMIT) {
  const actions = visibleAuditActionsForRole(role);
  return prisma.auditLog.findMany({
    where: actions ? { action: { in: actions } } : undefined,
    include: { admin: { select: { firstName: true, lastName: true, role: true } } },
    orderBy: { createdAt: "desc" },
    take: limit,
  });
}
