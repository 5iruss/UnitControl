"use server";

import { redirect } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { requireAdminRole } from "@/lib/admin/authorization";
import { recordAuditLog } from "@/lib/admin/audit-log";
import { firstIssueMessage } from "@/lib/zod-utils";
import { isUniqueConstraintError } from "@/lib/db-errors";
import {
  addGroupCourseSchema,
  courseGroupSchema,
  deleteCourseGroupSchema,
  removeGroupCourseSchema,
  updateCourseGroupSchema,
} from "./schemas";

const GROUP_ROLES = ["SUPER_ADMIN", "ACADEMIC_GROUP_MANAGER"] as const;

export interface AdminActionState {
  error?: string;
  success?: string;
}

export async function createCourseGroupAction(
  _prevState: AdminActionState,
  formData: FormData,
): Promise<AdminActionState> {
  const auth = await requireAdminRole(GROUP_ROLES);
  if (!auth.ok) return { error: auth.error };

  const parsed = courseGroupSchema.safeParse(Object.fromEntries(formData));
  if (!parsed.success) return { error: firstIssueMessage(parsed.error) };

  const curriculum = await prisma.curriculum.findUnique({ where: { id: parsed.data.curriculumId } });
  if (!curriculum) return { error: "Curriculum not found." };

  const existing = await prisma.courseGroup.findUnique({
    where: { curriculumId_name: { curriculumId: parsed.data.curriculumId, name: parsed.data.name } },
  });
  if (existing) return { error: "A group with this name already exists in this curriculum." };

  let group;
  try {
    group = await prisma.courseGroup.create({ data: parsed.data });
  } catch (err) {
    if (isUniqueConstraintError(err)) {
      return { error: "A group with this name already exists in this curriculum." };
    }
    throw err;
  }
  await recordAuditLog({
    adminId: auth.user.id,
    action: "COURSE_GROUP_CREATED",
    target: `${curriculum.name} / ${group.name}`,
  });

  redirect(`/admin/curricula/${curriculum.id}/groups/${group.id}`);
}

export async function updateCourseGroupAction(
  _prevState: AdminActionState,
  formData: FormData,
): Promise<AdminActionState> {
  const auth = await requireAdminRole(GROUP_ROLES);
  if (!auth.ok) return { error: auth.error };

  const parsed = updateCourseGroupSchema.safeParse(Object.fromEntries(formData));
  if (!parsed.success) return { error: firstIssueMessage(parsed.error) };
  const { id, ...data } = parsed.data;

  const existing = await prisma.courseGroup.findUnique({ where: { id }, include: { curriculum: true } });
  if (!existing) return { error: "Course group not found." };

  await prisma.courseGroup.update({ where: { id }, data });
  await recordAuditLog({
    adminId: auth.user.id,
    action: "COURSE_GROUP_UPDATED",
    target: `${existing.curriculum.name} / ${data.name}`,
  });

  redirect(`/admin/curricula/${existing.curriculumId}/groups/${id}`);
}

export async function deleteCourseGroupAction(
  _prevState: AdminActionState,
  formData: FormData,
): Promise<AdminActionState> {
  const auth = await requireAdminRole(GROUP_ROLES);
  if (!auth.ok) return { error: auth.error };

  const parsed = deleteCourseGroupSchema.safeParse(Object.fromEntries(formData));
  if (!parsed.success) return { error: firstIssueMessage(parsed.error) };

  const existing = await prisma.courseGroup.findUnique({
    where: { id: parsed.data.id },
    include: { curriculum: true, requirements: true },
  });
  if (!existing) return { error: "Course group not found." };

  // docs Phase 10 prompt §13, §22 — reject rather than cascade-delete a
  // group still referenced by a curriculum requirement.
  if (existing.requirements.length > 0) {
    return {
      error: "This group is used by a curriculum requirement; remove that requirement first.",
    };
  }

  await prisma.$transaction([
    prisma.courseGroupCourse.deleteMany({ where: { courseGroupId: existing.id } }),
    prisma.courseGroup.delete({ where: { id: existing.id } }),
  ]);
  await recordAuditLog({
    adminId: auth.user.id,
    action: "COURSE_GROUP_DELETED",
    target: `${existing.curriculum.name} / ${existing.name}`,
  });

  redirect(`/admin/curricula/${existing.curriculumId}`);
}

export async function addGroupCourseAction(
  _prevState: AdminActionState,
  formData: FormData,
): Promise<AdminActionState> {
  const auth = await requireAdminRole(GROUP_ROLES);
  if (!auth.ok) return { error: auth.error };

  const parsed = addGroupCourseSchema.safeParse(Object.fromEntries(formData));
  if (!parsed.success) return { error: firstIssueMessage(parsed.error) };
  const { courseGroupId, courseId } = parsed.data;

  const [group, course] = await Promise.all([
    prisma.courseGroup.findUnique({ where: { id: courseGroupId } }),
    prisma.course.findUnique({ where: { id: courseId } }),
  ]);
  if (!group) return { error: "Course group not found." };
  if (!course) return { error: "Course not found." };

  const existing = await prisma.courseGroupCourse.findUnique({
    where: { courseGroupId_courseId: { courseGroupId, courseId } },
  });
  if (existing) return { error: "This course is already in the group." };

  try {
    await prisma.courseGroupCourse.create({ data: { courseGroupId, courseId } });
  } catch (err) {
    if (isUniqueConstraintError(err)) return { error: "This course is already in the group." };
    throw err;
  }
  await recordAuditLog({
    adminId: auth.user.id,
    action: "GROUP_COURSE_ADDED",
    target: `${group.name} / ${course.name}`,
  });

  return { success: `${course.name} added to ${group.name}.` };
}

export async function removeGroupCourseAction(
  _prevState: AdminActionState,
  formData: FormData,
): Promise<AdminActionState> {
  const auth = await requireAdminRole(GROUP_ROLES);
  if (!auth.ok) return { error: auth.error };

  const parsed = removeGroupCourseSchema.safeParse(Object.fromEntries(formData));
  if (!parsed.success) return { error: firstIssueMessage(parsed.error) };

  const existing = await prisma.courseGroupCourse.findUnique({
    where: { id: parsed.data.id },
    include: { courseGroup: true, course: true },
  });
  if (!existing) return { error: "Group membership not found." };

  await prisma.courseGroupCourse.delete({ where: { id: parsed.data.id } });
  await recordAuditLog({
    adminId: auth.user.id,
    action: "GROUP_COURSE_REMOVED",
    target: `${existing.courseGroup.name} / ${existing.course.name}`,
  });

  return { success: `${existing.course.name} removed from ${existing.courseGroup.name}.` };
}
