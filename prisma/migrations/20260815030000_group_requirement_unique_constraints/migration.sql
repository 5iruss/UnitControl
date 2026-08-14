-- CreateIndex
CREATE UNIQUE INDEX "course_groups_curriculum_id_name_key" ON "course_groups"("curriculum_id", "name");

-- CreateIndex
CREATE UNIQUE INDEX "curriculum_requirements_curriculum_id_requirement_type_name_key" ON "curriculum_requirements"("curriculum_id", "requirement_type", "name");

