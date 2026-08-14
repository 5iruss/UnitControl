import Link from "next/link";
import { redirect } from "next/navigation";
import { getCurrentUser } from "@/lib/auth/session";
import { homePathForRole } from "@/lib/auth/routes";
import { Button } from "@/components/ui/button";

export default async function Home() {
  const user = await getCurrentUser();
  if (user) redirect(homePathForRole(user.role));

  return (
    <main className="flex min-h-screen flex-col items-center justify-center gap-4 p-4">
      <h1 className="text-2xl font-semibold">UnitControl</h1>
      <div className="flex gap-4">
        <Button render={<Link href="/login">Log in</Link>} />
        <Button variant="outline" render={<Link href="/register">Register</Link>} />
      </div>
    </main>
  );
}
