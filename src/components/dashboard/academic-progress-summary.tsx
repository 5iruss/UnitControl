import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { STATUS_META } from "@/components/curriculum-map/status-meta";
import type { CourseStatus } from "@/domain/academic";
import type { CourseProgressSummary } from "@/domain/academic-status";

const STATUS_ORDER = Object.keys(STATUS_META) as CourseStatus[];
const RADIUS = 40;
const CIRCUMFERENCE = 2 * Math.PI * RADIUS;

export interface AcademicProgressSummaryProps {
  statusCounts: Map<CourseStatus, number>;
  totalCount: number;
  progress: CourseProgressSummary;
}

// docs Redesign prompt §22 — a dedicated compact progress section, in
// addition to the header's progress badge, both driven by the same
// domain/academic-status/progress.ts calculation (docs prompt §9's
// consistency requirement — one canonical number, never two conflicting
// percentages). Course-count based only: no unit/credit data exists to
// calculate a real graduation percentage (docs/06_Curriculum_Dataset.md §7).
export function AcademicProgressSummary({
  statusCounts,
  totalCount,
  progress,
}: AcademicProgressSummaryProps) {
  let cumulative = 0;

  return (
    <Card>
      <CardHeader>
        <CardTitle>خلاصه پیشرفت تحصیلی</CardTitle>
      </CardHeader>
      <CardContent className="flex flex-wrap items-center gap-6">
        <div className="relative flex size-36 shrink-0 items-center justify-center">
          <svg viewBox="0 0 100 100" className="size-36 -rotate-90" aria-hidden>
            <circle cx="50" cy="50" r={RADIUS} fill="none" stroke="var(--border)" strokeWidth="12" />
            {totalCount > 0 &&
              STATUS_ORDER.map((status) => {
                const count = statusCounts.get(status) ?? 0;
                if (count === 0) return null;
                const segmentLength = (count / totalCount) * CIRCUMFERENCE;
                const offset = -cumulative;
                cumulative += segmentLength;
                return (
                  <circle
                    key={status}
                    cx="50"
                    cy="50"
                    r={RADIUS}
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="12"
                    strokeDasharray={`${segmentLength} ${CIRCUMFERENCE - segmentLength}`}
                    strokeDashoffset={offset}
                    className={STATUS_META[status].className}
                  />
                );
              })}
          </svg>
          <div className="absolute flex flex-col items-center">
            <span className="text-2xl font-bold" dir="ltr">
              {totalCount}
            </span>
            <span className="text-xs text-muted-foreground">کل دروس</span>
          </div>
        </div>

        <ul className="flex flex-1 flex-col gap-1.5 text-sm">
          {STATUS_ORDER.map((status) => {
            const count = statusCounts.get(status) ?? 0;
            const percent = totalCount === 0 ? 0 : Math.round((count / totalCount) * 1000) / 10;
            const StatusIcon = STATUS_META[status].icon;
            return (
              <li key={status} className="flex items-center justify-between gap-2">
                <span className="flex items-center gap-1.5">
                  <StatusIcon className={`size-3.5 shrink-0 ${STATUS_META[status].className}`} aria-hidden />
                  {STATUS_META[status].label}
                </span>
                <span className="text-muted-foreground" dir="ltr">
                  {count} ({percent}%)
                </span>
              </li>
            );
          })}
          <li className="mt-1 flex items-center justify-between gap-2 border-t pt-1.5 font-medium">
            <span>پیشرفت دروس</span>
            <span dir="ltr">{progress.percentage}%</span>
          </li>
        </ul>
      </CardContent>
    </Card>
  );
}
