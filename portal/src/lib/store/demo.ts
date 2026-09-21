import { randomUUID } from "node:crypto";
import { joinName, splitName } from "@/lib/format";
import { buildAgreementPdf, sha256Hex, stampSignature } from "@/lib/pdf";
import type {
  AvatarFile,
  Contract,
  ContractDetail,
  Conversation,
  ConversationSummary,
  Message,
  Milestone,
  NewClientInput,
  NewContractInput,
  NewProjectInput,
  PortalStore,
  Profile,
  Project,
  ProjectDetail,
  ProfilePatch,
  ProjectPatch,
  ProjectUpdate,
  Role,
  SignatureInput,
  WebsiteDetails,
  WebsiteDetailsInput,
} from "@/lib/types";

/** In-memory backend for local previews and development. Seeded with one
 *  realistic client account so every screen has something to show. State
 *  lives on globalThis so it survives Next's hot reloads; it resets when the
 *  server restarts. */
interface DemoState {
  profiles: Profile[];
  projects: Project[];
  milestones: Milestone[];
  updates: ProjectUpdate[];
  contracts: Contract[];
  files: Map<string, Uint8Array>; // `${contractId}:original` | `${contractId}:signed`
  uploads: Map<string, Uint8Array>; // PDFs uploaded for agreements not yet created
  websites: WebsiteDetails[];
  hostingPasswords: Map<string, string>; // profile id → password (memory only; Vault in production)
  avatars: Map<string, AvatarFile>; // profile id → image
  conversations: Conversation[];
  messages: Message[];
}

export const DEMO_ADMIN_ID = "00000000-0000-4000-8000-000000000001";
export const DEMO_CLIENT_ID = "00000000-0000-4000-8000-000000000002";

const daysAgo = (n: number) => new Date(Date.now() - n * 86_400_000).toISOString();
const daysAhead = (n: number) => new Date(Date.now() + n * 86_400_000).toISOString();
const dateOnly = (iso: string) => iso.slice(0, 10);

