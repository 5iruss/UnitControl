import { z } from "zod";

const optionalPositiveInt = z.preprocess(
  (v) => (v === "" || v === undefined || v === null ? null : Number(v)),
  z.number().int().positive().nullable(),
);

const optionalCategory = z.preprocess(
  (v) => (v === "" || v === undefined || v === null ? null : v),
  z
    .enum([
      "GENERAL",
      "BASIC",
      "SPECIALIZED_REQUIRED",
      "SPECIALIZED_ELECTIVE",
      "ELECTIVE",
      "PREPARATORY",
      "SKILLS_EMPLOYABILITY",
      "ORIENTATION_SPECIALIZED",
    ])
    .nullable(),
);

const optionalId = z.preprocess(
  (v) => (v === "" || v === undefined || v === null ? null : v),
  z.string().trim().min(1).nullable(),
);

export const requirementSchema = z.object({
  curriculumId: z.string().trim().min(1),
  requirementType: z.enum([
    "TOTAL_UNITS",
    "CATEGORY_UNITS",
    "ELECTIVE_UNITS",
    "PRACTICAL_UNITS",
    "COURSE_GROUP",
  ]),
  name: z.string().trim().min(1, "Name is required.").max(200),
  category: optionalCategory,
  requiredUnits: optionalPositiveInt,
  minimumPracticalUnits: optionalPositiveInt,
  courseGroupId: optionalId,
});

export const updateRequirementSchema = requirementSchema.and(z.object({ id: z.string().trim().min(1) }));

export const deleteRequirementSchema = z.object({ id: z.string().trim().min(1) });
