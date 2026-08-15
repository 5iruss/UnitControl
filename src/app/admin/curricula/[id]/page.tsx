import { notFound } from "next/navigation";
import Link from "next/link";
import { requireAdminPageAccess } from "@/lib/admin/authorization";
import { getCurriculumDetail } from "@/lib/admin/curricula/queries";
import { listActiveCoursesForPicker } from "@/lib/admin/courses/queries";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { CurriculumEditForm } from "./curriculum-edit-form";
import { CurriculumCourseRow } from "./curriculum-course-row";
import { AddCurriculumCourseForm } from "./add-curriculum-course-form";
import { AddCourseGroupForm } from "./add-course-group-form";
import { AddRequirementForm } from "./add-requirement-form";
import { RequirementRow } from "./requirement-row";

const CURRICULUM_ROLES = ["SUPER_ADMIN", "ACADEMIC_GROUP_MANAGER"] as const;

export default async function CurriculumDetailPage(props: PageProps<"/admin/curricula/[id]">) {
  await requireAdminPageAccess(CURRICULUM_ROLES);
  const { id } = await props.params;
  const [detail, allCourses] = await Promise.all([
    getCurriculumDetail(id),
    listActiveCoursesForPicker(),
  ]);
  if (!detail) notFound();

  const { curriculum, curriculumCourses, courseGroups, requirements } = detail;
  const memberCourseIds = new Set(curriculumCourses.map((cc) => cc.courseId));
  const availableCourses = allCourses.filter((c) => !memberCourseIds.has(c.id));

  return (
    <main className="mx-auto flex max-w-2xl flex-col gap-4 p-4">
      <div className="flex flex-wrap items-center gap-2">
        <h1 className="text-xl font-semibold">{curriculum.name}</h1>
        <Badge variant="outline">{curriculum.status}</Badge>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Edit curriculum</CardTitle>
        </CardHeader>
        <CardContent>
          <CurriculumEditForm curriculum={curriculum} />
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Courses ({curriculumCourses.length})</CardTitle>
        </CardHeader>
        <CardContent className="flex flex-col gap-2">
          {curriculumCourses.length === 0 ? (
            <p className="text-sm text-muted-foreground">No courses linked yet.</p>
          ) : (
            <ul>
              {curriculumCourses.map((cc) => (
                <CurriculumCourseRow key={cc.id} membership={cc} />
              ))}
            </ul>
          )}
          <AddCurriculumCourseForm curriculumId={curriculum.id} courses={availableCourses} />
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Course groups ({courseGroups.length})</CardTitle>
        </CardHeader>
        <CardContent className="flex flex-col gap-2">
          {courseGroups.length === 0 ? (
            <p className="text-sm text-muted-foreground">No course groups yet.</p>
          ) : (
            <ul className="flex flex-col gap-1 text-sm">
              {courseGroups.map((group) => (
                <li key={group.id}>
                  <Link href={`/admin/curricula/${curriculum.id}/groups/${group.id}`} className="underline">
                    {group.name}
                  </Link>{" "}
                  <span className="text-xs text-muted-foreground">
                    ({group.groupType}, {group.courseGroupCourses.length} course
                    {group.courseGroupCourses.length === 1 ? "" : "s"})
                  </span>
                </li>
              ))}
            </ul>
          )}
          <AddCourseGroupForm curriculumId={curriculum.id} />
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Requirements ({requirements.length})</CardTitle>
        </CardHeader>
        <CardContent className="flex flex-col gap-2">
          {requirements.length === 0 ? (
            <p className="text-sm text-muted-foreground">No requirements yet.</p>
          ) : (
            <ul>
              {requirements.map((requirement) => (
                <RequirementRow key={requirement.id} requirement={requirement} />
              ))}
            </ul>
          )}
          <AddRequirementForm
            curriculumId={curriculum.id}
            courseGroups={courseGroups.map((g) => ({ id: g.id, name: g.name }))}
          />
        </CardContent>
      </Card>
    </main>
  );
}