async function seed(): Promise<DemoState> {
  const admin: Profile = {
    id: DEMO_ADMIN_ID,
    email: "hello@melanieberberette.com",
    fullName: "Melanie Berberette",
    firstName: "Melanie",
    lastName: "Berberette",
    phone: null,
    company: null,
    role: "admin",
    avatarUrl: null,
    createdAt: daysAgo(400),
  };
  const client: Profile = {
    id: DEMO_CLIENT_ID,
    email: "jordan@everypeer.com",
    fullName: "Jordan Ellis",
    firstName: "Jordan",
    lastName: "Ellis",
    phone: "+1 (415) 555-0137",
    company: "EveryPeer",
    role: "client",
    avatarUrl: null,
    createdAt: daysAgo(64),
  };
  const clientWebsite: WebsiteDetails = {
    profileId: client.id,
    currentUrl: "https://www.everypeer.com",
    newDomain: "everypeer.io",
    hostingProvider: "Cloudflare",
    hostingLoginUrl: "https://dash.cloudflare.com/login",
    hostingUsername: "ops@everypeer.com",
    hasHostingPassword: true,
    hostingNotes: "Registrar and DNS are both on Cloudflare. 2FA goes to Jordan's phone.",
    updatedAt: daysAgo(12),
  };

  const site: Project = {
    id: "10000000-0000-4000-8000-000000000001",
    clientId: client.id,
    name: "EveryPeer marketing site",
    summary:
      "A new public face for the Internet Intelligence Company: brand refresh, narrative-led homepage with a scroll-driven product loop, and a component system the team can extend.",
    status: "awaiting_client",
    phase: "design",
    startDate: dateOnly(daysAgo(42)),
    targetLaunch: dateOnly(daysAhead(38)),
    nextStep: "Review the homepage design round 2 in Figma and leave comments by Thursday.",
    createdAt: daysAgo(42),
  };
  const portal: Project = {
    id: "10000000-0000-4000-8000-000000000002",
    clientId: client.id,
    name: "PeerLens onboarding flow",
    summary:
      "Redesign of the first-run experience for PeerLens: account creation, first probe setup, and the empty states that guide a new network engineer to their first insight.",
    status: "complete",
    phase: "launch",
    startDate: dateOnly(daysAgo(150)),
    targetLaunch: dateOnly(daysAgo(20)),
    nextStep: null,
    createdAt: daysAgo(150),
  };

  const ms = (projectId: string, title: string, due: number | null, done: number | null, i: number): Milestone => ({
    id: randomUUID(),
    projectId,
    title,
    dueDate: due === null ? null : dateOnly(due < 0 ? daysAgo(-due) : daysAhead(due)),
    completedAt: done === null ? null : daysAgo(done),
    sortOrder: i,
  });

  const milestones: Milestone[] = [
    ms(site.id, "Kickoff and stakeholder interviews", -38, 37, 0),
    ms(site.id, "Brand direction and messaging framework", -24, 22, 1),
    ms(site.id, "Homepage design — round 1", -10, 9, 2),
    ms(site.id, "Homepage design — round 2", -1, 1, 3),
    ms(site.id, "Interior pages and component library", 10, null, 4),
    ms(site.id, "Front-end build and motion", 28, null, 5),
    ms(site.id, "QA, accessibility pass, and launch", 38, null, 6),
    ms(portal.id, "Research and current-state audit", -140, 138, 0),
    ms(portal.id, "Flow architecture and prototypes", -110, 108, 1),
    ms(portal.id, "Visual design and handoff", -60, 58, 2),
    ms(portal.id, "Launch and 30-day review", -20, 20, 3),
  ];

  const up = (
    projectId: string,
    kind: ProjectUpdate["kind"],
    title: string,
    body: string,
    ago: number,
    link?: [string, string],
  ): ProjectUpdate => ({
    id: randomUUID(),
    projectId,
    kind,
    title,
    body,
    linkUrl: link?.[0] ?? null,
    linkLabel: link?.[1] ?? null,
    createdAt: daysAgo(ago),
  });

  const updates: ProjectUpdate[] = [
    up(
      site.id,
      "deliverable",
      "Homepage design, round 2",
      "Round 2 folds in your notes from last week: the hero now leads with the live paths counter, the product loop is one continuous scroll section with the three layers, and the type scale tightened across the board. Comment directly in Figma and I’ll consolidate on Friday.",
      1,
      ["https://www.figma.com", "Open in Figma"],
    ),
    up(
      site.id,
      "decision",
      "Green stays as the sole accent",
      "We explored a secondary warm accent for CTAs and decided against it — the single green reads more confident and keeps the starfield calm. Buttons will use weight and motion for hierarchy instead.",
      6,
    ),
    up(
      site.id,
      "update",
      "Round 1 feedback consolidated",
      "Fourteen comments across the team, grouped into three themes: lead with proof (the counter), make the loop feel like one system, and simplify the footer. All three are addressed in round 2.",
      8,
    ),
    up(
      site.id,
      "deliverable",
      "Messaging framework",
      "The narrative spine for the whole site: one promise, three layers, one loop. Includes voice principles and the approved headline set for each section.",
      22,
      ["https://www.notion.so", "Read the framework"],
    ),
    up(
      portal.id,
      "update",
      "30-day review complete",
      "Activation from signup to first probe rose from 41% to 63% over the first month. Handoff documentation and the Figma library are final; the project is closed.",
      20,
    ),
  ];

  /* Agreements */
  const msaPdf = await buildAgreementPdf({
    title: "Master Services Agreement",
    clientName: client.fullName,
    company: client.company!,
    effectiveDate: new Date(Date.now() - 44 * 86_400_000).toLocaleDateString("en-US", { dateStyle: "long" }),
    sections: [
      { heading: "Engagement", body: "Melanie Berberette Design (“Designer”) will provide web and product design services to Client as described in one or more Statements of Work executed under this Agreement. Each Statement of Work is incorporated by reference." },
      { heading: "Fees and payment", body: "Fees are set out in each Statement of Work. Invoices are due within 14 days of receipt. Work may pause on accounts more than 14 days overdue until the balance is settled." },
      { heading: "Intellectual property", body: "Upon full payment, Client owns the final deliverables. Designer retains ownership of pre-existing materials, working files, and general know-how, and grants Client a perpetual licence to any such materials embedded in the deliverables." },
      { heading: "Confidentiality", body: "Each party will keep the other’s non-public information confidential and use it only for the purposes of this Agreement, for the term and three years thereafter." },
      { heading: "Portfolio rights", body: "Designer may display the completed work in her portfolio and describe the engagement in general terms, unless Client requests otherwise in writing before launch." },
      { heading: "Term and termination", body: "Either party may end an active Statement of Work with 14 days’ written notice. Client will pay for work completed to the date of termination." },
    ],
  });
  const sowPdf = await buildAgreementPdf({
    title: "Statement of Work — Phase 2: Interior pages and build",
    clientName: client.fullName,
    company: client.company!,
    effectiveDate: new Date().toLocaleDateString("en-US", { dateStyle: "long" }),
    sections: [
      { heading: "Scope", body: "Design of up to six interior page templates (Product, Ecosystem, Pricing, About, Careers, Contact), a documented component library in Figma, and front-end build of all templates with the agreed motion language." },
      { heading: "Schedule", body: "Interior design: two weeks from signature. Build: three weeks following design approval. Launch support: one week including QA and an accessibility pass to WCAG 2.2 AA." },
      { heading: "Fees", body: "Fixed fee of $34,000, invoiced 50% on signature and 50% on launch. Additional templates are available at $2,400 each." },
      { heading: "Client responsibilities", body: "Provide final copy for each page before its design week begins, a single point of contact for approvals, and feedback within three business days of each review." },
      { heading: "Assumptions", body: "Hosting remains on the current provider. Analytics and consent tooling are configured by Client’s engineering team; Designer will provide the integration spec." },
    ],
  });

  const msa: Contract = {
    id: "20000000-0000-4000-8000-000000000001",
    clientId: client.id,
    projectId: site.id,
    title: "Master Services Agreement",
    description: "The umbrella agreement that governs all work together. Statements of Work sit underneath it.",
    status: "signed",
    documentSha256: sha256Hex(msaPdf),
    sentAt: daysAgo(45),
    signedAt: daysAgo(44),
    signerName: client.fullName,
    signerEmail: client.email,
    signerIp: "203.0.113.24",
    signerUserAgent: "Mozilla/5.0 (Macintosh; Intel Mac OS X 14_5) Safari/605.1.15",
    createdAt: daysAgo(45),
  };
  const sow: Contract = {
    id: "20000000-0000-4000-8000-000000000002",
    clientId: client.id,
    projectId: site.id,
    title: "Statement of Work — Phase 2",
    description: "Interior pages, the component library, and the front-end build. Signing kicks off the interior design sprint.",
    status: "awaiting_signature",
    documentSha256: sha256Hex(sowPdf),
    sentAt: daysAgo(2),
    signedAt: null,
    signerName: null,
    signerEmail: null,
    signerIp: null,
    signerUserAgent: null,
    createdAt: daysAgo(2),
  };

  /* Messages */
  const conversation: Conversation = {
    id: "30000000-0000-4000-8000-000000000001",
    clientId: client.id,
    createdAt: daysAgo(30),
    lastMessageAt: null,
  };
  const hoursAgo = (h: number) => new Date(Date.now() - h * 3_600_000).toISOString();
  const msg = (from: Profile, body: string, at: string, readAt: string | null): Message => ({
    id: randomUUID(),
    conversationId: conversation.id,
    senderId: from.id,
    senderRole: from.role,
    body,
    createdAt: at,
    readAt,
  });
  const messages: Message[] = [
    msg(client, "Hi Melanie — round 2 is looking great. The live paths counter in the hero is exactly what the team was hoping for.", daysAgo(3), daysAgo(3)),
    msg(admin, "So glad it landed! I'll keep refining the loop section this week. Anything the team flagged that I should look at first?", daysAgo(3), daysAgo(3)),
    msg(
      client,
      "Two things from the review:\n1. The footer still feels heavy on mobile.\n2. Legal wants the privacy link more visible.\n\nHere's the thread with their notes: https://www.notion.so/everypeer/site-review",
      hoursAgo(20),
      hoursAgo(19),
    ),
    msg(admin, "Both noted. I'll simplify the footer to a single column under 640px and move the privacy link up next to the copyright line. New build on staging by Thursday.", hoursAgo(19), null),
    msg(client, "Perfect, thank you. Should we sign the Phase 2 SOW before or after the Thursday review?", hoursAgo(2), null),
  ];
  conversation.lastMessageAt = messages[messages.length - 1]!.createdAt;

  const files = new Map<string, Uint8Array>();
  files.set(`${msa.id}:original`, msaPdf);
  files.set(
    `${msa.id}:signed`,
    await stampSignature(msaPdf, {
      contractId: msa.id,
      contractTitle: msa.title,
      signerName: msa.signerName!,
      signerEmail: msa.signerEmail!,
      signedAt: new Date(msa.signedAt!),
      ip: msa.signerIp,
      userAgent: msa.signerUserAgent,
      documentSha256: msa.documentSha256,
      signatureImage: null,
    }),
  );
  files.set(`${sow.id}:original`, sowPdf);

  return {
    profiles: [admin, client],
    projects: [site, portal],
    milestones,
    updates,
    contracts: [msa, sow],
    files,
    uploads: new Map(),
    websites: [clientWebsite],
    hostingPasswords: new Map([[client.id, "demo-only-not-a-real-password"]]),
    avatars: new Map(),
    conversations: [conversation],
    messages,
  };
}

