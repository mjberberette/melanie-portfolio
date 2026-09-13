import { Check } from "lucide-react";
import { cn } from "@/lib/utils";
import { PHASES, PHASE_LABELS, type Phase, type ProjectStatus } from "@/lib/types";

/** The five-phase progress track. Complete projects show every phase done. */
export function PhaseTrack({ phase, status, compact = false }: { phase: Phase; status: ProjectStatus; compact?: boolean }) {
  const current = status === "complete" ? PHASES.length : PHASES.indexOf(phase);

  return (
    <ol className={cn("grid gap-2", compact ? "grid-cols-5" : "grid-cols-5 sm:gap-3")} aria-label="Project phases">
      {PHASES.map((p, i) => {
        const done = i < current;
        const active = i === current;
        return (
          <li key={p} className="min-w-0">
            <div
              className={cn(
                "h-1 rounded-full transition-colors",
                done ? "bg-vermilion" : active ? "bg-vermilion/60" : "bg-bone/10",
              )}
            >
              {active && <div className="h-full w-1/2 rounded-full bg-vermilion" />}
            </div>
            {!compact && (
              <div className="mt-2.5 flex items-center gap-1.5">
                {done ? (
                  <Check className="size-3 shrink-0 text-vermilion" aria-hidden />
                ) : (
                  <span
                    className={cn("size-1.5 shrink-0 rounded-full", active ? "bg-vermilion" : "bg-bone/20")}
                    aria-hidden
                  />
                )}
                <span
                  className={cn(
                    "truncate font-mono text-[0.625rem] tracking-[0.14em] uppercase",
                    active ? "text-bone" : done ? "text-bone-dim" : "text-bone-faint",
                  )}
                >
                  {PHASE_LABELS[p]}
                  {active && <span className="sr-only"> (current phase)</span>}
                </span>
              </div>
            )}
          </li>
        );
      })}
    </ol>
  );
}
