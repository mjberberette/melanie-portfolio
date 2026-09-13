import Link from "next/link";
import { ArrowUpRight, CalendarDays } from "lucide-react";
import { PhaseTrack } from "@/components/phase-track";
import { ProjectStatusBadge } from "@/components/status-badge";
import { formatDate, relativeDays } from "@/lib/format";
import { PHASE_LABELS, type Project } from "@/lib/types";

export function ProjectCard({ project, clientName, href }: { project: Project; clientName?: string; href?: string }) {
  const to = href ?? `/projects/${project.id}`;
  return (
    <Link
      href={to}
      className="group relative flex flex-col gap-5 rounded-2xl border border-border bg-card p-5 transition-colors hover:border-bone/25 focus-visible:ring-2 focus-visible:ring-ring focus-visible:outline-none sm:p-6"
    >
      <div className="flex items-start justify-between gap-4">
        <div className="min-w-0">
          {clientName && <p className="eyebrow mb-2 truncate">{clientName}</p>}
          <h3 className="display text-2xl leading-tight text-balance">{project.name}</h3>
        </div>
        <ArrowUpRight className="size-5 shrink-0 text-bone-faint transition-all group-hover:translate-x-0.5 group-hover:-translate-y-0.5 group-hover:text-bone" aria-hidden />
      </div>

      <div className="flex flex-wrap items-center gap-2">
        <ProjectStatusBadge status={project.status} />
        <span className="font-mono text-[0.625rem] tracking-[0.14em] uppercase text-bone-faint">
          {project.status === "complete" ? "Launched" : `${PHASE_LABELS[project.phase]} phase`}
        </span>
      </div>

      <PhaseTrack phase={project.phase} status={project.status} compact />

      <div className="mt-auto flex items-center justify-between gap-3 text-xs text-bone-dim">
        <span className="inline-flex items-center gap-1.5">
          <CalendarDays className="size-3.5 text-bone-faint" aria-hidden />
          {project.status === "complete"
            ? `Launched ${formatDate(project.targetLaunch)}`
            : project.targetLaunch
              ? `Target launch ${formatDate(project.targetLaunch)} · ${relativeDays(project.targetLaunch)}`
              : "Launch date to be confirmed"}
        </span>
      </div>
    </Link>
  );
}
