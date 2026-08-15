import { describe, expect, it } from "vitest";
import { buildCurriculumMapViewModel } from "./layout";
import type { CurriculumMapCourseInput } from "./types";

const AVAILABLE = { allowed: true, status: "AVAILABLE" as const, reasons: [], warnings: [] };

function course(overrides: Partial<CurriculumMapCourseInput> = {}): CurriculumMapCourseInput {
  return {
    courseId: "course-a",
    courseCode: "1000",
    name: "Course A",
    category: "BASIC",
    status: "NOT_COMPLETED",
    termCode: null,
    eligibility: AVAILABLE,
    ...overrides,
  };
}

describe("buildCurriculumMapViewModel", () => {
  it("returns empty categories/nodes/edges for no courses", () => {
    const result = buildCurriculumMapViewModel([], []);
    expect(result).toEqual({ categories: [], nodes: [], edges: [] });
  });

  it("groups courses into their category, and omits categories with no courses", () => {
    const result = buildCurriculumMapViewModel(
      [course({ courseId: "a", category: "GENERAL" }), course({ courseId: "b", category: "BASIC" })],
      [],
    );
    expect(result.categories.map((c) => c.category)).toEqual(["GENERAL", "BASIC"]);
  });

  it("orders categories foundational-to-elective regardless of input order", () => {
    const result = buildCurriculumMapViewModel(
      [
        course({ courseId: "a", category: "ELECTIVE" }),
        course({ courseId: "b", category: "PREPARATORY" }),
        course({ courseId: "c", category: "SPECIALIZED_REQUIRED" }),
      ],
      [],
    );
    expect(result.categories.map((c) => c.category)).toEqual([
      "PREPARATORY",
      "SPECIALIZED_REQUIRED",
      "ELECTIVE",
    ]);
  });

  it("positions each category's header above its own nodes, and later categories' headers below earlier ones", () => {
    const result = buildCurriculumMapViewModel(
      [
        course({ courseId: "a", category: "PREPARATORY" }),
        course({ courseId: "b", category: "GENERAL" }),
      ],
      [],
    );
    const preparatory = result.categories.find((c) => c.category === "PREPARATORY")!;
    const general = result.categories.find((c) => c.category === "GENERAL")!;

    expect(preparatory.headerPosition.y).toBeLessThan(preparatory.nodes[0].position.y);
    expect(general.headerPosition.y).toBeGreaterThan(preparatory.nodes[0].position.y);
  });

  it("produces the same node positions across repeated calls with the same (differently-ordered) input — deterministic, not insertion-order-dependent", () => {
    const inputA = [
      course({ courseId: "a", courseCode: "2000", category: "BASIC" }),
      course({ courseId: "b", courseCode: "1000", category: "BASIC" }),
    ];
    const inputB = [inputA[1], inputA[0]]; // reversed order

    const resultA = buildCurriculumMapViewModel(inputA, []);
    const resultB = buildCurriculumMapViewModel(inputB, []);

    const positionsA = Object.fromEntries(resultA.nodes.map((n) => [n.courseId, n.position]));
    const positionsB = Object.fromEntries(resultB.nodes.map((n) => [n.courseId, n.position]));
    expect(positionsA).toEqual(positionsB);
    // Lower course code sorts first (x=0).
    expect(positionsA["b"].x).toBeLessThan(positionsA["a"].x);
  });

  it("wraps to a new row after the max-per-row threshold within a category", () => {
    const courses = Array.from({ length: 9 }, (_, i) =>
      course({ courseId: `c${i}`, courseCode: String(1000 + i), category: "ELECTIVE" }),
    );
    const result = buildCurriculumMapViewModel(courses, []);
    const ys = result.nodes.map((n) => n.position.y);
    // Not all on the same row.
    expect(new Set(ys).size).toBeGreaterThan(1);
  });

  it("stacks categories vertically without overlapping y ranges", () => {
    const result = buildCurriculumMapViewModel(
      [
        course({ courseId: "a", category: "PREPARATORY" }),
        course({ courseId: "b", category: "GENERAL" }),
      ],
      [],
    );
    const preparatoryNode = result.nodes.find((n) => n.courseId === "a")!;
    const generalNode = result.nodes.find((n) => n.courseId === "b")!;
    expect(generalNode.position.y).toBeGreaterThan(preparatoryNode.position.y);
  });

  it("carries each course's status and eligibility through unchanged", () => {
    const blocked = { allowed: false, status: "BLOCKED" as const, reasons: ["x"], warnings: [] };
    const result = buildCurriculumMapViewModel(
      [course({ courseId: "a", status: "FAILED", eligibility: blocked })],
      [],
    );
    expect(result.nodes[0].status).toBe("FAILED");
    expect(result.nodes[0].eligibility).toEqual(blocked);
  });

  it("produces zero edges when there are zero relationships (the current real dataset)", () => {
    const result = buildCurriculumMapViewModel(
      [course({ courseId: "a" }), course({ courseId: "b" })],
      [],
    );
    expect(result.edges).toEqual([]);
  });

  it("produces an edge for a verified relationship between two included courses", () => {
    const result = buildCurriculumMapViewModel(
      [course({ courseId: "a" }), course({ courseId: "b" })],
      [{ sourceCourseId: "a", targetCourseId: "b", relationshipType: "PREREQUISITE" }],
    );
    expect(result.edges).toHaveLength(1);
    expect(result.edges[0]).toMatchObject({
      sourceCourseId: "a",
      targetCourseId: "b",
      relationshipType: "PREREQUISITE",
    });
  });

  it("distinguishes PREREQUISITE and COREQUISITE relationship types", () => {
    const result = buildCurriculumMapViewModel(
      [course({ courseId: "a" }), course({ courseId: "b" }), course({ courseId: "c" })],
      [
        { sourceCourseId: "a", targetCourseId: "b", relationshipType: "PREREQUISITE" },
        { sourceCourseId: "a", targetCourseId: "c", relationshipType: "COREQUISITE" },
      ],
    );
    const types = result.edges.map((e) => e.relationshipType).sort();
    expect(types).toEqual(["COREQUISITE", "PREREQUISITE"]);
  });

  it("omits a relationship referencing a course outside the given course list (e.g. a different curriculum)", () => {
    const result = buildCurriculumMapViewModel(
      [course({ courseId: "a" })],
      [{ sourceCourseId: "a", targetCourseId: "outside-course", relationshipType: "PREREQUISITE" }],
    );
    expect(result.edges).toEqual([]);
  });
});
