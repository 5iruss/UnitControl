import { redirect } from "next/navigation";
import Link from "next/link";
import { getCurrentUser } from "@/lib/auth/session";
import { LogoutButton } from "@/components/logout-button";

// Minimal protected stub proving admin/support session auth works
// end-to-end. The full Admin Panel (docs/08_Admin_Panel.md) is a later
// phase (docs/10_Claude_Master_Prompt.md §29).
export default async function AdminPage() {
  const user = await getCurrentUser();
  if (!user || user.role === "STUDENT") redirect("/admin/login");

  return (
    <main className="flex min-h-screen flex-col items-center justify-center gap-4 p-4">
      <p>
        Welcome, {user.firstName} {user.lastName} ({user.role}).
      </p>
      {(user.role === "SUPER_ADMIN" || user.role === "SUPPORT") && (
        <Link href="/admin/support/reset-password" className="underline">
          Reset a student&apos;s password
        </Link>
      )}
      <LogoutButton redirectTo="/admin/login" />
    </main>
  );
}
