"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import {
  removeCurriculumCourseAction,
  updateCurriculumCourseAction,
} from "@/lib/admin/curricula/actions";
import { Button } from "@/components/ui/button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { ConfirmActionButton } from "@/components/admin/confirm-action-button";
import { CATEGORY_LABEL, CATEGORY_OPTIONS } from "./category-labels";

export interface CurriculumCourseRowProps {
  membership: {
    id: string;
    curriculumId: string;
    courseId: string;
    category: string;
    required: boolean;
    course: { name: string; courseCode: string };
  };
}

export function CurriculumCourseRow({ membership }: CurriculumCourseRowProps) {
  const router = useRouter();
  const [editing, setEditing] = useState(false);
  const [category, setCategory] = useState(membership.category);
  const [required, setRequired] = useState(membership.required);
  const [isPending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);

  function handleSave() {
    setError(null);
    const formData = new FormData();
    formData.set("id", membership.id);
    formData.set("curriculumId", membership.curriculumId);
    formData.set("courseId", membership.courseId);
    formData.set("category", category);
    formData.set("required", required ? "true" : "false");

    startTransition(async () => {
      const result = await updateCurriculumCourseAction({}, formData);
      if (result.error) {
        setError(result.error);
        return;
      }
      setEditing(false);
      router.refresh();
    });
  }

  return (
    <li className="flex flex-col gap-1 border-b py-1.5 text-sm last:border-b-0">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <span>
          {membership.course.name}{" "}
          <span className="font-mono text-xs text-muted-foreground" dir="ltr">
            {membership.course.courseCode}
          </span>{" "}
          <span className="text-xs text-muted-foreground">
            ({CATEGORY_LABEL[membership.category] ?? membership.category},{" "}
            {membership.required ? "required" : "not required"})
          </span>
        </span>
        <div className="flex gap-2">
          <Button type="button" size="sm" variant="outline" onClick={() => setEditing((v) => !v)}>
            Edit
          </Button>
          <ConfirmActionButton
            label="Remove"
            title="Remove course from curriculum"
            description={`Remove ${membership.course.name} from this curriculum? This does not affect any student's existing course history.`}
            action={removeCurriculumCourseAction}
            fields={{ id: membership.id }}
          />
        </div>
      </div>

      {editing && (
        <div className="flex flex-wrap items-end gap-2">
          <Select value={category} onValueChange={(v) => setCategory(v ?? category)}>
            <SelectTrigger className="w-56" aria-label={`Category for ${membership.course.name}`}>
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
          <label className="flex items-center gap-1.5 text-sm">
            <input
              type="checkbox"
              checked={required}
              onChange={(event) => setRequired(event.target.checked)}
            />
            Required
          </label>
          <Button type="button" size="sm" onClick={handleSave} disabled={isPending}>
            {isPending ? "Saving…" : "Save"}
          </Button>
        </div>
      )}
      {error && <p className="text-xs text-destructive" role="alert">{error}</p>}
    </li>
  );
}
