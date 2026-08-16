"use client";

import { useActionState } from "react";
import Link from "next/link";
import { registerAction, type ActionState } from "@/lib/auth/actions";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

const initialState: ActionState = {};

export function RegisterForm() {
  const [state, formAction, pending] = useActionState(registerAction, initialState);

  return (
    <form action={formAction} className="flex flex-col gap-4">
      <div className="flex flex-col gap-2">
        <Label htmlFor="studentNumber">شماره دانشجویی</Label>
        <Input id="studentNumber" name="studentNumber" required autoComplete="username" dir="ltr" />
      </div>
      <div className="flex flex-col gap-2">
        <Label htmlFor="password">رمز عبور</Label>
        <Input
          id="password"
          name="password"
          type="password"
          required
          autoComplete="new-password"
        />
      </div>
      <div className="flex flex-col gap-2">
        <Label htmlFor="firstName">نام</Label>
        <Input id="firstName" name="firstName" required autoComplete="given-name" />
      </div>
      <div className="flex flex-col gap-2">
        <Label htmlFor="lastName">نام خانوادگی</Label>
        <Input id="lastName" name="lastName" required autoComplete="family-name" />
      </div>
      <div className="flex flex-col gap-2">
        <Label htmlFor="phoneNumber">شماره تلفن</Label>
        <Input
          id="phoneNumber"
          name="phoneNumber"
          placeholder="09123456789"
          required
          autoComplete="tel"
          dir="ltr"
        />
      </div>
      {state.error && <p className="text-sm text-destructive" role="alert">{state.error}</p>}
      <Button type="submit" disabled={pending}>
        {pending ? "در حال ساخت حساب…" : "ساخت حساب"}
      </Button>
      <p className="text-sm text-muted-foreground">
        قبلاً حساب کاربری دارید؟{" "}
        <Link href="/login" className="underline">
          ورود
        </Link>
      </p>
    </form>
  );
}
