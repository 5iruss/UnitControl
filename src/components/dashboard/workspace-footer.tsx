import Link from "next/link";
import { CalendarPlus, ClipboardList, UserCog } from "lucide-react";

// docs Redesign prompt §23 — lightweight, secondary footer actions. Only
// links to routes that actually exist in the product (academic status,
// semester recording, academic profile): a settings/support/help page was
// not part of any prior phase and doesn't exist, so no dead links for them
// are added here (docs Redesign prompt's FINAL SAFETY RULE — don't invent
// missing product requirements).
export function WorkspaceFooter() {
  return (
    <footer className="flex flex-wrap items-center gap-4 rounded-xl border bg-card p-4 text-sm">
      <Link href="/academic-status" className="flex items-center gap-1.5 text-muted-foreground hover:text-foreground hover:underline">
        <ClipboardList className="size-4" aria-hidden />
        مدیریت وضعیت دروس
      </Link>
      <Link href="/academic-setup/advanced" className="flex items-center gap-1.5 text-muted-foreground hover:text-foreground hover:underline">
        <CalendarPlus className="size-4" aria-hidden />
        ثبت یک ترم
      </Link>
      <Link href="/profile" className="flex items-center gap-1.5 text-muted-foreground hover:text-foreground hover:underline">
        <UserCog className="size-4" aria-hidden />
        مدیریت پروفایل تحصیلی
      </Link>
    </footer>
  );
}
