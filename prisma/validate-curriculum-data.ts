// Runs the pure validator in src/domain/curriculum-data/validate.ts against
// the live database and prints a report. Reports problems; does not fix
// them (task Phase 4 §12, §18). Exits non-zero only if any "error"-severity
// finding is present — "warning"/"info" findings (including the documented
// dataset anomalies) are expected and do not fail the run.
import "dotenv/config";
import { PrismaClient } from "../src/generated/prisma/client";
import { PrismaPg } from "@prisma/adapter-pg";
import { validateCurriculumData, type Finding } from "../src/domain/curriculum-data";

const adapter = new PrismaPg({ connectionString: process.env.DATABASE_URL });
const prisma = new PrismaClient({ adapter });

async function main() {
  const [curricula, courses, curriculumCourses, courseGroups, courseGroupCourses, curriculumRequirements, courseRelationships] =
    await Promise.all([
      prisma.curriculum.findMany(),
      prisma.course.findMany(),
      prisma.curriculumCourse.findMany(),
      prisma.courseGroup.findMany(),
      prisma.courseGroupCourse.findMany(),
      prisma.curriculumRequirement.findMany(),
      prisma.courseRelationship.findMany(),
    ]);

  const findings = validateCurriculumData({
    curricula,
    courses,
    curriculumCourses,
    courseGroups,
    courseGroupCourses,
    curriculumRequirements,
    courseRelationships,
  });

  const bySeverity = (severity: Finding["severity"]) =>
    findings.filter((f) => f.severity === severity);

  console.log(`Curriculum data validation report`);
  console.log(`  Curricula: ${curricula.length}`);
  console.log(`  Courses: ${courses.length}`);
  console.log(`  Curriculum-course memberships: ${curriculumCourses.length}`);
  console.log(`  Course groups: ${courseGroups.length}`);
  console.log(`  Course relationships: ${courseRelationships.length}`);
  console.log("");

  for (const severity of ["error", "warning", "info"] as const) {
    const group = bySeverity(severity);
    if (group.length === 0) continue;
    console.log(`${severity.toUpperCase()} (${group.length}):`);
    for (const finding of group) {
      console.log(`  [${finding.code}] ${finding.message}`);
    }
    console.log("");
  }

  const errorCount = bySeverity("error").length;
  if (errorCount > 0) {
    console.error(`Validation failed: ${errorCount} error(s) found.`);
    process.exitCode = 1;
  } else {
    console.log("Validation passed: no errors.");
  }
}

main()
  .then(() => prisma.$disconnect())
  .catch(async (error) => {
    console.error(error);
    await prisma.$disconnect();
    process.exit(1);
  });
