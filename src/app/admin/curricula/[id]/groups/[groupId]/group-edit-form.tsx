"use client";

import { useActionState } from "react";
import { updateCourseGroupAction, type AdminActionState } from "@/lib/admin/course-groups/actions";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

const initialState: AdminActionState = {};

export interface GroupEditFormProps {
  group: {
    id: string;
    curriculumId: string;
    name: string;
    groupType: string;
    requiredUnits: number | null;
    minimumCourses: number | null;
    maximumCourses: number | null;
  };
}

export function GroupEditForm({ group }: GroupEditFormProps) {
  const [state, formAction, pending] = useActionState(updateCourseGroupAction, initialState);

  return (
    <form action={formAction} className="flex flex-col gap-4">
      <input type="hidden" name="id" value={group.id} />
      <input type="hidden" name="curriculumId" value={group.curriculumId} />
      <div className="flex flex-col gap-2">
        <Label htmlFor="name">Name</Label>
        <Input id="name" name="name" defaultValue={group.name} required />
      </div>
      <div className="flex flex-col gap-2">
        <Label htmlFor="groupType">Group type</Label>
        <Input id="groupType" name="groupType" defaultValue={group.groupType} required />
      </div>
      <div className="flex flex-col gap-2">
        <Label htmlFor="requiredUnits">Required units</Label>
        <Input
          id="requiredUnits"
          name="requiredUnits"
          type="number"
          min={1}
          defaultValue={group.requiredUnits ?? ""}
        />
      </div>
      <div className="flex gap-2">
        <div className="flex flex-1 flex-col gap-2">
          <Label htmlFor="minimumCourses">Min. courses</Label>
          <Input
            id="minimumCourses"
            name="minimumCourses"
            type="number"
            min={1}
            defaultValue={group.minimumCourses ?? ""}
          />
        </div>
        <div className="flex flex-1 flex-col gap-2">
          <Label htmlFor="maximumCourses">Max. courses</Label>
          <Input
            id="maximumCourses"
            name="maximumCourses"
            type="number"
            min={1}
            defaultValue={group.maximumCourses ?? ""}
          />
        </div>
      </div>
      {state.error && <p className="text-sm text-destructive" role="alert">{state.error}</p>}
      <Button type="submit" disabled={pending}>
        {pending ? "Saving…" : "Save changes"}
      </Button>
    </form>
  );
}
