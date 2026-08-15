"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { createRelationshipAction } from "@/lib/admin/relationships/actions";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

export interface AddRelationshipFormProps {
  courseId: string;
  otherCourses: { id: string; name: string; courseCode: string }[];
}

const DIRECTION_LABEL: Record<string, string> = {
  this_requires: "This course requires (as)",
  this_provides: "This course is a (for)",
};

const TYPE_LABEL: Record<string, string> = {
  PREREQUISITE: "Prerequisite",
  COREQUISITE: "Corequisite",
};

// docs/08_Admin_Panel.md §7 — create a verified relationship between two
// existing courses. "Direction" only decides which id is source vs target;
// it carries no academic interpretation of its own (that stays in the Rules
// Engine, docs/04_Academic_Rules_Engine.md).
export function AddRelationshipForm({ courseId, otherCourses }: AddRelationshipFormProps) {
  const router = useRouter();
  const [direction, setDirection] = useState("this_requires");
  const [relationshipType, setRelationshipType] = useState("PREREQUISITE");
  const [otherCourseId, setOtherCourseId] = useState("");
  const [isPending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);

  const courseNameById = new Map(otherCourses.map((c) => [c.id, `${c.name} (${c.courseCode})`]));

  function handleSubmit(event: React.FormEvent) {
    event.preventDefault();
    setError(null);
    if (!otherCourseId) {
      setError("Select the other course.");
      return;
    }
    const sourceCourseId = direction === "this_requires" ? otherCourseId : courseId;
    const targetCourseId = direction === "this_requires" ? courseId : otherCourseId;

    const formData = new FormData();
    formData.set("sourceCourseId", sourceCourseId);
    formData.set("targetCourseId", targetCourseId);
    formData.set("relationshipType", relationshipType);

    startTransition(async () => {
      const result = await createRelationshipAction({}, formData);
      if (result.error) {
        setError(result.error);
        return;
      }
      setOtherCourseId("");
      router.refresh();
    });
  }

  return (
    <form onSubmit={handleSubmit} className="flex flex-wrap items-end gap-2 border-t pt-3">
      <div className="flex flex-col gap-1">
        <Label htmlFor="direction">Direction</Label>
        <Select value={direction} onValueChange={(v) => setDirection(v ?? "this_requires")}>
          <SelectTrigger id="direction" className="w-56" aria-label="Direction">
            <SelectValue placeholder="Direction">
              {(value: string) => DIRECTION_LABEL[value] ?? value}
            </SelectValue>
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="this_requires">This course requires (as)</SelectItem>
            <SelectItem value="this_provides">This course is a (for)</SelectItem>
          </SelectContent>
        </Select>
      </div>

      <div className="flex flex-col gap-1">
        <Label htmlFor="relationshipType">Relationship type</Label>
        <Select value={relationshipType} onValueChange={(v) => setRelationshipType(v ?? "PREREQUISITE")}>
          <SelectTrigger id="relationshipType" className="w-40" aria-label="Relationship type">
            <SelectValue placeholder="Type">{(value: string) => TYPE_LABEL[value] ?? value}</SelectValue>
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="PREREQUISITE">Prerequisite</SelectItem>
            <SelectItem value="COREQUISITE">Corequisite</SelectItem>
          </SelectContent>
        </Select>
      </div>

      <div className="flex flex-col gap-1">
        <Label htmlFor="otherCourse">Other course</Label>
        <Select value={otherCourseId} onValueChange={(v) => setOtherCourseId(v ?? "")}>
          <SelectTrigger id="otherCourse" className="w-64" aria-label="Other course">
            <SelectValue placeholder="Select a course">
              {(value: string) => courseNameById.get(value) ?? value}
            </SelectValue>
          </SelectTrigger>
          <SelectContent>
            {otherCourses.map((course) => (
              <SelectItem key={course.id} value={course.id}>
                {course.name} ({course.courseCode})
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      <Button type="submit" disabled={isPending}>
        {isPending ? "Adding…" : "Add relationship"}
      </Button>

      {error && <p className="w-full text-xs text-destructive">{error}</p>}
    </form>
  );
}
