import { test, expect } from "@playwright/test";
import {
  getAllCurricula,
  getAllCourses,
  getAllCurriculumCourses,
  getAllCourseGroups,
  getAllCourseGroupCourses,
  getAllCurriculumRequirements,
  getAllCourseRelationships,
  getCourseGroupCoursesByGroupId,
} from "./db-helper";
import {
  CATEGORY_SECTIONS,
  CATEGORY_CONFLICT_COURSE_CODE,
  SE_CURRICULUM_NAME,
  IT_CURRICULUM_NAME,
  UNIFIED_CURRICULUM_NAME,
} from "../prisma/curriculum-dataset";
import { resolveCurriculum } from "../src/domain/academic-profile";
import { validateCurriculumData, KNOWN_DUPLICATE_COURSE_CODES } from "../src/domain/curriculum-data";

// These tests read the already-seeded database (run `pnpm db:seed` first,
// as the project's dev workflow does). They don't spin up a browser page.

test.describe("curricula", () => {
  test("all three documented curricula exist with correct identity", async () => {
    const curricula = await getAllCurricula();
    const byName = new Map(curricula.map((c) => [c.name, c]));

    const se = byName.get(SE_CURRICULUM_NAME);
    expect(se).toBeDefined();
    expect(se.major).toBe("Computer Engineering");
    expect(se.orientation).toBe("Software Engineering");
    expect(se.entry_year_from).toBeNull();
    expect(se.entry_year_to).toBe(1402);

    const it = byName.get(IT_CURRICULUM_NAME);
    expect(it).toBeDefined();
    expect(it.major).toBe("Computer Engineering");
    expect(it.orientation).toBe("Information Technology");
    expect(it.entry_year_from).toBeNull();
    expect(it.entry_year_to).toBe(1402);

    const unified = byName.get(UNIFIED_CURRICULUM_NAME);
    expect(unified).toBeDefined();
    expect(unified.major).toBe("Computer Engineering");
    expect(unified.orientation).toBe("Unified");
    expect(unified.entry_year_from).toBe(1403);
    expect(unified.entry_year_to).toBeNull();
  });

  test("Phase 3 curriculum resolution still works against the seeded data", async () => {
    const curricula = await getAllCurricula();
    const summaries = curricula.map((c) => ({
      id: c.id,
      name: c.name,
      major: c.major,
      orientation: c.orientation,
      entryYearFrom: c.entry_year_from,
      entryYearTo: c.entry_year_to,
    }));

    const se = resolveCurriculum(summaries, {
      entryYear: 1401,
      major: "Computer Engineering",
      orientation: "Software Engineering",
    });
    expect(se?.name).toBe(SE_CURRICULUM_NAME);

    const it = resolveCurriculum(summaries, {
      entryYear: 1402,
      major: "Computer Engineering",
      orientation: "Information Technology",
    });
    expect(it?.name).toBe(IT_CURRICULUM_NAME);

    const unified = resolveCurriculum(summaries, {
      entryYear: 1403,
      major: "Computer Engineering",
      orientation: "Unified",
    });
    expect(unified?.name).toBe(UNIFIED_CURRICULUM_NAME);

    const noMatch = resolveCurriculum(summaries, {
      entryYear: 1403,
      major: "Computer Engineering",
      orientation: "Software Engineering",
    });
    expect(noMatch).toBeNull();
  });
});

