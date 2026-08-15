"use server";

import { prisma } from "@/lib/prisma";
import { requireAdminRole } from "@/lib/admin/authorization";
import { recordAuditLog } from "@/lib/admin/audit-log";
import { firstIssueMessage } from "@/lib/zod-utils";
import { validateCurriculumRequirementInput } from "@/domain/admin";
import { deleteRequirementSchema, requirementSchema, updateRequirementSchema } from "./schemas";

const REQUIREMENT_ROLES = ["SUPER_ADMIN", "ACADEMIC_GROUP_MANAGER"] as const;

export interface AdminActionState {
  error?: string;
  success?: string;
}

// docs/08_Admin_Panel.md §8, §10 — "The Admin Panel should provide
// validation before saving changes" / "Do not allow malformed requirement
// data." Structural validation reuses domain/admin (pure, shared with
// unit tests) rather than re-implementing the same checks here.
export async function createRequirementAction(
  _prevState: AdminActionState,
  formData: FormData,
): Promise<AdminActionState> {
  const auth = await requireAdminRole(REQUIREMENT_ROLES);
  if (!auth.ok) return { error: auth.error };

  const parsed = requirementSchema.safeParse(Object.fromEntries(formData));
  if (!parsed.success) return { error: firstIssueMessage(parsed.error) };
  const data = parsed.data;

  const structural = validateCurriculumRequirementInput(data);
  if (!structural.valid) return { error: structural.reason };

  const curriculum = await prisma.curriculum.findUnique({ where: { id: data.curriculumId } });
  if (!curriculum) return { error: "Curriculum not found." };

  if (data.courseGroupId) {
    const group = await prisma.courseGroup.findUnique({ where: { id: data.courseGroupId } });
    if (!group || group.curriculumId !== data.curriculumId) {
      return { error: "The selected course group does not belong to this curriculum." };
    }
  }

  const existing = await prisma.curriculumRequirement.findUnique({
    where: {
      curriculumId_requirementType_name: {
        curriculumId: data.curriculumId,
        requirementType: data.requirementType,
        name: data.name,
      },
    },
  });
  if (existing) return { error: "A requirement with this name and type already exists." };

  await prisma.curriculumRequirement.create({ data });
  await recordAuditLog({
    adminId: auth.user.id,
    action: "REQUIREMENT_CREATED",
    target: `${curriculum.name} / ${data.name}`,
  });

  return { success: `Requirement "${data.name}" created.` };
}

export async function updateRequirementAction(
  _prevState: AdminActionState,
  formData: FormData,
): Promise<AdminActionState> {
  const auth = await requireAdminRole(REQUIREMENT_ROLES);
  if (!auth.ok) return { error: auth.error };

  const parsed = updateRequirementSchema.safeParse(Object.fromEntries(formData));
  if (!parsed.success) return { error: firstIssueMessage(parsed.error) };
  const { id, ...data } = parsed.data;

  const structural = validateCurriculumRequirementInput(data);
  if (!structural.valid) return { error: structural.reason };

  const existing = await prisma.curriculumRequirement.findUnique({
    where: { id },
    include: { curriculum: true },
  });
  if (!existing) return { error: "Requirement not found." };

  if (data.courseGroupId) {
    const group = await prisma.courseGroup.findUnique({ where: { id: data.courseGroupId } });
    if (!group || group.curriculumId !== data.curriculumId) {
      return { error: "The selected course group does not belong to this curriculum." };
    }
  }

  await prisma.curriculumRequirement.update({ where: { id }, data });
  await recordAuditLog({
    adminId: auth.user.id,
    action: "REQUIREMENT_UPDATED",
    target: `${existing.curriculum.name} / ${data.name}`,
  });

  return { success: `Requirement "${data.name}" updated.` };
}

export async function deleteRequirementAction(
  _prevState: AdminActionState,
  formData: FormData,
): Promise<AdminActionState> {
  const auth = await requireAdminRole(REQUIREMENT_ROLES);
  if (!auth.ok) return { error: auth.error };

  const parsed = deleteRequirementSchema.safeParse(Object.fromEntries(formData));
  if (!parsed.success) return { error: firstIssueMessage(parsed.error) };

  const existing = await prisma.curriculumRequirement.findUnique({
    where: { id: parsed.data.id },
    include: { curriculum: true },
  });
  if (!existing) return { error: "Requirement not found." };

  // docs Phase 10 prompt §15 — safe: no student-facing table references
  // CurriculumRequirement rows (progress is derived live, never stored
  // against a specific requirement row).
  await prisma.curriculumRequirement.delete({ where: { id: parsed.data.id } });
  await recordAuditLog({
    adminId: auth.user.id,
    action: "REQUIREMENT_DELETED",
    target: `${existing.curriculum.name} / ${existing.name}`,
  });

  return { success: `Requirement "${existing.name}" deleted.` };
}
