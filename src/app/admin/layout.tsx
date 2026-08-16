import Link from "next/link";
import { getCurrentUser } from "@/lib/auth/session";
import { LogoutButton } from "@/components/logout-button";
import { ROLE_LABEL } from "@/lib/admin/role-label";

// docs/08_Admin_Panel.md §16, §18 — role-specific nav visibility (UX layer
// only; every linked route re-checks authorization server-side — docs
// Phase 10 prompt §18). Renders nothing extra on /admin/login, since
// getCurrentUser() is null there for an unauthenticated visitor.
export default async function AdminLayout({ children }: LayoutProps<"/admin">) {
  const user = await getCurrentUser();
  const isAdmin = !!user && user.role !== "STUDENT";

  return (
    <div className="flex min-h-screen flex-col">
      {isAdmin && (
        <a
          href="#main"
          className="sr-only focus:not-sr-only focus:absolute focus:top-2 focus:left-2 focus:z-50 focus:rounded-md focus:bg-background focus:px-3 focus:py-2 focus:text-sm focus:underline focus-visible:ring-3 focus-visible:ring-ring/50"
        >
          Skip to content
        </a>
      )}
      {isAdmin && (
        <header className="flex flex-wrap items-center justify-between gap-3 border-b bg-muted/30 px-4 py-3">
          <nav className="flex flex-wrap items-center gap-4 text-sm">
            <Link href="/admin" className="font-medium underline">
              Dashboard
            </Link>
            {(user.role === "SUPER_ADMIN" || user.role === "ACADEMIC_GROUP_MANAGER") && (
              <>
                <Link href="/admin/curricula" className="underline">
                  Curricula
                </Link>
                <Link href="/admin/courses" className="underline">
                  Courses
                </Link>
              </>
            )}
            <Link href="/admin/students" className="underline">
              Students
            </Link>
            {user.role === "SUPER_ADMIN" && (
              <Link href="/admin/admins" className="underline">
                Administrators
              </Link>
            )}
            <Link href="/admin/audit-log" className="underline">
              Activity log
            </Link>
          </nav>
          <div className="flex items-center gap-3 text-sm text-muted-foreground">
            <span>
              {user.firstName} {user.lastName} ({ROLE_LABEL[user.role]})
            </span>
            <LogoutButton redirectTo="/admin/login" label="Log out" />
          </div>
        </header>
      )}
      {/* Individual admin pages each render their own <main>; this wrapper is
          only the skip-link target, not a second landmark. */}
      <div id="main" className="flex-1">
        {children}
      </div>
    </div>
  );
}
