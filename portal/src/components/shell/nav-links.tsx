"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { FileSignature, FolderKanban, LayoutDashboard, ShieldCheck } from "lucide-react";
import { cn } from "@/lib/utils";

const ICONS = { dashboard: LayoutDashboard, projects: FolderKanban, contracts: FileSignature, admin: ShieldCheck } as const;

export interface NavItem {
  href: string;
  label: string;
  icon: keyof typeof ICONS;
  badge?: number;
}

export function NavLinks({ items, onNavigate }: { items: NavItem[]; onNavigate?: () => void }) {
  const pathname = usePathname();
  return (
    <ul className="space-y-1">
      {items.map((item) => {
        const Icon = ICONS[item.icon];
        const active = item.href === "/" ? pathname === "/" : pathname.startsWith(item.href);
        return (
          <li key={item.href}>
            <Link
              href={item.href}
              onClick={onNavigate}
              aria-current={active ? "page" : undefined}
              className={cn(
                "group flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm transition-colors",
                active ? "bg-ink-veil text-bone" : "text-bone-dim hover:bg-ink-raised hover:text-bone",
              )}
            >
              <Icon className={cn("size-4 shrink-0", active ? "text-vermilion" : "text-bone-faint group-hover:text-bone-dim")} aria-hidden />
              <span className="flex-1">{item.label}</span>
              {item.badge ? (
                <span className="rounded-full bg-vermilion px-1.5 py-0.5 font-mono text-[0.625rem] leading-none text-primary-foreground">
                  {item.badge}
                </span>
              ) : null}
            </Link>
          </li>
        );
      })}
    </ul>
  );
}
