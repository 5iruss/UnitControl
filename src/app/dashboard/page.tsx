import { redirect } from "next/navigation";
import Link from "next/link";
import { getCurrentUser } from "@/lib/auth/session";
import { getStudentProfile } from "@/lib/academic-profile/queries";
import { LogoutButton } from "@/components/logout-button";

// Minimal protected stub proving session auth + academic profile gating
// work end-to-end. The real dashboard (curriculum map, statistics, etc.) is
// a later phase (docs/10_Claude_Master_Prompt.md §29).
export default async function DashboardPage() {
  const user = await getCurrentUser();
  if (!user || user.role !== "STUDENT") redirect("/login");

  // docs/02_User_Flow.md §2 — Registration -> Academic Profile -> Dashboard.
  const profile = await getStudentProfile(user.id);
  if (!profile) redirect("/profile/setup");

  return (
    <main className="flex min-h-screen flex-col items-center justify-center gap-4 p-4">
      <p>
        Welcome, {user.firstName} {user.lastName}.
      </p>
      <Link href="/profile" className="text-sm underline">
        Manage academic profile
      </Link>
      <LogoutButton redirectTo="/login" />
    </main>
  );
}
