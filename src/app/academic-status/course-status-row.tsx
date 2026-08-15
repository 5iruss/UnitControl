"use client";

import { useActionState, useState } from "react";
import { setCourseStatusAction, type AcademicStatusActionState } from "@/lib/academic-status/actions";
import type { CourseStatusValue } from "@/domain/academic-status";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

const STATUS_OPTIONS: { value: CourseStatusValue; label: string }[] = [
  { value: "NOT_COMPLETED", label: "Not completed" },
  { value: "PASSED", label: "Passed" },
  { value: "FAILED", label: "Failed" },
  { value: "CURRENTLY_STUDYING", label: "Currently studying" },
  { value: "PLANNED", label: "Planned" },
];

const STATUS_LABEL_BY_VALUE = new Map(STATUS_OPTIONS.map((o) => [o.value, o.label]));

const initialState: AcademicStatusActionState = {};

interface CourseStatusRowProps {
  courseId: string;
  courseName: string;
  courseCode: string;
  currentStatus: CourseStatusValue;
  currentTermCode: string | null;
}

export function CourseStatusRow({
  courseId,
  courseName,
  courseCode,
  currentStatus,
  currentTermCode,
}: CourseStatusRowProps) {
  const [state, formAction, pending] = useActionState(setCourseStatusAction, initialState);
  const [status, setStatus] = useState<CourseStatusValue>(currentStatus);

  return (
    <form
      action={formAction}
      className="flex flex-wrap items-center gap-2 border-b py-2 text-sm last:border-b-0"
    >
      <input type="hidden" name="courseId" value={courseId} />
      <div className="flex-1 min-w-48">
        <p>{courseName}</p>
        <p className="text-xs text-muted-foreground">{courseCode}</p>
      </div>

      <Select name="status" value={status} onValueChange={(value) => setStatus(value as CourseStatusValue)}>
        <SelectTrigger aria-label={`Status for ${courseName}`}>
          <SelectValue>
            {(value: CourseStatusValue) => STATUS_LABEL_BY_VALUE.get(value) ?? value}
          </SelectValue>
        </SelectTrigger>
        <SelectContent>
          {STATUS_OPTIONS.map((option) => (
            <SelectItem key={option.value} value={option.value}>
              {option.label}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>

      {status === "PLANNED" && (
        <Input
          name="plannedTermCode"
          aria-label={`Intended term for ${courseName}`}
          placeholder="4051"
          defaultValue={currentTermCode ?? ""}
          className="w-24"
        />
      )}

      <Button type="submit" size="sm" aria-label={`Save status for ${courseName}`} disabled={pending}>
        {pending ? "Saving…" : "Save"}
      </Button>

      {state.error && <p className="w-full text-xs text-destructive">{state.error}</p>}
      {state.success && <p className="w-full text-xs text-green-600">{state.success}</p>}
    </form>
  );
}
