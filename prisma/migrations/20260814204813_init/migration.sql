-- CreateEnum
CREATE TYPE "Role" AS ENUM ('STUDENT', 'SUPER_ADMIN', 'ACADEMIC_GROUP_MANAGER', 'SUPPORT');

-- CreateEnum
CREATE TYPE "StudyType" AS ENUM ('FULL_TIME', 'PART_TIME');

-- CreateEnum
CREATE TYPE "CurriculumStatus" AS ENUM ('ACTIVE', 'INACTIVE', 'ARCHIVED');

-- CreateEnum
CREATE TYPE "CourseCategory" AS ENUM ('GENERAL', 'BASIC', 'SPECIALIZED_REQUIRED', 'SPECIALIZED_ELECTIVE', 'ELECTIVE', 'PREPARATORY', 'SKILLS_EMPLOYABILITY', 'ORIENTATION_SPECIALIZED');

-- CreateEnum
CREATE TYPE "RequirementType" AS ENUM ('TOTAL_UNITS', 'CATEGORY_UNITS', 'ELECTIVE_UNITS', 'PRACTICAL_UNITS', 'COURSE_GROUP');

-- CreateEnum
CREATE TYPE "RelationshipType" AS ENUM ('PREREQUISITE', 'COREQUISITE');

-- CreateEnum
CREATE TYPE "TermType" AS ENUM ('MEHR', 'BAHMAN', 'SUMMER');

-- CreateEnum
CREATE TYPE "CourseStatus" AS ENUM ('NOT_COMPLETED', 'PASSED', 'FAILED', 'CURRENTLY_STUDYING', 'PLANNED');

-- CreateEnum
CREATE TYPE "AttemptResult" AS ENUM ('PASSED', 'FAILED', 'CURRENTLY_STUDYING');

