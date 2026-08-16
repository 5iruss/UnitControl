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
      <h1 className="text-xl font-semibold">تنظیم سوابق تحصیلی</h1>

      <Card className="w-full">
        <CardHeader>
          <CardTitle>حالت ساده</CardTitle>
          <CardDescription>
            وضعیت فعلی دروس خود را به‌سرعت مشخص کنید. نیازی به سابقه ترمی یا معدل نیست.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Link href="/academic-status" className={buttonVariants()}>
            شروع حالت ساده
          </Link>
        </CardContent>
      </Card>

      <Card className="w-full">
        <CardHeader>
          <CardTitle>حالت پیشرفته</CardTitle>
          <CardDescription>
            سوابق تحصیلی خود را ترم به ترم، همراه با معدل هر ترم، وارد کنید.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Link href="/academic-setup/advanced" className={buttonVariants({ variant: "outline" })}>
            شروع حالت پیشرفته
          </Link>
        </CardContent>
      </Card>
    </main>
  );
}
