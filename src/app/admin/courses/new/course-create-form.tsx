"use client";

import { useActionState } from "react";
import { createCourseAction, type AdminActionState } from "@/lib/admin/courses/actions";
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

export function CourseCreateForm() {
  const [state, formAction, pending] = useActionState(createCourseAction, initialState);

  return (
    <form action={formAction} className="flex flex-col gap-4">
      <div className="flex flex-col gap-2">
        <Label htmlFor="courseCode">Course code</Label>
        <Input id="courseCode" name="courseCode" required dir="ltr" />
      </div>
      <div className="flex flex-col gap-2">
        <Label htmlFor="name">Name</Label>
        <Input id="name" name="name" required />
      </div>
      <div className="flex flex-col gap-2">
        <Label htmlFor="credits">Credits (leave blank if unverified)</Label>
        <Input id="credits" name="credits" type="number" min={1} />
      </div>
      <div className="flex flex-col gap-2">
        <Label htmlFor="courseType">Course type (free text, optional)</Label>
        <Input id="courseType" name="courseType" />
      </div>
      <div className="flex flex-col gap-2">
        <Label htmlFor="isPractical">Practical classification</Label>
        <Select name="isPractical" defaultValue="unknown">
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
      {state.error && <p className="text-sm text-destructive">{state.error}</p>}
      <Button type="submit" disabled={pending}>
        {pending ? "Creating…" : "Create course"}
      </Button>
    </form>
  );
}
