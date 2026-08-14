import { describe, expect, it } from "vitest";
import { validateCurriculumData } from "./validate";
import type { CurriculumDataset } from "./types";

function emptyDataset(): CurriculumDataset {
  return {
    curricula: [],
    courses: [],
    curriculumCourses: [],
    courseGroups: [],
    courseGroupCourses: [],
    curriculumRequirements: [],
    courseRelationships: [],
  };
}

function baseDataset(): CurriculumDataset {
  return {
    curricula: [
      {
        id: "curr-1",
        name: "Computer Engineering — Unified",
        major: "Computer Engineering",
        orientation: "Unified",
        entryYearFrom: 1403,
        entryYearTo: null,
      },
    ],
    courses: [
      { id: "course-1", courseCode: "1001", name: "Course A" },
      { id: "course-2", courseCode: "1002", name: "Course B" },
    ],
    curriculumCourses: [
      { id: "link-1", curriculumId: "curr-1", courseId: "course-1", category: "BASIC" },
    ],
    courseGroups: [],
    courseGroupCourses: [],
    curriculumRequirements: [],
    courseRelationships: [],
  };
}

describe("validateCurriculumData", () => {
  it("reports nothing but the informational relationship count for an empty dataset", () => {
    const findings = validateCurriculumData(emptyDataset());
    expect(findings.filter((f) => f.severity === "error")).toHaveLength(0);
    expect(findings).toHaveLength(1);
    expect(findings[0].code).toBe("RELATIONSHIP_COUNT");
  });

  it("produces no errors for a valid, well-formed dataset", () => {
    const findings = validateCurriculumData(baseDataset());
    expect(findings.filter((f) => f.severity === "error")).toHaveLength(0);
  });

  it("detects a curriculum_courses row referencing a missing curriculum", () => {
    const data = baseDataset();
    data.curriculumCourses[0].curriculumId = "missing-curriculum";
    const findings = validateCurriculumData(data);
    expect(findings).toContainEqual(
      expect.objectContaining({ severity: "error", code: "INVALID_CURRICULUM_REFERENCE" }),
    );
  });

  it("detects a curriculum_courses row referencing a missing course", () => {
    const data = baseDataset();
    data.curriculumCourses[0].courseId = "missing-course";
    const findings = validateCurriculumData(data);
    expect(findings).toContainEqual(
      expect.objectContaining({ severity: "error", code: "INVALID_COURSE_REFERENCE" }),
    );
  });

  it("detects an invalid category", () => {
    const data = baseDataset();
    data.curriculumCourses[0].category = "NOT_A_REAL_CATEGORY";
    const findings = validateCurriculumData(data);
    expect(findings).toContainEqual(
      expect.objectContaining({ severity: "error", code: "INVALID_CATEGORY" }),
    );
  });

  it("detects an invalid requirement type", () => {
    const data = baseDataset();
    data.curriculumRequirements.push({
      id: "req-1",
      curriculumId: "curr-1",
      requirementType: "NOT_A_REAL_TYPE",
      courseGroupId: null,
      category: null,
    });
    const findings = validateCurriculumData(data);
    expect(findings).toContainEqual(
      expect.objectContaining({ severity: "error", code: "INVALID_REQUIREMENT_TYPE" }),
    );
  });

  it("detects a curriculum_requirements row referencing a missing course group", () => {
    const data = baseDataset();
    data.curriculumRequirements.push({
      id: "req-1",
      curriculumId: "curr-1",
      requirementType: "COURSE_GROUP",
      courseGroupId: "missing-group",
      category: null,
    });
    const findings = validateCurriculumData(data);
    expect(findings).toContainEqual(
      expect.objectContaining({ severity: "error", code: "INVALID_GROUP_REFERENCE" }),
    );
  });

  it("detects a course_group_courses row referencing a missing group or course", () => {
    const data = baseDataset();
    data.courseGroupCourses.push({
      id: "gm-1",
      courseGroupId: "missing-group",
      courseId: "course-1",
    });
    const findings = validateCurriculumData(data);
    expect(findings).toContainEqual(
      expect.objectContaining({ severity: "error", code: "INVALID_GROUP_REFERENCE" }),
    );
  });

  it("detects a course_relationships row referencing a missing course", () => {
    const data = baseDataset();
    data.courseRelationships.push({
      id: "rel-1",
      sourceCourseId: "course-1",
      targetCourseId: "missing-course",
    });
    const findings = validateCurriculumData(data);
    expect(findings).toContainEqual(
      expect.objectContaining({ severity: "error", code: "INVALID_RELATIONSHIP_REFERENCE" }),
    );
  });

  it("reports a documented duplicate course code as info", () => {
    const data = baseDataset();
    data.courses.push({ id: "course-3", courseCode: "7000031598", name: "مفاهیم پیشرفته" });
    data.courses.push({ id: "course-4", courseCode: "7000031598", name: "مفاهیم پیشرفته 2" });
    const findings = validateCurriculumData(data);
    const finding = findings.find((f) => f.code === "DUPLICATE_COURSE_CODE");
    expect(finding?.severity).toBe("info");
  });

  it("reports an undocumented duplicate course code as a warning", () => {
    const data = baseDataset();
    data.courses.push({ id: "course-3", courseCode: "9999999999", name: "Course C" });
    data.courses.push({ id: "course-4", courseCode: "9999999999", name: "Course D" });
    const findings = validateCurriculumData(data);
    const finding = findings.find((f) => f.code === "DUPLICATE_COURSE_CODE");
    expect(finding?.severity).toBe("warning");
  });

  it("detects a real conflicting curriculum mapping (same code, different categories, not a documented duplicate)", () => {
    const data = baseDataset();
    data.courses.push({ id: "course-3", courseCode: "5000", name: "Course C" });
    data.courses.push({ id: "course-4", courseCode: "5000", name: "Course C" });
    data.curriculumCourses.push(
      { id: "link-2", curriculumId: "curr-1", courseId: "course-3", category: "BASIC" },
      { id: "link-3", curriculumId: "curr-1", courseId: "course-4", category: "ELECTIVE" },
    );
    const findings = validateCurriculumData(data);
    expect(findings).toContainEqual(
      expect.objectContaining({ severity: "warning", code: "CONFLICTING_CURRICULUM_MAPPING" }),
    );
  });

  it("does not flag the documented duplicate-code courses as a conflicting mapping", () => {
    const data = baseDataset();
    data.courses.push({ id: "course-3", courseCode: "7000031588", name: "مدیریت پروژه" });
    data.courses.push({
      id: "course-4",
      courseCode: "7000031588",
      name: "مدیریت و برنامه ریزی راهبردی فناوری اطلاعات",
    });
    data.curriculumCourses.push(
      { id: "link-2", curriculumId: "curr-1", courseId: "course-3", category: "SPECIALIZED_ELECTIVE" },
      { id: "link-3", curriculumId: "curr-1", courseId: "course-4", category: "ELECTIVE" },
    );
    const findings = validateCurriculumData(data);
    expect(findings.filter((f) => f.code === "CONFLICTING_CURRICULUM_MAPPING")).toHaveLength(0);
  });

  it("reports the known category-conflict course as info when correctly left unlinked", () => {
    const data = baseDataset();
    data.courses.push({ id: "course-3", courseCode: "7000031553", name: "کارگاه کامپیوتر" });
    const findings = validateCurriculumData(data);
    const finding = findings.find((f) => f.code === "KNOWN_CATEGORY_CONFLICT");
    expect(finding?.severity).toBe("info");
  });

  it("reports the known category-conflict course as a warning if it was linked anyway", () => {
    const data = baseDataset();
    data.courses.push({ id: "course-3", courseCode: "7000031553", name: "کارگاه کامپیوتر" });
    data.curriculumCourses.push({
      id: "link-2",
      curriculumId: "curr-1",
      courseId: "course-3",
      category: "BASIC",
    });
    const findings = validateCurriculumData(data);
    const finding = findings.find((f) => f.code === "KNOWN_CATEGORY_CONFLICT");
    expect(finding?.severity).toBe("warning");
  });

  it("flags a curriculum with no entry-year bounds", () => {
    const data = baseDataset();
    data.curricula[0].entryYearFrom = null;
    data.curricula[0].entryYearTo = null;
    const findings = validateCurriculumData(data);
    expect(findings).toContainEqual(
      expect.objectContaining({ severity: "warning", code: "UNBOUNDED_CURRICULUM_ENTRY_YEARS" }),
    );
  });

  it("flags missing curriculum metadata", () => {
    const data = baseDataset();
    data.curricula[0].major = "";
    const findings = validateCurriculumData(data);
    expect(findings).toContainEqual(
      expect.objectContaining({ severity: "error", code: "MISSING_CURRICULUM_METADATA" }),
    );
  });

  it("reports the relationship count", () => {
    const data = baseDataset();
    const findings = validateCurriculumData(data);
    const finding = findings.find((f) => f.code === "RELATIONSHIP_COUNT");
    expect(finding?.message).toContain("0 prerequisite/corequisite relationship");
  });
});
