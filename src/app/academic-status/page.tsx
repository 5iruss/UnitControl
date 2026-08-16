import { redirect } from "next/navigation";
import Link from "next/link";
import { getCurrentUser } from "@/lib/auth/session";
import { getStudentProfile } from "@/lib/academic-profile/queries";
import { getCurriculumCoursesForDisplay, getStudentCourses } from "@/lib/academic-status/queries";
import { finishAcademicSetupAction } from "@/lib/academic-status/actions";
import type { CourseStatusValue } from "@/domain/academic-status";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { CourseStatusRow } from "./course-status-row";

// docs/02_User_Flow.md §5, §7 — Simple Mode course-status marking, reused as
// the ongoing "update your course statuses" page reachable from the
// dashboard. Not the final interactive curriculum map (a later phase) —
// just a plain list, per task Phase 5 §15 "minimum UI necessary."
export default async function AcademicStatusPage() {
  const user = await getCurrentUser();
  if (!user || user.role !== "STUDENT") redirect("/login");

  const profile = await getStudentProfile(user.id);
  if (!profile) redirect("/profile/setup");

  const [curriculumCourses, studentCourses] = await Promise.all([
    getCurriculumCoursesForDisplay(profile.curriculumId),
    getStudentCourses(profile.id),
  ]);

  const statusByCourseId = new Map(studentCourses.map((sc) => [sc.courseId, sc]));

  return (
    <main className="mx-auto flex max-w-3xl flex-col gap-4 p-4">
      <h1 className="text-xl font-semibold">وضعیت دروس</h1>

      <Card>
        <CardHeader>
          <CardTitle>{curriculumCourses.length} درس</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex flex-col">
            {curriculumCourses.map(({ course }) => {
              const current = statusByCourseId.get(course.id);
              return (
                <CourseStatusRow
                  key={course.id}
                  courseId={course.id}
                  courseName={course.name}
                  courseCode={course.courseCode}
                  currentStatus={(current?.status ?? "NOT_COMPLETED") as CourseStatusValue}
                  currentTermCode={current?.academicTerm?.termCode ?? null}
                />
              );
            })}
          </div>
        </CardContent>
      </Card>

      <div className="flex items-center justify-between">
        <Link href="/dashboard" className="text-sm underline">
          بازگشت به داشبورد
        </Link>
        {!profile.academicSetupCompletedAt && (
          <form action={finishAcademicSetupAction}>
            <Button type="submit">ادامه به داشبورد</Button>
          </form>
        )}
      </div>
    </main>
  );
}