const g = globalThis as unknown as { __portalDemo?: Promise<DemoState> };
const state = () => (g.__portalDemo ??= seed());

const clone = <T>(v: T): T => structuredClone(v);

export class DemoStore implements PortalStore {
  async getProfile(id: string) {
    const s = await state();
    return clone(s.profiles.find((p) => p.id === id) ?? null);
  }
  async getProfileByEmail(email: string) {
    const s = await state();
    const e = email.trim().toLowerCase();
    return clone(s.profiles.find((p) => p.email.toLowerCase() === e) ?? null);
  }
  async listProfiles() {
    const s = await state();
    return clone([...s.profiles].sort((a, b) => a.fullName.localeCompare(b.fullName)));
  }
  async createClient(input: NewClientInput) {
    const s = await state();
    if (s.profiles.some((p) => p.email.toLowerCase() === input.email.toLowerCase())) {
      throw new Error("A client with that email already exists.");
    }
    const { firstName, lastName } = splitName(input.fullName);
    const p: Profile = {
      id: randomUUID(),
      email: input.email.trim().toLowerCase(),
      fullName: input.fullName.trim(),
      firstName,
      lastName,
      phone: null,
      company: input.company?.trim() || null,
      role: "client",
      avatarUrl: null,
      createdAt: new Date().toISOString(),
    };
    s.profiles.push(p);
    return clone(p);
  }
  async promoteToAdmin(id: string) {
    const s = await state();
    const p = s.profiles.find((x) => x.id === id);
    if (p) p.role = "admin";
  }
  async setProfileName(id: string, fullName: string) {
    const s = await state();
    const p = s.profiles.find((x) => x.id === id);
    if (!p) return;
    const { firstName, lastName } = splitName(fullName);
    p.fullName = fullName.trim();
    p.firstName = firstName;
    p.lastName = lastName;
  }

