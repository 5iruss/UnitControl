import type { PlannedSemesterViewModel } from "@/domain/semester-planning";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { AddPlannedCourseForm } from "./add-planned-course-form";
import { PlannedCourseRow } from "./planned-course-row";

export interface SemesterPlanSectionProps {
  semesters: PlannedSemesterViewModel[];
  availableCourses: { id: string; name: string; courseCode: string }[];
}

// docs/02_User_Flow.md §11 "Semester Planning Flow" — a semester-grouped
// overview of the student's PLANNED courses, separate from the curriculum
// map (which stays category-grouped per docs/03_UX_UI_Specification.md
// §9-§10 and is not reorganized into a term-based layout).
export function SemesterPlanSection({ semesters, availableCourses }: SemesterPlanSectionProps) {
  return (
    <Card dir="rtl">
      <CardHeader>
        <CardTitle>برنامه ترم‌ها</CardTitle>
      </CardHeader>
      <CardContent className="flex flex-col gap-4">
        <AddPlannedCourseForm courses={availableCourses} />

        {semesters.length === 0 ? (
          <p className="text-sm text-muted-foreground">
            هنوز درسی برنامه‌ریزی نشده است. یک درس را از بالا انتخاب کنید، یا وضعیت
            &quot;برنامه‌ریزی‌شده&quot; را برای یک درس در نقشه دروس انتخاب و ترم مدنظر را وارد کنید.
          </p>
        ) : (
          semesters.map((semester) => (
            <div key={semester.termCode} className="flex flex-col gap-1">
              <div className="flex flex-wrap items-baseline justify-between gap-2">
                <h3 className="text-sm font-semibold">
                  <span dir="ltr">{semester.termLabel}</span>{" "}
                  <span className="font-mono text-xs text-muted-foreground" dir="ltr">
                    ({semester.termCode})
                  </span>
                </h3>
                <span className="text-xs text-muted-foreground">
                  {semester.courses.length} درس
                </span>
              </div>
              <ul>
                {semester.courses.map((course) => (
                  <PlannedCourseRow key={course.courseId} course={course} />
                ))}
              </ul>
            </div>
          ))
        )}
      </CardContent>
    </Card>
  );
}
