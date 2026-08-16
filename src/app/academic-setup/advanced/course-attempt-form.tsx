"use client";

import { useActionState } from "react";
import {
  recordCourseAttemptAction,
  type AcademicStatusActionState,
} from "@/lib/academic-status/actions";
import { Button } from "@/components/ui/button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { STATUS_META } from "@/components/curriculum-map/status-meta";

const initialState: AcademicStatusActionState = {};

// Attempt results are a subset of the same course-status vocabulary
// (status-meta.ts) — labels are derived from there, not redeclared, so this
// list can never say something different than the map/planner/dashboard for
// the identical statuses.
const RESULT_OPTIONS = (["PASSED", "FAILED", "CURRENTLY_STUDYING"] as const).map((value) => ({
  value,
  label: STATUS_META[value].label,
}));

const RESULT_LABEL_BY_VALUE = new Map<string, string>(RESULT_OPTIONS.map((o) => [o.value, o.label]));

interface CourseAttemptFormProps {
  termCode: string;
  courses: { id: string; name: string; courseCode: string }[];
}

export function CourseAttemptForm({ termCode, courses }: CourseAttemptFormProps) {
  const [state, formAction, pending] = useActionState(recordCourseAttemptAction, initialState);
  const courseNameById = new Map(courses.map((c) => [c.id, c.name]));

  return (
    <form action={formAction} className="flex flex-wrap items-center gap-2">
      <input type="hidden" name="termCode" value={termCode} />

      <Select name="courseId">
        <SelectTrigger className="w-64" aria-label={`درس برای ترم ${termCode}`}>
          <SelectValue placeholder="یک درس را انتخاب کنید">
            {(value: string) => courseNameById.get(value) ?? value}
          </SelectValue>
        </SelectTrigger>
        <SelectContent>
          {courses.map((course) => (
            <SelectItem key={course.id} value={course.id}>
              {course.name}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>

      <Select name="result">
        <SelectTrigger aria-label={`نتیجه ترم ${termCode}`}>
          <SelectValue placeholder="نتیجه">
            {(value: string) => RESULT_LABEL_BY_VALUE.get(value) ?? value}
          </SelectValue>
        </SelectTrigger>
        <SelectContent>
          {RESULT_OPTIONS.map((option) => (
            <SelectItem key={option.value} value={option.value}>
              {option.label}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>

      <Button type="submit" size="sm" aria-label={`افزودن نتیجه ترم ${termCode}`} disabled={pending}>
        {pending ? "در حال ذخیره…" : "افزودن نتیجه"}
      </Button>

      {state.error && (
        <p className="w-full text-xs text-destructive" role="alert">
          {state.error}
        </p>
      )}
      {state.success && (
        <p className="w-full text-xs text-emerald-700 dark:text-emerald-400" role="status" aria-live="polite">
          {state.success}
        </p>
      )}
    </form>
  );
}
