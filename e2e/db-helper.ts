// Uses `pg` directly rather than the generated Prisma Client: Prisma 7's
// "prisma-client" generator emits ESM-only TypeScript source, which
// Playwright's CJS-oriented TS loader cannot import from files under
// src/generated/ (that directory's nearest package.json is the project
// root, which is CommonJS by default). Raw SQL is simple enough here since
// this file only seeds/reads a couple of rows for test setup/assertions.
import { config } from "dotenv";
config({ path: ".env.test", quiet: true });

import { Client } from "pg";
import bcrypt from "bcryptjs";
import { randomUUID } from "crypto";

async function withClient<T>(fn: (client: Client) => Promise<T>): Promise<T> {
  const client = new Client({ connectionString: process.env.DATABASE_URL });
  await client.connect();
  try {
    return await fn(client);
  } finally {
    await client.end();
  }
}

export function uniqueId(prefix: string): string {
  return `${prefix}-${Date.now()}-${Math.floor(Math.random() * 1e6)}`;
}

type Role = "SUPER_ADMIN" | "SUPPORT" | "ACADEMIC_GROUP_MANAGER";

export async function seedAdmin(role: Role) {
  const studentNumber = uniqueId(role.toLowerCase());
  const password = "AdminPass123!";
  const passwordHash = await bcrypt.hash(password, 4);
  const id = randomUUID();

  await withClient((client) =>
    client.query(
      `INSERT INTO users (id, student_number, phone_number, password_hash, first_name, last_name, role, created_at, updated_at)
       VALUES ($1, $2, NULL, $3, 'Test', $4, $5, NOW(), NOW())`,
      [id, studentNumber, passwordHash, role, role],
    ),
  );

  return { id, studentNumber, password };
}

export async function seedStudent() {
  const studentNumber = uniqueId("student");
  const password = "StudentPass123!";
  const passwordHash = await bcrypt.hash(password, 4);
  const id = randomUUID();

  await withClient((client) =>
    client.query(
      `INSERT INTO users (id, student_number, phone_number, password_hash, first_name, last_name, role, created_at, updated_at)
       VALUES ($1, $2, NULL, $3, 'Test', 'Student', 'STUDENT', NOW(), NOW())`,
      [id, studentNumber, passwordHash],
    ),
  );

  return { id, studentNumber, password };
}

export async function findAuditLog(target: string, action: string, adminId: string) {
  return withClient(async (client) => {
    const result = await client.query(
      `SELECT * FROM audit_logs WHERE target = $1 AND action = $2 AND admin_id = $3 LIMIT 1`,
      [target, action, adminId],
    );
    return result.rows[0] ?? null;
  });
}

export async function getUserByStudentNumber(studentNumber: string) {
  return withClient(async (client) => {
    const result = await client.query(`SELECT * FROM users WHERE student_number = $1 LIMIT 1`, [
      studentNumber,
    ]);
    return result.rows[0] ?? null;
  });
}

export async function getCurriculumByName(name: string) {
  return withClient(async (client) => {
    const result = await client.query(`SELECT * FROM curricula WHERE name = $1 LIMIT 1`, [name]);
    return result.rows[0] ?? null;
  });
}

export async function getStudentProfileByUserId(userId: string) {
  return withClient(async (client) => {
    const result = await client.query(
      `SELECT * FROM student_profiles WHERE user_id = $1 LIMIT 1`,
      [userId],
    );
    return result.rows[0] ?? null;
  });
}

/// Seeds a throwaway course row (no curriculum, code, credits — just enough
/// to satisfy the FK) so a StudentCourse row can be attached to it for the
/// reset-cascade test.
export async function seedCourse() {
  const id = randomUUID();
  const courseCode = uniqueId("course");
  await withClient((client) =>
    client.query(`INSERT INTO courses (id, course_code, name, created_at, updated_at)
       VALUES ($1, $2, 'Test Course', NOW(), NOW())`, [id, courseCode]),
  );
  return { id, courseCode };
}

export async function seedStudentCourse(studentProfileId: string, courseId: string) {
  const id = randomUUID();
  await withClient((client) =>
    client.query(
      `INSERT INTO student_courses (id, student_id, course_id, status, created_at, updated_at)
       VALUES ($1, $2, $3, 'NOT_COMPLETED', NOW(), NOW())`,
      [id, studentProfileId, courseId],
    ),
  );
  return { id };
}

export async function countStudentCourses(studentProfileId: string) {
  return withClient(async (client) => {
    const result = await client.query(
      `SELECT count(*)::int AS count FROM student_courses WHERE student_id = $1`,
      [studentProfileId],
    );
    return result.rows[0].count as number;
  });
}

// ---------------------------------------------------------------------------
// Curriculum-data read helpers (Phase 4).
// ---------------------------------------------------------------------------

