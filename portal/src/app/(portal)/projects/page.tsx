import type { Metadata } from "next";
import { PageHeader } from "@/components/page-header";
import { ProjectCard } from "@/components/project-card";
import { requireSession } from "@/lib/auth";
import { getStore } from "@/lib/store";

export const metadata: Metadata = { title: "Projects" };

export default async function ProjectsPage() {
  const profile = await requireSession();
  const store = getStore();
  const isAdmin = profile.role === "admin";
  const [projects, profiles] = await Promise.all([
    store.listProjects(isAdmin ? undefined : profile.id),
    isAdmin ? store.listProfiles() : Promise.resolve([]),
  ]);
  const clientName = (id: string) => profiles.find((p) => p.id === id)?.fullName;

  const active = projects.filter((p) => p.status !== "complete");
  const done = projects.filter((p) => p.status === "complete");

  return (
    <div className="space-y-12">
      <PageHeader
        eyebrow="Projects"
        title={projects.length ? `${projects.length} ${projects.length === 1 ? "project" : "projects"}` : "Projects"}
        description="Each project moves through five phases: discovery, strategy, design, build, and launch. Open one for milestones, deliverables, and what comes next."
      />

      {projects.length === 0 && (
        <div className="rounded-2xl border border-dashed border-border p-10 text-center">
          <p className="display text-2xl">Nothing here yet</p>
          <p className="mt-2 text-sm text-bone-dim">Projects appear once an agreement is in place and work is scheduled.</p>
        </div>
      )}

      {active.length > 0 && (
        <section className="space-y-4" aria-labelledby="active">
          <h2 id="active" className="eyebrow text-bone">
            In progress
          </h2>
          <div className="grid gap-4 md:grid-cols-2">
            {active.map((p) => (
              <ProjectCard key={p.id} project={p} clientName={isAdmin ? clientName(p.clientId) : undefined} />
            ))}
          </div>
        </section>
      )}

      {done.length > 0 && (
        <section className="space-y-4" aria-labelledby="done">
          <h2 id="done" className="eyebrow text-bone">
            Launched
          </h2>
          <div className="grid gap-4 md:grid-cols-2">
            {done.map((p) => (
              <ProjectCard key={p.id} project={p} clientName={isAdmin ? clientName(p.clientId) : undefined} />
            ))}
          </div>
        </section>
      )}
    </div>
  );
}
