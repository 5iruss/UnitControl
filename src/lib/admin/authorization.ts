import "server-only";
import { redirect } from "next/navigation";
import { getCurrentUser } from "@/lib/auth/session";
import type { Role, User } from "@/generated/prisma/client";

// docs/08_Admin_Panel.md §16 permission table; docs Phase 10 prompt §3 —
// every protected Admin Server Action must verify session + role + operation
// permission, never client-side only. Used by Server Actions, which must
// return an error to the client rather than throwing a redirect.
export type AdminAuthResult = { ok: true; user: User } | { ok: false; error: string };

const UNAUTHORIZED: AdminAuthResult = {
  ok: false,
  error: "You are not authorized to perform this action.",
};

export async function requireAdminRole(allowedRoles: readonly Role[]): Promise<AdminAuthResult> {
  const user = await getCurrentUser();
  if (!user || user.role === "STUDENT" || !allowedRoles.includes(user.role)) {
    return UNAUTHORIZED;
  }
  return { ok: true, user };
}

// docs Phase 10 prompt §4 — unauthenticated -> /admin/login; authenticated
// but wrong role -> denied. Redirecting to /admin (rather than /admin/login,
// which would be misleading for an already-authenticated admin) since the
// dashboard only links to areas the admin's own role can access.
export async function requireAdminPageAccess(allowedRoles: readonly Role[]): Promise<User> {
  const user = await getCurrentUser();
  if (!user || user.role === "STUDENT") redirect("/admin/login");
  if (!allowedRoles.includes(user.role)) redirect("/admin");
  return user;
}
