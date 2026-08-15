import Link from "next/link";
import { requireAdminPageAccess } from "@/lib/admin/authorization";
import { listCurricula } from "@/lib/admin/curricula/queries";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { buttonVariants } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { STATUS_LABEL } from "@/app/admin/status-label";

const CURRICULUM_ROLES = ["SUPER_ADMIN", "ACADEMIC_GROUP_MANAGER"] as const;

export default async function CurriculaPage() {
  await requireAdminPageAccess(CURRICULUM_ROLES);
  const curricula = await listCurricula();

  return (
    <main className="mx-auto flex max-w-3xl flex-col gap-4 p-4">
      <div className="flex items-center justify-between">
        <h1 className="text-xl font-semibold">Curricula</h1>
        <Link href="/admin/curricula/new" className={buttonVariants()}>
          Create curriculum
        </Link>
      </div>
      <Card>
        <CardHeader>
          <CardTitle>{curricula.length} {curricula.length === 1 ? "curriculum" : "curricula"}</CardTitle>
        </CardHeader>
        <CardContent>
          {curricula.length === 0 ? (
            <p className="text-sm text-muted-foreground">No curricula yet.</p>
          ) : (
            <ul className="flex flex-col gap-2 text-sm">
              {curricula.map((curriculum) => (
                <li key={curriculum.id} className="flex flex-wrap items-center justify-between gap-2 border-b pb-1 last:border-b-0">
                  <span>
                    <Link href={`/admin/curricula/${curriculum.id}`} className="underline">
                      {curriculum.name}
                    </Link>{" "}
                    <span className="text-xs text-muted-foreground">
                      ({curriculum.major} — {curriculum.orientation})
                    </span>
                  </span>
                  {curriculum.status !== "ACTIVE" && (
                    <Badge variant="outline">{STATUS_LABEL[curriculum.status] ?? curriculum.status}</Badge>
                  )}
                </li>
              ))}
            </ul>
          )}
        </CardContent>
      </Card>
    </main>
  );
}
