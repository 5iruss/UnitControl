"use server";

import { redirect } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { hashPassword } from "@/lib/auth/password";
import { requireAdminRole } from "@/lib/admin/authorization";
import { recordAuditLog } from "@/lib/admin/audit-log";
import { firstIssueMessage } from "@/lib/zod-utils";
import { createAdminSchema } from "./schemas";

// docs/08_Admin_Panel.md §2 "Super Admin ... Can manage: Administrators" /
// §16 "Manage admins: Super Admin only."
const ADMIN_MANAGEMENT_ROLES = ["SUPER_ADMIN"] as const;

export interface AdminActionState {
  error?: string;
  success?: string;
}

export async function createAdminAction(
  _prevState: AdminActionState,
  formData: FormData,
): Promise<AdminActionState> {
  const auth = await requireAdminRole(ADMIN_MANAGEMENT_ROLES);
  if (!auth.ok) return { error: auth.error };

  const parsed = createAdminSchema.safeParse(Object.fromEntries(formData));
  if (!parsed.success) return { error: firstIssueMessage(parsed.error) };
  const { studentNumber, phoneNumber, password, firstName, lastName, role } = parsed.data;

  const existing = await prisma.user.findFirst({
    where: {
      OR: [{ studentNumber }, ...(phoneNumber ? [{ phoneNumber }] : [])],
    },
  });
  if (existing) {
    return {
      error:
        existing.studentNumber === studentNumber
          ? "An account with this identifier already exists."
          : "An account with this phone number already exists.",
    };
  }

  const passwordHash = await hashPassword(password);
  const admin = await prisma.user.create({
    data: { studentNumber, phoneNumber, passwordHash, firstName, lastName, role },
  });

  // docs/08_Admin_Panel.md §15 "Administrative permission change" — never
  // log the password/hash itself (docs §11, §15).
  await recordAuditLog({
    adminId: auth.user.id,
    action: "ADMIN_CREATED",
    target: admin.studentNumber,
    details: { role },
  });

  redirect("/admin/admins");
}
