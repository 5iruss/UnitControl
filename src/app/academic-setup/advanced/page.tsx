import { redirect } from "next/navigation";
import Link from "next/link";
import { getCurrentUser } from "@/lib/auth/session";
import { getStudentProfile } from "@/lib/academic-profile/queries";
import {
  getCurriculumCoursesForDisplay,
  getStudentCourseAttempts,
  getStudentSemesters,
} from "@/lib/academic-status/queries";
import { finishAcademicSetupAction } from "@/lib/academic-status/actions";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { STATUS_META } from "@/components/curriculum-map/status-meta";
import { SemesterForm } from "./semester-form";
import { CourseAttemptForm } from "./course-attempt-form";

// Derived independently from the shared status-meta.ts source (not imported
// from course-attempt-form.tsx, a "use client" module — a plain value
// export can't cross the Server/Client Component boundary reliably).
const RESULT_LABEL_BY_VALUE = new Map<string, string>(
  (["PASSED", "FAILED", "CURRENTLY_STUDYING"] as const).map((value) => [value, STATUS_META[value].label]),
);

// docs/02_User_Flow.md §5, §12 — Advanced Mode: add academic terms one at a
// time, mark courses taken and their final status, enter semester GPA.
export default async function AdvancedAcademicSetupPage() {
  const user = await getCurrentUser();
  if (!user || user.role !== "STUDENT") redirect("/login");

  const profile = await getStudentProfile(user.id);
  if (!profile) redirect("/profile/setup");

  const [semesters, curriculumCourses, attempts] = await Promise.all([
    getStudentSemesters(profile.id),
    getCurriculumCoursesForDisplay(profile.curriculumId),
    getStudentCourseAttempts(profile.id),
  ]);

  const courseOptions = curriculumCourses.map(({ course }) => ({
    id: course.id,
    name: course.name,
    courseCode: course.courseCode,
  }));

  return (
    <main className="mx-auto flex max-w-3xl flex-col gap-4 p-4">
      <h1 className="text-xl font-semibold">Advanced academic setup</h1>

      <Card>
        <CardHeader>
          <CardTitle>Add a semester</CardTitle>
        </CardHeader>
        <CardContent>
          <SemesterForm />
        </CardContent>
      </Card>

      {semesters.length === 0 && (
        <p className="text-sm text-muted-foreground">
          No semesters recorded yet. Add one above to start entering your academic history.
        </p>
      )}

      {semesters.map((semester) => {
        const termAttempts = attempts.filter(
          (attempt) => attempt.academicTermId === semester.academicTermId,
        );
        return (
          <Card key={semester.id}>
            <CardHeader>
              <CardTitle>
                {semester.academicTerm.termCode} — GPA {semester.semesterGpa.toString()}
              </CardTitle>
            </CardHeader>
            <CardContent className="flex flex-col gap-3">
              <ul className="text-sm">
                {termAttempts.map((attempt) => (
                  <li key={attempt.id}>
                    {attempt.course.name} — {RESULT_LABEL_BY_VALUE.get(attempt.result) ?? attempt.result}
                  </li>
                ))}
              </ul>
              <CourseAttemptForm termCode={semester.academicTerm.termCode} courses={courseOptions} />
            </CardContent>
          </Card>
        );
      })}

      <div className="flex items-center justify-between">
        <Link href="/dashboard" className="text-sm underline">
          Back to dashboard
        </Link>
        {!profile.academicSetupCompletedAt && (
          <form action={finishAcademicSetupAction}>
            <Button type="submit">Continue to dashboard</Button>
          </form>
        )}
      </div>
    </main>
  );
}