test.describe("courses", () => {
  test("every documented course code+name pair exists in the database", async () => {
    const dbCourses = await getAllCourses();
    const dbKeys = new Set(dbCourses.map((c) => `${c.course_code}::${c.name}`));

    const missing: string[] = [];
    for (const section of CATEGORY_SECTIONS) {
      for (const entry of section.courses) {
        const key = `${entry.code}::${entry.name}`;
        if (!dbKeys.has(key)) missing.push(key);
      }
    }
    expect(missing).toEqual([]);
  });

  test("no unexpected courses exist beyond the documented dataset and test fixtures", async () => {
    const expectedKeys = new Set<string>();
    for (const section of CATEGORY_SECTIONS) {
      for (const entry of section.courses) {
        expectedKeys.add(`${entry.code}::${entry.name}`);
      }
    }

    const dbCourses = await getAllCourses();
    const unexpected = dbCourses
      .filter((c) => !c.course_code.startsWith("course-")) // e2e test fixtures (auth/profile specs)
      .filter((c) => !expectedKeys.has(`${c.course_code}::${c.name}`))
      .map((c) => `${c.course_code}::${c.name}`);

    expect(unexpected).toEqual([]);
  });

  test("distinct course count matches the deduplicated dataset", async () => {
    const expectedKeys = new Set<string>();
    for (const section of CATEGORY_SECTIONS) {
      for (const entry of section.courses) {
        expectedKeys.add(`${entry.code}::${entry.name}`);
      }
    }

    const dbCourses = await getAllCourses();
    const datasetCourses = dbCourses.filter((c) => !c.course_code.startsWith("course-"));
    expect(datasetCourses.length).toBe(expectedKeys.size);
  });

  test("curriculum-course memberships match the dataset, excluding the known category conflict", async () => {
    const dbCourses = await getAllCourses();
    const courseIdByKey = new Map(dbCourses.map((c) => [`${c.course_code}::${c.name}`, c.id]));
    const curricula = await getAllCurricula();
    const curriculumIdByName = new Map(curricula.map((c) => [c.name, c.id]));
    const memberships = await getAllCurriculumCourses();
    const membershipSet = new Set(
      memberships.map((m) => `${m.curriculum_id}::${m.course_id}::${m.category}`),
    );

    const missing: string[] = [];
    for (const section of CATEGORY_SECTIONS) {
      for (const curriculumName of section.curricula) {
        const curriculumId = curriculumIdByName.get(curriculumName);
        for (const entry of section.courses) {
          if (entry.code === CATEGORY_CONFLICT_COURSE_CODE) continue;
          const courseId = courseIdByKey.get(`${entry.code}::${entry.name}`);
          const key = `${curriculumId}::${courseId}::${section.category}`;
          if (!membershipSet.has(key)) {
            missing.push(`${curriculumName} / ${entry.name} / ${section.category}`);
          }
        }
      }
    }
    expect(missing).toEqual([]);
  });

  test("the documented category-conflict course exists but has no curriculum membership", async () => {
    const dbCourses = await getAllCourses();
    const conflictCourse = dbCourses.find((c) => c.course_code === CATEGORY_CONFLICT_COURSE_CODE);
    expect(conflictCourse).toBeDefined();

    const memberships = await getAllCurriculumCourses();
    const hasMembership = memberships.some((m) => m.course_id === conflictCourse!.id);
    expect(hasMembership).toBe(false);
  });

  test("the two documented duplicate course codes each resolve to two distinct courses", async () => {
    const dbCourses = await getAllCourses();
    for (const code of KNOWN_DUPLICATE_COURSE_CODES) {
      const matches = dbCourses.filter((c) => c.course_code === code);
      expect(matches.length).toBe(2);
      expect(new Set(matches.map((c) => c.name)).size).toBe(2);
    }
  });
});