  async listProjects(clientId?: string) {
    const s = await state();
    return clone(
      s.projects
        .filter((p) => !clientId || p.clientId === clientId)
        .sort((a, b) => b.createdAt.localeCompare(a.createdAt)),
    );
  }
  async getProject(id: string): Promise<ProjectDetail | null> {
    const s = await state();
    const p = s.projects.find((x) => x.id === id);
    if (!p) return null;
    const client = s.profiles.find((x) => x.id === p.clientId)!;
    return clone({
      ...p,
      client,
      milestones: s.milestones.filter((m) => m.projectId === id).sort((a, b) => a.sortOrder - b.sortOrder),
      updates: s.updates.filter((u) => u.projectId === id).sort((a, b) => b.createdAt.localeCompare(a.createdAt)),
    });
  }
  async createProject(input: NewProjectInput) {
    const s = await state();
    const p: Project = { id: randomUUID(), createdAt: new Date().toISOString(), ...input };
    s.projects.push(p);
    return clone(p);
  }
  async updateProject(id: string, patch: ProjectPatch) {
    const s = await state();
    const p = s.projects.find((x) => x.id === id);
    if (!p) throw new Error("Project not found.");
    Object.assign(p, patch);
    return clone(p);
  }
  async addMilestone(projectId: string, title: string, dueDate: string | null) {
    const s = await state();
    const order = s.milestones.filter((m) => m.projectId === projectId).length;
    const m: Milestone = { id: randomUUID(), projectId, title, dueDate, completedAt: null, sortOrder: order };
    s.milestones.push(m);
    return clone(m);
  }
  async setMilestoneComplete(id: string, complete: boolean) {
    const s = await state();
    const m = s.milestones.find((x) => x.id === id);
    if (m) m.completedAt = complete ? new Date().toISOString() : null;
  }
  async deleteMilestone(id: string) {
    const s = await state();
    s.milestones = s.milestones.filter((m) => m.id !== id);
  }
  async addUpdate(projectId: string, input: Pick<ProjectUpdate, "kind" | "title" | "body" | "linkUrl" | "linkLabel">) {
    const s = await state();
    const u: ProjectUpdate = { id: randomUUID(), projectId, createdAt: new Date().toISOString(), ...input };
    s.updates.push(u);
    return clone(u);
  }

