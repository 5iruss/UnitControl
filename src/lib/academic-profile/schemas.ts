import { z } from "zod";

// docs/02_User_Flow.md §4 — entry year, major, orientation, study type.
// Major/orientation are validated against real curricula (see actions.ts),
// not a hardcoded enum, per docs/09_Technical_Requirements.md §26 "Do Not
// Hardcode Curriculum Data in UI Components".
export const profileSchema = z.object({
  entryYear: z.coerce
    .number()
    .int("Entry year must be a whole number.")
    .positive("Entry year must be a positive number."),
  major: z.string().trim().min(1, "Major is required."),
  orientation: z.string().trim().min(1, "Orientation is required."),
  studyType: z.enum(["FULL_TIME", "PART_TIME"], {
    error: "Select a study type.",
  }),
});

export type ProfileInput = z.infer<typeof profileSchema>;
