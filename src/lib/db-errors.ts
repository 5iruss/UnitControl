import { Prisma } from "@/generated/prisma/client";

// docs/09_Technical_Requirements.md — server-side validation must not trust
// a client-side pre-check alone. Every "does X already exist?" read-then-
// create action has a TOCTOU race window; this lets callers translate the
// resulting Postgres unique-constraint violation (Prisma error code P2002)
// into the same friendly message the pre-check already returns, instead of
// letting it surface as an unhandled server error.
export function isUniqueConstraintError(error: unknown): boolean {
  return error instanceof Prisma.PrismaClientKnownRequestError && error.code === "P2002";
}
