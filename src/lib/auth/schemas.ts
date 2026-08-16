import { z } from "zod";

// Iranian mobile number format (e.g. 09123456789). Not specified by the
// docs; a reasonable technical default given the product's documented
// Iranian/Persian context (docs/09_Technical_Requirements.md §3).
const phoneNumberSchema = z
  .string()
  .trim()
  .regex(/^09\d{9}$/, "شماره تلفن معتبر وارد کنید (مثلاً 09123456789).");

// Minimum length is an implementation default (not specified by the docs);
// docs/09_Technical_Requirements.md §9/§15 only require secure hashing. Kept
// English: also used by supportResetPasswordSchema below, which serves the
// (unredesigned, English) Admin Panel.
const passwordSchema = z.string().min(8, "Password must be at least 8 characters.");
// Separate Persian-message schema for student registration only, so the
// Admin Panel's reset-password validation text is untouched by this
// redesign (docs Redesign prompt §28 — don't change admin behavior).
const registerPasswordSchema = z.string().min(8, "رمز عبور باید حداقل ۸ کاراکتر باشد.");

const studentNumberSchema = z.string().trim().min(1, "شماره دانشجویی الزامی است.").max(50);

// docs/02_User_Flow.md §3 — field order: student number, password, first
// name, last name, phone number.
export const registerSchema = z.object({
  studentNumber: studentNumberSchema,
  password: registerPasswordSchema,
  firstName: z.string().trim().min(1, "نام الزامی است.").max(100),
  lastName: z.string().trim().min(1, "نام خانوادگی الزامی است.").max(100),
  phoneNumber: phoneNumberSchema,
});

export type RegisterInput = z.infer<typeof registerSchema>;

// docs/01_Product_Overview.md §11 / docs/02_User_Flow.md §14 — login by
// student number OR phone number, plus password. Shared by student and
// admin login actions; kept English since both login forms enforce
// `required` client-side and the Admin Panel itself is unredesigned (docs
// Redesign prompt §28) — this validation path is not reachable through
// either form in normal use.
export const loginSchema = z.object({
  identifier: z.string().trim().min(1, "Student number or phone number is required."),
  password: z.string().min(1, "Password is required."),
});

export type LoginInput = z.infer<typeof loginSchema>;

// docs/02_User_Flow.md §15, docs/08_Admin_Panel.md §11 — support resets a
// student's password after locating their account.
export const supportResetPasswordSchema = z.object({
  identifier: z.string().trim().min(1, "Student number or phone number is required."),
  newPassword: passwordSchema,
});

export type SupportResetPasswordInput = z.infer<typeof supportResetPasswordSchema>;
