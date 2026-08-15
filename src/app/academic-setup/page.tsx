import { redirect } from "next/navigation";
import Link from "next/link";
import { getCurrentUser } from "@/lib/auth/session";
import { getStudentProfile } from "@/lib/academic-profile/queries";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { buttonVariants } from "@/components/ui/button";

// docs/02_User_Flow.md §2, §5 — after the academic profile, the student
// chooses Simple or Advanced academic setup.
export default async function AcademicSetupPage() {
  const user = await getCurrentUser();
  if (!user || user.role !== "STUDENT") redirect("/login");

  const profile = await getStudentProfile(user.id);
  if (!profile) redirect("/profile/setup");

  return (
    <main className="mx-auto flex min-h-screen max-w-2xl flex-col items-center justify-center gap-4 p-4">
      <h1 className="text-xl font-semibold">Set up your academic history</h1>

      <Card className="w-full">
        <CardHeader>
          <CardTitle>Simple Mode</CardTitle>
          <CardDescription>
            Quickly mark your current course statuses. No semester history or GPA required.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Link href="/academic-status" className={buttonVariants()}>
            Start Simple Mode
          </Link>
        </CardContent>
      </Card>

      <Card className="w-full">
        <CardHeader>
          <CardTitle>Advanced Mode</CardTitle>
          <CardDescription>
            Enter your academic history semester by semester, including semester GPA.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Link href="/academic-setup/advanced" className={buttonVariants({ variant: "outline" })}>
            Start Advanced Mode
          </Link>
        </CardContent>
      </Card>
    </main>
  );
}