test.describe("groups and requirements", () => {
  test("selective/elective groups exist per curriculum with the documented required units", async () => {
    const curricula = await getAllCurricula();
    const curriculumIdByName = new Map(curricula.map((c) => [c.name, c.id]));
    const groups = await getAllCourseGroups();

    for (const section of CATEGORY_SECTIONS.filter((s) => s.isGroup)) {
      for (const curriculumName of section.curricula) {
        const curriculumId = curriculumIdByName.get(curriculumName);
        const group = groups.find(
          (g) => g.curriculum_id === curriculumId && g.name === section.label,
        );
        expect(group, `${curriculumName} / ${section.label}`).toBeDefined();
        expect(group!.required_units).toBe(section.requiredUnits);
      }
    }
  });

  test("group membership matches the documented course list", async () => {
    const curricula = await getAllCurricula();
    const curriculumIdByName = new Map(curricula.map((c) => [c.name, c.id]));
    const groups = await getAllCourseGroups();

    for (const section of CATEGORY_SECTIONS.filter((s) => s.isGroup)) {
      for (const curriculumName of section.curricula) {
        const curriculumId = curriculumIdByName.get(curriculumName);
        const group = groups.find(
          (g) => g.curriculum_id === curriculumId && g.name === section.label,
        )!;
        const memberCourses = await getCourseGroupCoursesByGroupId(group.id);
        const memberKeys = new Set(memberCourses.map((c) => `${c.course_code}::${c.name}`));
        const expectedKeys = new Set(section.courses.map((e) => `${e.code}::${e.name}`));
        expect(memberKeys).toEqual(expectedKeys);
      }
    }
  });

  test("the 1403+ elective requirement preserves 10 units and the 1-practical-unit note", async () => {
    const curricula = await getAllCurricula();
    const unifiedId = curricula.find((c) => c.name === UNIFIED_CURRICULUM_NAME)!.id;
    const requirements = await getAllCurriculumRequirements();
    const electiveRequirement = requirements.find(
      (r) => r.curriculum_id === unifiedId && r.name === "Elective" && r.requirement_type === "COURSE_GROUP",
    );
    expect(electiveRequirement).toBeDefined();
    expect(electiveRequirement!.required_units).toBe(10);
    expect(electiveRequirement!.minimum_practical_units).toBe(1);
  });

  test("no total_required_units or TOTAL_UNITS requirement was invented for any curriculum", async () => {
    const curricula = await getAllCurricula();
    for (const curriculum of curricula) {
      expect(curriculum.total_required_units).toBeNull();
    }
    const requirements = await getAllCurriculumRequirements();
    expect(requirements.some((r) => r.requirement_type === "TOTAL_UNITS")).toBe(false);
  });
});

test.describe("integrity", () => {
  test("zero prerequisite/corequisite relationships are imported", async () => {
    const relationships = await getAllCourseRelationships();
    expect(relationships).toHaveLength(0);
  });

  test("the validator reports no errors and exactly the documented anomalies against live data", async () => {
    const [curricula, courses, curriculumCourses, courseGroups, courseGroupCourses, curriculumRequirements, courseRelationships] =
      await Promise.all([
        getAllCurricula(),
        getAllCourses(),
        getAllCurriculumCourses(),
        getAllCourseGroups(),
        getAllCourseGroupCourses(),
        getAllCurriculumRequirements(),
        getAllCourseRelationships(),
      ]);

    const findings = validateCurriculumData({
      curricula: curricula.map((c) => ({
        id: c.id,
        name: c.name,
        major: c.major,
        orientation: c.orientation,
        entryYearFrom: c.entry_year_from,
        entryYearTo: c.entry_year_to,
      })),
      courses: courses.map((c) => ({ id: c.id, courseCode: c.course_code, name: c.name })),
      curriculumCourses: curriculumCourses.map((c) => ({
        id: c.id,
        curriculumId: c.curriculum_id,
        courseId: c.course_id,
        category: c.category,
      })),
      courseGroups: courseGroups.map((g) => ({
        id: g.id,
        curriculumId: g.curriculum_id,
        name: g.name,
      })),
      courseGroupCourses: courseGroupCourses.map((m) => ({
        id: m.id,
        courseGroupId: m.course_group_id,
        courseId: m.course_id,
      })),
      curriculumRequirements: curriculumRequirements.map((r) => ({
        id: r.id,
        curriculumId: r.curriculum_id,
        requirementType: r.requirement_type,
        courseGroupId: r.course_group_id,
        category: r.category,
      })),
      courseRelationships: courseRelationships.map((r) => ({
        id: r.id,
        sourceCourseId: r.source_course_id,
        targetCourseId: r.target_course_id,
      })),
    });

    const errors = findings.filter((f) => f.severity === "error");
    expect(errors).toEqual([]);

    const warnings = findings.filter((f) => f.severity === "warning");
    expect(warnings).toEqual([]);

    const infoCodes = findings.filter((f) => f.severity === "info").map((f) => f.code);
    expect(infoCodes).toContain("KNOWN_CATEGORY_CONFLICT");
    expect(infoCodes.filter((c) => c === "DUPLICATE_COURSE_CODE")).toHaveLength(
      KNOWN_DUPLICATE_COURSE_CODES.length,
    );
    expect(infoCodes).toContain("RELATIONSHIP_COUNT");
  });
});
