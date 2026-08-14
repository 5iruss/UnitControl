import { redirect } from "next/navigation";
import Link from "next/link";
import { getCurrentUser } from "@/lib/auth/session";
import { getCurricula, getStudentProfile } from "@/lib/academic-profile/queries";
import { updateProfileAction } from "@/lib/academic-profile/actions";
import { homePathForRole } from "@/lib/auth/routes";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { ProfileForm } from "@/app/profile/profile-form";

// docs/02_User_Flow.md §13, docs/03_UX_UI_Specification.md §5, §20 — editing
// the academic profile.
export default async function ProfilePage() {
  const user = await getCurrentUser();
  if (!user) redirect("/login");
  if (user.role !== "STUDENT") redirect(homePathForRole(user.role));

  const profile = await getStudentProfile(user.id);
  if (!profile) redirect("/profile/setup");

  const curricula = await getCurricula();

  return (
    <main className="flex min-h-screen flex-col items-center justify-center gap-4 p-4">
      <Card className="w-full max-w-sm">
        <CardHeader>
          <CardTitle>Academic profile</CardTitle>
        </CardHeader>
        <CardContent>
          <ProfileForm
            action={updateProfileAction}
            curricula={curricula}
            defaultValues={{
              entryYear: profile.entryYear,
              major: profile.major,
              orientation: profile.orientation,
              studyType: profile.studyType,
            }}
            submitLabel="Save changes"
            mode="edit"
          />
        </CardContent>
      </Card>
      <Link href="/dashboard" className="text-sm underline">
        Back to dashboard
      </Link>
    </main>
  );
}
