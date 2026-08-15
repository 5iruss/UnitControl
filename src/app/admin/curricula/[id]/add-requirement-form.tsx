"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { createRequirementAction } from "@/lib/admin/requirements/actions";
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
import { CATEGORY_LABEL, CATEGORY_OPTIONS } from "./category-labels";

export interface AddRequirementFormProps {
  curriculumId: string;
  courseGroups: { id: string; name: string }[];
}

const REQUIREMENT_TYPES = [
  "TOTAL_UNITS",
  "CATEGORY_UNITS",
  "ELECTIVE_UNITS",
  "PRACTICAL_UNITS",
  "COURSE_GROUP",
] as const;

const TYPE_LABEL: Record<string, string> = {
  TOTAL_UNITS: "Total units",
  CATEGORY_UNITS: "Category units",
  ELECTIVE_UNITS: "Elective units",
  PRACTICAL_UNITS: "Practical units",
  COURSE_GROUP: "Course group",
};

// docs/07_Database_Schema.md §11 — only the fields relevant to the selected
// requirement type are shown (mirrors domain/admin's server-side validation,
// see lib/admin/requirements/actions.ts).
export function AddRequirementForm({ curriculumId, courseGroups }: AddRequirementFormProps) {
  const router = useRouter();
  const [requirementType, setRequirementType] = useState<string>("TOTAL_UNITS");
  const [name, setName] = useState("");
  const [category, setCategory] = useState<string>(CATEGORY_OPTIONS[0]);
  const [requiredUnits, setRequiredUnits] = useState("");
  const [minimumPracticalUnits, setMinimumPracticalUnits] = useState("");
  const [courseGroupId, setCourseGroupId] = useState("");
  const [isPending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);

  const groupNameById = new Map(courseGroups.map((g) => [g.id, g.name]));

  function handleSubmit(event: React.FormEvent) {
    event.preventDefault();
    setError(null);
    if (!name.trim()) {
      setError("Name is required.");
      return;
    }
    if (requirementType === "COURSE_GROUP" && !courseGroupId) {
      setError("Select a course group.");
      return;
    }

    const formData = new FormData();
    formData.set("curriculumId", curriculumId);
    formData.set("requirementType", requirementType);
    formData.set("name", name);
    formData.set("category", requirementType === "CATEGORY_UNITS" ? category : "");
    formData.set(
      "requiredUnits",
      ["TOTAL_UNITS", "CATEGORY_UNITS", "ELECTIVE_UNITS"].includes(requirementType) ? requiredUnits : "",
    );
    formData.set(
      "minimumPracticalUnits",
      requirementType === "PRACTICAL_UNITS" ? minimumPracticalUnits : "",
    );
    formData.set("courseGroupId", requirementType === "COURSE_GROUP" ? courseGroupId : "");

    startTransition(async () => {
      const result = await createRequirementAction({}, formData);
      if (result.error) {
        setError(result.error);
        return;
      }
      setName("");
      setRequiredUnits("");
      setMinimumPracticalUnits("");
      setCourseGroupId("");
      router.refresh();
    });
  }

  return (
    <form onSubmit={handleSubmit} className="flex flex-col gap-2 border-t pt-3">
      <div className="flex flex-wrap items-end gap-2">
        <div className="flex flex-col gap-1">
          <Label htmlFor="requirementType">Type</Label>
          <Select value={requirementType} onValueChange={(v) => setRequirementType(v ?? "TOTAL_UNITS")}>
            <SelectTrigger id="requirementType" className="w-48" aria-label="Type">
              <SelectValue placeholder="Type">{(value: string) => TYPE_LABEL[value] ?? value}</SelectValue>
            </SelectTrigger>
            <SelectContent>
              {REQUIREMENT_TYPES.map((type) => (
                <SelectItem key={type} value={type}>
                  {TYPE_LABEL[type]}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        <div className="flex flex-col gap-1">
          <Label htmlFor="reqName">Name</Label>
          <Input
            id="reqName"
            value={name}
            onChange={(event) => setName(event.target.value)}
            className="w-48"
          />
        </div>

        {requirementType === "CATEGORY_UNITS" && (
          <div className="flex flex-col gap-1">
            <Label htmlFor="reqCategory">Applies to category</Label>
            <Select value={category} onValueChange={(v) => setCategory(v ?? CATEGORY_OPTIONS[0])}>
              <SelectTrigger id="reqCategory" className="w-48" aria-label="Applies to category">
                <SelectValue placeholder="Category">
                  {(value: string) => CATEGORY_LABEL[value] ?? value}
                </SelectValue>
              </SelectTrigger>
              <SelectContent>
                {CATEGORY_OPTIONS.map((option) => (
                  <SelectItem key={option} value={option}>
                    {CATEGORY_LABEL[option]}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        )}

        {["TOTAL_UNITS", "CATEGORY_UNITS", "ELECTIVE_UNITS"].includes(requirementType) && (
          <div className="flex flex-col gap-1">
            <Label htmlFor="reqUnits">Required units</Label>
            <Input
              id="reqUnits"
              type="number"
              min={1}
              value={requiredUnits}
              onChange={(event) => setRequiredUnits(event.target.value)}
              className="w-28"
            />
          </div>
        )}

        {requirementType === "PRACTICAL_UNITS" && (
          <div className="flex flex-col gap-1">
            <Label htmlFor="reqPracticalUnits">Minimum practical units</Label>
            <Input
              id="reqPracticalUnits"
              type="number"
              min={1}
              value={minimumPracticalUnits}
              onChange={(event) => setMinimumPracticalUnits(event.target.value)}
              className="w-28"
            />
          </div>
        )}

        {requirementType === "COURSE_GROUP" && (
          <div className="flex flex-col gap-1">
            <Label htmlFor="reqGroup">Course group</Label>
            <Select value={courseGroupId} onValueChange={(v) => setCourseGroupId(v ?? "")}>
              <SelectTrigger id="reqGroup" className="w-48" aria-label="Course group">
                <SelectValue placeholder="Select a group">
                  {(value: string) => groupNameById.get(value) ?? value}
                </SelectValue>
              </SelectTrigger>
              <SelectContent>
                {courseGroups.map((group) => (
                  <SelectItem key={group.id} value={group.id}>
                    {group.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        )}

        <Button type="submit" disabled={isPending}>
          {isPending ? "Adding…" : "Add requirement"}
        </Button>
      </div>
      {error && <p className="text-xs text-destructive" role="alert">{error}</p>}
    </form>
  );
}
