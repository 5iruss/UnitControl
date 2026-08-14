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
import { SemesterForm } from "./semester-form";
import { CourseAttemptForm } from "./course-attempt-form";

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
      <Card>
        <CardHeader>
          <CardTitle>Add an academic term</CardTitle>
        </CardHeader>
        <CardContent>
          <SemesterForm />
        </CardContent>
      </Card>

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
                    {attempt.course.name} — {attempt.result}
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
