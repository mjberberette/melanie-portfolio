"use client";

import { useState } from "react";
import { Menu } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetTrigger } from "@/components/ui/sheet";
import { NavLinks, type NavItem } from "./nav-links";
import { Logo } from "@/components/logo";

export function MobileNav({ items, footer }: { items: NavItem[]; footer: React.ReactNode }) {
  const [open, setOpen] = useState(false);
  return (
    <Sheet open={open} onOpenChange={setOpen}>
      <SheetTrigger render={<Button variant="ghost" size="icon" aria-label="Open menu" />}>
        <Menu className="size-5" />
      </SheetTrigger>
      <SheetContent side="left" className="w-72 bg-ink p-0">
        <SheetHeader className="border-b border-border px-5 py-4">
          <SheetTitle className="text-left">
            <Logo size="sm" animate={false} />
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
