"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { addCurriculumCourseAction } from "@/lib/admin/curricula/actions";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { CATEGORY_LABEL, CATEGORY_OPTIONS } from "./category-labels";

export interface AddCurriculumCourseFormProps {
  curriculumId: string;
  courses: { id: string; name: string; courseCode: string }[];
}

export function AddCurriculumCourseForm({ curriculumId, courses }: AddCurriculumCourseFormProps) {
  const router = useRouter();
  const [courseId, setCourseId] = useState("");
  const [category, setCategory] = useState<string>(CATEGORY_OPTIONS[0]);
  const [required, setRequired] = useState(true);
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
    formData.set("curriculumId", curriculumId);
    formData.set("courseId", courseId);
    formData.set("category", category);
    formData.set("required", required ? "true" : "false");

    startTransition(async () => {
      const result = await addCurriculumCourseAction({}, formData);
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
        <Label htmlFor="addCourse">Course</Label>
        <Select value={courseId} onValueChange={(v) => setCourseId(v ?? "")}>
          <SelectTrigger id="addCourse" className="w-64" aria-label="Course">
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

      <div className="flex flex-col gap-1">
        <Label htmlFor="addCategory">Category</Label>
        <Select value={category} onValueChange={(v) => setCategory(v ?? CATEGORY_OPTIONS[0])}>
          <SelectTrigger id="addCategory" className="w-56" aria-label="Category">
            <SelectValue placeholder="Category">
              {(value: string) => CATEGORY_LABEL[value] ?? value}
            </SelectValue>
          </SelectTrigger>
          <SelectContent>
            {CATEGORY_OPTIONS.map((option) => (
              <SelectItem key={option} value={option}>
                {CATEGORY_LABEL[option]}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      <label className="flex items-center gap-1.5 text-sm">
        <input
          type="checkbox"
          checked={required}
          onChange={(event) => setRequired(event.target.checked)}
        />
        Required
      </label>

      <Button type="submit" disabled={isPending}>
        {isPending ? "Adding…" : "Add to curriculum"}
      </Button>

      {error && <p className="w-full text-xs text-destructive">{error}</p>}
    </form>
  );
}
