import "server-only";
import { prisma } from "@/lib/prisma";
import type { AcademicState, CourseAttemptRecord, CourseRelationshipRecord } from "@/domain/academic";

// docs/09_Technical_Requirements.md §2, §24 — the Academic Rules Engine
// (domain/academic/) must not import Prisma directly. This module is the
// glue layer: it fetches the student's academic data and maps it into the
// domain's framework-independent AcademicState shape.
//
// Relationships are scoped to the student's curriculum (docs/04_Academic_Rules_Engine.md
// §16 — curriculum isolation): only relationships where the source or target
// course belongs to `curriculumId` are included.
export async function buildAcademicState(
  studentId: string,
  curriculumId: string,
): Promise<AcademicState> {
  const [curriculumCourses, studentCourses, attempts, relationships] = await Promise.all([
    prisma.curriculumCourse.findMany({
      where: { curriculumId },
      select: { courseId: true },
    }),
    prisma.studentCourse.findMany({
      where: { studentId },
      select: { courseId: true, status: true },
    }),
    prisma.studentCourseAttempt.findMany({
      where: { studentId },
      select: { courseId: true, result: true, academicTerm: { select: { termCode: true } } },
    }),
    prisma.courseRelationship.findMany({
      where: {
        OR: [
          { sourceCourse: { curriculumCourses: { some: { curriculumId } } } },
          { targetCourse: { curriculumCourses: { some: { curriculumId } } } },
        ],
      },
      select: { sourceCourseId: true, targetCourseId: true, relationshipType: true },
    }),
  ]);

  const attemptRecords: CourseAttemptRecord[] = attempts.map((attempt) => ({
    courseId: attempt.courseId,
    termCode: attempt.academicTerm.termCode,
    result: attempt.result,
  }));

  const relationshipRecords: CourseRelationshipRecord[] = relationships.map((relationship) => ({
    sourceCourseId: relationship.sourceCourseId,
    targetCourseId: relationship.targetCourseId,
    relationshipType: relationship.relationshipType,
  }));

  return {
    curriculumCourseIds: new Set(curriculumCourses.map((c) => c.courseId)),
    courseStatuses: new Map(studentCourses.map((sc) => [sc.courseId, sc.status])),
    attempts: attemptRecords,
    relationships: relationshipRecords,
  };
}
