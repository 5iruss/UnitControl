"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import {
  Dialog,
  DialogClose,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";

export interface AdminActionState {
  error?: string;
  success?: string;
}

export interface ConfirmActionButtonProps {
  label: string;
  pendingLabel?: string;
  title: string;
  description: string;
  confirmLabel?: string;
  variant?: "destructive" | "outline";
  action: (prevState: AdminActionState, formData: FormData) => Promise<AdminActionState>;
  fields: Record<string, string>;
}

// docs/08_Admin_Panel.md §17, docs Phase 10 prompt §17 — "Confirmation
// dialogs for destructive operations." One reusable component for every
// archive/delete/remove action in the Admin Panel, rather than a bespoke
// dialog per screen.
export function ConfirmActionButton({
  label,
  pendingLabel,
  title,
  description,
  confirmLabel = "Confirm",
  variant = "destructive",
  action,
  fields,
}: ConfirmActionButtonProps) {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [isPending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);

  function handleConfirm() {
    setError(null);
    const formData = new FormData();
    for (const [key, value] of Object.entries(fields)) formData.set(key, value);
    startTransition(async () => {
      const result = await action({}, formData);
      if (result.error) {
        setError(result.error);
        return;
      }
      setOpen(false);
      router.refresh();
    });
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger render={<Button type="button" variant={variant} size="sm" />}>
        {label}
      </DialogTrigger>
      <DialogContent dir="rtl">
        <DialogHeader>
          <DialogTitle>{title}</DialogTitle>
          <DialogDescription>{description}</DialogDescription>
        </DialogHeader>
        {error && <p className="text-sm text-destructive" role="alert">{error}</p>}
        <DialogFooter>
          <DialogClose render={<Button type="button" variant="outline" />}>Cancel</DialogClose>
          <Button type="button" variant={variant} onClick={handleConfirm} disabled={isPending}>
            {isPending ? (pendingLabel ?? "Working…") : confirmLabel}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
