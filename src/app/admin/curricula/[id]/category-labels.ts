// docs/05_Curriculum_Data_Model.md §7 — the eight documented course
// categories, shared by curriculum-course membership and requirement forms
// on this curriculum's admin pages. Re-exports the single source of truth
// in the domain layer (also used by the curriculum map) instead of keeping
// an independent copy that could drift out of sync.
import { CATEGORY_LABELS, CATEGORY_ORDER } from "@/domain/curriculum-map";

export const CATEGORY_OPTIONS = CATEGORY_ORDER;
// Widened to Record<string, string> (rather than Record<CourseCategory, string>)
// since call sites index it with plain-string values read from the DB/forms.
export const CATEGORY_LABEL: Record<string, string> = CATEGORY_LABELS;
