"use server";

import { redirect } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { hashPassword, verifyPassword } from "@/lib/auth/password";
import { createSession, destroySession, getCurrentUser } from "@/lib/auth/session";
import {
  loginSchema,
  registerSchema,
  supportResetPasswordSchema,
} from "@/lib/auth/schemas";
import type { Role } from "@/generated/prisma/client";

export interface ActionState {
  error?: string;
  success?: string;
}

function firstIssueMessage(error: { issues: { message: string }[] }): string {
  return error.issues[0]?.message ?? "Invalid input.";
}

// docs/02_User_Flow.md §3 — student self-registration.
export async function registerAction(
  _prevState: ActionState,
  formData: FormData,
): Promise<ActionState> {
  const parsed = registerSchema.safeParse(Object.fromEntries(formData));
  if (!parsed.success) {
    return { error: firstIssueMessage(parsed.error) };
  }
  const { studentNumber, password, firstName, lastName, phoneNumber } = parsed.data;

  const existing = await prisma.user.findFirst({
    where: { OR: [{ studentNumber }, { phoneNumber }] },
  });
  if (existing) {
    return {
      error:
        existing.studentNumber === studentNumber
          ? "An account with this student number already exists."
          : "An account with this phone number already exists.",
    };
  }

  const passwordHash = await hashPassword(password);
  const user = await prisma.user.create({
    data: {
      studentNumber,
      phoneNumber,
      passwordHash,
      firstName,
      lastName,
      role: "STUDENT",
    },
  });

  await createSession(user.id);
  // docs/02_User_Flow.md §2 — Registration -> Academic Profile next.
  redirect("/profile/setup");
}

async function authenticate(identifier: string, password: string) {
  const user = await prisma.user.findFirst({
    where: { OR: [{ studentNumber: identifier }, { phoneNumber: identifier }] },
  });
  if (!user) return null;

  const valid = await verifyPassword(password, user.passwordHash);
  if (!valid) return null;

  return user;
}

// docs/01_Product_Overview.md §11 / docs/02_User_Flow.md §14 — student login
// by student number or phone number.
export async function studentLoginAction(
  _prevState: ActionState,
  formData: FormData,
): Promise<ActionState> {
  const parsed = loginSchema.safeParse(Object.fromEntries(formData));
  if (!parsed.success) {
    return { error: firstIssueMessage(parsed.error) };
  }

  const user = await authenticate(parsed.data.identifier, parsed.data.password);
  if (!user) {
    return { error: "Incorrect credentials." };
  }
  if (user.role !== "STUDENT") {
    return { error: "This is not a student account. Use the administrative login." };
  }

  await createSession(user.id);
  redirect("/dashboard");
}

const ADMIN_ROLES: Role[] = ["SUPER_ADMIN", "ACADEMIC_GROUP_MANAGER", "SUPPORT"];

// docs/08_Admin_Panel.md §3 — administrators authenticate through a separate
// administrative login. Same credential check as student login; the docs
// do not describe a different verification mechanism (see Phase 2 plan).
export async function adminLoginAction(
  _prevState: ActionState,
  formData: FormData,
): Promise<ActionState> {
  const parsed = loginSchema.safeParse(Object.fromEntries(formData));
  if (!parsed.success) {
    return { error: firstIssueMessage(parsed.error) };
  }

  const user = await authenticate(parsed.data.identifier, parsed.data.password);
  if (!user) {
    return { error: "Incorrect credentials." };
  }
  if (!ADMIN_ROLES.includes(user.role)) {
    return { error: "This account does not have administrative access." };
  }

  await createSession(user.id);
  redirect("/admin");
}

export async function logoutAction(redirectTo: string): Promise<void> {
  await destroySession();
  redirect(redirectTo);
}

// docs/02_User_Flow.md §15, docs/08_Admin_Panel.md §11, §15 — support staff
// reset a student's password after locating their account; the action is
// audit-logged.
export async function supportResetPasswordAction(
  _prevState: ActionState,
  formData: FormData,
): Promise<ActionState> {
  const actor = await getCurrentUser();
  if (!actor || !["SUPER_ADMIN", "SUPPORT"].includes(actor.role)) {
    return { error: "You are not authorized to perform this action." };
  }

  const parsed = supportResetPasswordSchema.safeParse(Object.fromEntries(formData));
  if (!parsed.success) {
    return { error: firstIssueMessage(parsed.error) };
  }

  const target = await prisma.user.findFirst({
    where: {
      OR: [
        { studentNumber: parsed.data.identifier },
        { phoneNumber: parsed.data.identifier },
      ],
    },
  });
  if (!target) {
    return { error: "No account found for that student number or phone number." };
  }

  const passwordHash = await hashPassword(parsed.data.newPassword);
  await prisma.$transaction([
    prisma.user.update({ where: { id: target.id }, data: { passwordHash } }),
    prisma.auditLog.create({
      data: {
        adminId: actor.id,
        action: "PASSWORD_RESET",
        target: target.studentNumber,
      },
    }),
  ]);

  return { success: `Password reset for ${target.firstName} ${target.lastName}.` };
}
