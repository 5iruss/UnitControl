"use client";

import { Handle, Position, type Node, type NodeProps } from "@xyflow/react";
import {
  Ban,
  CalendarClock,
  CheckCircle2,
  Circle,
  Clock,
  TriangleAlert,
  XCircle,
} from "lucide-react";
import { cn } from "@/lib/utils";
import type { AvailabilityStatus, CourseStatus } from "@/domain/academic";

export interface CourseNodeData extends Record<string, unknown> {
  courseId: string;
  courseCode: string;
  name: string;
  status: CourseStatus;
  availabilityStatus: AvailabilityStatus;
  dimmed: boolean;
  onSelect: (courseId: string) => void;
}

export type CourseFlowNode = Node<CourseNodeData, "course">;

// docs/03_UX_UI_Specification.md §10, §23 — every status/availability state
// needs a distinct, non-color-only treatment (icon + label, not color alone).
const STATUS_META: Record<CourseStatus, { label: string; icon: typeof Circle; className: string }> = {
  PASSED: { label: "Passed", icon: CheckCircle2, className: "text-emerald-600 dark:text-emerald-400" },
  FAILED: { label: "Failed", icon: XCircle, className: "text-red-600 dark:text-red-400" },
  CURRENTLY_STUDYING: { label: "Currently studying", icon: Clock, className: "text-blue-600 dark:text-blue-400" },
  PLANNED: { label: "Planned", icon: CalendarClock, className: "text-amber-600 dark:text-amber-400" },
  NOT_COMPLETED: { label: "Not completed", icon: Circle, className: "text-muted-foreground" },
};

const AVAILABILITY_META: Record<
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

export function CourseNode({ data }: NodeProps<CourseFlowNode>) {
  const status = STATUS_META[data.status];
  const availability = AVAILABILITY_META[data.availabilityStatus];
  const StatusIcon = status.icon;
  const AvailabilityIcon = availability.icon;

  return (
    <button
      type="button"
      dir="rtl"
      onClick={() => data.onSelect(data.courseId)}
      aria-label={`${data.name} (${data.courseCode}) — ${status.label}, ${availability.label}`}
      className={cn(
        "w-[220px] rounded-lg border-2 bg-card p-2 text-right text-xs shadow-sm transition-opacity hover:shadow-md",
        availability.borderClassName,
        data.dimmed && "opacity-25",
      )}
    >
      <Handle type="target" position={Position.Left} className="!opacity-0" />
      <div className="flex items-start justify-between gap-1">
        <span className="line-clamp-2 font-medium text-card-foreground">{data.name}</span>
        <AvailabilityIcon className="mt-0.5 size-3.5 shrink-0" aria-hidden />
      </div>
      <p className="mt-0.5 font-mono text-[0.65rem] text-muted-foreground" dir="ltr">
        {data.courseCode}
      </p>
      <div className="mt-1.5 flex items-center gap-1">
        <StatusIcon className={cn("size-3.5 shrink-0", status.className)} aria-hidden />
        <span className="text-muted-foreground">{status.label}</span>
      </div>
      <Handle type="source" position={Position.Right} className="!opacity-0" />
    </button>
  );
}

export { STATUS_META, AVAILABILITY_META };
