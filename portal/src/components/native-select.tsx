import { ChevronDown } from "lucide-react";
import { cn } from "@/lib/utils";

/** A plain <select> styled to match the inputs. Native selects submit with
 *  forms without any client JS, which keeps the admin forms simple. */
export function NativeSelect({ className, children, ...props }: React.ComponentProps<"select">) {
  return (
    <div className="relative">
      <select
        {...props}
        className={cn(
          "h-10 w-full appearance-none rounded-lg border border-input bg-ink-raised px-3 pr-9 text-sm text-bone outline-none transition-colors focus-visible:border-ring focus-visible:ring-2 focus-visible:ring-ring/40 disabled:opacity-50",
          className,
        )}
      >
        {children}
      </select>
      <ChevronDown className="pointer-events-none absolute top-1/2 right-3 size-4 -translate-y-1/2 text-bone-faint" aria-hidden />
    </div>
  );
}
