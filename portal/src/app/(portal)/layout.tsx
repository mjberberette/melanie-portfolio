import Link from "next/link";
import { requireSession } from "@/lib/auth";
import { getStore, isDemoMode } from "@/lib/store";
import { NavLinks, type NavItem } from "@/components/shell/nav-links";
import { MobileNav } from "@/components/shell/mobile-nav";
import { UserCard } from "@/components/shell/user-card";

export default async function PortalLayout({ children }: LayoutProps<"/">) {
  const profile = await requireSession();
  const store = getStore();
  const isAdmin = profile.role === "admin";

  const contracts = await store.listContracts(isAdmin ? undefined : profile.id);
  const awaiting = contracts.filter((c) => c.status === "awaiting_signature").length;

  const items: NavItem[] = [
    { href: "/", label: "Overview", icon: "dashboard" },
    { href: "/projects", label: "Projects", icon: "projects" },
    { href: "/contracts", label: "Agreements", icon: "contracts", badge: isAdmin ? undefined : awaiting || undefined },
  ];
  if (isAdmin) items.push({ href: "/admin", label: "Studio admin", icon: "admin" });

  return (
    <div className="flex min-h-screen">
      <aside className="sticky top-0 hidden h-screen w-64 shrink-0 flex-col border-r border-border lg:flex">
        <Link href="/" className="flex items-center gap-3 px-6 py-6">
          <span className="mark size-7 text-bone" aria-hidden />
          <span className="eyebrow text-bone">Client portal</span>
        </Link>
        <nav className="flex-1 px-3" aria-label="Main">
          <NavLinks items={items} />
        </nav>
        {isDemoMode() && (
          <p className="mx-3 mb-3 rounded-lg border border-dashed border-border px-3 py-2 text-xs leading-relaxed text-bone-faint">
            Demo mode — sample data, resets on restart. Connect Supabase to go live.
          </p>
        )}
        <div className="border-t border-border p-3">
          <UserCard profile={profile} />
        </div>
      </aside>

      <div className="flex min-w-0 flex-1 flex-col">
        <header className="sticky top-0 z-30 flex items-center justify-between border-b border-border bg-ink/85 px-4 py-3 backdrop-blur lg:hidden">
          <Link href="/" className="flex items-center gap-2.5">
            <span className="mark size-6 text-bone" aria-hidden />
            <span className="eyebrow text-bone">Client portal</span>
          </Link>
          <MobileNav items={items} footer={<UserCard profile={profile} />} />
        </header>
        <main className="mx-auto w-full max-w-6xl flex-1 px-4 py-8 sm:px-8 sm:py-12">{children}</main>
        <footer className="px-4 py-6 text-xs text-bone-faint sm:px-8">
          Questions about anything here? Email{" "}
          <a href="mailto:hello@melanieberberette.com" className="underline-offset-4 hover:text-bone hover:underline">
            hello@melanieberberette.com
          </a>
          .
        </footer>
      </div>
    </div>
  );
}
