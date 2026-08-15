import { z } from "zod";

const optionalPositiveInt = z.preprocess(
  (v) => (v === "" || v === undefined || v === null ? null : Number(v)),
  z.number().int().positive().nullable(),
);

export const courseGroupSchema = z
  .object({
    curriculumId: z.string().trim().min(1),
    name: z.string().trim().min(1, "Name is required.").max(200),
    groupType: z.string().trim().min(1, "Group type is required.").max(100),
    requiredUnits: optionalPositiveInt,
    minimumCourses: optionalPositiveInt,
    maximumCourses: optionalPositiveInt,
  })
  .refine(
    (data) =>
      data.minimumCourses === null || data.maximumCourses === null || data.minimumCourses <= data.maximumCourses,
    { message: "Minimum courses must not exceed maximum courses.", path: ["maximumCourses"] },
  );

export const updateCourseGroupSchema = courseGroupSchema.and(z.object({ id: z.string().trim().min(1) }));

export const deleteCourseGroupSchema = z.object({ id: z.string().trim().min(1) });

export const addGroupCourseSchema = z.object({
  courseGroupId: z.string().trim().min(1),
  courseId: z.string().trim().min(1, "Select a course."),
});

export const removeGroupCourseSchema = z.object({ id: z.string().trim().min(1) });