  async listContracts(clientId?: string) {
    const s = await state();
    return clone(
      s.contracts
        .filter((c) => !clientId || c.clientId === clientId)
        .sort((a, b) => b.sentAt.localeCompare(a.sentAt)),
    );
  }
  async getContract(id: string): Promise<ContractDetail | null> {
    const s = await state();
    const c = s.contracts.find((x) => x.id === id);
    if (!c) return null;
    return clone({
      ...c,
      client: s.profiles.find((p) => p.id === c.clientId)!,
      project: s.projects.find((p) => p.id === c.projectId) ?? null,
    });
  }
  async getContractPdf(id: string, variant: "original" | "signed") {
    const s = await state();
    return s.files.get(`${id}:${variant}`) ?? null;
  }
  async createContractUploadUrl() {
    return null;
  }
  async putContractUpload(id: string, pdf: Uint8Array) {
    const s = await state();
    s.uploads.set(id, pdf);
  }
  async readContractUpload(id: string) {
    const s = await state();
    return s.uploads.get(id) ?? null;
  }
  async discardContractUpload(id: string) {
    const s = await state();
    s.uploads.delete(id);
  }
  async createContract(input: NewContractInput) {
    const s = await state();
    if (s.contracts.some((x) => x.id === input.id)) throw new Error("This agreement was already sent.");
    const c: Contract = {
      id: input.id,
      clientId: input.clientId,
      projectId: input.projectId,
      title: input.title.trim(),
      description: input.description?.trim() || null,
      status: "awaiting_signature",
      documentSha256: sha256Hex(input.pdf),
      sentAt: new Date().toISOString(),
      signedAt: null,
      signerName: null,
      signerEmail: null,
      signerIp: null,
      signerUserAgent: null,
      createdAt: new Date().toISOString(),
    };
    s.contracts.push(c);
    s.files.set(`${c.id}:original`, input.pdf);
    s.uploads.delete(c.id);
    return clone(c);
  }
  async signContract(input: SignatureInput, signer: Profile) {
    const s = await state();
    const c = s.contracts.find((x) => x.id === input.contractId);
    if (!c) throw new Error("Agreement not found.");
    if (c.clientId !== signer.id) throw new Error("This agreement is not yours to sign.");
    if (c.status !== "awaiting_signature") throw new Error("This agreement is no longer awaiting a signature.");
    const original = s.files.get(`${c.id}:original`);
    if (!original) throw new Error("The agreement file is missing.");

    const signedAt = new Date();
    const signed = await stampSignature(original, {
      contractId: c.id,
      contractTitle: c.title,
      signerName: input.signerName,
      signerEmail: signer.email,
      signedAt,
      ip: input.ip,
      userAgent: input.userAgent,
      documentSha256: c.documentSha256,
      signatureImage: input.signatureImage,
    });
    s.files.set(`${c.id}:signed`, signed);
    Object.assign(c, {
      status: "signed",
      signedAt: signedAt.toISOString(),
      signerName: input.signerName,
      signerEmail: signer.email,
      signerIp: input.ip,
      signerUserAgent: input.userAgent,
    } satisfies Partial<Contract>);
    return clone(c);
  }
  async voidContract(id: string) {
    const s = await state();
    const c = s.contracts.find((x) => x.id === id);
    if (c && c.status === "awaiting_signature") c.status = "void";
  }