-- CreateTable
CREATE TABLE "users" (
    "id" TEXT NOT NULL,
    "student_number" TEXT NOT NULL,
    "phone_number" TEXT,
    "password_hash" TEXT NOT NULL,
    "first_name" TEXT NOT NULL,
    "last_name" TEXT NOT NULL,
    "role" "Role" NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "users_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "student_profiles" (
    "id" TEXT NOT NULL,
    "user_id" TEXT NOT NULL,
    "entry_year" INTEGER NOT NULL,
    "major" TEXT NOT NULL,
    "orientation" TEXT NOT NULL,
    "study_type" "StudyType" NOT NULL,
    "curriculum_id" TEXT NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "student_profiles_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "curricula" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "major" TEXT NOT NULL,
    "orientation" TEXT NOT NULL,
    "entry_year_from" INTEGER NOT NULL,
    "entry_year_to" INTEGER,
    "total_required_units" INTEGER,
    "status" "CurriculumStatus" NOT NULL DEFAULT 'ACTIVE',
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "curricula_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "courses" (
    "id" TEXT NOT NULL,
    "course_code" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "credits" INTEGER,
    "course_type" TEXT,
    "is_practical" BOOLEAN,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "courses_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "curriculum_courses" (
    "id" TEXT NOT NULL,
    "curriculum_id" TEXT NOT NULL,
    "course_id" TEXT NOT NULL,
    "category" "CourseCategory" NOT NULL,
    "required" BOOLEAN NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "curriculum_courses_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "course_groups" (
    "id" TEXT NOT NULL,
    "curriculum_id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "group_type" TEXT NOT NULL,
    "required_units" INTEGER,
    "minimum_courses" INTEGER,
    "maximum_courses" INTEGER,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "course_groups_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "course_group_courses" (
    "id" TEXT NOT NULL,
    "course_group_id" TEXT NOT NULL,
    "course_id" TEXT NOT NULL,

    CONSTRAINT "course_group_courses_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "curriculum_requirements" (
    "id" TEXT NOT NULL,
    "curriculum_id" TEXT NOT NULL,
    "requirement_type" "RequirementType" NOT NULL,
    "name" TEXT NOT NULL,
    "category" "CourseCategory",
    "required_units" INTEGER,
    "minimum_practical_units" INTEGER,
    "course_group_id" TEXT,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "curriculum_requirements_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "course_relationships" (
    "id" TEXT NOT NULL,
    "source_course_id" TEXT NOT NULL,
    "target_course_id" TEXT NOT NULL,
    "relationship_type" "RelationshipType" NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "course_relationships_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "academic_terms" (
    "id" TEXT NOT NULL,
    "term_code" TEXT NOT NULL,
    "academic_year" INTEGER NOT NULL,
    "term_type" "TermType" NOT NULL,

    CONSTRAINT "academic_terms_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "student_courses" (
    "id" TEXT NOT NULL,
    "student_id" TEXT NOT NULL,
    "course_id" TEXT NOT NULL,
    "status" "CourseStatus" NOT NULL,
    "academic_term_id" TEXT,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "student_courses_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "student_course_attempts" (
    "id" TEXT NOT NULL,
    "student_id" TEXT NOT NULL,
    "course_id" TEXT NOT NULL,
    "academic_term_id" TEXT NOT NULL,
    "result" "AttemptResult" NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "student_course_attempts_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "student_semesters" (
    "id" TEXT NOT NULL,
    "student_id" TEXT NOT NULL,
    "academic_term_id" TEXT NOT NULL,
    "semester_gpa" DECIMAL(65,30) NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "student_semesters_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "users_student_number_key" ON "users"("student_number");

-- CreateIndex
CREATE UNIQUE INDEX "users_phone_number_key" ON "users"("phone_number");

-- CreateIndex
CREATE UNIQUE INDEX "student_profiles_user_id_key" ON "student_profiles"("user_id");

-- CreateIndex
CREATE UNIQUE INDEX "courses_course_code_key" ON "courses"("course_code");

-- CreateIndex
CREATE UNIQUE INDEX "curriculum_courses_curriculum_id_course_id_key" ON "curriculum_courses"("curriculum_id", "course_id");

-- CreateIndex
CREATE UNIQUE INDEX "course_group_courses_course_group_id_course_id_key" ON "course_group_courses"("course_group_id", "course_id");

-- CreateIndex
CREATE UNIQUE INDEX "course_relationships_source_course_id_target_course_id_rela_key" ON "course_relationships"("source_course_id", "target_course_id", "relationship_type");

-- CreateIndex
CREATE UNIQUE INDEX "academic_terms_term_code_key" ON "academic_terms"("term_code");

-- CreateIndex
CREATE UNIQUE INDEX "student_courses_student_id_course_id_key" ON "student_courses"("student_id", "course_id");

-- CreateIndex
CREATE UNIQUE INDEX "student_course_attempts_student_id_course_id_academic_term__key" ON "student_course_attempts"("student_id", "course_id", "academic_term_id");

-- CreateIndex
CREATE UNIQUE INDEX "student_semesters_student_id_academic_term_id_key" ON "student_semesters"("student_id", "academic_term_id");

-- AddForeignKey
ALTER TABLE "student_profiles" ADD CONSTRAINT "student_profiles_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "student_profiles" ADD CONSTRAINT "student_profiles_curriculum_id_fkey" FOREIGN KEY ("curriculum_id") REFERENCES "curricula"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "curriculum_courses" ADD CONSTRAINT "curriculum_courses_curriculum_id_fkey" FOREIGN KEY ("curriculum_id") REFERENCES "curricula"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "curriculum_courses" ADD CONSTRAINT "curriculum_courses_course_id_fkey" FOREIGN KEY ("course_id") REFERENCES "courses"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "course_groups" ADD CONSTRAINT "course_groups_curriculum_id_fkey" FOREIGN KEY ("curriculum_id") REFERENCES "curricula"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "course_group_courses" ADD CONSTRAINT "course_group_courses_course_group_id_fkey" FOREIGN KEY ("course_group_id") REFERENCES "course_groups"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "course_group_courses" ADD CONSTRAINT "course_group_courses_course_id_fkey" FOREIGN KEY ("course_id") REFERENCES "courses"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "curriculum_requirements" ADD CONSTRAINT "curriculum_requirements_curriculum_id_fkey" FOREIGN KEY ("curriculum_id") REFERENCES "curricula"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "curriculum_requirements" ADD CONSTRAINT "curriculum_requirements_course_group_id_fkey" FOREIGN KEY ("course_group_id") REFERENCES "course_groups"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "course_relationships" ADD CONSTRAINT "course_relationships_source_course_id_fkey" FOREIGN KEY ("source_course_id") REFERENCES "courses"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "course_relationships" ADD CONSTRAINT "course_relationships_target_course_id_fkey" FOREIGN KEY ("target_course_id") REFERENCES "courses"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "student_courses" ADD CONSTRAINT "student_courses_student_id_fkey" FOREIGN KEY ("student_id") REFERENCES "student_profiles"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "student_courses" ADD CONSTRAINT "student_courses_course_id_fkey" FOREIGN KEY ("course_id") REFERENCES "courses"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "student_courses" ADD CONSTRAINT "student_courses_academic_term_id_fkey" FOREIGN KEY ("academic_term_id") REFERENCES "academic_terms"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "student_course_attempts" ADD CONSTRAINT "student_course_attempts_student_id_fkey" FOREIGN KEY ("student_id") REFERENCES "student_profiles"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "student_course_attempts" ADD CONSTRAINT "student_course_attempts_course_id_fkey" FOREIGN KEY ("course_id") REFERENCES "courses"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "student_course_attempts" ADD CONSTRAINT "student_course_attempts_academic_term_id_fkey" FOREIGN KEY ("academic_term_id") REFERENCES "academic_terms"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "student_semesters" ADD CONSTRAINT "student_semesters_student_id_fkey" FOREIGN KEY ("student_id") REFERENCES "student_profiles"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "student_semesters" ADD CONSTRAINT "student_semesters_academic_term_id_fkey" FOREIGN KEY ("academic_term_id") REFERENCES "academic_terms"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
