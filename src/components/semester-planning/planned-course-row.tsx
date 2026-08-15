"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { setCourseStatusAction } from "@/lib/academic-status/actions";
import type { PlannedCourseViewModel } from "@/domain/semester-planning";
import { AVAILABILITY_META } from "@/components/curriculum-map/status-meta";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";

export interface PlannedCourseRowProps {
  course: PlannedCourseViewModel;
}

// docs/02_User_Flow.md §11 — "The student can modify their plan until
// they are satisfied." Move = resubmit PLANNED with a new term (re-gated
// by the Rules Engine, same as adding — see lib/academic-status/actions.ts).
// Remove = return to NOT_COMPLETED (docs §9: never touches attempt history).
export function PlannedCourseRow({ course }: PlannedCourseRowProps) {
  const router = useRouter();
  const [isMoving, startMoveTransition] = useTransition();
  const [isRemoving, startRemoveTransition] = useTransition();
  const [moveTermCode, setMoveTermCode] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [showMoveInput, setShowMoveInput] = useState(false);

  const availability = AVAILABILITY_META[course.eligibility.status];
  const AvailabilityIcon = availability.icon;

  function handleMove(event: React.FormEvent) {
    event.preventDefault();
    setError(null);
    const formData = new FormData();
    formData.set("courseId", course.courseId);
    formData.set("status", "PLANNED");
    formData.set("plannedTermCode", moveTermCode);
    startMoveTransition(async () => {
      const result = await setCourseStatusAction({}, formData);
      if (result.error) {
        setError(result.error);
        return;
      }
      setShowMoveInput(false);
      setMoveTermCode("");
      router.refresh();
    });
  }

  function handleRemove() {
    setError(null);
    const formData = new FormData();
    formData.set("courseId", course.courseId);
    formData.set("status", "NOT_COMPLETED");
    startRemoveTransition(async () => {
      const result = await setCourseStatusAction({}, formData);
      if (result.error) {
        setError(result.error);
        return;
      }
      router.refresh();
    });
  }

  return (
    <li className="flex flex-col gap-1 border-b py-2 text-sm last:border-b-0">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <div className="min-w-40 flex-1">
          <p>{course.name}</p>
          <p className="font-mono text-xs text-muted-foreground" dir="ltr">
            {course.courseCode}
          </p>
        </div>

        <span
          className="flex items-center gap-1 text-xs text-muted-foreground"
          aria-label={`Eligibility for ${course.name}: ${availability.label}`}
        >
          <AvailabilityIcon className="size-3.5" aria-hidden />
          {availability.label}
        </span>

        <Button
          type="button"
          size="sm"
          variant="outline"
          onClick={() => setShowMoveInput((prev) => !prev)}
        >
          Move
        </Button>
        <Button
          type="button"
          size="sm"
          variant="destructive"
          aria-label={`Remove ${course.name} from plan`}
          onClick={handleRemove}
          disabled={isRemoving}
        >
          {isRemoving ? "Removing…" : "Remove"}
        </Button>
      </div>

      {course.eligibility.reasons.length > 0 && (
        <p className="text-xs text-destructive">{course.eligibility.reasons.join(" ")}</p>
      )}
      {course.eligibility.warnings.length > 0 && (
        <p className="text-xs text-amber-700 dark:text-amber-400">
          {course.eligibility.warnings.join(" ")}
        </p>
      )}

      {showMoveInput && (
        <form onSubmit={handleMove} className="flex flex-wrap items-center gap-2">
          <Input
            aria-label={`New intended term for ${course.name}`}
            placeholder="4051"
            value={moveTermCode}
            onChange={(event) => setMoveTermCode(event.target.value)}
            className="w-24"
          />
          <Button type="submit" size="sm" disabled={isMoving}>
            {isMoving ? "Moving…" : "Save new term"}
          </Button>
        </form>
      )}

      {error && <p className="text-xs text-destructive">{error}</p>}
    </li>
  );
}
