-- DropIndex
DROP INDEX "courses_course_code_key";

-- CreateIndex
CREATE INDEX "courses_course_code_idx" ON "courses"("course_code");

