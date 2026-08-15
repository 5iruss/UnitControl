"use server";

import { redirect } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { requireAdminRole } from "@/lib/admin/authorization";
import { recordAuditLog } from "@/lib/admin/audit-log";
import { firstIssueMessage } from "@/lib/zod-utils";
import { courseSchema, courseStatusSchema, updateCourseSchema } from "./schemas";

const COURSE_ROLES = ["SUPER_ADMIN", "ACADEMIC_GROUP_MANAGER"] as const;

export interface AdminActionState {
  error?: string;
  success?: string;
}

function courseTarget(courseCode: string, name: string): string {
  return `${courseCode} — ${name}`;
}

// docs/08_Admin_Panel.md §6 — create a course record. credits/isPractical
// stay null unless the admin explicitly enters a value (docs Phase 10
// prompt §7 — never auto-assign).
export async function createCourseAction(
  _prevState: AdminActionState,
  formData: FormData,
): Promise<AdminActionState> {
  const auth = await requireAdminRole(COURSE_ROLES);
  if (!auth.ok) return { error: auth.error };

  const parsed = courseSchema.safeParse(Object.fromEntries(formData));
  if (!parsed.success) return { error: firstIssueMessage(parsed.error) };

  const course = await prisma.course.create({ data: parsed.data });
  await recordAuditLog({
    adminId: auth.user.id,
    action: "COURSE_CREATED",
    target: courseTarget(course.courseCode, course.name),
  });

  redirect(`/admin/courses/${course.id}`);
}

export async function updateCourseAction(
  _prevState: AdminActionState,
  formData: FormData,
): Promise<AdminActionState> {
  const auth = await requireAdminRole(COURSE_ROLES);
  if (!auth.ok) return { error: auth.error };

  const parsed = updateCourseSchema.safeParse(Object.fromEntries(formData));
  if (!parsed.success) return { error: firstIssueMessage(parsed.error) };
  const { id, ...data } = parsed.data;

  const existing = await prisma.course.findUnique({ where: { id } });
  if (!existing) return { error: "Course not found." };

  await prisma.course.update({ where: { id }, data });
  await recordAuditLog({
    adminId: auth.user.id,
    action: "COURSE_UPDATED",
    target: courseTarget(data.courseCode, data.name),
  });

  redirect(`/admin/courses/${id}`);
}

// docs/08_Admin_Panel.md §6 "Disable/archive a course"; §14 "Archive Instead
// of Delete." There is deliberately no delete action for courses — see
// docs Phase 10 pre-coding report item 4/9.
export async function setCourseStatusAction(
  _prevState: AdminActionState,
  formData: FormData,
): Promise<AdminActionState> {
  const auth = await requireAdminRole(COURSE_ROLES);
  if (!auth.ok) return { error: auth.error };

  const parsed = courseStatusSchema.safeParse(Object.fromEntries(formData));
  if (!parsed.success) return { error: firstIssueMessage(parsed.error) };
  const { id, status } = parsed.data;

  const existing = await prisma.course.findUnique({ where: { id } });
  if (!existing) return { error: "Course not found." };

  await prisma.course.update({ where: { id }, data: { status } });
  await recordAuditLog({
    adminId: auth.user.id,
    action: "COURSE_STATUS_CHANGED",
    target: courseTarget(existing.courseCode, existing.name),
    details: { previousStatus: existing.status, newStatus: status },
  });

  return { success: `${existing.name} status set to ${status}.` };
}
