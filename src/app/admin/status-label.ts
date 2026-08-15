// Shared label for the CurriculumStatus enum (ACTIVE/INACTIVE/ARCHIVED),
// reused by both Course.status and Curriculum.status (prisma/schema.prisma
// — Course intentionally reuses this enum rather than defining a second
// one, docs Phase 10 admin panel work). Kept in one place so list views and
// edit forms can never show a raw enum value in one spot and a humanized
// label in another for the same field.
export const STATUS_LABEL: Record<string, string> = {
  ACTIVE: "Active",
  INACTIVE: "Inactive",
  ARCHIVED: "Archived",
};
