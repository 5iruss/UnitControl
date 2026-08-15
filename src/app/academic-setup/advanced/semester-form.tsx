"use client";

import { useActionState } from "react";
import { saveSemesterAction, type AcademicStatusActionState } from "@/lib/academic-status/actions";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

const initialState: AcademicStatusActionState = {};

export function SemesterForm() {
  const [state, formAction, pending] = useActionState(saveSemesterAction, initialState);

  return (
    <form action={formAction} className="flex flex-wrap items-end gap-2">
      <div className="flex flex-col gap-1">
        <Label htmlFor="termCode">Academic term code</Label>
        <Input id="termCode" name="termCode" placeholder="4051" className="w-28" required dir="ltr" />
      </div>
      <div className="flex flex-col gap-1">
        <Label htmlFor="semesterGpa">Semester GPA</Label>
        <Input
          id="semesterGpa"
          name="semesterGpa"
          type="number"
          step="0.01"
          className="w-28"
          required
        />
      </div>
      <Button type="submit" disabled={pending}>
        {pending ? "Saving…" : "Add / update semester"}
      </Button>
      {state.error && (
        <p className="w-full text-sm text-destructive" role="alert">
          {state.error}
        </p>
      )}
      {state.success && (
        <p className="w-full text-sm text-emerald-700 dark:text-emerald-400" role="status" aria-live="polite">
          {state.success}
        </p>
      )}
    </form>
  );
}
