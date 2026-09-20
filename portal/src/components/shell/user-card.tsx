import Link from "next/link";
import { LogOut } from "lucide-react";
import { signOut } from "@/app/(auth)/login/actions";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { initials } from "@/lib/format";
import type { Profile } from "@/lib/types";

export function UserCard({ profile }: { profile: Profile }) {
  return (
    <div className="flex items-center gap-1 rounded-lg py-1.5 pr-2 pl-1">
      <Link
        href="/profile"
        className="flex min-w-0 flex-1 items-center gap-3 rounded-lg px-1.5 py-1 outline-none hover:bg-ink-raised focus-visible:ring-3 focus-visible:ring-ring/50"
        aria-label="Your profile"
      >
        <Avatar className="size-8 border border-border">
          {profile.avatarUrl && <AvatarImage src={profile.avatarUrl} alt="" />}
          <AvatarFallback className="bg-ink-veil font-mono text-[0.625rem] text-bone">{initials(profile.fullName || profile.email)}</AvatarFallback>
        </Avatar>
        <div className="min-w-0 flex-1">
          <p className="truncate text-sm leading-tight">{profile.fullName || profile.email}</p>
          <p className="truncate text-xs text-bone-faint">{profile.company ?? (profile.role === "admin" ? "Studio" : profile.email)}</p>
        </div>
      </Link>
      <form action={signOut}>
        <Button type="submit" variant="ghost" size="icon" className="size-8 text-bone-faint hover:text-bone" aria-label="Sign out">
          <LogOut className="size-4" />
        </Button>
      </form>
    </div>
  );
}
