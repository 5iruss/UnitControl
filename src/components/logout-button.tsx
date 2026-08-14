"use client";

import { logoutAction } from "@/lib/auth/actions";
import { Button } from "@/components/ui/button";

export function LogoutButton({ redirectTo }: { redirectTo: string }) {
  return (
    <form action={logoutAction.bind(null, redirectTo)}>
      <Button type="submit" variant="outline">
        Log out
      </Button>
    </form>
  );
}
