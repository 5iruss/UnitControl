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

const initialState: AcademicStatusActionState = {};

const RESULT_OPTIONS = [
  { value: "PASSED", label: "Passed" },
  { value: "FAILED", label: "Failed" },
  { value: "CURRENTLY_STUDYING", label: "Currently studying" },
];

const RESULT_LABEL_BY_VALUE = new Map(RESULT_OPTIONS.map((o) => [o.value, o.label]));

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
        <SelectTrigger className="w-64" aria-label={`Course for term ${termCode}`}>
          <SelectValue placeholder="Select a course">
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
        <SelectTrigger aria-label={`Result for term ${termCode}`}>
          <SelectValue placeholder="Result">
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

      <Button type="submit" size="sm" aria-label={`Add result for term ${termCode}`} disabled={pending}>
        {pending ? "Saving…" : "Add result"}
      </Button>

      {state.error && <p className="w-full text-xs text-destructive">{state.error}</p>}
      {state.success && <p className="w-full text-xs text-green-600">{state.success}</p>}
    </form>
  );
}
