import { BookMarked, Calendar, Clock, GraduationCap, Route } from "lucide-react";
import { LogoutButton } from "@/components/logout-button";
import { Badge } from "@/components/ui/badge";
import { STATUS_META } from "@/components/curriculum-map/status-meta";
import type { CourseStatus } from "@/domain/academic";
import type { CourseProgressSummary } from "@/domain/academic-status";

const STATUS_ORDER = Object.keys(STATUS_META) as CourseStatus[];

function initials(firstName: string, lastName: string): string {
  return `${firstName.charAt(0)}${lastName.charAt(0)}`;
}

export interface WorkspaceHeaderProps {
  firstName: string;
  lastName: string;
  studentNumber: string;
  major: string;
  orientation: string;
  entryYear: number;
  studyType: "FULL_TIME" | "PART_TIME";
  curriculumName: string;
  statusCounts: Map<CourseStatus, number>;
  totalCount: number;
  progress: CourseProgressSummary;
}

// docs/03_UX_UI_Specification.md — header answers "who is this student and
// what is their overall academic situation," kept compact (identity +
// academic profile summary + statistics + the one canonical progress
// percentage, docs Redesign prompt §9). No notifications/avatar-photo: those
// aren't real product features, so no dead UI for them is added here.
export function WorkspaceHeader(props: WorkspaceHeaderProps) {
  const {
    firstName,
    lastName,
    studentNumber,
    major,
    orientation,
    entryYear,
    studyType,
    curriculumName,
    statusCounts,
    totalCount,
    progress,
  } = props;

  return (
    <header className="flex flex-col gap-4 rounded-xl border bg-card p-4 shadow-sm">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div className="flex items-center gap-2">
          <div className="flex size-9 items-center justify-center rounded-lg bg-primary text-primary-foreground">
            <GraduationCap className="size-5" aria-hidden />
          </div>
          <div>
            <p className="text-base font-semibold leading-tight">پونیت کنترل</p>
            <p className="text-xs leading-tight text-muted-foreground">
              برنامه‌ریزی هوشمند تحصیلی شما
            </p>
          </div>
        </div>

        <div className="flex items-center gap-3">
          <div className="text-left sm:text-right">
            <h1 className="text-sm font-medium">
              سلام، {firstName} {lastName}
            </h1>
            <p className="font-mono text-xs text-muted-foreground" dir="ltr">
              {studentNumber}
            </p>
          </div>
          <div
            className="flex size-9 items-center justify-center rounded-full bg-secondary text-sm font-semibold text-secondary-foreground"
            aria-hidden
          >
            {initials(firstName, lastName)}
          </div>
          <LogoutButton redirectTo="/login" label="خروج" />
        </div>
      </div>

      <div className="grid grid-cols-1 gap-3 rounded-lg border bg-muted/40 p-3 text-sm sm:grid-cols-3 lg:grid-cols-5">
        <ProfileFact icon={BookMarked} label="رشته" value={major} />
        <ProfileFact icon={Route} label="گرایش" value={orientation} />
        <ProfileFact icon={Calendar} label="سال ورود" value={String(entryYear)} valueDir="ltr" />
        <ProfileFact icon={Clock} label="نوع تحصیل" value={studyType === "FULL_TIME" ? "تمام‌وقت" : "پاره‌وقت"} />
        <ProfileFact icon={GraduationCap} label="برنامه درسی" value={curriculumName} />
      </div>

      <div className="flex flex-wrap items-center gap-2">
        <Badge variant="secondary" className="text-sm font-semibold">
          پیشرفت دروس: {progress.percentage}٪
        </Badge>
        <Badge variant="outline">کل دروس: {totalCount}</Badge>
        {STATUS_ORDER.map((status) => {
          const StatusIcon = STATUS_META[status].icon;
          return (
            <Badge key={status} variant="outline">
              <StatusIcon aria-hidden className={STATUS_META[status].className} />
              {STATUS_META[status].label}: {statusCounts.get(status) ?? 0}
            </Badge>
          );
        })}
      </div>
    </header>
  );
}

function ProfileFact({
  icon: Icon,
  label,
  value,
  valueDir,
}: {
  icon: typeof BookMarked;
  label: string;
  value: string;
  valueDir?: "ltr" | "rtl";
}) {
  return (
    <div className="flex items-start gap-2">
      <Icon className="mt-0.5 size-4 shrink-0 text-muted-foreground" aria-hidden />
      <div className="min-w-0">
        <p className="text-xs text-muted-foreground">{label}</p>
        <p className="truncate font-medium" dir={valueDir}>
          {value}
        </p>
      </div>
    </div>
  );
}
