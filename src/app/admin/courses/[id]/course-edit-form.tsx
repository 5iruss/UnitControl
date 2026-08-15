"use client";

import { useActionState } from "react";
import { updateCourseAction, type AdminActionState } from "@/lib/admin/courses/actions";
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

const initialState: AdminActionState = {};

const PRACTICAL_LABEL: Record<string, string> = {
  unknown: "Unknown / unverified",
  true: "Practical",
  false: "Theoretical",
};

const STATUS_LABEL: Record<string, string> = {
  ACTIVE: "Active",
  INACTIVE: "Inactive",
  ARCHIVED: "Archived",
};

export interface CourseEditFormProps {
  course: {
    id: string;
    courseCode: string;
    name: string;
    credits: number | null;
    courseType: string | null;
    isPractical: boolean | null;
    status: "ACTIVE" | "INACTIVE" | "ARCHIVED";
  };
}

// docs/08_Admin_Panel.md §6, §7 — edit fields the docs explicitly allow;
// never auto-fills credits/isPractical (docs Phase 10 prompt §7).
export function CourseEditForm({ course }: CourseEditFormProps) {
  const [state, formAction, pending] = useActionState(updateCourseAction, initialState);
  const isPracticalDefault = course.isPractical === null ? "unknown" : String(course.isPractical);

  return (
    <form action={formAction} className="flex flex-col gap-4">
      <input type="hidden" name="id" value={course.id} />
      <div className="flex flex-col gap-2">
        <Label htmlFor="courseCode">Course code</Label>
        <Input id="courseCode" name="courseCode" defaultValue={course.courseCode} required dir="ltr" />
      </div>
      <div className="flex flex-col gap-2">
        <Label htmlFor="name">Name</Label>
        <Input id="name" name="name" defaultValue={course.name} required />
      </div>
      <div className="flex flex-col gap-2">
        <Label htmlFor="credits">Credits (leave blank if unverified)</Label>
        <Input id="credits" name="credits" type="number" min={1} defaultValue={course.credits ?? ""} />
      </div>
      <div className="flex flex-col gap-2">
        <Label htmlFor="courseType">Course type (free text, optional)</Label>
        <Input id="courseType" name="courseType" defaultValue={course.courseType ?? ""} />
      </div>
      <div className="flex flex-col gap-2">
        <Label htmlFor="isPractical">Practical classification</Label>
        <Select name="isPractical" defaultValue={isPracticalDefault}>
          <SelectTrigger id="isPractical" aria-label="Practical classification">
            <SelectValue placeholder="Select">
              {(value: string) => PRACTICAL_LABEL[value] ?? value}
            </SelectValue>
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="unknown">Unknown / unverified</SelectItem>
            <SelectItem value="true">Practical</SelectItem>
            <SelectItem value="false">Theoretical</SelectItem>
          </SelectContent>
        </Select>
      </div>
      <div className="flex flex-col gap-2">
        <Label htmlFor="status">Status</Label>
        <Select name="status" defaultValue={course.status}>
          <SelectTrigger id="status" aria-label="Status">
            <SelectValue placeholder="Select">
              {(value: string) => STATUS_LABEL[value] ?? value}
            </SelectValue>
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="ACTIVE">Active</SelectItem>
            <SelectItem value="INACTIVE">Inactive</SelectItem>
            <SelectItem value="ARCHIVED">Archived</SelectItem>
          </SelectContent>
        </Select>
      </div>
      {state.error && <p className="text-sm text-destructive">{state.error}</p>}
      <Button type="submit" disabled={pending}>
        {pending ? "Saving…" : "Save changes"}
      </Button>
    </form>
  );
}
