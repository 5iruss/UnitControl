"use client";

import { useActionState } from "react";
import { supportResetPasswordAction, type ActionState } from "@/lib/auth/actions";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

const initialState: ActionState = {};

export function ResetPasswordForm() {
  const [state, formAction, pending] = useActionState(
    supportResetPasswordAction,
    initialState,
  );

  return (
    <form action={formAction} className="flex flex-col gap-4">
      <div className="flex flex-col gap-2">
        <Label htmlFor="identifier">Student number or phone number</Label>
        <Input id="identifier" name="identifier" required dir="ltr" />
      </div>
      <div className="flex flex-col gap-2">
        <Label htmlFor="newPassword">New password</Label>
        <Input id="newPassword" name="newPassword" type="password" required />
      </div>
      {state.error && (
        <p className="text-sm text-destructive" role="alert">
          {state.error}
        </p>
      )}
      {state.success && (
        <p className="text-sm text-emerald-700 dark:text-emerald-400" role="status" aria-live="polite">
          {state.success}
        </p>
      )}
      <Button type="submit" disabled={pending}>
        {pending ? "Resetting…" : "Reset password"}
      </Button>
    </form>
  );
}
