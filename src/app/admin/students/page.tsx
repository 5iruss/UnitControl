import Link from "next/link";
import { requireAdminPageAccess } from "@/lib/admin/authorization";
import { searchStudents } from "@/lib/admin/students/queries";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";

const SEARCH_ROLES = ["SUPER_ADMIN", "ACADEMIC_GROUP_MANAGER", "SUPPORT"] as const;

// docs/08_Admin_Panel.md §10 — search by student number, phone number, or
// name. Plain GET form: no client JS required for a simple text search.
export default async function AdminStudentsPage(props: PageProps<"/admin/students">) {
  await requireAdminPageAccess(SEARCH_ROLES);
  const searchParams = await props.searchParams;
  const q = typeof searchParams.q === "string" ? searchParams.q : undefined;
  const results = await searchStudents(q);

  return (
    <main className="mx-auto flex max-w-2xl flex-col gap-4 p-4">
      <h1 className="text-xl font-semibold">Student search</h1>
      <form action="/admin/students" method="GET" className="flex gap-2">
        <Input
          name="q"
          defaultValue={q ?? ""}
          placeholder="Student number, phone number, or name"
          aria-label="Search students"
          className="flex-1"
        />
        <Button type="submit">Search</Button>
      </form>

      <Card>
        <CardHeader>
          <CardTitle>
            {q ? `${results.length} result${results.length === 1 ? "" : "s"}` : "Enter a search term"}
          </CardTitle>
        </CardHeader>
        <CardContent>
          {q && results.length === 0 ? (
            <p className="text-sm text-muted-foreground">No students found.</p>
          ) : (
            <ul className="flex flex-col gap-2 text-sm">
              {results.map((student) => (
                <li key={student.id} className="border-b pb-1 last:border-b-0">
                  <Link href={`/admin/students/${student.id}`} className="underline">
                    {student.firstName} {student.lastName}
                  </Link>{" "}
                  <span className="font-mono text-xs text-muted-foreground" dir="ltr">
                    {student.studentNumber}
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
