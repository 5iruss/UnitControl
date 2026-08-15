"use client";

import { Handle, Position, type Node, type NodeProps } from "@xyflow/react";
import { cn } from "@/lib/utils";
import type { AvailabilityStatus, CourseStatus } from "@/domain/academic";
import { AVAILABILITY_META, STATUS_META } from "./status-meta";

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
      <div className="mt-1 flex items-center gap-1">
        <AvailabilityIcon className="size-3.5 shrink-0" aria-hidden />
        <span className="text-muted-foreground">{availability.label}</span>
      </div>
      <Handle type="source" position={Position.Right} className="!opacity-0" />
    </button>
  );
}
