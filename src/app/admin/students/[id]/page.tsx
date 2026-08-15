import { notFound } from "next/navigation";
import Link from "next/link";
import { requireAdminPageAccess } from "@/lib/admin/authorization";
import { getStudentAccountDetail } from "@/lib/admin/students/queries";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

const SEARCH_ROLES = ["SUPER_ADMIN", "ACADEMIC_GROUP_MANAGER", "SUPPORT"] as const;

// docs/08_Admin_Panel.md §12 — basic account info + academic profile fields
// only; never the password hash (docs §11).
export default async function StudentDetailPage(props: PageProps<"/admin/students/[id]">) {
  const user = await requireAdminPageAccess(SEARCH_ROLES);
  const { id } = await props.params;
  const student = await getStudentAccountDetail(id);
  if (!student) notFound();

  return (
    <main className="mx-auto flex max-w-2xl flex-col gap-4 p-4">
      <h1 className="text-xl font-semibold">
        {student.firstName} {student.lastName}
      </h1>

      <Card>
        <CardHeader>
          <CardTitle>Account</CardTitle>
        </CardHeader>
        <CardContent className="flex flex-col gap-1 text-sm">
          <span>
            Student number: <span dir="ltr">{student.studentNumber}</span>
          </span>
          <span>
            Phone number: <span dir="ltr">{student.phoneNumber ?? "—"}</span>
          </span>
          <span>Account created: {student.createdAt.toLocaleDateString("en-US")}</span>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Academic profile</CardTitle>
        </CardHeader>
        <CardContent className="flex flex-col gap-1 text-sm">
          {!student.studentProfile ? (
            <p className="text-muted-foreground">Profile not yet configured.</p>
          ) : (
            <>
              <span>Entry year: {student.studentProfile.entryYear}</span>
              <span>Major: {student.studentProfile.major}</span>
              <span>Orientation: {student.studentProfile.orientation}</span>
              <span>
                Study type: {student.studentProfile.studyType === "FULL_TIME" ? "Full-time" : "Part-time"}
              </span>
              <span>Curriculum: {student.studentProfile.curriculum.name}</span>
              <span>
                Academic setup:{" "}
                {student.studentProfile.academicSetupCompletedAt ? "Completed" : "Not yet completed"}
              </span>
            </>
          )}
        </CardContent>
      </Card>

      {(user.role === "SUPER_ADMIN" || user.role === "SUPPORT") && (
        <Link href="/admin/support/reset-password" className="text-sm underline">
          Reset this student&apos;s password
        </Link>
      )}
    </main>
  );
}
