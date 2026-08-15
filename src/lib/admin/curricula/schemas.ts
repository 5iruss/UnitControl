import { z } from "zod";

// docs/07_Database_Schema.md §6 — entryYearFrom/entryYearTo/totalRequiredUnits
// are nullable; empty form fields map to null rather than 0 or omission.
const optionalPositiveInt = z.preprocess(
  (v) => (v === "" || v === undefined || v === null ? null : Number(v)),
  z.number().int().positive().nullable(),
);

export const curriculumSchema = z
  .object({
    name: z.string().trim().min(1, "Name is required.").max(200),
    major: z.string().trim().min(1, "Major is required.").max(200),
    orientation: z.string().trim().min(1, "Orientation is required.").max(200),
    entryYearFrom: optionalPositiveInt,
    entryYearTo: optionalPositiveInt,
    totalRequiredUnits: optionalPositiveInt,
    status: z.enum(["ACTIVE", "INACTIVE", "ARCHIVED"]),
  })
  .refine(
    (data) =>
      data.entryYearFrom === null || data.entryYearTo === null || data.entryYearFrom <= data.entryYearTo,
    { message: "Entry year from must not be after entry year to.", path: ["entryYearTo"] },
  );

export type CurriculumInput = z.infer<typeof curriculumSchema>;

export const updateCurriculumSchema = curriculumSchema.and(
  z.object({ id: z.string().trim().min(1) }),
);

export const addCurriculumCourseSchema = z.object({
  curriculumId: z.string().trim().min(1),
  courseId: z.string().trim().min(1),
  category: z.enum([
    "GENERAL",
    "BASIC",
    "SPECIALIZED_REQUIRED",
    "SPECIALIZED_ELECTIVE",
    "ELECTIVE",
    "PREPARATORY",
    "SKILLS_EMPLOYABILITY",
    "ORIENTATION_SPECIALIZED",
  ]),
  required: z.preprocess((v) => v === "true" || v === "on", z.boolean()),
});

export const updateCurriculumCourseSchema = addCurriculumCourseSchema.and(
  z.object({ id: z.string().trim().min(1) }),
);

export const removeCurriculumCourseSchema = z.object({
  id: z.string().trim().min(1),
});
