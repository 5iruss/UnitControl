import Link from "next/link";
import { requireAdminPageAccess } from "@/lib/admin/authorization";
import { listAdmins } from "@/lib/admin/admins/queries";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { ROLE_LABEL } from "@/lib/admin/role-label";

// docs/08_Admin_Panel.md §2, §16 — Super Admin only.
export default async function AdminsPage() {
  await requireAdminPageAccess(["SUPER_ADMIN"]);
  const admins = await listAdmins();

  return (
    <main className="mx-auto flex max-w-3xl flex-col gap-4 p-4">
      <div className="flex items-center justify-between">
        <h1 className="text-xl font-semibold">Administrators</h1>
        <Button render={<Link href="/admin/admins/new">Create administrator</Link>} />
      </div>
      <Card>
        <CardHeader>
          <CardTitle>{admins.length} administrator{admins.length === 1 ? "" : "s"}</CardTitle>
        </CardHeader>
        <CardContent>
          {admins.length === 0 ? (
            <p className="text-sm text-muted-foreground">No administrators yet.</p>
          ) : (
            <ul className="flex flex-col gap-2 text-sm">
              {admins.map((admin) => (
                <li key={admin.id} className="flex flex-wrap items-baseline justify-between gap-2 border-b pb-1 last:border-b-0">
                  <span>
                    {admin.firstName} {admin.lastName}{" "}
                    <span className="font-mono text-xs text-muted-foreground" dir="ltr">
                      {admin.studentNumber}
                    </span>
                  </span>
                  <span className="text-xs text-muted-foreground">{ROLE_LABEL[admin.role]}</span>
                </li>
              ))}
            </ul>
          )}
        </CardContent>
      </Card>
    </main>
  );
}
