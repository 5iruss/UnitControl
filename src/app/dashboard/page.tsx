import { redirect } from "next/navigation";
import Link from "next/link";
import { getCurrentUser } from "@/lib/auth/session";
import { getStudentProfile } from "@/lib/academic-profile/queries";
import { getCurriculumMapData } from "@/lib/curriculum-map/queries";
import { getSemesterPlan } from "@/lib/semester-planning/queries";
import { LogoutButton } from "@/components/logout-button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { CurriculumMapView } from "@/components/curriculum-map/curriculum-map-view";
import { SemesterPlanSection } from "@/components/semester-planning/semester-plan-section";
import type { CourseStatus } from "@/domain/academic";

const STATUS_STAT_LABELS: Record<CourseStatus, string> = {
  PASSED: "Passed",
  FAILED: "Failed",
  CURRENTLY_STUDYING: "Currently studying",
  PLANNED: "Planned",
  NOT_COMPLETED: "Not completed",
};

// docs/03_UX_UI_Specification.md §4 — the Dashboard is built around the
// interactive curriculum map (Phase 7). Student info, filters, status
// toolbar, statistics, and the map itself all live here; there is no
// separate term-based layout.
export default async function DashboardPage() {
  const user = await getCurrentUser();
  if (!user || user.role !== "STUDENT") redirect("/login");

  // docs/02_User_Flow.md §2 — Registration -> Academic Profile -> Academic
  // Setup -> Dashboard.
  const profile = await getStudentProfile(user.id);
  if (!profile) redirect("/profile/setup");
  if (!profile.academicSetupCompletedAt) redirect("/academic-setup");

  const [{ curriculumName, viewModel }, semesters] = await Promise.all([
    getCurriculumMapData(profile.id, profile.curriculumId),
    getSemesterPlan(profile.id, profile.curriculumId),
  ]);

  // docs/03_UX_UI_Specification.md §6 — course counts only (never units:
  // courses.credits / curricula.total_required_units are unverified/NULL in
  // the current dataset — see docs/06_Curriculum_Dataset.md §7).
  const statusCounts = new Map<CourseStatus, number>();
  for (const node of viewModel.nodes) {
    statusCounts.set(node.status, (statusCounts.get(node.status) ?? 0) + 1);
  }

  // docs/04_Academic_Rules_Engine.md §21 item 2 — an already-passed course
  // is unconditionally blocked, so it's left out of the "add to plan" picker
  // rather than offered and then always rejected server-side.
  const availableCourses = viewModel.nodes
    .filter((node) => node.status !== "PASSED")
    .map((node) => ({ id: node.courseId, name: node.name, courseCode: node.courseCode }));

  return (
    <main className="mx-auto flex max-w-6xl flex-col gap-4 p-4" dir="rtl">
      <Card>
        <CardHeader className="flex flex-row items-center justify-between">
          <CardTitle>
            Welcome, {user.firstName} {user.lastName}.
          </CardTitle>
          <LogoutButton redirectTo="/login" />
        </CardHeader>
        <CardContent className="flex flex-wrap gap-x-6 gap-y-1 text-sm text-muted-foreground">
          <span>Student number: {user.studentNumber}</span>
          <span>Entry year: {profile.entryYear}</span>
          <span>
            Major/orientation: {profile.major} — {profile.orientation}
          </span>
          <span>Study type: {profile.studyType === "FULL_TIME" ? "Full-time" : "Part-time"}</span>
          <span>Curriculum: {curriculumName}</span>
        </CardContent>
      </Card>

      <div className="flex flex-wrap gap-2">
        {(Object.keys(STATUS_STAT_LABELS) as CourseStatus[]).map((status) => (
          <Badge key={status} variant="outline">
            {STATUS_STAT_LABELS[status]}: {statusCounts.get(status) ?? 0}
          </Badge>
        ))}
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Curriculum map</CardTitle>
        </CardHeader>
        <CardContent>
          <CurriculumMapView viewModel={viewModel} />
        </CardContent>
      </Card>

      <SemesterPlanSection semesters={semesters} availableCourses={availableCourses} />

      <div className="flex flex-wrap items-center gap-4 text-sm">
        <Link href="/profile" className="underline">
          Manage academic profile
        </Link>
        <Link href="/academic-status" className="underline">
          Manage course statuses
        </Link>
        <Link href="/academic-setup/advanced" className="underline">
          Record a semester
        </Link>
      </div>
    </main>
  );
}
