// Shared status/availability display metadata (docs/03_UX_UI_Specification.md
// §10, §23 — every state needs a distinct, non-color-only treatment: icon +
// label, not color alone). Deliberately NOT a "use client" module: it's
// consumed by both client components (course-node.tsx, planned-course-row.tsx)
// and server components (recommendations-panel.tsx). A plain value export
// from a "use client" module isn't reliably resolvable across that RSC
// boundary, so this lives in its own framework-neutral file instead.
import { Ban, CalendarClock, CheckCircle2, Circle, Clock, TriangleAlert, XCircle } from "lucide-react";
import type { AvailabilityStatus, CourseStatus } from "@/domain/academic";

export const STATUS_META: Record<
  CourseStatus,
  { label: string; icon: typeof Circle; className: string }
> = {
  PASSED: { label: "Passed", icon: CheckCircle2, className: "text-emerald-600 dark:text-emerald-400" },
  FAILED: { label: "Failed", icon: XCircle, className: "text-red-600 dark:text-red-400" },
  CURRENTLY_STUDYING: { label: "Currently studying", icon: Clock, className: "text-blue-600 dark:text-blue-400" },
  PLANNED: { label: "Planned", icon: CalendarClock, className: "text-amber-600 dark:text-amber-400" },
  NOT_COMPLETED: { label: "Not completed", icon: Circle, className: "text-muted-foreground" },
};

export const AVAILABILITY_META: Record<
  AvailabilityStatus,
  { label: string; icon: typeof Circle; borderClassName: string }
> = {
  AVAILABLE: { label: "Available", icon: CheckCircle2, borderClassName: "border-emerald-500/50" },
  BLOCKED: { label: "Blocked", icon: Ban, borderClassName: "border-red-500/60" },
  AVAILABLE_WITH_WARNING: {
    label: "Available with warning",
    icon: TriangleAlert,
    borderClassName: "border-amber-500/60",
  },
};
