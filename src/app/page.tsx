import Link from "next/link";
import { redirect } from "next/navigation";
import { getCurrentUser } from "@/lib/auth/session";
import { homePathForRole } from "@/lib/auth/routes";
import { buttonVariants } from "@/components/ui/button";

export default async function Home() {
  const user = await getCurrentUser();
  if (user) redirect(homePathForRole(user.role));

  return (
    <main className="flex min-h-screen flex-col items-center justify-center gap-4 p-4">
      <h1 className="text-2xl font-semibold">UnitControl</h1>
      <div className="flex gap-4">
        <Link href="/login" className={buttonVariants()}>
          Log in
        </Link>
        <Link href="/register" className={buttonVariants({ variant: "outline" })}>
          Register
        </Link>
      </div>
    </main>
  );
}
