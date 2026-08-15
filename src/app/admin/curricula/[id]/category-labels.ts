// docs/05_Curriculum_Data_Model.md §7 — the eight documented course
// categories, shared by curriculum-course membership and requirement forms
// on this curriculum's admin pages.
export const CATEGORY_OPTIONS = [
  "PREPARATORY",
  "GENERAL",
  "BASIC",
  "SPECIALIZED_REQUIRED",
  "ORIENTATION_SPECIALIZED",
  "SPECIALIZED_ELECTIVE",
  "ELECTIVE",
  "SKILLS_EMPLOYABILITY",
] as const;

export const CATEGORY_LABEL: Record<string, string> = {
  PREPARATORY: "Preparatory",
  GENERAL: "General",
  BASIC: "Basic",
  SPECIALIZED_REQUIRED: "Specialized Required",
  ORIENTATION_SPECIALIZED: "Orientation Specialization",
  SPECIALIZED_ELECTIVE: "Specialized Selective",
  ELECTIVE: "Elective",
  SKILLS_EMPLOYABILITY: "Skills / Employability",
};
