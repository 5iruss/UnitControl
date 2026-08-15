import { z } from "zod";

const optionalPhoneNumber = z.preprocess(
  (v) => (typeof v === "string" && v.trim() === "" ? null : v),
  z
    .string()
    .regex(/^09\d{9}$/, "Enter a valid phone number (e.g. 09123456789).")
    .nullable(),
);

// docs/08_Admin_Panel.md §2, §16 — Super Admin creates administrator
// accounts (Super Admin, Academic Group Manager, or Support).
export const createAdminSchema = z.object({
  studentNumber: z.string().trim().min(1, "Identifier is required.").max(50),
  phoneNumber: optionalPhoneNumber,
  password: z.string().min(8, "Password must be at least 8 characters."),
  firstName: z.string().trim().min(1, "First name is required.").max(100),
  lastName: z.string().trim().min(1, "Last name is required.").max(100),
  role: z.enum(["SUPER_ADMIN", "ACADEMIC_GROUP_MANAGER", "SUPPORT"]),
});
