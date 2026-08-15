"use client";

import { useActionState } from "react";
import { createAdminAction, type AdminActionState } from "@/lib/admin/admins/actions";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

const initialState: AdminActionState = {};

const ROLE_OPTIONS = [
  { value: "SUPER_ADMIN", label: "Super Admin" },
  { value: "ACADEMIC_GROUP_MANAGER", label: "Academic Group Manager" },
  { value: "SUPPORT", label: "Support" },
] as const;

const ROLE_LABEL_BY_VALUE: Map<string, string> = new Map(ROLE_OPTIONS.map((o) => [o.value, o.label]));

export function AdminCreateForm() {
  const [state, formAction, pending] = useActionState(createAdminAction, initialState);

  return (
    <form action={formAction} className="flex flex-col gap-4">
      <div className="flex flex-col gap-2">
        <Label htmlFor="studentNumber">Identifier (login number)</Label>
        <Input id="studentNumber" name="studentNumber" required />
      </div>
      <div className="flex flex-col gap-2">
        <Label htmlFor="phoneNumber">Phone number (optional)</Label>
        <Input id="phoneNumber" name="phoneNumber" placeholder="09123456789" />
      </div>
      <div className="flex flex-col gap-2">
        <Label htmlFor="firstName">First name</Label>
        <Input id="firstName" name="firstName" required />
      </div>
      <div className="flex flex-col gap-2">
        <Label htmlFor="lastName">Last name</Label>
        <Input id="lastName" name="lastName" required />
      </div>
      <div className="flex flex-col gap-2">
        <Label htmlFor="password">Password</Label>
        <Input id="password" name="password" type="password" required />
      </div>
      <div className="flex flex-col gap-2">
        <Label htmlFor="role">Role</Label>
        <Select name="role" defaultValue="SUPPORT">
          <SelectTrigger id="role" aria-label="Role">
            <SelectValue placeholder="Select a role">
              {(value: string) => ROLE_LABEL_BY_VALUE.get(value) ?? value}
            </SelectValue>
          </SelectTrigger>
          <SelectContent>
            {ROLE_OPTIONS.map((option) => (
              <SelectItem key={option.value} value={option.value}>
                {option.label}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>
      {state.error && <p className="text-sm text-destructive">{state.error}</p>}
      <Button type="submit" disabled={pending}>
        {pending ? "Creating…" : "Create administrator"}
      </Button>
    </form>
  );
}
