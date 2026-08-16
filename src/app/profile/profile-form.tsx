"use client";

import { useActionState, useMemo, useState } from "react";
import { getMajors, getOrientationsForMajor } from "@/domain/academic-profile";
import type { CurriculumSummary } from "@/domain/academic-profile";
import type { ProfileActionState } from "@/lib/academic-profile/actions";
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

const initialState: ProfileActionState = {};

interface ProfileFormProps {
  action: (state: ProfileActionState, formData: FormData) => Promise<ProfileActionState>;
  curricula: CurriculumSummary[];
  defaultValues?: {
    entryYear: number;
    major: string;
    orientation: string;
    studyType: "FULL_TIME" | "PART_TIME";
  };
  submitLabel: string;
  mode: "create" | "edit";
}

export function ProfileForm({
  action,
  curricula,
  defaultValues,
  submitLabel,
  mode,
}: ProfileFormProps) {
  const [state, formAction, pending] = useActionState(action, initialState);
  const majors = useMemo(() => getMajors(curricula), [curricula]);

  // All fields are fully controlled: a Server Action round-trip (e.g. to
  // show the reset-confirmation warning below, without persisting anything)
  // re-renders the enclosing Server Component, and an uncontrolled native
  // <input defaultValue> can lose the user's in-progress edit across that
  // round-trip. Controlled state keeps entered values stable regardless.
  const [entryYear, setEntryYear] = useState(defaultValues?.entryYear?.toString() ?? "");
  const [selectedMajor, setSelectedMajor] = useState(defaultValues?.major ?? majors[0] ?? "");
  const [orientation, setOrientation] = useState(defaultValues?.orientation ?? "");
  const [studyType, setStudyType] = useState(defaultValues?.studyType ?? "");
  const orientations = useMemo(
    () => getOrientationsForMajor(curricula, selectedMajor),
    [curricula, selectedMajor],
  );
  const [confirmDismissed, setConfirmDismissed] = useState(false);

  const showConfirmation = mode === "edit" && !!state.pendingReset && !confirmDismissed;

  return (
    <form
      action={formAction}
      onSubmit={() => setConfirmDismissed(false)}
      className="flex flex-col gap-4"
    >
      <div className="flex flex-col gap-2">
        <Label htmlFor="entryYear">سال ورود</Label>
        <Input
          id="entryYear"
          name="entryYear"
          type="number"
          required
          value={entryYear}
          onChange={(e) => setEntryYear(e.target.value)}
          placeholder="1403"
          dir="ltr"
        />
      </div>

      <div className="flex flex-col gap-2">
        <Label htmlFor="major">رشته</Label>
        <Select
          name="major"
          value={selectedMajor}
          onValueChange={(value) => setSelectedMajor(value ?? "")}
        >
          <SelectTrigger id="major">
            <SelectValue placeholder="یک رشته را انتخاب کنید" />
          </SelectTrigger>
          <SelectContent>
            {majors.map((major) => (
              <SelectItem key={major} value={major}>
                {major}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      <div className="flex flex-col gap-2">
        <Label htmlFor="orientation">گرایش</Label>
        <Select
          name="orientation"
          value={orientation}
          onValueChange={(value) => setOrientation(value ?? "")}
        >
          <SelectTrigger id="orientation">
            <SelectValue placeholder="یک گرایش را انتخاب کنید" />
          </SelectTrigger>
          <SelectContent>
            {orientations.map((o) => (
              <SelectItem key={o} value={o}>
                {o}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      <div className="flex flex-col gap-2">
        <Label htmlFor="studyType">نوع تحصیل</Label>
        <Select
          name="studyType"
          value={studyType}
          onValueChange={(value) => setStudyType((value as typeof studyType) ?? "")}
        >
          <SelectTrigger id="studyType">
            <SelectValue placeholder="نوع تحصیل را انتخاب کنید" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="FULL_TIME">تمام‌وقت</SelectItem>
            <SelectItem value="PART_TIME">پاره‌وقت</SelectItem>
          </SelectContent>
        </Select>
      </div>

      {state.error && (
        <p className="text-sm text-destructive" role="alert">
          {state.error}
        </p>
      )}

      {showConfirmation && state.pendingReset && (
        <div className="flex flex-col gap-3 rounded-md border border-destructive/40 bg-destructive/5 p-3">
          <p className="text-sm">
            تغییر به <strong>{state.pendingReset.curriculumName}</strong> باعث حذف داده‌های وضعیت
            دروس تحصیلی فعلی شما می‌شود. پس از آن باید وضعیت تحصیلی خود را دوباره تنظیم کنید. این
            عملیات قابل بازگشت نیست.
          </p>
          <input type="hidden" name="confirmReset" value="true" />
          <div className="flex gap-2">
            <Button type="submit" variant="destructive">
              بله، بازنشانی و ادامه
            </Button>
            <Button type="button" variant="outline" onClick={() => setConfirmDismissed(true)}>
              انصراف
            </Button>
          </div>
        </div>
      )}

      {!showConfirmation && (
        <Button type="submit" disabled={pending}>
          {pending ? "در حال ذخیره…" : submitLabel}
        </Button>
      )}

      {state.success && !state.pendingReset && (
        <p className="text-sm text-emerald-700 dark:text-emerald-400" role="status" aria-live="polite">
          پروفایل ذخیره شد.
        </p>
      )}
    </form>
  );
}
