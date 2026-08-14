"use server";

import { redirect } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { getCurrentUser } from "@/lib/auth/session";
import { resolveCurriculum, requiresCurriculumReset } from "@/domain/academic-profile";
import { profileSchema } from "@/lib/academic-profile/schemas";
import { getCurricula, getStudentProfile } from "@/lib/academic-profile/queries";

export interface ProfileActionState {
  error?: string;
  success?: boolean;
  /// Set when a curriculum-changing update needs explicit confirmation
  /// before anything is persisted (docs/03_UX_UI_Specification.md §20).
  pendingReset?: {
    curriculumName: string;
  };
}

function firstIssueMessage(error: { issues: { message: string }[] }): string {
  return error.issues[0]?.message ?? "Invalid input.";
}

// docs/02_User_Flow.md §4 — first-time academic profile creation.
export async function createProfileAction(
  _prevState: ProfileActionState,
  formData: FormData,
): Promise<ProfileActionState> {
  const user = await getCurrentUser();
  if (!user || user.role !== "STUDENT") redirect("/login");

  const existing = await getStudentProfile(user.id);
  if (existing) redirect("/profile");

  const parsed = profileSchema.safeParse(Object.fromEntries(formData));
  if (!parsed.success) {
    return { error: firstIssueMessage(parsed.error) };
  }
  const { entryYear, major, orientation, studyType } = parsed.data;

  const curricula = await getCurricula();
  const curriculum = resolveCurriculum(curricula, { entryYear, major, orientation });
  if (!curriculum) {
    return {
      error:
        "No curriculum matches the provided entry year, major, and orientation. Please check your selections.",
    };
  }

  await prisma.studentProfile.create({
    data: {
      userId: user.id,
      entryYear,
      major,
      orientation,
      studyType,
      curriculumId: curriculum.id,
    },
  });

  redirect("/dashboard");
}

// docs/02_User_Flow.md §13, docs/03_UX_UI_Specification.md §20 — editing the
// profile; a curriculum-changing update requires explicit confirmation and
// resets academic course-state data.
export async function updateProfileAction(
  _prevState: ProfileActionState,
  formData: FormData,
): Promise<ProfileActionState> {
  const user = await getCurrentUser();
  if (!user || user.role !== "STUDENT") redirect("/login");

  const profile = await getStudentProfile(user.id);
  if (!profile) redirect("/profile/setup");

  const parsed = profileSchema.safeParse(Object.fromEntries(formData));
  if (!parsed.success) {
    return { error: firstIssueMessage(parsed.error) };
  }
  const { entryYear, major, orientation, studyType } = parsed.data;

  const curricula = await getCurricula();
  const curriculum = resolveCurriculum(curricula, { entryYear, major, orientation });
  if (!curriculum) {
    return {
      error:
        "No curriculum matches the provided entry year, major, and orientation. Please check your selections.",
    };
  }

  const willReset = requiresCurriculumReset(profile.curriculumId, curriculum.id);

  if (willReset) {
    const confirmed = formData.get("confirmReset") === "true";
    if (!confirmed) {
      return { pendingReset: { curriculumName: curriculum.name } };
    }

    await prisma.$transaction([
      prisma.studentCourse.deleteMany({ where: { studentId: profile.id } }),
      prisma.studentCourseAttempt.deleteMany({ where: { studentId: profile.id } }),
      prisma.studentSemester.deleteMany({ where: { studentId: profile.id } }),
      prisma.studentProfile.update({
        where: { id: profile.id },
        data: { entryYear, major, orientation, studyType, curriculumId: curriculum.id },
      }),
    ]);

    return { success: true };
  }

  await prisma.studentProfile.update({
    where: { id: profile.id },
    data: { entryYear, major, orientation, studyType, curriculumId: curriculum.id },
  });

  return { success: true };
}
