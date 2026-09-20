export type Role = "client" | "admin";

export interface Profile {
  id: string;
  email: string;
  /** Display name; always kept equal to `${firstName} ${lastName}` when either is set. */
  fullName: string;
  firstName: string;
  lastName: string;
  phone: string | null;
  company: string | null;
  role: Role;
  /** Same-origin URL that streams the avatar (see /api/avatars/[id]), or null. */
  avatarUrl: string | null;
  createdAt: string;
}

/** Fields a client can change about themselves (admins can also change company). */
export interface ProfilePatch {
  firstName?: string;
  lastName?: string;
  phone?: string | null;
  company?: string | null;
}

/** The client's web presence: where they are today, where they're going, and
 *  how to get into their domain/hosting account. The login fields are
 *  sensitive — never log them and only show them to the owner or an admin.
 *  The password itself is never part of this object: it's encrypted at rest
 *  and only fetched on demand through `revealHostingPassword`. */
export interface WebsiteDetails {
  profileId: string;
  currentUrl: string | null;
  newDomain: string | null;
  hostingProvider: string | null;
  hostingLoginUrl: string | null;
  hostingUsername: string | null;
  hasHostingPassword: boolean;
  hostingNotes: string | null;
  updatedAt: string | null;
}

export type WebsiteDetailsInput = Omit<WebsiteDetails, "profileId" | "updatedAt" | "hasHostingPassword"> & {
  /** `undefined` keeps the stored password, `null` removes it, a string replaces it. */
  hostingPassword?: string | null;
};

export interface AvatarFile {
  bytes: Uint8Array;
  contentType: string;
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
  /** The upload id the PDF was stored under; becomes the agreement's id. */
  id: string;
  clientId: string;
  projectId: string | null;
  title: string;
  description: string | null;
  /** The uploaded bytes, already validated by the caller. */
  pdf: Uint8Array;
}

/** Where the browser should PUT an agreement PDF. Uploading straight to
 *  storage keeps multi-megabyte files out of the server's request path,
 *  which Vercel caps at 4.5 MB. */
export interface ContractUploadTarget {
  url: string;
  headers: Record<string, string>;
}

/** Everything the app needs from a backend. Implemented twice: an in-memory
 *  demo store for local previews and a Supabase store for production. */
export interface PortalStore {
  getProfile(id: string): Promise<Profile | null>;
  getProfileByEmail(email: string): Promise<Profile | null>;
  listProfiles(): Promise<Profile[]>;
  createClient(input: NewClientInput): Promise<Profile>;
  promoteToAdmin(id: string): Promise<void>;
  setProfileName(id: string, fullName: string): Promise<void>;

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
  /** A short-lived, direct-to-storage upload target for the PDF of a
   *  not-yet-created agreement, or null when the store has no external
   *  storage (the demo store) and the PDF should be PUT to the portal's own
   *  upload route, which calls putContractUpload. */
  createContractUploadUrl(id: string): Promise<ContractUploadTarget | null>;
  putContractUpload(id: string, pdf: Uint8Array): Promise<void>;
  /** The bytes uploaded under `id`, or null if the upload never finished. */
  readContractUpload(id: string): Promise<Uint8Array | null>;
  discardContractUpload(id: string): Promise<void>;
  /** Records the agreement for an upload that has already been validated. */
  createContract(input: NewContractInput): Promise<Contract>;
  signContract(input: SignatureInput, signer: Profile): Promise<Contract>;
  voidContract(id: string): Promise<void>;

  /* Profile self-service (also used by admins on a client's behalf) */
  updateProfile(id: string, patch: ProfilePatch): Promise<Profile>;
  /** Changes the address on the profile row only; auth-level email changes
   *  are handled by the caller (Supabase confirms them by email first). */
  setProfileEmail(id: string, email: string): Promise<Profile>;
  getWebsiteDetails(profileId: string): Promise<WebsiteDetails | null>;
  saveWebsiteDetails(profileId: string, input: WebsiteDetailsInput): Promise<WebsiteDetails>;
  /** Decrypts and returns the hosting password. Server-side only; callers must
   *  have already checked the requester is the owner or an admin. */
  revealHostingPassword(profileId: string): Promise<string | null>;
  getAvatar(profileId: string): Promise<AvatarFile | null>;
  setAvatar(profileId: string, file: AvatarFile): Promise<Profile>;
  removeAvatar(profileId: string): Promise<Profile>;
}
