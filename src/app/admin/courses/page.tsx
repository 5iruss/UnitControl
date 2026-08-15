import Link from "next/link";
import { requireAdminPageAccess } from "@/lib/admin/authorization";
import { searchCourses } from "@/lib/admin/courses/queries";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";

const COURSE_ROLES = ["SUPER_ADMIN", "ACADEMIC_GROUP_MANAGER"] as const;

// docs/08_Admin_Panel.md §6; docs Phase 10 prompt §16 — server-side search
// rather than loading the entire course table.
export default async function AdminCoursesPage(props: PageProps<"/admin/courses">) {
  await requireAdminPageAccess(COURSE_ROLES);
  const searchParams = await props.searchParams;
  const q = typeof searchParams.q === "string" ? searchParams.q : undefined;
  const { courses, total, truncated } = await searchCourses(q);

  return (
    <main className="mx-auto flex max-w-3xl flex-col gap-4 p-4">
      <div className="flex items-center justify-between">
        <h1 className="text-xl font-semibold">Courses</h1>
        <Button render={<Link href="/admin/courses/new">Create course</Link>} />
      </div>

      <form action="/admin/courses" method="GET" className="flex gap-2">
        <Input
          name="q"
          defaultValue={q ?? ""}
          placeholder="Course name or code"
          aria-label="Search courses"
          className="flex-1"
        />
        <Button type="submit">Search</Button>
      </form>

      <Card>
        <CardHeader>
          <CardTitle>
            {total} course{total === 1 ? "" : "s"}
            {truncated ? ` (showing first ${courses.length})` : ""}
          </CardTitle>
        </CardHeader>
        <CardContent>
          {courses.length === 0 ? (
            <p className="text-sm text-muted-foreground">No courses found.</p>
          ) : (
            <ul className="flex flex-col gap-2 text-sm">
              {courses.map((course) => (
                <li key={course.id} className="flex flex-wrap items-center justify-between gap-2 border-b pb-1 last:border-b-0">
                  <span>
                    <Link href={`/admin/courses/${course.id}`} className="underline">
                      {course.name}
                    </Link>{" "}
                    <span className="font-mono text-xs text-muted-foreground" dir="ltr">
                      {course.courseCode}
                    </span>
                  </span>
                  {course.status !== "ACTIVE" && <Badge variant="outline">{course.status}</Badge>}
                </li>
              ))}
            </ul>
          )}
        </CardContent>
      </Card>
    </main>
  );
}
