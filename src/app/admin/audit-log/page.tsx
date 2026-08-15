import { requireAdminPageAccess } from "@/lib/admin/authorization";
import { listAuditLog } from "@/lib/admin/audit-log";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

const ALL_ADMIN_ROLES = ["SUPER_ADMIN", "ACADEMIC_GROUP_MANAGER", "SUPPORT"] as const;

// docs/08_Admin_Panel.md §15, §16 — role-scoped audit activity (see
// lib/admin/audit-log.ts's visibleAuditActionsForRole for the scoping rule).
export default async function AuditLogPage() {
  const user = await requireAdminPageAccess(ALL_ADMIN_ROLES);
  const entries = await listAuditLog(user.role, 100);

  return (
    <main className="mx-auto flex max-w-4xl flex-col gap-4 p-4">
      <h1 className="text-xl font-semibold">Activity log</h1>
      <Card>
        <CardHeader>
          <CardTitle>
            {user.role === "SUPER_ADMIN" ? "All administrative activity" : "Activity within your role"}
          </CardTitle>
        </CardHeader>
        <CardContent>
          {entries.length === 0 ? (
            <p className="text-sm text-muted-foreground">No recorded activity yet.</p>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b text-right text-xs text-muted-foreground">
                    <th scope="col" className="py-1 pe-2 font-normal">Action</th>
                    <th scope="col" className="py-1 pe-2 font-normal">Target</th>
                    <th scope="col" className="py-1 pe-2 font-normal">Admin</th>
                    <th scope="col" className="py-1 font-normal">Timestamp</th>
                  </tr>
                </thead>
                <tbody>
                  {entries.map((entry) => (
                    <tr key={entry.id} className="border-b last:border-b-0">
                      <td className="py-1.5 pe-2 font-medium">{entry.action}</td>
                      <td className="py-1.5 pe-2">{entry.target}</td>
                      <td className="py-1.5 pe-2 text-muted-foreground">
                        {entry.admin.firstName} {entry.admin.lastName}
                      </td>
                      <td className="py-1.5 text-muted-foreground" dir="ltr">
                        {entry.createdAt.toLocaleString("en-US")}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </CardContent>
      </Card>
    </main>
  );
}
