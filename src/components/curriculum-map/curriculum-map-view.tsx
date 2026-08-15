"use client";

import { useMemo, useState } from "react";
import {
  Background,
  Controls,
  MarkerType,
  ReactFlow,
  ReactFlowProvider,
  type Edge,
} from "@xyflow/react";
import "@xyflow/react/dist/style.css";
import {
  Ban,
  CalendarClock,
  CheckCircle2,
  Circle,
  Clock,
  XCircle,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import type { AvailabilityStatus, CourseStatus } from "@/domain/academic";
import type { CurriculumMapViewModel } from "@/domain/curriculum-map";
import type { CourseStatusValue } from "@/domain/academic-status";
import { CourseNode, type CourseFlowNode } from "./course-node";
import { CategoryLabelNode, type CategoryLabelFlowNode } from "./category-label-node";
import { CourseDetailDialog, type DetailRelationship } from "./course-detail-dialog";

const NODE_TYPES = { course: CourseNode, categoryLabel: CategoryLabelNode };

type FlowNode = CourseFlowNode | CategoryLabelFlowNode;

const STATUS_FILTER_OPTIONS: { value: CourseStatus; label: string; icon: typeof Circle }[] = [
  { value: "PASSED", label: "Passed", icon: CheckCircle2 },
  { value: "FAILED", label: "Failed", icon: XCircle },
  { value: "CURRENTLY_STUDYING", label: "Currently studying", icon: Clock },
  { value: "PLANNED", label: "Planned", icon: CalendarClock },
  { value: "NOT_COMPLETED", label: "Not completed", icon: Circle },
];

const AVAILABILITY_FILTER_OPTIONS: { value: AvailabilityStatus; label: string; icon: typeof Circle }[] = [
  { value: "AVAILABLE", label: "Available", icon: CheckCircle2 },
  { value: "BLOCKED", label: "Blocked", icon: Ban },
];

const TOOLBAR_STATUS_OPTIONS: { value: CourseStatusValue; label: string; icon: typeof Circle }[] = [
  { value: "PASSED", label: "Passed", icon: CheckCircle2 },
  { value: "FAILED", label: "Failed", icon: XCircle },
  { value: "CURRENTLY_STUDYING", label: "Currently studying", icon: Clock },
  { value: "PLANNED", label: "Planned", icon: CalendarClock },
  { value: "NOT_COMPLETED", label: "Not completed", icon: Circle },
];

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
        label: edge.relationshipType === "COREQUISITE" ? "corequisite" : undefined,
      })),
    [viewModel.edges],
  );

  const selectedNode = selectedCourseId ? courseById.get(selectedCourseId) : null;

  if (viewModel.nodes.length === 0) {
    return (
      <div className="flex h-64 items-center justify-center rounded-lg border border-dashed text-sm text-muted-foreground">
        This curriculum has no courses configured yet.
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-3" dir="rtl">
      <div className="flex flex-col gap-1.5">
        <p className="text-xs font-medium text-muted-foreground">Filters</p>
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
          Status toolbar — select a status, then click a course to apply it
        </p>
        <div className="flex flex-wrap gap-1.5">
          {TOOLBAR_STATUS_OPTIONS.map((option) => (
            <Button
              key={option.value}
              type="button"
              size="sm"
              variant={armedStatus === option.value ? "default" : "outline"}
              aria-pressed={armedStatus === option.value}
              aria-label={`Apply status: ${option.label}`}
              onClick={() => toggleArmedStatus(option.value)}
            >
              <option.icon aria-hidden />
              {option.label}
            </Button>
          ))}
        </div>
        {armedStatus && (
          <p className="text-xs text-muted-foreground">
            Selected: {TOOLBAR_STATUS_OPTIONS.find((o) => o.value === armedStatus)?.label}. Click a
            course on the map to apply it.
          </p>
        )}
      </div>

      <div dir="ltr" className="h-[720px] w-full overflow-hidden rounded-lg border">
        <ReactFlowProvider>
          <ReactFlow
            nodes={flowNodes}
            edges={flowEdges}
            nodeTypes={NODE_TYPES}
            fitView
            nodesDraggable={false}
            nodesConnectable={false}
            elementsSelectable
            proOptions={{ hideAttribution: true }}
          >
            <Background />
            <Controls showInteractive={false} />
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
