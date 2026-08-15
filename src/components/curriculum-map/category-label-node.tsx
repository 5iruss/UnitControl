"use client";

import type { Node, NodeProps } from "@xyflow/react";

export interface CategoryLabelData extends Record<string, unknown> {
  label: string;
}

export type CategoryLabelFlowNode = Node<CategoryLabelData, "categoryLabel">;

// docs/03_UX_UI_Specification.md §9 groups the map by curriculum category
// (docs/05_Curriculum_Data_Model.md §7). A non-interactive text node keeps
// the label inside React Flow's pannable/zoomable world, positioned by the
// same layout the course nodes use, rather than a fixed screen overlay.
export function CategoryLabelNode({ data }: NodeProps<CategoryLabelFlowNode>) {
  return (
    <div dir="rtl" className="pointer-events-none w-[900px] text-sm font-semibold text-foreground/80">
      {data.label}
    </div>
  );
}
