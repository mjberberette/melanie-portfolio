export type Role = "client" | "admin";

export interface Profile {
  id: string;
  email: string;
  fullName: string;
  company: string | null;
  role: Role;
  createdAt: string;
}

export const PHASES = ["discovery", "strategy", "design", "build", "launch"] as const;
export type Phase = (typeof PHASES)[number];

export const PHASE_LABELS: Record<Phase, string> = {
  discovery: "Discovery",
  strategy: "Strategy",
  design: "Design",
  build: "Build",
  launch: "Launch",
};

export const PROJECT_STATUSES = [
  "on_track",
  "awaiting_client",
  "at_risk",
  "on_hold",
  "complete",
] as const;
export type ProjectStatus = (typeof PROJECT_STATUSES)[number];

export const PROJECT_STATUS_LABELS: Record<ProjectStatus, string> = {
  on_track: "On track",
  awaiting_client: "Awaiting your input",
  at_risk: "At risk",
  on_hold: "On hold",
  complete: "Complete",
};

export interface Project {
  id: string;
  clientId: string;
  name: string;
  summary: string;
  status: ProjectStatus;
  phase: Phase;
  startDate: string; // ISO date
  targetLaunch: string | null; // ISO date
  nextStep: string | null;
  createdAt: string;
}

export interface Milestone {
  id: string;
  projectId: string;
  title: string;
  dueDate: string | null;
  completedAt: string | null;
  sortOrder: number;
}

export const UPDATE_KINDS = ["update", "deliverable", "decision"] as const;
export type UpdateKind = (typeof UPDATE_KINDS)[number];

export interface ProjectUpdate {
  id: string;
  projectId: string;
  kind: UpdateKind;
  title: string;
  body: string;
  linkUrl: string | null;
  linkLabel: string | null;
  createdAt: string;
}

export interface ProjectDetail extends Project {
  milestones: Milestone[];
  updates: ProjectUpdate[];
  client: Profile;
}

export const CONTRACT_STATUSES = ["awaiting_signature", "signed", "void"] as const;
export type ContractStatus = (typeof CONTRACT_STATUSES)[number];

export const CONTRACT_STATUS_LABELS: Record<ContractStatus, string> = {
  awaiting_signature: "Awaiting signature",
  signed: "Signed",
  void: "Void",
};

export interface Contract {
  id: string;
  clientId: string;
  projectId: string | null;
  title: string;
  description: string | null;
  status: ContractStatus;
  documentSha256: string;
  sentAt: string;
  signedAt: string | null;
  signerName: string | null;
  signerEmail: string | null;
  signerIp: string | null;
  signerUserAgent: string | null;
  createdAt: string;
}

export interface ContractDetail extends Contract {
  client: Profile;
  project: Project | null;
}

export interface SignatureInput {
  contractId: string;
  signerName: string;
  /** PNG data URL from the signature pad, or null when the client typed their name. */
  signatureImage: string | null;
  ip: string | null;
  userAgent: string | null;
}

export interface NewClientInput {
  email: string;
  fullName: string;
  company: string | null;
}

export interface NewProjectInput {
  clientId: string;
  name: string;
  summary: string;
  phase: Phase;
  status: ProjectStatus;
  startDate: string;
  targetLaunch: string | null;
  nextStep: string | null;
}

export type ProjectPatch = Partial<
  Pick<Project, "name" | "summary" | "phase" | "status" | "targetLaunch" | "nextStep">
>;

export interface NewContractInput {
  clientId: string;
  projectId: string | null;
  title: string;
  description: string | null;
  pdf: Uint8Array;
}

/** Everything the app needs from a backend. Implemented twice: an in-memory
 *  demo store for local previews and a Supabase store for production. */
export interface PortalStore {
  getProfile(id: string): Promise<Profile | null>;
  getProfileByEmail(email: string): Promise<Profile | null>;
  listProfiles(): Promise<Profile[]>;
  createClient(input: NewClientInput): Promise<Profile>;
  promoteToAdmin(id: string): Promise<void>;

  listProjects(clientId?: string): Promise<Project[]>;
  getProject(id: string): Promise<ProjectDetail | null>;
  createProject(input: NewProjectInput): Promise<Project>;
  updateProject(id: string, patch: ProjectPatch): Promise<Project>;
  addMilestone(projectId: string, title: string, dueDate: string | null): Promise<Milestone>;
  setMilestoneComplete(id: string, complete: boolean): Promise<void>;
  deleteMilestone(id: string): Promise<void>;
  addUpdate(
    projectId: string,
    input: Pick<ProjectUpdate, "kind" | "title" | "body" | "linkUrl" | "linkLabel">,
  ): Promise<ProjectUpdate>;

  listContracts(clientId?: string): Promise<Contract[]>;
  getContract(id: string): Promise<ContractDetail | null>;
  getContractPdf(id: string, variant: "original" | "signed"): Promise<Uint8Array | null>;
  createContract(input: NewContractInput): Promise<Contract>;
  signContract(input: SignatureInput, signer: Profile): Promise<Contract>;
  voidContract(id: string): Promise<void>;
}
