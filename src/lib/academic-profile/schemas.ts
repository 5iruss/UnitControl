import { z } from "zod";

// docs/02_User_Flow.md §4 — entry year, major, orientation, study type.
// Major/orientation are validated against real curricula (see actions.ts),
// not a hardcoded enum, per docs/09_Technical_Requirements.md §26 "Do Not
// Hardcode Curriculum Data in UI Components".
export const profileSchema = z.object({
  entryYear: z.coerce
    .number()
    .int("سال ورود باید یک عدد صحیح باشد.")
    .positive("سال ورود باید عددی مثبت باشد."),
  major: z.string().trim().min(1, "رشته الزامی است."),
  orientation: z.string().trim().min(1, "گرایش الزامی است."),
  studyType: z.enum(["FULL_TIME", "PART_TIME"], {
    error: "نوع تحصیل را انتخاب کنید.",
  }),
});

export type ProfileInput = z.infer<typeof profileSchema>;
