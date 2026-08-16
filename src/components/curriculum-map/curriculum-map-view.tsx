"use client";

import { useMemo, useState } from "react";
import {
  Background,
  Controls,
  MarkerType,
  MiniMap,
  ReactFlow,
  ReactFlowProvider,
  type Edge,
} from "@xyflow/react";
import "@xyflow/react/dist/style.css";
import { Button } from "@/components/ui/button";
import type { AvailabilityStatus, CourseStatus } from "@/domain/academic";
import type { CurriculumMapViewModel } from "@/domain/curriculum-map";
import type { CourseStatusValue } from "@/domain/academic-status";
import { CourseNode, type CourseFlowNode } from "./course-node";
import { CategoryLabelNode, type CategoryLabelFlowNode } from "./category-label-node";
import { CourseDetailDialog, type DetailRelationship } from "./course-detail-dialog";
import { AVAILABILITY_META, STATUS_META } from "./status-meta";

const NODE_TYPES = { course: CourseNode, categoryLabel: CategoryLabelNode };

type FlowNode = CourseFlowNode | CategoryLabelFlowNode;

// Derived from the shared status-meta.ts source (not redeclared here) so the
// filter/toolbar labels can never drift from the map card / planner /
// recommendations labels for the same statuses.
const STATUS_ORDER = Object.keys(STATUS_META) as CourseStatus[];
const STATUS_FILTER_OPTIONS = STATUS_ORDER.map((value) => ({
  value,
  label: STATUS_META[value].label,
  icon: STATUS_META[value].icon,
}));
const TOOLBAR_STATUS_OPTIONS = STATUS_ORDER.map((value) => ({
  value: value as CourseStatusValue,
  label: STATUS_META[value].label,
  icon: STATUS_META[value].icon,
}));

const AVAILABILITY_FILTER_OPTIONS = (["AVAILABLE", "BLOCKED"] as const satisfies readonly AvailabilityStatus[]).map(
  (value) => ({ value, label: AVAILABILITY_META[value].label, icon: AVAILABILITY_META[value].icon }),
);

type FilterValue = CourseStatus | AvailabilityStatus;

export interface CurriculumMapViewProps {
  viewModel: CurriculumMapViewModel;
}

