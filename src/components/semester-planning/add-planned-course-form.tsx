"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { setCourseStatusAction } from "@/lib/academic-status/actions";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

export interface AddPlannedCourseFormProps {
  courses: { id: string; name: string; courseCode: string }[];
}

// docs/02_User_Flow.md §8, §11 — "Select course, select term" is the
// documented planning flow; a new term code naturally creates a new
// semester (docs/07_Database_Schema.md §13 — terms are upserted on use),
// so this one form covers both "add to an existing semester" and "plan a
// new semester."
export function AddPlannedCourseForm({ courses }: AddPlannedCourseFormProps) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();
  const [courseId, setCourseId] = useState("");
  const [termCode, setTermCode] = useState("");
  const [error, setError] = useState<string | null>(null);
  const courseNameById = new Map(courses.map((c) => [c.id, c.name]));

  function handleSubmit(event: React.FormEvent) {
    event.preventDefault();
    setError(null);
    if (!courseId) {
      setError("Select a course.");
      return;
    }
    const formData = new FormData();
    formData.set("courseId", courseId);
    formData.set("status", "PLANNED");
    formData.set("plannedTermCode", termCode);
    startTransition(async () => {
      const result = await setCourseStatusAction({}, formData);
      if (result.error) {
        setError(result.error);
        return;
      }
      setCourseId("");
      setTermCode("");
      router.refresh();
    });
  }

  return (
    <form onSubmit={handleSubmit} className="flex flex-wrap items-end gap-2 border-b pb-3">
      <div className="flex flex-col gap-1">
        <Label htmlFor="plan-course">Course</Label>
        <Select value={courseId} onValueChange={(value) => setCourseId(value ?? "")}>
          <SelectTrigger id="plan-course" className="w-full sm:w-64" aria-label="Course to plan">
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
      </div>

      <div className="flex flex-col gap-1">
        <Label htmlFor="plan-term">Term</Label>
        <Input
          id="plan-term"
          aria-label="Intended term"
          placeholder="4051"
          value={termCode}
          onChange={(event) => setTermCode(event.target.value)}
          className="w-24"
          dir="ltr"
        />
      </div>

      <Button type="submit" disabled={isPending}>
        {isPending ? "Adding…" : "Add to plan"}
      </Button>

      {error && (
        <p className="w-full text-xs text-destructive" role="alert">
          {error}
        </p>
      )}
    </form>
  );
}
