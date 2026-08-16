import { redirect } from "next/navigation";
import { getCurrentUser } from "@/lib/auth/session";
import { getStudentProfile } from "@/lib/academic-profile/queries";
import { buildAcademicState } from "@/lib/academic-rules/queries";
import { getCurriculumMapData } from "@/lib/curriculum-map/queries";
import { getSemesterPlan } from "@/lib/semester-planning/queries";
import { getRecommendations } from "@/lib/recommendations/queries";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { CurriculumMapView } from "@/components/curriculum-map/curriculum-map-view";
import { SemesterPlanSection } from "@/components/semester-planning/semester-plan-section";
import { RecommendationsPanel } from "@/components/recommendations/recommendations-panel";
import { WorkspaceHeader } from "@/components/dashboard/workspace-header";
import { AcademicProgressSummary } from "@/components/dashboard/academic-progress-summary";
import { WorkspaceFooter } from "@/components/dashboard/workspace-footer";
import { calculateCourseProgress } from "@/domain/academic-status";
import type { CourseStatus } from "@/domain/academic";

// docs/03_UX_UI_Specification.md §4 — the Dashboard is a single Persian/RTL
// academic workspace built around the interactive curriculum map (docs
// Redesign prompt §3, §10): student context, then the curriculum/course
// pipeline as the primary content, then planning/warnings/recommendations/
// progress as supporting sections. No separate term-based layout, and no
// standalone "academic path" section (docs Redesign prompt §6) — the
// pipeline lives inside the curriculum map only.
export default async function DashboardPage() {
  const user = await getCurrentUser();
  if (!user || user.role !== "STUDENT") redirect("/login");

  // docs/02_User_Flow.md §2 — Registration -> Academic Profile -> Academic
  // Setup -> Dashboard.
  const profile = await getStudentProfile(user.id);
  if (!profile) redirect("/profile/setup");
  if (!profile.academicSetupCompletedAt) redirect("/academic-setup");

  // docs Phase 9 prompt §22 — assemble the academic state once per request
  // and hand it to every view-model query below, instead of each one
  // rebuilding it (avoids N+1 duplicate Rules Engine data fetches).
  const academicState = await buildAcademicState(profile.id, profile.curriculumId);

  const [{ curriculumName, viewModel }, semesters] = await Promise.all([
    getCurriculumMapData(profile.id, profile.curriculumId, academicState),
    getSemesterPlan(profile.id, academicState),
  ]);

  const recommendations = await getRecommendations(
    profile.curriculumId,
    academicState,
    viewModel,
    semesters,
  );

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

  const totalCount = viewModel.nodes.length;
  const progress = calculateCourseProgress(statusCounts, totalCount);

  return (
    <main className="mx-auto flex max-w-6xl flex-col gap-4 p-4">
      <WorkspaceHeader
        firstName={user.firstName}
        lastName={user.lastName}
        studentNumber={user.studentNumber}
        major={profile.major}
        orientation={profile.orientation}
        entryYear={profile.entryYear}
        studyType={profile.studyType}
        curriculumName={curriculumName}
        statusCounts={statusCounts}
        totalCount={totalCount}
        progress={progress}
      />

      <Card>
        <CardHeader>
          <CardTitle>نقشه دروس (ساختار برنامه درسی)</CardTitle>
        </CardHeader>
        <CardContent>
          <CurriculumMapView viewModel={viewModel} />
        </CardContent>
      </Card>

      <RecommendationsPanel data={recommendations} />

      <div className="grid gap-4 lg:grid-cols-[2fr_1fr]">
        <SemesterPlanSection semesters={semesters} availableCourses={availableCourses} />
        <AcademicProgressSummary
          statusCounts={statusCounts}
          totalCount={totalCount}
          progress={progress}
        />
      </div>

      <WorkspaceFooter />
    </main>
  );
}
