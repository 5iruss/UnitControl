"use client";

import { useActionState } from "react";
import Link from "next/link";
import { studentLoginAction, type ActionState } from "@/lib/auth/actions";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

const initialState: ActionState = {};

export function LoginForm() {
  const [state, formAction, pending] = useActionState(studentLoginAction, initialState);

  return (
    <form action={formAction} className="flex flex-col gap-4">
      <div className="flex flex-col gap-2">
        <Label htmlFor="identifier">شماره دانشجویی یا شماره تلفن</Label>
        <Input id="identifier" name="identifier" required autoComplete="username" dir="ltr" />
      </div>
      <div className="flex flex-col gap-2">
        <Label htmlFor="password">رمز عبور</Label>
        <Input
          id="password"
          name="password"
          type="password"
          required
          autoComplete="current-password"
        />
      </div>
      {state.error && <p className="text-sm text-destructive" role="alert">{state.error}</p>}
      <Button type="submit" disabled={pending}>
        {pending ? "در حال ورود…" : "ورود"}
      </Button>
      <p className="text-sm text-muted-foreground">
        هنوز حساب کاربری ندارید؟{" "}
        <Link href="/register" className="underline">
          ثبت‌نام
        </Link>
      </p>
    </form>
  );
}
