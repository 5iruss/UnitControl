"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { setCourseStatusAction } from "@/lib/academic-status/actions";
import type { CourseStatusValue } from "@/domain/academic-status";
import type { AvailabilityStatus, RelationshipType } from "@/domain/academic";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { AVAILABILITY_META, STATUS_META } from "./status-meta";

// "Not completed" first (the reset option), then the shared status-meta.ts
// order — labels/icons come from that single source, not redeclared here.
const STATUS_OPTION_ORDER: CourseStatusValue[] = [
  "NOT_COMPLETED",
  "PASSED",
  "FAILED",
  "CURRENTLY_STUDYING",
  "PLANNED",
];
const STATUS_OPTIONS = STATUS_OPTION_ORDER.map((value) => ({
  value,
  label: STATUS_META[value].label,
}));
const STATUS_LABEL_BY_VALUE = new Map(STATUS_OPTIONS.map((o) => [o.value, o.label]));

const AVAILABILITY_BADGE_VARIANT: Record<AvailabilityStatus, "default" | "destructive" | "secondary"> = {
  AVAILABLE: "default",
  BLOCKED: "destructive",
  AVAILABLE_WITH_WARNING: "secondary",
};

export interface DetailRelationship {
  relationshipType: RelationshipType;
  /// docs/03_UX_UI_Specification.md §11 — prerequisite edges are directed;
  /// "requires" = this course requires the other as a prerequisite,
  /// "requiredBy" = the other course requires this one.
  direction: "requires" | "requiredBy" | "corequisite";
  otherCourseId: string;
  otherCourseName: string;
}

export interface CourseDetailDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  courseId: string;
  courseCode: string;
  courseName: string;
  categoryLabel: string;
  currentStatus: CourseStatusValue;
  currentTermCode: string | null;
  availabilityStatus: AvailabilityStatus;
  reasons: string[];
  warnings: string[];
  relationships: DetailRelationship[];
  /// docs/04_Academic_Rules_Engine.md §8 concept: a status armed in the
  /// toolbar pre-fills the dialog rather than applying instantly — see
  /// Phase 7 report ambiguity #2 (deliberate-interaction safety).
  presetStatus: CourseStatusValue | null;
}

export function CourseDetailDialog(props: CourseDetailDialogProps) {
  const {
    open,
    onOpenChange,
    courseId,
    courseCode,
    courseName,
    categoryLabel,
    currentStatus,
    currentTermCode,
    availabilityStatus,
    reasons,
    warnings,
    relationships,
    presetStatus,
  } = props;

  const router = useRouter();
  const [isPending, startTransition] = useTransition();
  // The parent only mounts this component while a course is selected (see
  // CurriculumMapView), and unmounts it on close — so state is always fresh
  // per course without needing an effect to reset it on reopen.
  const [status, setStatus] = useState<CourseStatusValue>(presetStatus ?? currentStatus);
  const [termCode, setTermCode] = useState(currentTermCode ?? "");
  const [error, setError] = useState<string | null>(null);
  const AvailabilityIcon = AVAILABILITY_META[availabilityStatus].icon;

  function handleSubmit(event: React.FormEvent) {
    event.preventDefault();
    setError(null);
    const formData = new FormData();
    formData.set("courseId", courseId);
    formData.set("status", status);
    if (status === "PLANNED") formData.set("plannedTermCode", termCode);

    startTransition(async () => {
      const result = await setCourseStatusAction({}, formData);
      if (result.error) {
        setError(result.error);
        return;
      }
      router.refresh();
      onOpenChange(false);
    });
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent dir="rtl" className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>{courseName}</DialogTitle>
          <DialogDescription dir="ltr" className="text-left font-mono text-xs">
            {courseCode}
          </DialogDescription>
        </DialogHeader>

        <div className="flex flex-wrap items-center gap-2 text-sm">
          <Badge variant="outline">{categoryLabel}</Badge>
          <Badge variant={AVAILABILITY_BADGE_VARIANT[availabilityStatus]}>
            <AvailabilityIcon aria-hidden />
            {AVAILABILITY_META[availabilityStatus].label}
          </Badge>
        </div>

        {reasons.length > 0 && (
          <div className="flex flex-col gap-1 rounded-md bg-destructive/10 p-2 text-xs text-destructive">
            {reasons.map((reason) => (
              <p key={reason}>{reason}</p>
            ))}
          </div>
        )}

        {warnings.length > 0 && (
          <div className="flex flex-col gap-1 rounded-md bg-amber-500/10 p-2 text-xs text-amber-700 dark:text-amber-400">
            {warnings.map((warning) => (
              <p key={warning}>{warning}</p>
            ))}
          </div>
        )}

        <div className="flex flex-col gap-1 text-xs">
          <p className="font-medium text-foreground">Relationships</p>
          {relationships.length === 0 ? (
            <p className="text-muted-foreground">
              No verified prerequisite or corequisite relationships for this course.
            </p>
          ) : (
            relationships.map((rel) => (
              <p key={`${rel.relationshipType}-${rel.otherCourseId}`} className="text-muted-foreground">
                {rel.direction === "requires" && `Requires prerequisite: ${rel.otherCourseName}`}
                {rel.direction === "requiredBy" && `Is a prerequisite for: ${rel.otherCourseName}`}
                {rel.direction === "corequisite" && `Corequisite: ${rel.otherCourseName}`}
              </p>
            ))
          )}
        </div>

        <form onSubmit={handleSubmit} className="flex flex-col gap-3 border-t pt-3">
          <div className="flex flex-col gap-1">
            <Label htmlFor="detail-status">Status</Label>
            <Select
              value={status}
              onValueChange={(value) => setStatus(value as CourseStatusValue)}
            >
              <SelectTrigger id="detail-status" aria-label="Status">
                <SelectValue>
                  {(value: CourseStatusValue) => STATUS_LABEL_BY_VALUE.get(value) ?? value}
                </SelectValue>
              </SelectTrigger>
              <SelectContent>
                {STATUS_OPTIONS.map((option) => (
                  <SelectItem key={option.value} value={option.value}>
                    {option.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {status === "PLANNED" && (
            <div className="flex flex-col gap-1">
              <Label htmlFor="detail-term">Intended term</Label>
              <Input
                id="detail-term"
                aria-label="Intended term"
                placeholder="4051"
                value={termCode}
                onChange={(event) => setTermCode(event.target.value)}
                dir="ltr"
              />
            </div>
          )}

          {error && (
            <p className="text-xs text-destructive" role="alert">
              {error}
            </p>
          )}

          <Button type="submit" disabled={isPending}>
            {isPending ? "Saving…" : "Save status"}
          </Button>
        </form>
      </DialogContent>
    </Dialog>
  );
}
