import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

// Unauthenticated by design (used by uptime/deploy tooling), so it must not
// return any business data (e.g. a user count) — only whether the app can
// reach its database.
export async function GET() {
  try {
    await prisma.$queryRaw`SELECT 1`;
    return NextResponse.json({ status: "ok" });
  } catch {
    return NextResponse.json({ status: "error" }, { status: 503 });
  }
}
