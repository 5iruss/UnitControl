import { requireAdminPageAccess } from "@/lib/admin/authorization";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { AdminCreateForm } from "./admin-create-form";

export default async function NewAdminPage() {
  await requireAdminPageAccess(["SUPER_ADMIN"]);

  return (
    <main className="mx-auto flex max-w-sm flex-col gap-4 p-4">
      <Card>
        <CardHeader>
          <CardTitle>Create administrator</CardTitle>
        </CardHeader>
        <CardContent>
          <AdminCreateForm />
        </CardContent>
      </Card>
    </main>
  );
}
