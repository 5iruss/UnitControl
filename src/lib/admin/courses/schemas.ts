import { z } from "zod";

// docs/06_Curriculum_Dataset.md §7 — credits/is_practical are legitimately
// unknown for the current dataset; the form must be able to submit "unknown"
// explicitly rather than being forced to pick true/false.
const optionalPositiveInt = z.preprocess(
  (v) => (v === "" || v === undefined || v === null ? null : Number(v)),
  z.number().int().positive().nullable(),
);

const tristateBoolean = z.preprocess((v) => {
  if (v === "true") return true;
  if (v === "false") return false;
  return null;
}, z.boolean().nullable());

const optionalText = z.preprocess(
  (v) => (typeof v === "string" && v.trim() === "" ? null : v),
  z.string().trim().max(200).nullable(),
);

export const courseSchema = z.object({
  courseCode: z.string().trim().min(1, "Course code is required.").max(100),
  name: z.string().trim().min(1, "Name is required.").max(300),
  credits: optionalPositiveInt,
  courseType: optionalText,
  isPractical: tristateBoolean,
});

export type CourseInput = z.infer<typeof courseSchema>;

export const updateCourseSchema = courseSchema.and(
  z.object({
    id: z.string().trim().min(1),
    status: z.enum(["ACTIVE", "INACTIVE", "ARCHIVED"]),
  }),
);

export const courseStatusSchema = z.object({
  id: z.string().trim().min(1),
  status: z.enum(["ACTIVE", "INACTIVE", "ARCHIVED"]),
});
