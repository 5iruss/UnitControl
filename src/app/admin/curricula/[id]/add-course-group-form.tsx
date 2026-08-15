"use client";

import { useActionState } from "react";
import { createCourseGroupAction, type AdminActionState } from "@/lib/admin/course-groups/actions";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

const initialState: AdminActionState = {};

export interface AddCourseGroupFormProps {
  curriculumId: string;
}

export function AddCourseGroupForm({ curriculumId }: AddCourseGroupFormProps) {
  const [state, formAction, pending] = useActionState(createCourseGroupAction, initialState);

  return (
    <form action={formAction} className="flex flex-wrap items-end gap-2 border-t pt-3">
      <input type="hidden" name="curriculumId" value={curriculumId} />
      <div className="flex flex-col gap-1">
        <Label htmlFor="groupName">Name</Label>
        <Input id="groupName" name="name" required className="w-48" />
      </div>
      <div className="flex flex-col gap-1">
        <Label htmlFor="groupType">Group type</Label>
        <Input id="groupType" name="groupType" required className="w-40" placeholder="e.g. ELECTIVE" />
      </div>
      <div className="flex flex-col gap-1">
        <Label htmlFor="requiredUnits">Required units</Label>
        <Input id="requiredUnits" name="requiredUnits" type="number" min={1} className="w-24" />
      </div>
      <div className="flex flex-col gap-1">
        <Label htmlFor="minimumCourses">Min. courses</Label>
        <Input id="minimumCourses" name="minimumCourses" type="number" min={1} className="w-24" />
      </div>
      <div className="flex flex-col gap-1">
        <Label htmlFor="maximumCourses">Max. courses</Label>
        <Input id="maximumCourses" name="maximumCourses" type="number" min={1} className="w-24" />
      </div>
      <Button type="submit" disabled={pending}>
        {pending ? "Creating…" : "Create group"}
      </Button>
      {state.error && <p className="w-full text-xs text-destructive">{state.error}</p>}
    </form>
  );
}