export async function getAllCurricula() {
  return withClient(async (client) => (await client.query(`SELECT * FROM curricula`)).rows);
}

export async function getAllCourses() {
  return withClient(async (client) => (await client.query(`SELECT * FROM courses`)).rows);
}

export async function getAllCurriculumCourses() {
  return withClient(
    async (client) => (await client.query(`SELECT * FROM curriculum_courses`)).rows,
  );
}

export async function getAllCourseGroups() {
  return withClient(async (client) => (await client.query(`SELECT * FROM course_groups`)).rows);
}

export async function getAllCourseGroupCourses() {
  return withClient(
    async (client) => (await client.query(`SELECT * FROM course_group_courses`)).rows,
  );
}

export async function getAllCurriculumRequirements() {
  return withClient(
    async (client) => (await client.query(`SELECT * FROM curriculum_requirements`)).rows,
  );
}

export async function getAllCourseRelationships() {
  return withClient(
    async (client) => (await client.query(`SELECT * FROM course_relationships`)).rows,
  );
}

/// Seeds a single verified relationship row between two real courses, for
/// exercising the curriculum map's edge-rendering path (docs/06_Curriculum_Dataset.md
/// §5 — the actual dataset has zero relationships, so this is test-only
/// fixture data). Callers must clean up with deleteCourseRelationship.
export async function seedCourseRelationship(
  sourceCourseId: string,
  targetCourseId: string,
  relationshipType: "PREREQUISITE" | "COREQUISITE",
) {
  const id = randomUUID();
  await withClient((client) =>
    client.query(
      `INSERT INTO course_relationships (id, source_course_id, target_course_id, relationship_type, created_at, updated_at)
       VALUES ($1, $2, $3, $4, NOW(), NOW())`,
      [id, sourceCourseId, targetCourseId, relationshipType],
    ),
  );
  return { id };
}

export async function deleteCourseRelationship(id: string) {
  await withClient((client) => client.query(`DELETE FROM course_relationships WHERE id = $1`, [id]));
}

// ---------------------------------------------------------------------------
// Academic-status read helpers (Phase 5).
// ---------------------------------------------------------------------------

/// Picks one real course that belongs to the given curriculum (by name),
/// for use as a valid course reference in tests.
export async function getCourseInCurriculum(curriculumName: string) {
  return withClient(async (client) => {
    const result = await client.query(
      `SELECT c.id, c.course_code, c.name
       FROM curriculum_courses cc
       JOIN curricula cur ON cur.id = cc.curriculum_id
       JOIN courses c ON c.id = cc.course_id
       WHERE cur.name = $1
       ORDER BY c.name
       LIMIT 1`,
      [curriculumName],
    );
    return result.rows[0] ?? null;
  });
}

/// A second, distinct course from the same curriculum (for multi-course tests).
export async function getAnotherCourseInCurriculum(curriculumName: string, excludeCourseId: string) {
  return withClient(async (client) => {
    const result = await client.query(
      `SELECT c.id, c.course_code, c.name
       FROM curriculum_courses cc
       JOIN curricula cur ON cur.id = cc.curriculum_id
       JOIN courses c ON c.id = cc.course_id
       WHERE cur.name = $1 AND c.id != $2
       ORDER BY c.name
       LIMIT 1`,
      [curriculumName, excludeCourseId],
    );
    return result.rows[0] ?? null;
  });
}

export async function getStudentCourse(studentId: string, courseId: string) {
  return withClient(async (client) => {
    const result = await client.query(
      `SELECT * FROM student_courses WHERE student_id = $1 AND course_id = $2 LIMIT 1`,
      [studentId, courseId],
    );
    return result.rows[0] ?? null;
  });
}

export async function getStudentCourseAttempts(studentId: string, courseId: string) {
  return withClient(async (client) => {
    const result = await client.query(
      `SELECT sca.*, at.term_code FROM student_course_attempts sca
       JOIN academic_terms at ON at.id = sca.academic_term_id
       WHERE sca.student_id = $1 AND sca.course_id = $2`,
      [studentId, courseId],
    );
    return result.rows;
  });
}

export async function getStudentSemesterByTermCode(studentId: string, termCode: string) {
  return withClient(async (client) => {
    const result = await client.query(
      `SELECT ss.* FROM student_semesters ss
       JOIN academic_terms at ON at.id = ss.academic_term_id
       WHERE ss.student_id = $1 AND at.term_code = $2
       LIMIT 1`,
      [studentId, termCode],
    );
    return result.rows[0] ?? null;
  });
}

export async function getCourseGroupCoursesByGroupId(courseGroupId: string) {
  return withClient(
    async (client) =>
      (
        await client.query(
          `SELECT c.* FROM course_group_courses gc JOIN courses c ON c.id = gc.course_id WHERE gc.course_group_id = $1`,
          [courseGroupId],
        )
      ).rows,
  );
}
