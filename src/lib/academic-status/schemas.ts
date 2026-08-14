import { z } from "zod";
import {
  ATTEMPT_RESULT_VALUES,
  COURSE_STATUS_VALUES,
  isValidTermCode,
  type AttemptResultValue,
  type CourseStatusValue,
} from "@/domain/academic-status";

// docs/07_Database_Schema.md §14.1 — status is one of the five documented
// values. plannedTermCode is only required when status === "PLANNED"
// (docs/05_Curriculum_Data_Model.md §14.1), checked in the action itself
// since Zod's object-level refine would otherwise duplicate that branch.
export const courseStatusSchema = z.object({
  courseId: z.string().trim().min(1, "Course is required."),
  status: z.enum(COURSE_STATUS_VALUES as [CourseStatusValue, ...CourseStatusValue[]], {
    error: "Select a valid course status.",
  }),
  plannedTermCode: z
    .string()
    .trim()
    .optional()
    .transform((value) => (value ? value : undefined)),
});

export type CourseStatusInput = z.infer<typeof courseStatusSchema>;

// docs/07_Database_Schema.md §15 — one semester record (term + GPA) per
// student + term.
export const semesterSchema = z.object({
  termCode: z
    .string()
    .trim()
    .refine(isValidTermCode, "Enter a valid academic term code (e.g. 4051)."),
  semesterGpa: z.coerce
    .number({ error: "Enter a semester GPA." })
    .nonnegative("Semester GPA cannot be negative.")
    .finite("Enter a valid semester GPA."),
});

export type SemesterInput = z.infer<typeof semesterSchema>;

// docs/07_Database_Schema.md §14.2 — one attempt record per student +
// course + term.
export const courseAttemptSchema = z.object({
  termCode: z
    .string()
    .trim()
    .refine(isValidTermCode, "Enter a valid academic term code (e.g. 4051)."),
  courseId: z.string().trim().min(1, "Course is required."),
  result: z.enum(ATTEMPT_RESULT_VALUES as [AttemptResultValue, ...AttemptResultValue[]], {
    error: "Select a valid result.",
  }),
});

export type CourseAttemptInput = z.infer<typeof courseAttemptSchema>;
