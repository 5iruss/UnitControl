import { redirect } from "next/navigation";
import { getCurrentUser } from "@/lib/auth/session";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { LogoutButton } from "@/components/logout-button";
import { ResetPasswordForm } from "./reset-password-form";

// docs/02_User_Flow.md §15, docs/08_Admin_Panel.md §11 — support-driven
// password reset. Restricted to SUPPORT and SUPER_ADMIN (docs/08_Admin_Panel.md §16).
export default async function SupportResetPasswordPage() {
  const user = await getCurrentUser();
  if (!user || !["SUPER_ADMIN", "SUPPORT"].includes(user.role)) {
    redirect("/admin/login");
  }

  return (
    <main className="flex min-h-screen flex-col items-center justify-center gap-4 p-4">
      <Card className="w-full max-w-sm">
        <CardHeader>
          <CardTitle>Reset a student&apos;s password</CardTitle>
        </CardHeader>
        <CardContent>
          <ResetPasswordForm />
        </CardContent>
      </Card>
      <LogoutButton redirectTo="/admin/login" />
    </main>
  );
}
