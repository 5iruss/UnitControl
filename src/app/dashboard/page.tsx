import { redirect } from "next/navigation";
import { getCurrentUser } from "@/lib/auth/session";
import { LogoutButton } from "@/components/logout-button";

// Minimal protected stub proving session auth works end-to-end. The real
// dashboard (curriculum map, statistics, etc.) is a later phase
// (docs/10_Claude_Master_Prompt.md §29).
export default async function DashboardPage() {
  const user = await getCurrentUser();
  if (!user || user.role !== "STUDENT") redirect("/login");

  return (
    <main className="flex min-h-screen flex-col items-center justify-center gap-4 p-4">
      <p>
        Welcome, {user.firstName} {user.lastName}.
      </p>
      <LogoutButton redirectTo="/login" />
    </main>
  );
}
