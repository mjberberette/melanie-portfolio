"use client";

import { useState } from "react";
import { Menu } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetTrigger } from "@/components/ui/sheet";
import { NavLinks, type NavItem } from "./nav-links";

export function MobileNav({ items, footer }: { items: NavItem[]; footer: React.ReactNode }) {
  const [open, setOpen] = useState(false);
  return (
    <Sheet open={open} onOpenChange={setOpen}>
      <SheetTrigger render={<Button variant="ghost" size="icon" aria-label="Open menu" />}>
        <Menu className="size-5" />
      </SheetTrigger>
      <SheetContent side="left" className="w-72 bg-ink p-0">
        <SheetHeader className="border-b border-border px-5 py-4">
          <SheetTitle className="flex items-center gap-3 text-left">
            <span className="mark size-6 text-bone" aria-hidden />
            <span className="eyebrow text-bone">Client portal</span>
          </SheetTitle>
        </SheetHeader>
        <nav className="p-3" aria-label="Main">
          <NavLinks items={items} onNavigate={() => setOpen(false)} />
        </nav>
        <div className="mt-auto border-t border-border p-3">{footer}</div>
      </SheetContent>
    </Sheet>
  );
}
