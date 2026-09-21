import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { ArrowLeft, Check, Circle, ExternalLink, Trash2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { ProjectStatusBadge } from "@/components/status-badge";
import { UpdateItem } from "@/components/update-item";
import { requireAdmin } from "@/lib/auth";
import { formatDate } from "@/lib/format";
import { getStore } from "@/lib/store";
import { PHASE_LABELS } from "@/lib/types";
import { cn } from "@/lib/utils";
import { deleteMilestone, toggleMilestone } from "../../actions";
import { EditProjectForm, MilestoneForm, UpdateForm } from "./forms";

export async function generateMetadata({ params }: PageProps<"/admin/projects/[id]">): Promise<Metadata> {
  const { id } = await params;
  const p = await getStore().getProject(id);
  return { title: p ? `Manage · ${p.name}` : "Manage project" };
}

export default async function ManageProjectPage({ params }: PageProps<"/admin/projects/[id]">) {
  await requireAdmin();
  const { id } = await params;
  const project = await getStore().getProject(id);
  if (!project) notFound();

  return (
    <div className="space-y-10">
      <div className="flex items-center justify-between gap-4">
        <Link href="/admin" className="inline-flex items-center gap-1.5 text-sm text-bone-dim hover:text-bone">
          <ArrowLeft className="size-4" aria-hidden /> Studio admin
        </Link>
        <Button nativeButton={false} render={<Link href={`/projects/${project.id}`} />} variant="outline" size="sm">
          <ExternalLink className="size-4" aria-hidden /> View as client
        </Button>
      </div>

      <header>
        <div className="flex flex-wrap items-center gap-3">
          <ProjectStatusBadge status={project.status} />
          <span className="eyebrow">
            {project.client.fullName} · {project.client.company} · {PHASE_LABELS[project.phase]}
          </span>
        </div>
        <h1 className="display mt-4 text-4xl sm:text-5xl">{project.name}</h1>
      </header>

      <div className="grid gap-10 lg:grid-cols-[1.2fr_1fr] lg:items-start">
        <div className="space-y-10">
          <section className="space-y-4" aria-labelledby="details">
            <h2 id="details" className="eyebrow text-bone">
              Status and next step
            </h2>
            <EditProjectForm project={project} />
          </section>

          <section className="space-y-4" aria-labelledby="post">
            <h2 id="post" className="eyebrow text-bone">
              Post an update
            </h2>
            <UpdateForm projectId={project.id} />
            {project.updates.length > 0 && (
              <ol className="pt-4">
                {project.updates.map((u, i) => (
                  <UpdateItem key={u.id} update={u} last={i === project.updates.length - 1} />
                ))}
              </ol>
            )}
          </section>
        </div>

        <section className="space-y-4" aria-labelledby="ms">
          <h2 id="ms" className="eyebrow text-bone">
            Milestones
          </h2>
          <ul className="space-y-1.5">
            {project.milestones.length === 0 && <li className="text-sm text-bone-dim">No milestones yet.</li>}
            {project.milestones.map((m) => (
              <li key={m.id} className="surface-inner flex items-center gap-2 px-3 py-2">
                <form action={toggleMilestone} className="flex items-center">
                  <input type="hidden" name="id" value={m.id} />
                  <input type="hidden" name="complete" value={m.completedAt ? "0" : "1"} />
                  <button
                    type="submit"
                    className={cn(
                      "grid size-6 place-items-center rounded-full border transition-colors",
                      m.completedAt ? "border-vermilion bg-vermilion text-primary-foreground" : "border-border text-bone-faint hover:border-bone",
                    )}
                    aria-label={m.completedAt ? `Mark "${m.title}" as not complete` : `Mark "${m.title}" complete`}
                  >
                    {m.completedAt ? <Check className="size-3.5" /> : <Circle className="size-3" />}
                  </button>
                </form>
                <div className="min-w-0 flex-1">
                  <p className={cn("truncate text-sm", m.completedAt && "text-bone-dim line-through decoration-bone/30")}>{m.title}</p>
                  <p className="font-mono text-[0.625rem] tracking-[0.12em] uppercase text-bone-faint">
                    {m.completedAt ? `Done ${formatDate(m.completedAt)}` : m.dueDate ? `Due ${formatDate(m.dueDate)}` : "Unscheduled"}
                  </p>
                </div>
                <form action={deleteMilestone}>
                  <input type="hidden" name="id" value={m.id} />
                  <button type="submit" className="grid size-7 place-items-center rounded-md text-bone-faint hover:bg-ink-veil hover:text-bone" aria-label={`Delete "${m.title}"`}>
                    <Trash2 className="size-3.5" />
                  </button>
                </form>
              </li>
            ))}
          </ul>
          <MilestoneForm projectId={project.id} />
        </section>
      </div>
    </div>
  );
}
