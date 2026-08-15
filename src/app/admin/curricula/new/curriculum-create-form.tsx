"use client";

import { useActionState } from "react";
import { createCurriculumAction, type AdminActionState } from "@/lib/admin/curricula/actions";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

const initialState: AdminActionState = {};

export function CurriculumCreateForm() {
  const [state, formAction, pending] = useActionState(createCurriculumAction, initialState);

  return (
    <form action={formAction} className="flex flex-col gap-4">
      <div className="flex flex-col gap-2">
        <Label htmlFor="name">Name</Label>
        <Input id="name" name="name" required />
      </div>
      <div className="flex flex-col gap-2">
        <Label htmlFor="major">Major</Label>
        <Input id="major" name="major" required />
      </div>
      <div className="flex flex-col gap-2">
        <Label htmlFor="orientation">Orientation</Label>
        <Input id="orientation" name="orientation" required />
      </div>
      <div className="flex gap-2">
        <div className="flex flex-1 flex-col gap-2">
          <Label htmlFor="entryYearFrom">Entry year from</Label>
          <Input id="entryYearFrom" name="entryYearFrom" type="number" min={1} />
        </div>
        <div className="flex flex-1 flex-col gap-2">
          <Label htmlFor="entryYearTo">Entry year to</Label>
          <Input id="entryYearTo" name="entryYearTo" type="number" min={1} />
        </div>
      </div>
      <div className="flex flex-col gap-2">
        <Label htmlFor="totalRequiredUnits">Total required units (leave blank if unverified)</Label>
        <Input id="totalRequiredUnits" name="totalRequiredUnits" type="number" min={1} />
      </div>
      <input type="hidden" name="status" value="ACTIVE" />
      {state.error && <p className="text-sm text-destructive">{state.error}</p>}
      <Button type="submit" disabled={pending}>
        {pending ? "Creating…" : "Create curriculum"}
      </Button>
    </form>
  );
}
