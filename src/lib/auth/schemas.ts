import { z } from "zod";

// Iranian mobile number format (e.g. 09123456789). Not specified by the
// docs; a reasonable technical default given the product's documented
// Iranian/Persian context (docs/09_Technical_Requirements.md §3).
const phoneNumberSchema = z
  .string()
  .trim()
  .regex(/^09\d{9}$/, "Enter a valid phone number (e.g. 09123456789).");

// Minimum length is an implementation default (not specified by the docs);
// docs/09_Technical_Requirements.md §9/§15 only require secure hashing.
const passwordSchema = z.string().min(8, "Password must be at least 8 characters.");

const studentNumberSchema = z.string().trim().min(1, "Student number is required.").max(50);

// docs/02_User_Flow.md §3 — field order: student number, password, first
// name, last name, phone number.
export const registerSchema = z.object({
  studentNumber: studentNumberSchema,
  password: passwordSchema,
  firstName: z.string().trim().min(1, "First name is required.").max(100),
  lastName: z.string().trim().min(1, "Last name is required.").max(100),
  phoneNumber: phoneNumberSchema,
});

export type RegisterInput = z.infer<typeof registerSchema>;

// docs/01_Product_Overview.md §11 / docs/02_User_Flow.md §14 — login by
// student number OR phone number, plus password.
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
