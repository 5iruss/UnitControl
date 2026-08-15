import { TriangleAlert } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { AVAILABILITY_META } from "@/components/curriculum-map/status-meta";
import type { RecommendationsResult } from "@/domain/recommendations";

export interface RecommendationsPanelProps {
  data: RecommendationsResult;
}

// docs/03_UX_UI_Specification.md §4, §16, §17 — "Recommended Courses" and
// "Academic Problems / Warnings" as two panels below the curriculum map.
// Read-only for Phase 9: the student acts on a recommendation through the
// existing "Add to plan" form (Phase 8) rather than a duplicate action here
// (docs Phase 9 prompt §13 — recommendations are suggestions, the student
// must explicitly choose any action; docs Phase 9 prompt §18 — "smallest
// useful presentation," refined later).
export function RecommendationsPanel({ data }: RecommendationsPanelProps) {
  const hasWarnings = data.failedCourseWarnings.length > 0 || data.plannedCourseAlerts.length > 0;

  return (
    <div className="grid gap-4 md:grid-cols-2" dir="rtl">
      <Card>
        <CardHeader>
          <CardTitle>Recommended courses</CardTitle>
        </CardHeader>
        <CardContent>
          {data.courseRecommendations.length === 0 ? (
            <p className="text-sm text-muted-foreground">No recommended courses right now.</p>
          ) : (
            <ul className="flex flex-col gap-3">
              {data.courseRecommendations.map((course) => {
                const availability = AVAILABILITY_META[course.eligibility.status];
                const AvailabilityIcon = availability.icon;
                return (
                  <li key={course.courseId} className="border-b pb-2 text-sm last:border-b-0">
                    <div className="flex items-center justify-between gap-2">
                      <p className="font-medium">{course.name}</p>
                      <span
                        className="flex items-center gap-1 text-xs text-muted-foreground"
                        aria-label={`Availability: ${availability.label}`}
                      >
                        <AvailabilityIcon className="size-3.5" aria-hidden />
                        {availability.label}
                      </span>
                    </div>
                    <p className="font-mono text-xs text-muted-foreground" dir="ltr">
                      {course.courseCode}
                    </p>
                    <p className="text-xs text-muted-foreground">{course.reasons.join(" ")}</p>
                  </li>
                );
              })}
            </ul>
          )}
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Academic warnings</CardTitle>
        </CardHeader>
        <CardContent className="flex flex-col gap-3">
          {!hasWarnings ? (
            <p className="text-sm text-muted-foreground">No academic warnings right now.</p>
          ) : (
            <ul className="flex flex-col gap-3">
              {data.failedCourseWarnings.map((item) => (
                <li key={`failed-${item.courseId}`} className="border-b pb-2 text-sm last:border-b-0">
                  <div className="flex items-center gap-1.5 font-medium">
                    <TriangleAlert className="size-3.5 text-amber-600 dark:text-amber-400" aria-hidden />
                    {item.courseName}{" "}
                    <span className="font-mono text-xs text-muted-foreground" dir="ltr">
                      ({item.courseCode})
                    </span>
                  </div>
                  <p className="text-xs text-amber-700 dark:text-amber-400">{item.warning.reason}</p>
                  <p className="text-xs text-muted-foreground">
                    Suggested action: {item.warning.suggestedAction}
                  </p>
                </li>
              ))}

              {data.plannedCourseAlerts.map((alert) => {
                const availability = AVAILABILITY_META[alert.eligibility.status];
                const AvailabilityIcon = availability.icon;
                return (
                  <li key={`planned-${alert.courseId}`} className="border-b pb-2 text-sm last:border-b-0">
                    <div className="flex items-center gap-1.5 font-medium">
                      <AvailabilityIcon className="size-3.5" aria-hidden />
                      {alert.name}{" "}
                      <span className="font-mono text-xs text-muted-foreground" dir="ltr">
                        ({alert.courseCode})
                      </span>
                    </div>
                    <p className="text-xs text-muted-foreground">
                      Planned for {alert.termCode} — {availability.label}.
                    </p>
                    {alert.eligibility.reasons.length > 0 && (
                      <p className="text-xs text-destructive">{alert.eligibility.reasons.join(" ")}</p>
                    )}
                    {alert.eligibility.warnings.length > 0 && (
                      <p className="text-xs text-amber-700 dark:text-amber-400">
                        {alert.eligibility.warnings.join(" ")}
                      </p>
                    )}
                  </li>
                );
              })}
            </ul>
          )}

          {data.dataLimitations.length > 0 && (
            <div className="flex flex-col gap-1 border-t pt-2">
              {data.dataLimitations.map((notice) => (
                <p key={notice.message} className="text-xs text-muted-foreground">
                  {notice.message}
                </p>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
