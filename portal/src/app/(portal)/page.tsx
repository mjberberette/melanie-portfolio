import Link from "next/link";
import { ArrowRight, PenLine, Sparkles } from "lucide-react";
import { Button } from "@/components/ui/button";
import { ContractRow } from "@/components/contract-row";
import { PageHeader } from "@/components/page-header";
import { ProjectCard } from "@/components/project-card";
import { UpdateItem } from "@/components/update-item";
import { requireSession } from "@/lib/auth";
import { firstNameOf } from "@/lib/format";
import { getStore } from "@/lib/store";

function greeting() {
  const h = new Date().getHours();
  return h < 12 ? "Good morning" : h < 18 ? "Good afternoon" : "Good evening";
}

export default async function OverviewPage() {
  const profile = await requireSession();
  const store = getStore();
  const isAdmin = profile.role === "admin";
  const scope = isAdmin ? undefined : profile.id;

  const [projects, contracts, profiles] = await Promise.all([
    store.listProjects(scope),
    store.listContracts(scope),
    isAdmin ? store.listProfiles() : Promise.resolve([]),
  ]);
  const clientName = (id: string) => profiles.find((p) => p.id === id)?.fullName;

  const awaiting = contracts.filter((c) => c.status === "awaiting_signature");
  const active = projects.filter((p) => p.status !== "complete");
  const needsInput = active.filter((p) => p.status === "awaiting_client");

  const details = await Promise.all(active.slice(0, 4).map((p) => store.getProject(p.id)));
  const recent = details
    .flatMap((d) => (d ? d.updates.map((u) => ({ update: u, projectName: d.name })) : []))
    .sort((a, b) => b.update.createdAt.localeCompare(a.update.createdAt))
    .slice(0, 4);

  const firstName = firstNameOf(profile.fullName) ?? "there";
  const attentionCount = awaiting.length + needsInput.length;

  return (
    <div className="space-y-12">
      <PageHeader
        eyebrow={new Date().toLocaleDateString("en-US", { weekday: "long", month: "long", day: "numeric" })}
        title={
          <>
            {greeting()}, {firstName}.
          </>
        }
        description={
          attentionCount > 0
            ? `${attentionCount === 1 ? "One thing needs" : `${attentionCount} things need`} your attention before work can keep moving.`
            : active.length
              ? "Nothing is waiting on you right now. Here's where everything stands."
              : "No active projects at the moment. Signed agreements and past work stay available here."
        }
      />

      {attentionCount > 0 && (
        <section aria-labelledby="attention" className="space-y-4">
          <div className="flex items-center gap-2">
            <Sparkles className="size-4 text-vermilion" aria-hidden />
            <h2 id="attention" className="eyebrow text-bone">
              Needs your attention
            </h2>
          </div>
          <ul className="space-y-3">
            {awaiting.map((c) => (
              <ContractRow
                key={c.id}
                contract={c}
                clientName={isAdmin ? clientName(c.clientId) : undefined}
                projectName={projects.find((p) => p.id === c.projectId)?.name}
              />
            ))}
            {needsInput.map((p) => (
              <li key={p.id} data-tone="accent" className="surface flex flex-col gap-4 p-5 sm:flex-row sm:items-center sm:justify-between">
                <div className="min-w-0">
                  <p className="eyebrow text-vermilion-soft">{p.name}</p>
                  <p className="mt-2 text-sm leading-relaxed">{p.nextStep ?? "Your input is needed to continue."}</p>
                </div>
                <Button nativeButton={false} render={<Link href={`/projects/${p.id}`} />} variant="outline" className="shrink-0">
                  Open project <ArrowRight className="size-4" aria-hidden />
                </Button>
              </li>
            ))}
          </ul>
        </section>
      )}

      <section aria-labelledby="projects" className="space-y-4">
        <div className="flex items-end justify-between gap-4">
          <h2 id="projects" className="eyebrow text-bone">
            {isAdmin ? "Active projects" : "Your projects"}
          </h2>
          <Link href="/projects" className="text-sm text-bone-dim underline-offset-4 hover:text-bone hover:underline">
            All projects
          </Link>
        </div>
        {active.length ? (
          <div className="grid gap-4 md:grid-cols-2">
            {active.map((p) => (
              <ProjectCard key={p.id} project={p} clientName={isAdmin ? clientName(p.clientId) : undefined} />
            ))}
          </div>
        ) : (
          <div className="surface-empty p-8 text-center">
            <p className="text-sm text-bone-dim">No active projects. {projects.length ? "Completed work is under All projects." : ""}</p>
          </div>
        )}
      </section>

      <div className="grid gap-12 lg:grid-cols-[1.4fr_1fr]">
        <section aria-labelledby="recent" className="space-y-4">
          <h2 id="recent" className="eyebrow text-bone">
            Latest from the studio
          </h2>
          {recent.length ? (
            <ol className="pt-2">
              {recent.map(({ update, projectName }, i) => (
                <UpdateItem key={update.id} update={update} projectName={projectName} last={i === recent.length - 1} />
              ))}
            </ol>
          ) : (
            <p className="surface-empty p-8 text-center text-sm text-bone-dim">
              Updates from each phase will appear here as work progresses.
            </p>
          )}
        </section>

        <section aria-labelledby="agreements" className="space-y-4">
          <h2 id="agreements" className="eyebrow text-bone">
            Agreements
          </h2>
          <div className="surface p-5 sm:p-6">
            <dl className="grid grid-cols-2 gap-4">
              <div>
                <dt className="eyebrow">Signed</dt>
                <dd className="display mt-2 text-4xl">{contracts.filter((c) => c.status === "signed").length}</dd>
              </div>
              <div>
                <dt className="eyebrow">Awaiting</dt>
                <dd className={`display mt-2 text-4xl ${awaiting.length ? "text-vermilion" : ""}`}>{awaiting.length}</dd>
              </div>
            </dl>
            <Button nativeButton={false} render={<Link href="/contracts" />} variant="outline" className="mt-5 w-full">
              {awaiting.length ? (
                <>
                  <PenLine className="size-4" aria-hidden /> Sign now
                </>
              ) : (
                <>View all agreements</>
              )}
            </Button>
          </div>
        </section>
      </div>
    </div>
  );
}