export function CurriculumMapView({ viewModel }: CurriculumMapViewProps) {
  const [activeFilters, setActiveFilters] = useState<Set<FilterValue>>(new Set());
  const [armedStatus, setArmedStatus] = useState<CourseStatusValue | null>(null);
  const [selectedCourseId, setSelectedCourseId] = useState<string | null>(null);

  const courseById = useMemo(
    () => new Map(viewModel.nodes.map((node) => [node.courseId, node])),
    [viewModel.nodes],
  );

  const categoryLabelByCourseId = useMemo(() => {
    const map = new Map<string, string>();
    for (const group of viewModel.categories) {
      for (const node of group.nodes) map.set(node.courseId, group.label);
    }
    return map;
  }, [viewModel.categories]);

  const relationshipsByCourseId = useMemo(() => {
    const map = new Map<string, DetailRelationship[]>();
    for (const edge of viewModel.edges) {
      const source = courseById.get(edge.sourceCourseId);
      const target = courseById.get(edge.targetCourseId);
      if (!source || !target) continue;

      if (edge.relationshipType === "COREQUISITE") {
        for (const [id, other] of [
          [edge.sourceCourseId, target],
          [edge.targetCourseId, source],
        ] as const) {
          const list = map.get(id) ?? [];
          list.push({
            relationshipType: "COREQUISITE",
            direction: "corequisite",
            otherCourseId: other.courseId,
            otherCourseName: other.name,
          });
          map.set(id, list);
        }
        continue;
      }

      const requiresList = map.get(edge.targetCourseId) ?? [];
      requiresList.push({
        relationshipType: "PREREQUISITE",
        direction: "requires",
        otherCourseId: source.courseId,
        otherCourseName: source.name,
      });
      map.set(edge.targetCourseId, requiresList);

      const requiredByList = map.get(edge.sourceCourseId) ?? [];
      requiredByList.push({
        relationshipType: "PREREQUISITE",
        direction: "requiredBy",
        otherCourseId: target.courseId,
        otherCourseName: target.name,
      });
      map.set(edge.sourceCourseId, requiredByList);
    }
    return map;
  }, [viewModel.edges, courseById]);

  function toggleFilter(value: FilterValue) {
    setActiveFilters((prev) => {
      const next = new Set(prev);
      if (next.has(value)) next.delete(value);
      else next.add(value);
      return next;
    });
  }

  function toggleArmedStatus(value: CourseStatusValue) {
    setArmedStatus((prev) => (prev === value ? null : value));
  }

  function handleSelectCourse(courseId: string) {
    setSelectedCourseId(courseId);
  }

  const flowNodes: FlowNode[] = useMemo(() => {
    const courseNodes: CourseFlowNode[] = viewModel.nodes.map((node) => {
      const matchesFilter =
        activeFilters.size === 0 ||
        activeFilters.has(node.status) ||
        activeFilters.has(node.eligibility.status);
      return {
        id: node.courseId,
        type: "course",
        position: node.position,
        data: {
          courseId: node.courseId,
          courseCode: node.courseCode,
          name: node.name,
          status: node.status,
          availabilityStatus: node.eligibility.status,
          dimmed: !matchesFilter,
          onSelect: handleSelectCourse,
        },
        draggable: false,
      };
    });

    const categoryLabelNodes: CategoryLabelFlowNode[] = viewModel.categories.map((group) => ({
      id: `category:${group.category}`,
      type: "categoryLabel",
      position: group.headerPosition,
      data: { label: group.label },
      draggable: false,
      selectable: false,
    }));

    return [...categoryLabelNodes, ...courseNodes];
  }, [viewModel.nodes, viewModel.categories, activeFilters]);

  const flowEdges: Edge[] = useMemo(
    () =>
      viewModel.edges.map((edge) => ({
        id: edge.id,
        source: edge.sourceCourseId,
        target: edge.targetCourseId,
        type: edge.relationshipType === "COREQUISITE" ? "straight" : "smoothstep",
        animated: false,
        markerEnd:
          edge.relationshipType === "PREREQUISITE" ? { type: MarkerType.ArrowClosed } : undefined,
        style:
          edge.relationshipType === "COREQUISITE"
            ? { strokeDasharray: "6 4" }
            : undefined,
        label: edge.relationshipType === "COREQUISITE" ? "هم‌نیاز" : undefined,
      })),
    [viewModel.edges],
  );

  const selectedNode = selectedCourseId ? courseById.get(selectedCourseId) : null;

  if (viewModel.nodes.length === 0) {
    return (
      <div className="flex h-64 items-center justify-center rounded-lg border border-dashed text-sm text-muted-foreground">
        هنوز درسی برای این برنامه تحصیلی تعریف نشده است.
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-3" dir="rtl">
      <div className="flex flex-col gap-1.5">
        <p className="text-xs font-medium text-muted-foreground">فیلترها</p>
        <div className="flex flex-wrap gap-1.5">
          {STATUS_FILTER_OPTIONS.map((option) => (
            <Button
              key={option.value}
              type="button"
              size="sm"
              variant={activeFilters.has(option.value) ? "default" : "outline"}
              aria-pressed={activeFilters.has(option.value)}
              onClick={() => toggleFilter(option.value)}
            >
              <option.icon aria-hidden />
              {option.label}
            </Button>
          ))}
          {AVAILABILITY_FILTER_OPTIONS.map((option) => (
            <Button
              key={option.value}
              type="button"
              size="sm"
              variant={activeFilters.has(option.value) ? "default" : "outline"}
              aria-pressed={activeFilters.has(option.value)}
              onClick={() => toggleFilter(option.value)}
            >
              <option.icon aria-hidden />
              {option.label}
            </Button>
          ))}
        </div>
      </div>

      <div className="flex flex-col gap-1.5">
        <p className="text-xs font-medium text-muted-foreground">
          نوار وضعیت — یک وضعیت را انتخاب کنید، سپس روی درس مورد نظر در نقشه کلیک کنید
        </p>
        <div className="flex flex-wrap gap-1.5">
          {TOOLBAR_STATUS_OPTIONS.map((option) => (
            <Button
              key={option.value}
              type="button"
              size="sm"
              variant={armedStatus === option.value ? "default" : "outline"}
              aria-pressed={armedStatus === option.value}
              aria-label={`اعمال وضعیت: ${option.label}`}
              onClick={() => toggleArmedStatus(option.value)}
            >
              <option.icon aria-hidden />
              {option.label}
            </Button>
          ))}
        </div>
        {armedStatus && (
          <p className="text-xs text-muted-foreground">
            انتخاب‌شده: {TOOLBAR_STATUS_OPTIONS.find((o) => o.value === armedStatus)?.label}. برای
            اعمال آن روی یک درس در نقشه کلیک کنید.
          </p>
        )}
      </div>

      <div dir="ltr" className="h-[min(720px,70vh)] w-full overflow-hidden rounded-lg border">
        <ReactFlowProvider>
          <ReactFlow
            nodes={flowNodes}
            edges={flowEdges}
            nodeTypes={NODE_TYPES}
            fitView
            nodesDraggable={false}
            nodesConnectable={false}
            nodesFocusable={false}
            elementsSelectable
            proOptions={{ hideAttribution: true }}
          >
            <Background />
            <Controls showInteractive={false} />
            <MiniMap pannable zoomable />
          </ReactFlow>
        </ReactFlowProvider>
      </div>

      {selectedNode && (
        <CourseDetailDialog
          open={selectedCourseId !== null}
          onOpenChange={(open) => {
            if (!open) setSelectedCourseId(null);
          }}
          courseId={selectedNode.courseId}
          courseCode={selectedNode.courseCode}
          courseName={selectedNode.name}
          categoryLabel={categoryLabelByCourseId.get(selectedNode.courseId) ?? ""}
          currentStatus={selectedNode.status}
          currentTermCode={selectedNode.termCode}
          availabilityStatus={selectedNode.eligibility.status}
          reasons={selectedNode.eligibility.reasons}
          warnings={selectedNode.eligibility.warnings}
          relationships={relationshipsByCourseId.get(selectedNode.courseId) ?? []}
          presetStatus={armedStatus}
        />
      )}
    </div>
  );
}
