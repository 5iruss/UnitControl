"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { addGroupCourseAction } from "@/lib/admin/course-groups/actions";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

export interface AddGroupCourseFormProps {
  courseGroupId: string;
  courses: { id: string; name: string; courseCode: string }[];
}

export function AddGroupCourseForm({ courseGroupId, courses }: AddGroupCourseFormProps) {
  const router = useRouter();
  const [courseId, setCourseId] = useState("");
  const [isPending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);

  const courseNameById = new Map(courses.map((c) => [c.id, `${c.name} (${c.courseCode})`]));

  function handleSubmit(event: React.FormEvent) {
    event.preventDefault();
    setError(null);
    if (!courseId) {
      setError("Select a course.");
      return;
    }
    const formData = new FormData();
    formData.set("courseGroupId", courseGroupId);
    formData.set("courseId", courseId);

    startTransition(async () => {
      const result = await addGroupCourseAction({}, formData);
      if (result.error) {
        setError(result.error);
        return;
      }
      setCourseId("");
      router.refresh();
    });
  }

  return (
    <form onSubmit={handleSubmit} className="flex flex-wrap items-end gap-2 border-t pt-3">
      <div className="flex flex-col gap-1">
        <Label htmlFor="groupCourse">Course</Label>
        <Select value={courseId} onValueChange={(v) => setCourseId(v ?? "")}>
          <SelectTrigger id="groupCourse" className="w-64" aria-label="Course">
            <SelectValue placeholder="Select a course">
              {(value: string) => courseNameById.get(value) ?? value}
            </SelectValue>
          </SelectTrigger>
          <SelectContent>
            {courses.map((course) => (
              <SelectItem key={course.id} value={course.id}>
                {course.name} ({course.courseCode})
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>
      <Button type="submit" disabled={isPending}>
        {isPending ? "Adding…" : "Add to group"}
      </Button>
      {error && <p className="w-full text-xs text-destructive" role="alert">{error}</p>}
    </form>
  );
}
