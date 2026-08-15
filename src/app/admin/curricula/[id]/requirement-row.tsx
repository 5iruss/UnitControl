"use client";

import { deleteRequirementAction } from "@/lib/admin/requirements/actions";
import { ConfirmActionButton } from "@/components/admin/confirm-action-button";
import { CATEGORY_LABEL } from "./category-labels";

export interface RequirementRowProps {
  requirement: {
    id: string;
    requirementType: string;
    name: string;
    category: string | null;
    requiredUnits: number | null;
    minimumPracticalUnits: number | null;
    courseGroup: { name: string } | null;
  };
}

function describeRequirement(requirement: RequirementRowProps["requirement"]): string {
  const parts: string[] = [requirement.requirementType];
  if (requirement.category) parts.push(CATEGORY_LABEL[requirement.category] ?? requirement.category);
  if (requirement.requiredUnits !== null) parts.push(`${requirement.requiredUnits} units`);
  if (requirement.minimumPracticalUnits !== null) {
    parts.push(`min. ${requirement.minimumPracticalUnits} practical units`);
  }
  if (requirement.courseGroup) parts.push(`group: ${requirement.courseGroup.name}`);
  return parts.join(", ");
}

export function RequirementRow({ requirement }: RequirementRowProps) {
  return (
    <li className="flex flex-wrap items-center justify-between gap-2 border-b py-1.5 text-sm last:border-b-0">
      <span>
        <span className="font-medium">{requirement.name}</span>{" "}
        <span className="text-xs text-muted-foreground">({describeRequirement(requirement)})</span>
      </span>
      <ConfirmActionButton
        label="Delete"
        title="Delete requirement"
        description={`Delete the requirement "${requirement.name}"?`}
        action={deleteRequirementAction}
        fields={{ id: requirement.id }}
      />
    </li>
  );
}
