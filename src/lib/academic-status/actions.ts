"use server";

import { redirect } from "next/navigation";
import { refresh } from "next/cache";
import { prisma } from "@/lib/prisma";
import { getCurrentUser } from "@/lib/auth/session";
import { getStudentProfile } from "@/lib/academic-profile/queries";
import {
  courseStatusFromAttemptResult,
  isCourseInCurriculum,
  parseTermCode,
} from "@/domain/academic-status";
import { courseAttemptSchema, courseStatusSchema, semesterSchema } from "@/lib/academic-status/schemas";
import { getCurriculumCourseIds } from "@/lib/academic-status/queries";
import { buildAcademicState } from "@/lib/academic-rules/queries";
import { evaluateCourseEligibility } from "@/domain/academic";

export interface AcademicStatusActionState {
  error?: string;
  success?: string;
  /// docs/04_Academic_Rules_Engine.md §20 — non-blocking Rules Engine
  /// warnings for the change just made (set only when relevant, e.g. a
  /// PLANNED course whose prerequisite was previously failed).
  warnings?: string[];
}

function firstIssueMessage(error: { issues: { message: string }[] }): string {
  return error.issues[0]?.message ?? "Invalid input.";
}

async function requireStudentProfile() {
  const user = await getCurrentUser();
  if (!user || user.role !== "STUDENT") redirect("/login");
  const profile = await getStudentProfile(user.id);
  if (!profile) redirect("/profile/setup");
  return profile;
}

async function upsertAcademicTerm(termCode: string) {
  const parsed = parseTermCode(termCode);
  if (!parsed) throw new Error(`Invalid term code passed validation: ${termCode}`);
  return prisma.academicTerm.upsert({
    where: { termCode: parsed.termCode },
    update: {},
    create: {
      termCode: parsed.termCode,
      academicYear: parsed.academicYear,
      termType: parsed.termType,
    },
  });
}

// docs/02_User_Flow.md §7 — Simple Mode / ongoing status management. No
// status-transition restriction is documented (Phase 5 plan report,
// ambiguity #3): any status may be set directly.
export async function setCourseStatusAction(
  _prevState: AcademicStatusActionState,
  formData: FormData,
): Promise<AcademicStatusActionState> {
  const profile = await requireStudentProfile();

  const parsed = courseStatusSchema.safeParse(Object.fromEntries(formData));
  if (!parsed.success) {
    return { error: firstIssueMessage(parsed.error) };
  }
  const { courseId, status, plannedTermCode } = parsed.data;

  const curriculumCourseIds = await getCurriculumCourseIds(profile.curriculumId);
  if (!isCourseInCurriculum(courseId, curriculumCourseIds)) {
    return { error: "این درس در برنامه تحصیلی شما وجود ندارد." };
  }

  let academicTermId: string | null = null;
  let warnings: string[] | undefined;
  // docs/05_Curriculum_Data_Model.md §14.1 — PLANNED requires an intended term.
  if (status === "PLANNED") {
    if (!plannedTermCode) {
      return { error: "برای درس برنامه‌ریزی‌شده، ترم مدنظر را انتخاب کنید." };
    }
    const parsedTerm = parseTermCode(plannedTermCode);
    if (!parsedTerm) {
      return { error: "کد ترم معتبر وارد کنید (مثلاً 4051)." };
    }

    // docs/02_User_Flow.md §8, §11 — planning a course requires Rules Engine
    // validation before it's added; invalid -> show the reason, don't add.
    // Scoped to PLANNED only: other status transitions keep Phase 5's
    // unrestricted "any status may be set directly" behavior (history
    // correction, not new planning).
    const academicState = await buildAcademicState(profile.id, profile.curriculumId);
    const eligibility = evaluateCourseEligibility(academicState, courseId);
    if (!eligibility.allowed) {
      return { error: eligibility.reasons.join(" ") };
    }
    if (eligibility.warnings.length > 0) warnings = eligibility.warnings;

    const term = await upsertAcademicTerm(plannedTermCode);
    academicTermId = term.id;
  }

  await prisma.studentCourse.upsert({
    where: { studentId_courseId: { studentId: profile.id, courseId } },
    update: { status, academicTermId },
    create: { studentId: profile.id, courseId, status, academicTermId },
  });

  // No refresh() here: this row already reflects its own status locally
  // (CourseStatusRow's controlled Select), and unlike Advanced Mode it never
  // adds new elements to the page that only a fresh server render can reveal.
  return { success: "وضعیت درس به‌روزرسانی شد.", warnings };
}

// docs/02_User_Flow.md §12 — Advanced Mode semester GPA entry.
export async function saveSemesterAction(
  _prevState: AcademicStatusActionState,
  formData: FormData,
): Promise<AcademicStatusActionState> {
  const profile = await requireStudentProfile();

  const parsed = semesterSchema.safeParse(Object.fromEntries(formData));
  if (!parsed.success) {
    return { error: firstIssueMessage(parsed.error) };
  }

  const term = await upsertAcademicTerm(parsed.data.termCode);

  await prisma.studentSemester.upsert({
    where: { studentId_academicTermId: { studentId: profile.id, academicTermId: term.id } },
    update: { semesterGpa: parsed.data.semesterGpa },
    create: {
      studentId: profile.id,
      academicTermId: term.id,
      semesterGpa: parsed.data.semesterGpa,
    },
  });

  refresh();
  return { success: `ترم ${term.termCode} ذخیره شد.` };
}

// docs/02_User_Flow.md §5 — Advanced Mode: mark a course's result for a
// specific term. Records both the persistent attempt (history) and updates
// current status to match (Phase 5 plan report, ambiguity #4).
export async function recordCourseAttemptAction(
  _prevState: AcademicStatusActionState,
  formData: FormData,
): Promise<AcademicStatusActionState> {
  const profile = await requireStudentProfile();

  const parsed = courseAttemptSchema.safeParse(Object.fromEntries(formData));
  if (!parsed.success) {
    return { error: firstIssueMessage(parsed.error) };
  }
  const { courseId, result } = parsed.data;

  const curriculumCourseIds = await getCurriculumCourseIds(profile.curriculumId);
  if (!isCourseInCurriculum(courseId, curriculumCourseIds)) {
    return { error: "این درس در برنامه تحصیلی شما وجود ندارد." };
  }

  const term = await upsertAcademicTerm(parsed.data.termCode);
  const status = courseStatusFromAttemptResult(result);

  await prisma.$transaction([
    prisma.studentCourseAttempt.upsert({
      where: {
        studentId_courseId_academicTermId: {
          studentId: profile.id,
          courseId,
          academicTermId: term.id,
        },
      },
      update: { result },
      create: { studentId: profile.id, courseId, academicTermId: term.id, result },
    }),
    prisma.studentCourse.upsert({
      where: { studentId_courseId: { studentId: profile.id, courseId } },
      update: { status, academicTermId: term.id },
      create: { studentId: profile.id, courseId, status, academicTermId: term.id },
    }),
  ]);

  refresh();
  return { success: "نتیجه درس ثبت شد." };
}

// docs/02_User_Flow.md §5 — "Enter Dashboard" step ending both Simple and
// Advanced setup.
export async function finishAcademicSetupAction(): Promise<void> {
  const profile = await requireStudentProfile();

  await prisma.studentProfile.update({
    where: { id: profile.id },
    data: { academicSetupCompletedAt: new Date() },
  });

  redirect("/dashboard");
}
