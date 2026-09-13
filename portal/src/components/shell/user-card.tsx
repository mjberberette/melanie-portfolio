import { LogOut } from "lucide-react";
import { signOut } from "@/app/(auth)/login/actions";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { initials } from "@/lib/format";
import type { Profile } from "@/lib/types";

export function UserCard({ profile }: { profile: Profile }) {
  return (
    <div className="flex items-center gap-3 rounded-lg px-2 py-1.5">
      <Avatar className="size-8 border border-border">
        <AvatarFallback className="bg-ink-veil font-mono text-[0.625rem] text-bone">{initials(profile.fullName || profile.email)}</AvatarFallback>
      </Avatar>
      <div className="min-w-0 flex-1">
        <p className="truncate text-sm leading-tight">{profile.fullName || profile.email}</p>
        <p className="truncate text-xs text-bone-faint">{profile.company ?? (profile.role === "admin" ? "Studio" : profile.email)}</p>
      </div>
      <form action={signOut}>
        <Button type="submit" variant="ghost" size="icon" className="size-8 text-bone-faint hover:text-bone" aria-label="Sign out">
          <LogOut className="size-4" />
        </Button>
      </form>
    </div>
  );
}