  private async mustProfile(id: string) {
    const s = await state();
    const p = s.profiles.find((x) => x.id === id);
    if (!p) throw new Error("Profile not found.");
    return { s, p };
  }
  async updateProfile(id: string, patch: ProfilePatch) {
    const { p } = await this.mustProfile(id);
    if (patch.firstName !== undefined) p.firstName = patch.firstName.trim();
    if (patch.lastName !== undefined) p.lastName = patch.lastName.trim();
    if (patch.firstName !== undefined || patch.lastName !== undefined) p.fullName = joinName(p.firstName, p.lastName);
    if (patch.phone !== undefined) p.phone = patch.phone?.trim() || null;
    if (patch.company !== undefined) p.company = patch.company?.trim() || null;
    return clone(p);
  }
  async setProfileEmail(id: string, email: string) {
    const { s, p } = await this.mustProfile(id);
    const e = email.trim().toLowerCase();
    if (s.profiles.some((x) => x.id !== id && x.email.toLowerCase() === e)) {
      throw new Error("Another account already uses that email address.");
    }
    p.email = e;
    return clone(p);
  }
  async getWebsiteDetails(profileId: string) {
    const s = await state();
    return clone(s.websites.find((w) => w.profileId === profileId) ?? null);
  }
  async saveWebsiteDetails(profileId: string, input: WebsiteDetailsInput) {
    const { s } = await this.mustProfile(profileId);
    const { hostingPassword, ...fields } = input;
    if (hostingPassword === null) s.hostingPasswords.delete(profileId);
    else if (hostingPassword !== undefined) s.hostingPasswords.set(profileId, hostingPassword);
    const next: WebsiteDetails = {
      ...fields,
      profileId,
      hasHostingPassword: s.hostingPasswords.has(profileId),
      updatedAt: new Date().toISOString(),
    };
    const i = s.websites.findIndex((w) => w.profileId === profileId);
    if (i === -1) s.websites.push(next);
    else s.websites[i] = next;
    return clone(next);
  }
  async revealHostingPassword(profileId: string) {
    const s = await state();
    return s.hostingPasswords.get(profileId) ?? null;
  }
  async getAvatar(profileId: string) {
    const s = await state();
    return s.avatars.get(profileId) ?? null;
  }
  async setAvatar(profileId: string, file: AvatarFile) {
    const { s, p } = await this.mustProfile(profileId);
    s.avatars.set(profileId, file);
    p.avatarUrl = `/api/avatars/${profileId}?v=${Date.now().toString(36)}`;
    return clone(p);
  }
  async removeAvatar(profileId: string) {
    const { s, p } = await this.mustProfile(profileId);
    s.avatars.delete(profileId);
    p.avatarUrl = null;
    return clone(p);
  }

  async getOrCreateConversation(clientId: string) {
    const { s } = await this.mustProfile(clientId);
    let c = s.conversations.find((x) => x.clientId === clientId);
    if (!c) {
      c = { id: randomUUID(), clientId, createdAt: new Date().toISOString(), lastMessageAt: null };
      s.conversations.push(c);
    }
    return clone(c);
  }
  async getConversation(id: string) {
    const s = await state();
    return clone(s.conversations.find((c) => c.id === id) ?? null);
  }
  async listConversations(): Promise<ConversationSummary[]> {
    const s = await state();
    const rows = s.conversations.flatMap((c) => {
      const client = s.profiles.find((p) => p.id === c.clientId);
      if (!client) return [];
      const thread = s.messages.filter((m) => m.conversationId === c.id);
      const lastMessage = thread.reduce<Message | null>((a, m) => (!a || m.createdAt > a.createdAt ? m : a), null);
      const unreadCount = thread.filter((m) => m.senderRole === "client" && !m.readAt).length;
      return [{ ...c, client, lastMessage, unreadCount }];
    });
    return clone(rows.sort((a, b) => (b.lastMessageAt ?? b.createdAt).localeCompare(a.lastMessageAt ?? a.createdAt)));
  }
  async listMessages(conversationId: string, after?: string) {
    const s = await state();
    return clone(
      s.messages
        .filter((m) => m.conversationId === conversationId && (!after || m.createdAt > after))
        .sort((a, b) => a.createdAt.localeCompare(b.createdAt)),
    );
  }
  async sendMessage(conversationId: string, sender: Profile, body: string) {
    const s = await state();
    const c = s.conversations.find((x) => x.id === conversationId);
    if (!c) throw new Error("Conversation not found.");
    const m: Message = {
      id: randomUUID(),
      conversationId,
      senderId: sender.id,
      senderRole: sender.role,
      body,
      createdAt: new Date().toISOString(),
      readAt: null,
    };
    s.messages.push(m);
    c.lastMessageAt = m.createdAt;
    return clone(m);
  }
  async markConversationRead(conversationId: string, viewerRole: Role) {
    const s = await state();
    const now = new Date().toISOString();
    let n = 0;
    for (const m of s.messages) {
      if (m.conversationId === conversationId && m.senderRole !== viewerRole && !m.readAt) {
        m.readAt = now;
        n++;
      }
    }
    return n;
  }
  async countUnreadMessages(viewer: Profile) {
    const s = await state();
    if (viewer.role === "admin") return s.messages.filter((m) => m.senderRole === "client" && !m.readAt).length;
    const c = s.conversations.find((x) => x.clientId === viewer.id);
    return c ? s.messages.filter((m) => m.conversationId === c.id && m.senderRole === "admin" && !m.readAt).length : 0;
  }
}
