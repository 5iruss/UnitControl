import { redirect } from "next/navigation";
import { getCurrentUser } from "@/lib/auth/session";
import { getCurricula, getStudentProfile } from "@/lib/academic-profile/queries";
import { createProfileAction } from "@/lib/academic-profile/actions";
import { homePathForRole } from "@/lib/auth/routes";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { ProfileForm } from "@/app/profile/profile-form";

// docs/02_User_Flow.md §4 — Academic Profile Setup, right after registration.
export default async function ProfileSetupPage() {
  const user = await getCurrentUser();
  if (!user) redirect("/login");
  if (user.role !== "STUDENT") redirect(homePathForRole(user.role));

  const existing = await getStudentProfile(user.id);
  if (existing) redirect("/profile");

  const curricula = await getCurricula();

  return (
    <main className="flex min-h-screen items-center justify-center p-4">
      <Card className="w-full max-w-sm">
        <CardHeader>
          <CardTitle>تکمیل پروفایل تحصیلی</CardTitle>
        </CardHeader>
        <CardContent>
          <ProfileForm
            action={createProfileAction}
            curricula={curricula}
            submitLabel="ادامه"
            mode="create"
          />
        </CardContent>
      </Card>
    </main>
  );
}
