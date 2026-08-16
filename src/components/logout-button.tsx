"use client";

import { logoutAction } from "@/lib/auth/actions";
import { Button } from "@/components/ui/button";

// Shared by the (Persian-redesigned) student dashboard and the
// (unredesigned, English) Admin Panel layout — the label is a required prop
// rather than hardcoded so each caller supplies its own language, instead of
// this one component silently changing the Admin Panel's logout button text
// (docs Redesign prompt §28 — don't change admin behavior).
export function LogoutButton({ redirectTo, label }: { redirectTo: string; label: string }) {
  return (
    <form action={logoutAction.bind(null, redirectTo)}>
      <Button type="submit" variant="outline">
        {label}
      </Button>
    </form>
  );
}
