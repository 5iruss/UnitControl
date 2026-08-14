// Plain, framework-independent types for curriculum-data integrity
// validation. Mirrors domain/academic/ and domain/academic-profile/'s
// isolation: no Prisma/Next imports — callers map DB rows into these shapes.

export interface CurriculumRecord {
  id: string;
  name: string;
  major: string;
  orientation: string;
  entryYearFrom: number | null;
  entryYearTo: number | null;
}

export interface CourseRecord {
  id: string;
  courseCode: string;
  name: string;
}

export interface CurriculumCourseRecord {
  id: string;
  curriculumId: string;
  courseId: string;
  category: string;
}

export interface CourseGroupRecord {
  id: string;
  curriculumId: string;
  name: string;
}

export interface CourseGroupCourseRecord {
  id: string;
  courseGroupId: string;
  courseId: string;
}

export interface CurriculumRequirementRecord {
  id: string;
  curriculumId: string;
  requirementType: string;
  courseGroupId: string | null;
  category: string | null;
}

export interface CourseRelationshipRecord {
  id: string;
  sourceCourseId: string;
  targetCourseId: string;
}

export interface CurriculumDataset {
  curricula: CurriculumRecord[];
  courses: CourseRecord[];
  curriculumCourses: CurriculumCourseRecord[];
  courseGroups: CourseGroupRecord[];
  courseGroupCourses: CourseGroupCourseRecord[];
  curriculumRequirements: CurriculumRequirementRecord[];
  courseRelationships: CourseRelationshipRecord[];
}

export type FindingSeverity = "error" | "warning" | "info";

export interface Finding {
  severity: FindingSeverity;
  code: string;
  message: string;
}
