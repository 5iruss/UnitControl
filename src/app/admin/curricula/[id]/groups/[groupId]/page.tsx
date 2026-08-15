import { notFound } from "next/navigation";
import { requireAdminPageAccess } from "@/lib/admin/authorization";
import { getCourseGroupDetail } from "@/lib/admin/course-groups/queries";
import { listActiveCoursesForPicker } from "@/lib/admin/courses/queries";
import { deleteCourseGroupAction, removeGroupCourseAction } from "@/lib/admin/course-groups/actions";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { ConfirmActionButton } from "@/components/admin/confirm-action-button";
import { GroupEditForm } from "./group-edit-form";
import { AddGroupCourseForm } from "./add-group-course-form";

const GROUP_ROLES = ["SUPER_ADMIN", "ACADEMIC_GROUP_MANAGER"] as const;

export default async function CourseGroupDetailPage(
  props: PageProps<"/admin/curricula/[id]/groups/[groupId]">,
) {
  await requireAdminPageAccess(GROUP_ROLES);
  const { id, groupId } = await props.params;
  const [group, allCourses] = await Promise.all([
    getCourseGroupDetail(groupId),
    listActiveCoursesForPicker(),
  ]);
  if (!group || group.curriculumId !== id) notFound();

  const memberCourseIds = new Set(group.courseGroupCourses.map((gc) => gc.courseId));
  const availableCourses = allCourses.filter((c) => !memberCourseIds.has(c.id));

  return (
    <main className="mx-auto flex max-w-2xl flex-col gap-4 p-4">
      <h1 className="text-xl font-semibold">
        {group.curriculum.name} / {group.name}
      </h1>

      <Card>
        <CardHeader>
          <CardTitle>Edit group</CardTitle>
        </CardHeader>
        <CardContent>
          <GroupEditForm group={group} />
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Member courses ({group.courseGroupCourses.length})</CardTitle>
        </CardHeader>
        <CardContent className="flex flex-col gap-2">
          {group.courseGroupCourses.length === 0 ? (
            <p className="text-sm text-muted-foreground">No courses in this group yet.</p>
          ) : (
            <ul className="flex flex-col gap-1 text-sm">
              {group.courseGroupCourses.map((gc) => (
                <li key={gc.id} className="flex flex-wrap items-center justify-between gap-2 border-b pb-1 last:border-b-0">
                  <span>
                    {gc.course.name}{" "}
                    <span className="font-mono text-xs text-muted-foreground" dir="ltr">
                      {gc.course.courseCode}
                    </span>
                  </span>
                  <ConfirmActionButton
                    label="Remove"
                    title="Remove course from group"
                    description={`Remove ${gc.course.name} from ${group.name}?`}
                    action={removeGroupCourseAction}
                    fields={{ id: gc.id }}
                  />
                </li>
              ))}
            </ul>
          )}
          <AddGroupCourseForm courseGroupId={group.id} courses={availableCourses} />
        </CardContent>
      </Card>

      <ConfirmActionButton
        label="Delete group"
        title="Delete course group"
        description={`Delete "${group.name}"? This is rejected if a curriculum requirement still references it.`}
        action={deleteCourseGroupAction}
        fields={{ id: group.id }}
      />
    </main>
  );
}
