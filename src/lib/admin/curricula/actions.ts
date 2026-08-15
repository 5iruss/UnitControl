"use server";

import { redirect } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { requireAdminRole } from "@/lib/admin/authorization";
import { recordAuditLog } from "@/lib/admin/audit-log";
import { firstIssueMessage } from "@/lib/zod-utils";
import { isUniqueConstraintError } from "@/lib/db-errors";
import {
  addCurriculumCourseSchema,
  curriculumSchema,
  removeCurriculumCourseSchema,
  updateCurriculumCourseSchema,
  updateCurriculumSchema,
} from "./schemas";

// docs/08_Admin_Panel.md §16 — curriculum management is Super Admin +
// Academic Group Manager only.
const CURRICULUM_ROLES = ["SUPER_ADMIN", "ACADEMIC_GROUP_MANAGER"] as const;

export interface AdminActionState {
  error?: string;
  success?: string;
}

// docs/08_Admin_Panel.md §5 — curriculum metadata (name, major, orientation,
// entry-year range, required units, status).
export async function createCurriculumAction(
  _prevState: AdminActionState,
  formData: FormData,
): Promise<AdminActionState> {
  const auth = await requireAdminRole(CURRICULUM_ROLES);
  if (!auth.ok) return { error: auth.error };

  const parsed = curriculumSchema.safeParse(Object.fromEntries(formData));
  if (!parsed.success) return { error: firstIssueMessage(parsed.error) };

  const existing = await prisma.curriculum.findUnique({ where: { name: parsed.data.name } });
  if (existing) return { error: "A curriculum with this name already exists." };

  let curriculum;
  try {
    curriculum = await prisma.curriculum.create({ data: parsed.data });
  } catch (err) {
    if (isUniqueConstraintError(err)) return { error: "A curriculum with this name already exists." };
    throw err;
  }
  await recordAuditLog({
    adminId: auth.user.id,
    action: "CURRICULUM_CREATED",
    target: curriculum.name,
  });

  redirect(`/admin/curricula/${curriculum.id}`);
}

export async function updateCurriculumAction(
  _prevState: AdminActionState,
  formData: FormData,
): Promise<AdminActionState> {
  const auth = await requireAdminRole(CURRICULUM_ROLES);
  if (!auth.ok) return { error: auth.error };

  const parsed = updateCurriculumSchema.safeParse(Object.fromEntries(formData));
  if (!parsed.success) return { error: firstIssueMessage(parsed.error) };
  const { id, ...data } = parsed.data;

  const existing = await prisma.curriculum.findUnique({ where: { id } });
  if (!existing) return { error: "Curriculum not found." };

  const nameOwner = await prisma.curriculum.findUnique({ where: { name: data.name } });
  if (nameOwner && nameOwner.id !== id) {
    return { error: "A curriculum with this name already exists." };
  }

  await prisma.curriculum.update({ where: { id }, data });
  await recordAuditLog({
    adminId: auth.user.id,
    action: "CURRICULUM_UPDATED",
    target: data.name,
    details: { previousStatus: existing.status, newStatus: data.status },
  });

  redirect(`/admin/curricula/${id}`);
}

// docs/08_Admin_Panel.md §6 "Associate a course with a curriculum" — managed
// from the curriculum's own page (docs Phase 10 pre-coding report §3).
export async function addCurriculumCourseAction(
  _prevState: AdminActionState,
  formData: FormData,
): Promise<AdminActionState> {
  const auth = await requireAdminRole(CURRICULUM_ROLES);
  if (!auth.ok) return { error: auth.error };

  const parsed = addCurriculumCourseSchema.safeParse(Object.fromEntries(formData));
  if (!parsed.success) return { error: firstIssueMessage(parsed.error) };
  const { curriculumId, courseId, category, required } = parsed.data;

  const [curriculum, course] = await Promise.all([
    prisma.curriculum.findUnique({ where: { id: curriculumId } }),
    prisma.course.findUnique({ where: { id: courseId } }),
  ]);
  if (!curriculum) return { error: "Curriculum not found." };
  if (!course) return { error: "Course not found." };

  const existing = await prisma.curriculumCourse.findUnique({
    where: { curriculumId_courseId: { curriculumId, courseId } },
  });
  if (existing) return { error: "This course is already part of the curriculum." };

  try {
    await prisma.curriculumCourse.create({ data: { curriculumId, courseId, category, required } });
  } catch (err) {
    if (isUniqueConstraintError(err)) return { error: "This course is already part of the curriculum." };
    throw err;
  }
  await recordAuditLog({
    adminId: auth.user.id,
    action: "CURRICULUM_COURSE_ADDED",
    target: `${curriculum.name} / ${course.name}`,
  });

  return { success: `${course.name} added to ${curriculum.name}.` };
}

export async function updateCurriculumCourseAction(
  _prevState: AdminActionState,
  formData: FormData,
): Promise<AdminActionState> {
  const auth = await requireAdminRole(CURRICULUM_ROLES);
  if (!auth.ok) return { error: auth.error };

  const parsed = updateCurriculumCourseSchema.safeParse(Object.fromEntries(formData));
  if (!parsed.success) return { error: firstIssueMessage(parsed.error) };
  const { id, category, required } = parsed.data;

  const existing = await prisma.curriculumCourse.findUnique({
    where: { id },
    include: { curriculum: true, course: true },
  });
  if (!existing) return { error: "Curriculum-course link not found." };

  await prisma.curriculumCourse.update({ where: { id }, data: { category, required } });
  await recordAuditLog({
    adminId: auth.user.id,
    action: "CURRICULUM_COURSE_UPDATED",
    target: `${existing.curriculum.name} / ${existing.course.name}`,
  });

  return { success: "Curriculum course membership updated." };
}

export async function removeCurriculumCourseAction(
  _prevState: AdminActionState,
  formData: FormData,
): Promise<AdminActionState> {
  const auth = await requireAdminRole(CURRICULUM_ROLES);
  if (!auth.ok) return { error: auth.error };

  const parsed = removeCurriculumCourseSchema.safeParse(Object.fromEntries(formData));
  if (!parsed.success) return { error: firstIssueMessage(parsed.error) };

  const existing = await prisma.curriculumCourse.findUnique({
    where: { id: parsed.data.id },
    include: { curriculum: true, course: true },
  });
  if (!existing) return { error: "Curriculum-course link not found." };

  // docs Phase 10 prompt §15 — this only removes the course from the
  // curriculum's displayed membership; it does not touch any student's
  // StudentCourse/StudentCourseAttempt history (no FK from those to
  // CurriculumCourse), so it cannot corrupt historical records.
  await prisma.curriculumCourse.delete({ where: { id: parsed.data.id } });
  await recordAuditLog({
    adminId: auth.user.id,
    action: "CURRICULUM_COURSE_REMOVED",
    target: `${existing.curriculum.name} / ${existing.course.name}`,
  });

  return { success: `${existing.course.name} removed from ${existing.curriculum.name}.` };
}
