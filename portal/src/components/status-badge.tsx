import { cn } from "@/lib/utils";
import {
  CONTRACT_STATUS_LABELS,
  PROJECT_STATUS_LABELS,
  type ContractStatus,
  type ProjectStatus,
} from "@/lib/types";

const projectTone: Record<ProjectStatus, string> = {
  on_track: "bg-success/12 text-success border-success/30",
  awaiting_client: "bg-vermilion/12 text-vermilion-soft border-vermilion/40",
  at_risk: "bg-warning/12 text-warning border-warning/30",
  on_hold: "bg-bone/8 text-bone-dim border-border",
  complete: "bg-bone/8 text-bone border-border",
};

const contractTone: Record<ContractStatus, string> = {
  awaiting_signature: "bg-vermilion/12 text-vermilion-soft border-vermilion/40",
  signed: "bg-success/12 text-success border-success/30",
  void: "bg-bone/8 text-bone-faint border-border",
};

function Pill({ className, children, pulse }: { className?: string; children: React.ReactNode; pulse?: boolean }) {
  return (
    <span
      className={cn(
        "inline-flex items-center gap-1.5 rounded-full border px-2.5 py-1 font-mono text-[0.625rem] tracking-[0.14em] uppercase whitespace-nowrap",
        className,
      )}
    >
      <span className={cn("size-1.5 rounded-full bg-current", pulse && "animate-pulse")} aria-hidden />
      {children}
    </span>
  );
}

export function ProjectStatusBadge({ status }: { status: ProjectStatus }) {
  return (
    <Pill className={projectTone[status]} pulse={status === "awaiting_client"}>
      {PROJECT_STATUS_LABELS[status]}
    </Pill>
  );
}

export function ContractStatusBadge({ status }: { status: ContractStatus }) {
  return (
    <Pill className={contractTone[status]} pulse={status === "awaiting_signature"}>
      {CONTRACT_STATUS_LABELS[status]}
    </Pill>
  );
}
