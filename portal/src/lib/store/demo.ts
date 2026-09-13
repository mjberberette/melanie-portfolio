import { randomUUID } from "node:crypto";
import { buildAgreementPdf, sha256Hex, stampSignature } from "@/lib/pdf";
import type {
  Contract,
  ContractDetail,
  Milestone,
  NewClientInput,
  NewContractInput,
  NewProjectInput,
  PortalStore,
  Profile,
  Project,
  ProjectDetail,
  ProjectPatch,
  ProjectUpdate,
  SignatureInput,
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
    company: null,
    role: "admin",
    createdAt: daysAgo(400),
  };
  const client: Profile = {
    id: DEMO_CLIENT_ID,
    email: "jordan@everypeer.com",
    fullName: "Jordan Ellis",
    company: "EveryPeer",
    role: "client",
    createdAt: daysAgo(64),
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
    const p: Profile = {
      id: randomUUID(),
      email: input.email.trim().toLowerCase(),
      fullName: input.fullName.trim(),
      company: input.company?.trim() || null,
      role: "client",
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
  async createContract(input: NewContractInput) {
    const s = await state();
    const c: Contract = {
      id: randomUUID(),
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
}
