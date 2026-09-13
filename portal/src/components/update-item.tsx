import { ExternalLink, FileCheck2, MessageSquareText, Scale } from "lucide-react";
import { cn } from "@/lib/utils";
import { formatDate } from "@/lib/format";
import type { ProjectUpdate, UpdateKind } from "@/lib/types";

const KIND: Record<UpdateKind, { label: string; icon: typeof FileCheck2; tone: string }> = {
  update: { label: "Update", icon: MessageSquareText, tone: "text-bone-dim" },
  deliverable: { label: "Deliverable", icon: FileCheck2, tone: "text-vermilion" },
  decision: { label: "Decision", icon: Scale, tone: "text-warning" },
};

export function UpdateItem({ update, projectName, last }: { update: ProjectUpdate; projectName?: string; last?: boolean }) {
  const meta = KIND[update.kind];
  const Icon = meta.icon;
  return (
    <li className="relative flex gap-4 pb-8">
      {!last && <span className="absolute top-9 bottom-0 left-[15px] w-px bg-border" aria-hidden />}
      <span className={cn("relative z-10 grid size-8 shrink-0 place-items-center rounded-full border border-border bg-ink", meta.tone)}>
        <Icon className="size-3.5" aria-hidden />
      </span>
      <div className="min-w-0 flex-1 pt-1">
        <p className="flex flex-wrap items-center gap-x-2 gap-y-1 font-mono text-[0.625rem] tracking-[0.14em] uppercase text-bone-faint">
          <span className={meta.tone}>{meta.label}</span>
          <span aria-hidden>·</span>
          <time dateTime={update.createdAt}>{formatDate(update.createdAt)}</time>
          {projectName && (
            <>
              <span aria-hidden>·</span>
              <span className="truncate">{projectName}</span>
            </>
          )}
        </p>
        <h3 className="mt-1.5 font-medium">{update.title}</h3>
        <p className="mt-1.5 text-sm leading-relaxed text-bone-dim">{update.body}</p>
        {update.linkUrl && (
          <a
            href={update.linkUrl}
            target="_blank"
            rel="noreferrer"
            className="mt-3 inline-flex items-center gap-1.5 text-sm text-bone underline-offset-4 hover:text-vermilion hover:underline"
          >
            {update.linkLabel ?? "Open link"} <ExternalLink className="size-3.5" aria-hidden />
          </a>
        )}
      </div>
    </li>
  );
}
