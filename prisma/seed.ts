// Seeds curriculum identity rows (docs/06_Curriculum_Dataset.md §2) and the
// course catalog / curriculum membership / groups / requirements
// transcribed in curriculum-dataset.ts. Idempotent: safe to re-run, never
// destructive (no deletes), never touches student/authentication data.
//
// Prerequisite/corequisite relationships are intentionally NOT seeded —
// docs/06_Curriculum_Dataset.md §5 states none are populated in the current
// dataset.
import "dotenv/config";
import { PrismaClient } from "../src/generated/prisma/client";
import { PrismaPg } from "@prisma/adapter-pg";
import {
  CATEGORY_CONFLICT_COURSE_CODE,
  CATEGORY_SECTIONS,
  SE_CURRICULUM_NAME,
  IT_CURRICULUM_NAME,
  UNIFIED_CURRICULUM_NAME,
  type CourseEntry,
} from "./curriculum-dataset";

const adapter = new PrismaPg({ connectionString: process.env.DATABASE_URL });
const prisma = new PrismaClient({ adapter });

const CURRICULA = [
  {
    name: SE_CURRICULUM_NAME,
    major: "Computer Engineering",
    orientation: "Software Engineering",
    entryYearFrom: null,
    entryYearTo: 1402,
  },
  {
    name: IT_CURRICULUM_NAME,
    major: "Computer Engineering",
    orientation: "Information Technology",
    entryYearFrom: null,
    entryYearTo: 1402,
  },
  {
    name: UNIFIED_CURRICULUM_NAME,
    major: "Computer Engineering",
    orientation: "Unified",
    entryYearFrom: 1403,
    entryYearTo: null,
  },
];

// docs/07_Database_Schema.md §8 / §16 gives no documented rule for how to
// set curriculum_courses.required. Derived literally from category naming:
// "elective"/"selective" categories are choose-from-a-pool by definition,
// everything else is required. See Phase 4 plan report (contradiction #4).
const ELECTIVE_CATEGORIES = new Set(["SPECIALIZED_ELECTIVE", "ELECTIVE"]);

async function seedCurricula() {
  const byName = new Map<string, string>();
  for (const curriculum of CURRICULA) {
    const row = await prisma.curriculum.upsert({
      where: { name: curriculum.name },
      update: {},
      create: curriculum,
    });
    byName.set(curriculum.name, row.id);
  }
  return byName;
}

async function findOrCreateCourse(entry: CourseEntry) {
  const existing = await prisma.course.findFirst({
    where: { courseCode: entry.code, name: entry.name },
  });
  if (existing) return existing;
  return prisma.course.create({
    data: { courseCode: entry.code, name: entry.name },
  });
}

async function seedCatalog(curriculumIdByName: Map<string, string>) {
  let coursesSeeded = 0;
  let membershipsSeeded = 0;
  let membershipsSkipped = 0;
  let groupsSeeded = 0;
  let groupMembershipsSeeded = 0;
  let requirementsSeeded = 0;

  for (const section of CATEGORY_SECTIONS) {
    const courseIdByCode = new Map<string, string>();

    for (const entry of section.courses) {
      const course = await findOrCreateCourse(entry);
      courseIdByCode.set(entry.code + "::" + entry.name, course.id);
      coursesSeeded++;
    }

    for (const curriculumName of section.curricula) {
      const curriculumId = curriculumIdByName.get(curriculumName);
      if (!curriculumId) {
        throw new Error(`Unknown curriculum referenced by seed data: ${curriculumName}`);
      }

      // docs/06_Curriculum_Dataset.md §7 — "کارگاه کامپیوتر" (7000031553) has
      // an unresolved category conflict; do not create its membership.
      const membershipEntries = section.courses.filter(
        (entry) => entry.code !== CATEGORY_CONFLICT_COURSE_CODE,
      );

      const membershipCourseIds: string[] = [];
      for (const entry of membershipEntries) {
        const courseId = courseIdByCode.get(entry.code + "::" + entry.name)!;
        await prisma.curriculumCourse.upsert({
          where: { curriculumId_courseId: { curriculumId, courseId } },
          update: {},
          create: {
            curriculumId,
            courseId,
            category: section.category,
            required: !ELECTIVE_CATEGORIES.has(section.category),
          },
        });
        membershipCourseIds.push(courseId);
        membershipsSeeded++;
      }
      membershipsSkipped += section.courses.length - membershipEntries.length;

      if (section.isGroup) {
        const group = await prisma.courseGroup.upsert({
          where: { curriculumId_name: { curriculumId, name: section.label } },
          update: {},
          create: {
            curriculumId,
            name: section.label,
            groupType: section.category,
            requiredUnits: section.requiredUnits,
          },
        });
        groupsSeeded++;

        for (const courseId of membershipCourseIds) {
          await prisma.courseGroupCourse.upsert({
            where: { courseGroupId_courseId: { courseGroupId: group.id, courseId } },
            update: {},
            create: { courseGroupId: group.id, courseId },
          });
          groupMembershipsSeeded++;
        }

        await prisma.curriculumRequirement.upsert({
          where: {
            curriculumId_requirementType_name: {
              curriculumId,
              requirementType: "COURSE_GROUP",
              name: section.label,
            },
          },
          update: {},
          create: {
            curriculumId,
            requirementType: "COURSE_GROUP",
            name: section.label,
            requiredUnits: section.requiredUnits,
            minimumPracticalUnits: section.minimumPracticalUnits ?? null,
            courseGroupId: group.id,
          },
        });
        requirementsSeeded++;
      } else {
        await prisma.curriculumRequirement.upsert({
          where: {
            curriculumId_requirementType_name: {
              curriculumId,
              requirementType: "CATEGORY_UNITS",
              name: section.label,
            },
          },
          update: {},
          create: {
            curriculumId,
            requirementType: "CATEGORY_UNITS",
            name: section.label,
            category: section.category,
            requiredUnits: section.requiredUnits,
          },
        });
        requirementsSeeded++;
      }
    }
  }

  return {
    coursesSeeded,
    membershipsSeeded,
    membershipsSkipped,
    groupsSeeded,
    groupMembershipsSeeded,
    requirementsSeeded,
  };
}

async function main() {
  const curriculumIdByName = await seedCurricula();
  const stats = await seedCatalog(curriculumIdByName);

  const totalCourses = await prisma.course.count();
  console.log("Seed complete.");
  console.log(`  Curricula: ${curriculumIdByName.size}`);
  console.log(`  Distinct courses in DB: ${totalCourses}`);
  console.log(`  Curriculum-course memberships upserted: ${stats.membershipsSeeded}`);
  console.log(`  Memberships intentionally skipped (category conflict): ${stats.membershipsSkipped}`);
  console.log(`  Course groups upserted: ${stats.groupsSeeded}`);
  console.log(`  Course group memberships upserted: ${stats.groupMembershipsSeeded}`);
  console.log(`  Curriculum requirements upserted: ${stats.requirementsSeeded}`);
}

main()
  .then(() => prisma.$disconnect())
  .catch(async (error) => {
    console.error(error);
    await prisma.$disconnect();
    process.exit(1);
  });
