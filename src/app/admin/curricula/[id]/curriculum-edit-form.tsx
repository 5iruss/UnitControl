"use client";

import { useActionState } from "react";
import { updateCurriculumAction, type AdminActionState } from "@/lib/admin/curricula/actions";
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
import { STATUS_LABEL } from "@/app/admin/status-label";

const initialState: AdminActionState = {};

export interface CurriculumEditFormProps {
  curriculum: {
    id: string;
    name: string;
    major: string;
    orientation: string;
    entryYearFrom: number | null;
    entryYearTo: number | null;
    totalRequiredUnits: number | null;
    status: "ACTIVE" | "INACTIVE" | "ARCHIVED";
  };
}

// docs/08_Admin_Panel.md §5, §14 — curriculum metadata + archive-instead-of-
// delete status. There is no curriculum-delete action anywhere in the Admin
// Panel (docs Phase 10 pre-coding report item 4).
export function CurriculumEditForm({ curriculum }: CurriculumEditFormProps) {
  const [state, formAction, pending] = useActionState(updateCurriculumAction, initialState);

  return (
    <form action={formAction} className="flex flex-col gap-4">
      <input type="hidden" name="id" value={curriculum.id} />
      <div className="flex flex-col gap-2">
        <Label htmlFor="name">Name</Label>
        <Input id="name" name="name" defaultValue={curriculum.name} required />
      </div>
      <div className="flex flex-col gap-2">
        <Label htmlFor="major">Major</Label>
        <Input id="major" name="major" defaultValue={curriculum.major} required />
      </div>
      <div className="flex flex-col gap-2">
        <Label htmlFor="orientation">Orientation</Label>
        <Input id="orientation" name="orientation" defaultValue={curriculum.orientation} required />
      </div>
      <div className="flex gap-2">
        <div className="flex flex-1 flex-col gap-2">
          <Label htmlFor="entryYearFrom">Entry year from</Label>
          <Input
            id="entryYearFrom"
            name="entryYearFrom"
            type="number"
            min={1}
            defaultValue={curriculum.entryYearFrom ?? ""}
          />
        </div>
        <div className="flex flex-1 flex-col gap-2">
          <Label htmlFor="entryYearTo">Entry year to</Label>
          <Input
            id="entryYearTo"
            name="entryYearTo"
            type="number"
            min={1}
            defaultValue={curriculum.entryYearTo ?? ""}
          />
        </div>
      </div>
      <div className="flex flex-col gap-2">
        <Label htmlFor="totalRequiredUnits">Total required units (leave blank if unverified)</Label>
        <Input
          id="totalRequiredUnits"
          name="totalRequiredUnits"
          type="number"
          min={1}
          defaultValue={curriculum.totalRequiredUnits ?? ""}
        />
      </div>
      <div className="flex flex-col gap-2">
        <Label htmlFor="status">Status</Label>
        <Select name="status" defaultValue={curriculum.status}>
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
      {state.error && <p className="text-sm text-destructive" role="alert">{state.error}</p>}
      <Button type="submit" disabled={pending}>
        {pending ? "Saving…" : "Save changes"}
      </Button>
    </form>
  );
}
