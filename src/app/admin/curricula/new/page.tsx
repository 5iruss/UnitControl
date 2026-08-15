import { requireAdminPageAccess } from "@/lib/admin/authorization";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { CurriculumCreateForm } from "./curriculum-create-form";

export default async function NewCurriculumPage() {
  await requireAdminPageAccess(["SUPER_ADMIN", "ACADEMIC_GROUP_MANAGER"]);

  return (
    <main className="mx-auto flex max-w-sm flex-col gap-4 p-4">
      <Card>
        <CardHeader>
          <CardTitle>Create curriculum</CardTitle>
        </CardHeader>
        <CardContent>
          <CurriculumCreateForm />
        </CardContent>
      </Card>
    </main>
  );
}
