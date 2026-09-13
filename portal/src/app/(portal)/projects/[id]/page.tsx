import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { ArrowLeft, Check, Circle, Settings2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { ContractRow } from "@/components/contract-row";
import { PhaseTrack } from "@/components/phase-track";
import { ProjectStatusBadge } from "@/components/status-badge";
import { UpdateItem } from "@/components/update-item";
import { requireSession } from "@/lib/auth";
import { formatDate, relativeDays } from "@/lib/format";
import { getStore } from "@/lib/store";
import { PHASE_LABELS } from "@/lib/types";
import { cn } from "@/lib/utils";

export async function generateMetadata({ params }: PageProps<"/projects/[id]">): Promise<Metadata> {
  const { id } = await params;
  const project = await getStore().getProject(id);
  return { title: project?.name ?? "Project" };
}

export default async function ProjectPage({ params }: PageProps<"/projects/[id]">) {
  const { id } = await params;
  const profile = await requireSession();
  const store = getStore();
  const project = await store.getProject(id);
  if (!project || (profile.role !== "admin" && project.clientId !== profile.id)) notFound();

  const contracts = (await store.listContracts(project.clientId)).filter((c) => c.projectId === project.id);
  const done = project.milestones.filter((m) => m.completedAt);
  const upcoming = project.milestones.filter((m) => !m.completedAt);
  const progress = project.milestones.length ? Math.round((done.length / project.milestones.length) * 100) : 0;

  return (
    <div className="space-y-12">
      <div className="flex items-center justify-between gap-4">
        <Link href="/projects" className="inline-flex items-center gap-1.5 text-sm text-bone-dim hover:text-bone">
          <ArrowLeft className="size-4" aria-hidden /> Projects
        </Link>
        {profile.role === "admin" && (
          <Button nativeButton={false} render={<Link href={`/admin/projects/${project.id}`} />} variant="outline" size="sm">
            <Settings2 className="size-4" aria-hidden /> Manage
          </Button>
        )}
      </div>

      <header className="space-y-6">
        <div className="flex flex-wrap items-center gap-3">
          <ProjectStatusBadge status={project.status} />
          {profile.role === "admin" && <span className="eyebrow">{project.client.fullName} · {project.client.company}</span>}
        </div>
        <h1 className="display max-w-3xl text-4xl text-balance sm:text-6xl">{project.name}</h1>
        <p className="max-w-2xl text-base leading-relaxed text-bone-dim">{project.summary}</p>
      </header>

      <section className="rounded-2xl border border-border bg-card p-5 sm:p-6" aria-labelledby="phase">
        <div className="mb-5 flex items-baseline justify-between gap-4">
          <h2 id="phase" className="eyebrow text-bone">
            {project.status === "complete" ? "Launched" : `Now in ${PHASE_LABELS[project.phase]}`}
          </h2>
          <span className="font-mono text-xs text-bone-faint">
            {done.length}/{project.milestones.length} milestones · {progress}%
          </span>
        </div>
        <PhaseTrack phase={project.phase} status={project.status} />
      </section>

      {project.nextStep && project.status !== "complete" && (
        <section
          className={cn(
            "rounded-2xl border p-5 sm:p-6",
            project.status === "awaiting_client" ? "border-vermilion/40 bg-vermilion/5" : "border-border bg-card",
          )}
          aria-labelledby="next"
        >
          <h2 id="next" className={cn("eyebrow", project.status === "awaiting_client" ? "text-vermilion-soft" : "text-bone")}>
            {project.status === "awaiting_client" ? "Waiting on you" : "What happens next"}
          </h2>
          <p className="mt-3 text-lg leading-relaxed text-balance">{project.nextStep}</p>
        </section>
      )}

      <div className="grid gap-12 lg:grid-cols-[1fr_1.4fr]">
        <div className="space-y-12">
          <section aria-labelledby="facts">
            <h2 id="facts" className="eyebrow text-bone">
              At a glance
            </h2>
            <dl className="mt-4 divide-y divide-border rounded-2xl border border-border bg-card px-5">
              {[
                ["Started", formatDate(project.startDate)],
                [
                  project.status === "complete" ? "Launched" : "Target launch",
                  project.targetLaunch
                    ? `${formatDate(project.targetLaunch)}${project.status !== "complete" ? ` · ${relativeDays(project.targetLaunch)}` : ""}`
                    : "To be confirmed",
                ],
                ["Phase", project.status === "complete" ? "Complete" : PHASE_LABELS[project.phase]],
              ].map(([k, v]) => (
                <div key={k} className="flex items-baseline justify-between gap-4 py-3.5">
                  <dt className="text-sm text-bone-dim">{k}</dt>
                  <dd className="text-right text-sm">{v}</dd>
                </div>
              ))}
            </dl>
          </section>

          <section aria-labelledby="milestones">
            <h2 id="milestones" className="eyebrow text-bone">
              Milestones
            </h2>
            {project.milestones.length ? (
              <ol className="mt-4 space-y-1.5">
                {[...done, ...upcoming].map((m, i) => {
                  const isNext = !m.completedAt && i === done.length;
                  return (
                    <li
                      key={m.id}
                      className={cn(
                        "flex items-start gap-3 rounded-xl px-3 py-2.5",
                        isNext && "border border-vermilion/30 bg-vermilion/5",
                      )}
                    >
                      {m.completedAt ? (
                        <Check className="mt-0.5 size-4 shrink-0 text-vermilion" aria-label="Completed" />
                      ) : (
                        <Circle className={cn("mt-0.5 size-4 shrink-0", isNext ? "text-vermilion" : "text-bone/20")} aria-hidden />
                      )}
                      <div className="min-w-0 flex-1">
                        <p className={cn("text-sm", m.completedAt && "text-bone-dim")}>{m.title}</p>
                        <p className="mt-0.5 font-mono text-[0.625rem] tracking-[0.12em] uppercase text-bone-faint">
                          {m.completedAt ? `Done ${formatDate(m.completedAt)}` : m.dueDate ? `Due ${formatDate(m.dueDate)}` : "Unscheduled"}
                          {isNext && " · up next"}
                        </p>
                      </div>
                    </li>
                  );
                })}
              </ol>
            ) : (
              <p className="mt-4 text-sm text-bone-dim">Milestones will be added as the plan firms up.</p>
            )}
          </section>

          {contracts.length > 0 && (
            <section aria-labelledby="agreements">
              <h2 id="agreements" className="eyebrow text-bone">
                Agreements for this project
              </h2>
              <ul className="mt-4 space-y-3">
                {contracts.map((c) => (
                  <ContractRow key={c.id} contract={c} />
                ))}
              </ul>
            </section>
          )}
        </div>

        <section aria-labelledby="timeline">
          <h2 id="timeline" className="eyebrow text-bone">
            Timeline
          </h2>
          {project.updates.length ? (
            <ol className="mt-6">
              {project.updates.map((u, i) => (
                <UpdateItem key={u.id} update={u} last={i === project.updates.length - 1} />
              ))}
            </ol>
          ) : (
            <p className="mt-4 rounded-2xl border border-dashed border-border p-8 text-center text-sm text-bone-dim">
              No updates posted yet. You&apos;ll see deliverables, decisions, and progress notes here.
            </p>
          )}
        </section>
      </div>
    </div>
  );
}
