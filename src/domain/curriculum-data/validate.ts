import type { CurriculumDataset, Finding } from "./types";

// docs/06_Curriculum_Dataset.md §7 / docs/10_Claude_Master_Prompt.md §34 —
// documented, must-not-be-corrected anomalies. Duplicates/conflicts
// involving exactly these are reported as "info" (expected); anything else
// is reported as an error/warning (unexpected).
export const KNOWN_DUPLICATE_COURSE_CODES = ["7000031598", "7000031588"];
export const KNOWN_CATEGORY_CONFLICT_COURSE_CODE = "7000031553";

const VALID_CATEGORIES = new Set([
  "GENERAL",
  "BASIC",
  "SPECIALIZED_REQUIRED",
  "SPECIALIZED_ELECTIVE",
  "ELECTIVE",
  "PREPARATORY",
  "SKILLS_EMPLOYABILITY",
  "ORIENTATION_SPECIALIZED",
]);

const VALID_REQUIREMENT_TYPES = new Set([
  "TOTAL_UNITS",
  "CATEGORY_UNITS",
  "ELECTIVE_UNITS",
  "PRACTICAL_UNITS",
  "COURSE_GROUP",
]);

export function validateCurriculumData(data: CurriculumDataset): Finding[] {
  const findings: Finding[] = [];

  const curriculumIds = new Set(data.curricula.map((c) => c.id));
  const courseIds = new Set(data.courses.map((c) => c.id));
  const courseGroupIds = new Set(data.courseGroups.map((g) => g.id));
  const courseById = new Map(data.courses.map((c) => [c.id, c]));

  // 1. Missing curriculum metadata.
  for (const curriculum of data.curricula) {
    if (!curriculum.name || !curriculum.major || !curriculum.orientation) {
      findings.push({
        severity: "error",
        code: "MISSING_CURRICULUM_METADATA",
        message: `Curriculum ${curriculum.id} is missing required name/major/orientation.`,
      });
    }
    if (curriculum.entryYearFrom === null && curriculum.entryYearTo === null) {
      findings.push({
        severity: "warning",
        code: "UNBOUNDED_CURRICULUM_ENTRY_YEARS",
        message: `Curriculum "${curriculum.name}" has no entry-year bounds (matches every entry year).`,
      });
    }
  }

  // 2. Duplicate course codes.
  const coursesByCode = new Map<string, typeof data.courses>();
  for (const course of data.courses) {
    const list = coursesByCode.get(course.courseCode) ?? [];
    list.push(course);
    coursesByCode.set(course.courseCode, list);
  }
  for (const [code, courses] of coursesByCode) {
    if (courses.length <= 1) continue;
    const severity = KNOWN_DUPLICATE_COURSE_CODES.includes(code) ? "info" : "warning";
    findings.push({
      severity,
      code: "DUPLICATE_COURSE_CODE",
      message: `Course code ${code} is used by ${courses.length} different course names: ${courses
        .map((c) => c.name)
        .join(", ")}.${severity === "info" ? " (documented anomaly, preserved as-is)" : " (unexpected — not a documented anomaly)"}`,
    });
  }

  // 3. Missing curriculum / invalid course references.
  for (const link of data.curriculumCourses) {
    if (!curriculumIds.has(link.curriculumId)) {
      findings.push({
        severity: "error",
        code: "INVALID_CURRICULUM_REFERENCE",
        message: `curriculum_courses row ${link.id} references missing curriculum ${link.curriculumId}.`,
      });
    }
    if (!courseIds.has(link.courseId)) {
      findings.push({
        severity: "error",
        code: "INVALID_COURSE_REFERENCE",
        message: `curriculum_courses row ${link.id} references missing course ${link.courseId}.`,
      });
    }
    if (!VALID_CATEGORIES.has(link.category)) {
      findings.push({
        severity: "error",
        code: "INVALID_CATEGORY",
        message: `curriculum_courses row ${link.id} has invalid category "${link.category}".`,
      });
    }
  }

  for (const group of data.courseGroups) {
    if (!curriculumIds.has(group.curriculumId)) {
      findings.push({
        severity: "error",
        code: "INVALID_CURRICULUM_REFERENCE",
        message: `course_groups row ${group.id} references missing curriculum ${group.curriculumId}.`,
      });
    }
  }

  for (const membership of data.courseGroupCourses) {
    if (!courseGroupIds.has(membership.courseGroupId)) {
      findings.push({
        severity: "error",
        code: "INVALID_GROUP_REFERENCE",
        message: `course_group_courses row ${membership.id} references missing group ${membership.courseGroupId}.`,
      });
    }
    if (!courseIds.has(membership.courseId)) {
      findings.push({
        severity: "error",
        code: "INVALID_COURSE_REFERENCE",
        message: `course_group_courses row ${membership.id} references missing course ${membership.courseId}.`,
      });
    }
  }

  for (const requirement of data.curriculumRequirements) {
    if (!curriculumIds.has(requirement.curriculumId)) {
      findings.push({
        severity: "error",
        code: "INVALID_CURRICULUM_REFERENCE",
        message: `curriculum_requirements row ${requirement.id} references missing curriculum ${requirement.curriculumId}.`,
      });
    }
    if (!VALID_REQUIREMENT_TYPES.has(requirement.requirementType)) {
      findings.push({
        severity: "error",
        code: "INVALID_REQUIREMENT_TYPE",
        message: `curriculum_requirements row ${requirement.id} has invalid requirement_type "${requirement.requirementType}".`,
      });
    }
    if (requirement.category !== null && !VALID_CATEGORIES.has(requirement.category)) {
      findings.push({
        severity: "error",
        code: "INVALID_CATEGORY",
        message: `curriculum_requirements row ${requirement.id} has invalid category "${requirement.category}".`,
      });
    }
    if (requirement.courseGroupId !== null && !courseGroupIds.has(requirement.courseGroupId)) {
      findings.push({
        severity: "error",
        code: "INVALID_GROUP_REFERENCE",
        message: `curriculum_requirements row ${requirement.id} references missing group ${requirement.courseGroupId}.`,
      });
    }
  }

  // 4. Prerequisite/corequisite references + population status.
  for (const relationship of data.courseRelationships) {
    if (!courseIds.has(relationship.sourceCourseId) || !courseIds.has(relationship.targetCourseId)) {
      findings.push({
        severity: "error",
        code: "INVALID_RELATIONSHIP_REFERENCE",
        message: `course_relationships row ${relationship.id} references a missing course.`,
      });
    }
  }
  findings.push({
    severity: "info",
    code: "RELATIONSHIP_COUNT",
    message: `${data.courseRelationships.length} prerequisite/corequisite relationship(s) imported (docs/06_Curriculum_Dataset.md §5 — none are populated in the current dataset; this is expected to be 0 until verified relationships are added).`,
  });

  // 5. Conflicting curriculum mappings: same course code linked into the
  // same curriculum under more than one category. Excludes the documented
  // duplicate-code courses (§2 above) — those are legitimately two
  // different subjects that happen to share a code, not one course with a
  // genuine category conflict.
  const membershipsByKey = new Map<string, Set<string>>();
  for (const link of data.curriculumCourses) {
    const course = courseById.get(link.courseId);
    if (!course) continue;
    if (KNOWN_DUPLICATE_COURSE_CODES.includes(course.courseCode)) continue;
    const key = `${link.curriculumId}::${course.courseCode}`;
    const categories = membershipsByKey.get(key) ?? new Set<string>();
    categories.add(link.category);
    membershipsByKey.set(key, categories);
  }
  for (const [key, categories] of membershipsByKey) {
    if (categories.size <= 1) continue;
    const [curriculumId, courseCode] = key.split("::");
    findings.push({
      severity: "warning",
      code: "CONFLICTING_CURRICULUM_MAPPING",
      message: `Course code ${courseCode} is linked into curriculum ${curriculumId} under multiple categories: ${[...categories].join(", ")}.`,
    });
  }

  // 6. The documented category-conflict course: report whether it's present
  // and, as designed, has no curriculum membership.
  const conflictCourses = data.courses.filter(
    (c) => c.courseCode === KNOWN_CATEGORY_CONFLICT_COURSE_CODE,
  );
  for (const course of conflictCourses) {
    const hasMembership = data.curriculumCourses.some((link) => link.courseId === course.id);
    findings.push({
      severity: hasMembership ? "warning" : "info",
      code: "KNOWN_CATEGORY_CONFLICT",
      message: hasMembership
        ? `Course "${course.name}" (${course.courseCode}) has a documented category conflict (docs/06_Curriculum_Dataset.md §7) but was linked into a curriculum anyway — expected to remain unlinked pending verification.`
        : `Course "${course.name}" (${course.courseCode}) has a documented, unresolved category conflict (docs/06_Curriculum_Dataset.md §7) and is intentionally not linked to any curriculum pending verification.`,
    });
  }

  return findings;
}
