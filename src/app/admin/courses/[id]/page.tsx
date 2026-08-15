import { notFound } from "next/navigation";
import Link from "next/link";
import { requireAdminPageAccess } from "@/lib/admin/authorization";
import { getCourseDetail, listActiveCoursesForPicker } from "@/lib/admin/courses/queries";
import { deleteRelationshipAction } from "@/lib/admin/relationships/actions";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { ConfirmActionButton } from "@/components/admin/confirm-action-button";
import { STATUS_LABEL } from "@/app/admin/status-label";
import { CATEGORY_LABEL } from "@/app/admin/curricula/[id]/category-labels";
import { CourseEditForm } from "./course-edit-form";
import { AddRelationshipForm } from "./add-relationship-form";

const COURSE_ROLES = ["SUPER_ADMIN", "ACADEMIC_GROUP_MANAGER"] as const;

export default async function CourseDetailPage(props: PageProps<"/admin/courses/[id]">) {
  await requireAdminPageAccess(COURSE_ROLES);
  const { id } = await props.params;
  const [detail, otherCourses] = await Promise.all([
    getCourseDetail(id),
    listActiveCoursesForPicker(),
  ]);
  if (!detail) notFound();

  const { course, relationshipsAsSource, relationshipsAsTarget, curriculumCourses } = detail;
  const pickerCourses = otherCourses.filter((c) => c.id !== course.id);

  return (
    <main className="mx-auto flex max-w-2xl flex-col gap-4 p-4">
      <div className="flex flex-wrap items-center gap-2">
        <h1 className="text-xl font-semibold">{course.name}</h1>
        <span className="font-mono text-sm text-muted-foreground" dir="ltr">
          {course.courseCode}
        </span>
        <Badge variant="outline">{STATUS_LABEL[course.status] ?? course.status}</Badge>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Edit course</CardTitle>
        </CardHeader>
        <CardContent>
          <CourseEditForm course={course} />
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Curricula containing this course</CardTitle>
        </CardHeader>
        <CardContent>
          {curriculumCourses.length === 0 ? (
            <p className="text-sm text-muted-foreground">
              Not part of any curriculum. Add it from a curriculum&apos;s page.
            </p>
          ) : (
            <ul className="flex flex-col gap-1 text-sm">
              {curriculumCourses.map((cc) => (
                <li key={cc.id}>
                  <Link href={`/admin/curricula/${cc.curriculumId}`} className="underline">
                    {cc.curriculum.name}
                  </Link>{" "}
                  <span className="text-xs text-muted-foreground">
                    ({CATEGORY_LABEL[cc.category] ?? cc.category}, {cc.required ? "required" : "not required"})
                  </span>
                </li>
              ))}
            </ul>
          )}
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Relationships</CardTitle>
        </CardHeader>
        <CardContent className="flex flex-col gap-3">
          {relationshipsAsSource.length === 0 && relationshipsAsTarget.length === 0 ? (
            <p className="text-sm text-muted-foreground">No relationships recorded for this course.</p>
          ) : (
            <ul className="flex flex-col gap-2 text-sm">
              {relationshipsAsTarget.map((rel) => (
                <li key={rel.id} className="flex flex-wrap items-center justify-between gap-2 border-b pb-1">
                  <span>
                    Requires <span className="font-medium">{rel.sourceCourse.name}</span> as{" "}
                    {rel.relationshipType === "PREREQUISITE" ? "prerequisite" : "corequisite"}
                  </span>
                  <ConfirmActionButton
                    label="Remove"
                    title="Remove relationship"
                    description={`Remove the ${rel.relationshipType} relationship between ${rel.sourceCourse.name} and ${course.name}?`}
                    action={deleteRelationshipAction}
                    fields={{ id: rel.id }}
                  />
                </li>
              ))}
              {relationshipsAsSource.map((rel) => (
                <li key={rel.id} className="flex flex-wrap items-center justify-between gap-2 border-b pb-1 last:border-b-0">
                  <span>
                    Is {rel.relationshipType === "PREREQUISITE" ? "a prerequisite" : "a corequisite"} for{" "}
                    <span className="font-medium">{rel.targetCourse.name}</span>
                  </span>
                  <ConfirmActionButton
                    label="Remove"
                    title="Remove relationship"
                    description={`Remove the ${rel.relationshipType} relationship between ${course.name} and ${rel.targetCourse.name}?`}
                    action={deleteRelationshipAction}
                    fields={{ id: rel.id }}
                  />
                </li>
              ))}
            </ul>
          )}
          <AddRelationshipForm courseId={course.id} otherCourses={pickerCourses} />
        </CardContent>
      </Card>
    </main>
  );
}
