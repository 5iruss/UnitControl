import Link from "next/link";
import { requireAdminPageAccess } from "@/lib/admin/authorization";
import { getDashboardStats } from "@/lib/admin/dashboard/queries";
import { listAuditLog } from "@/lib/admin/audit-log";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

const ALL_ADMIN_ROLES = ["SUPER_ADMIN", "ACADEMIC_GROUP_MANAGER", "SUPPORT"] as const;

// docs/08_Admin_Panel.md §4 — a lightweight system overview, plus links into
// the management areas the current role can access.
export default async function AdminDashboardPage() {
  const user = await requireAdminPageAccess(ALL_ADMIN_ROLES);
  const [stats, recentActivity] = await Promise.all([
    getDashboardStats(),
    listAuditLog(user.role, 10),
  ]);

  return (
    <main className="mx-auto flex max-w-4xl flex-col gap-4 p-4">
      <h1 className="text-xl font-semibold">
        Welcome, {user.firstName} {user.lastName}.
      </h1>

      <div className="grid grid-cols-1 gap-3 sm:grid-cols-3">
        <Card>
          <CardHeader>
            <CardTitle className="text-sm text-muted-foreground">Total students</CardTitle>
          </CardHeader>
          <CardContent className="text-2xl font-semibold">{stats.totalStudents}</CardContent>
        </Card>
        <Card>
          <CardHeader>
            <CardTitle className="text-sm text-muted-foreground">Curricula</CardTitle>
          </CardHeader>
          <CardContent className="text-2xl font-semibold">{stats.curriculumCount}</CardContent>
        </Card>
        <Card>
          <CardHeader>
            <CardTitle className="text-sm text-muted-foreground">Courses</CardTitle>
          </CardHeader>
          <CardContent className="text-2xl font-semibold">{stats.courseCount}</CardContent>
        </Card>
      </div>

      {(user.role === "SUPER_ADMIN" || user.role === "ACADEMIC_GROUP_MANAGER") && (
        <Card>
          <CardHeader>
            <CardTitle>Academic data</CardTitle>
          </CardHeader>
          <CardContent className="flex flex-wrap gap-4 text-sm">
            <Link href="/admin/curricula" className="underline">
              Manage curricula
            </Link>
            <Link href="/admin/courses" className="underline">
              Manage courses
            </Link>
          </CardContent>
        </Card>
      )}

      <Card>
        <CardHeader>
          <CardTitle>Student support</CardTitle>
        </CardHeader>
        <CardContent className="flex flex-wrap gap-4 text-sm">
          <Link href="/admin/students" className="underline">
            Search students
          </Link>
          {(user.role === "SUPER_ADMIN" || user.role === "SUPPORT") && (
            <Link href="/admin/support/reset-password" className="underline">
              Reset a student&apos;s password
            </Link>
          )}
        </CardContent>
      </Card>

      {user.role === "SUPER_ADMIN" && (
        <Card>
          <CardHeader>
            <CardTitle>Administration</CardTitle>
          </CardHeader>
          <CardContent className="flex flex-wrap gap-4 text-sm">
            <Link href="/admin/admins" className="underline">
              Manage administrators
            </Link>
          </CardContent>
        </Card>
      )}

      <Card>
        <CardHeader className="flex flex-row items-center justify-between">
          <CardTitle>Recent activity</CardTitle>
          <Link href="/admin/audit-log" className="text-sm underline">
            View all
          </Link>
        </CardHeader>
        <CardContent>
          {recentActivity.length === 0 ? (
            <p className="text-sm text-muted-foreground">No recorded activity yet.</p>
          ) : (
            <ul className="flex flex-col gap-2 text-sm">
              {recentActivity.map((entry) => (
                <li key={entry.id} className="flex flex-wrap items-baseline justify-between gap-2 border-b pb-1 last:border-b-0">
                  <span>
                    <span className="font-medium">{entry.action}</span> — {entry.target}
                  </span>
                  <span className="text-xs text-muted-foreground">
                    {entry.admin.firstName} {entry.admin.lastName} · {entry.createdAt.toLocaleString("en-US")}
                  </span>
                </li>
              ))}
            </ul>
          )}
        </CardContent>
      </Card>
    </main>
  );
}
