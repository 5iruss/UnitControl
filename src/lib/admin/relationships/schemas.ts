import { z } from "zod";

export const createRelationshipSchema = z.object({
  sourceCourseId: z.string().trim().min(1, "Select the source course."),
  targetCourseId: z.string().trim().min(1, "Select the target course."),
  relationshipType: z.enum(["PREREQUISITE", "COREQUISITE"]),
});

export const deleteRelationshipSchema = z.object({
  id: z.string().trim().min(1),
});
