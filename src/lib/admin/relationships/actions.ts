"use server";

import { prisma } from "@/lib/prisma";
import { requireAdminRole } from "@/lib/admin/authorization";
import { recordAuditLog } from "@/lib/admin/audit-log";
import { firstIssueMessage } from "@/lib/zod-utils";
import { isUniqueConstraintError } from "@/lib/db-errors";
import { validateCourseRelationshipInput } from "@/domain/admin";
import { createRelationshipSchema, deleteRelationshipSchema } from "./schemas";

const RELATIONSHIP_ROLES = ["SUPER_ADMIN", "ACADEMIC_GROUP_MANAGER"] as const;

export interface AdminActionState {
  error?: string;
  success?: string;
}

// docs/08_Admin_Panel.md §7 — the Admin Panel manages relationship DATA
// only; it never interprets what a relationship means academically (that
// stays in domain/academic, the Rules Engine — docs/04_Academic_Rules_Engine.md).
export async function createRelationshipAction(
  _prevState: AdminActionState,
  formData: FormData,
): Promise<AdminActionState> {
  const auth = await requireAdminRole(RELATIONSHIP_ROLES);
  if (!auth.ok) return { error: auth.error };

  const parsed = createRelationshipSchema.safeParse(Object.fromEntries(formData));
  if (!parsed.success) return { error: firstIssueMessage(parsed.error) };
  const { sourceCourseId, targetCourseId, relationshipType } = parsed.data;

  const structural = validateCourseRelationshipInput({ sourceCourseId, targetCourseId });
  if (!structural.valid) return { error: structural.reason };

  const [sourceCourse, targetCourse] = await Promise.all([
    prisma.course.findUnique({ where: { id: sourceCourseId } }),
    prisma.course.findUnique({ where: { id: targetCourseId } }),
  ]);
  if (!sourceCourse) return { error: "Source course not found." };
  if (!targetCourse) return { error: "Target course not found." };

  const existing = await prisma.courseRelationship.findUnique({
    where: {
      sourceCourseId_targetCourseId_relationshipType: {
        sourceCourseId,
        targetCourseId,
        relationshipType,
      },
    },
  });
  if (existing) return { error: "This relationship already exists." };

  try {
    await prisma.courseRelationship.create({ data: { sourceCourseId, targetCourseId, relationshipType } });
  } catch (err) {
    if (isUniqueConstraintError(err)) return { error: "This relationship already exists." };
    throw err;
  }
  await recordAuditLog({
    adminId: auth.user.id,
    action: "RELATIONSHIP_CREATED",
    target: `${sourceCourse.name} —${relationshipType}→ ${targetCourse.name}`,
  });

  return { success: `${relationshipType} relationship created.` };
}

export async function deleteRelationshipAction(
  _prevState: AdminActionState,
  formData: FormData,
): Promise<AdminActionState> {
  const auth = await requireAdminRole(RELATIONSHIP_ROLES);
  if (!auth.ok) return { error: auth.error };

  const parsed = deleteRelationshipSchema.safeParse(Object.fromEntries(formData));
  if (!parsed.success) return { error: firstIssueMessage(parsed.error) };

  const existing = await prisma.courseRelationship.findUnique({
    where: { id: parsed.data.id },
    include: { sourceCourse: true, targetCourse: true },
  });
  if (!existing) return { error: "Relationship not found." };

  // docs Phase 10 prompt §15 — safe to hard-delete: no student-facing table
  // references CourseRelationship rows (student eligibility is recomputed
  // live from current relationships, never stored against a specific one).
  await prisma.courseRelationship.delete({ where: { id: parsed.data.id } });
  await recordAuditLog({
    adminId: auth.user.id,
    action: "RELATIONSHIP_DELETED",
    target: `${existing.sourceCourse.name} —${existing.relationshipType}→ ${existing.targetCourse.name}`,
  });

  return { success: "Relationship deleted." };
}
