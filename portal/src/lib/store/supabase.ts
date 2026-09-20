import { createClient, type SupabaseClient } from "@supabase/supabase-js";
import { sha256Hex, stampSignature } from "@/lib/pdf";
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

/* Row shapes as stored (snake_case) */
type ProfileRow = { id: string; email: string; full_name: string; company: string | null; role: Profile["role"]; created_at: string };
type ProjectRow = {
  id: string; client_id: string; name: string; summary: string; status: Project["status"]; phase: Project["phase"];
  start_date: string; target_launch: string | null; next_step: string | null; created_at: string;
};
type MilestoneRow = { id: string; project_id: string; title: string; due_date: string | null; completed_at: string | null; sort_order: number };
type UpdateRow = {
  id: string; project_id: string; kind: ProjectUpdate["kind"]; title: string; body: string;
  link_url: string | null; link_label: string | null; created_at: string;
};
type ContractRow = {
  id: string; client_id: string; project_id: string | null; title: string; description: string | null; status: Contract["status"];
  document_sha256: string; sent_at: string; signed_at: string | null; signer_name: string | null; signer_email: string | null;
  signer_ip: string | null; signer_user_agent: string | null; created_at: string;
};

const profile = (r: ProfileRow): Profile => ({
  id: r.id, email: r.email, fullName: r.full_name, company: r.company, role: r.role, createdAt: r.created_at,
});
const project = (r: ProjectRow): Project => ({
  id: r.id, clientId: r.client_id, name: r.name, summary: r.summary, status: r.status, phase: r.phase,
  startDate: r.start_date, targetLaunch: r.target_launch, nextStep: r.next_step, createdAt: r.created_at,
});
const milestone = (r: MilestoneRow): Milestone => ({
  id: r.id, projectId: r.project_id, title: r.title, dueDate: r.due_date, completedAt: r.completed_at, sortOrder: r.sort_order,
});
const update = (r: UpdateRow): ProjectUpdate => ({
  id: r.id, projectId: r.project_id, kind: r.kind, title: r.title, body: r.body,
  linkUrl: r.link_url, linkLabel: r.link_label, createdAt: r.created_at,
});
const contract = (r: ContractRow): Contract => ({
  id: r.id, clientId: r.client_id, projectId: r.project_id, title: r.title, description: r.description, status: r.status,
  documentSha256: r.document_sha256, sentAt: r.sent_at, signedAt: r.signed_at, signerName: r.signer_name,
  signerEmail: r.signer_email, signerIp: r.signer_ip, signerUserAgent: r.signer_user_agent, createdAt: r.created_at,
});

const BUCKET = "contracts";

function fail(msg: string, error: { message: string } | null): never {
  throw new Error(`${msg}: ${error?.message ?? "unknown error"}`);
}

/** Production backend. Uses the service-role key on the server; callers
 *  (server actions / pages) are responsible for scoping by the signed-in user,
 *  which they do by passing clientId or checking ownership on the result. */
export class SupabaseStore implements PortalStore {
  private db: SupabaseClient;

  constructor(url: string, serviceRoleKey: string) {
    this.db = createClient(url, serviceRoleKey, { auth: { persistSession: false, autoRefreshToken: false } });
  }

  async getProfile(id: string) {
    const { data } = await this.db.from("profiles").select("*").eq("id", id).maybeSingle<ProfileRow>();
    return data ? profile(data) : null;
  }
  async getProfileByEmail(email: string) {
    const { data } = await this.db.from("profiles").select("*").eq("email", email.trim().toLowerCase()).maybeSingle<ProfileRow>();
    return data ? profile(data) : null;
  }
  async listProfiles() {
    const { data, error } = await this.db.from("profiles").select("*").order("full_name");
    if (error) fail("Could not load clients", error);
    return (data as ProfileRow[]).map(profile);
  }
  async createClient(input: NewClientInput) {
    const email = input.email.trim().toLowerCase();
    // Invite through Auth; the on_auth_user_created trigger creates the profile
    // row and the invite email doubles as the client's first sign-in link,
    // which lands on the set-password step.
    const redirectTo = `${process.env.NEXT_PUBLIC_PORTAL_URL ?? ""}/auth/callback?next=${encodeURIComponent("/set-password")}`;
    const { data, error } = await this.db.auth.admin.inviteUserByEmail(email, {
      data: { full_name: input.fullName.trim(), company: input.company?.trim() || null },
      redirectTo,
    });
    if (error || !data.user) fail("Could not invite client", error);
    // The trigger runs synchronously with the insert, so the profile exists now.
    await this.db
      .from("profiles")
      .update({ full_name: input.fullName.trim(), company: input.company?.trim() || null })
      .eq("id", data.user.id);
    return (await this.getProfile(data.user.id))!;
  }
  async promoteToAdmin(id: string) {
    await this.db.from("profiles").update({ role: "admin" }).eq("id", id);
  }
  async setProfileName(id: string, fullName: string) {
    await this.db.from("profiles").update({ full_name: fullName.trim() }).eq("id", id);
  }

  async listProjects(clientId?: string) {
    let q = this.db.from("projects").select("*").order("created_at", { ascending: false });
    if (clientId) q = q.eq("client_id", clientId);
    const { data, error } = await q;
    if (error) fail("Could not load projects", error);
    return (data as ProjectRow[]).map(project);
  }
  async getProject(id: string): Promise<ProjectDetail | null> {
    const { data: p } = await this.db.from("projects").select("*").eq("id", id).maybeSingle<ProjectRow>();
    if (!p) return null;
    const [{ data: ms }, { data: us }, client] = await Promise.all([
      this.db.from("milestones").select("*").eq("project_id", id).order("sort_order"),
      this.db.from("project_updates").select("*").eq("project_id", id).order("created_at", { ascending: false }),
      this.getProfile(p.client_id),
    ]);
    if (!client) return null;
    return {
      ...project(p),
      client,
      milestones: ((ms ?? []) as MilestoneRow[]).map(milestone),
      updates: ((us ?? []) as UpdateRow[]).map(update),
    };
  }
  async createProject(input: NewProjectInput) {
    const { data, error } = await this.db
      .from("projects")
      .insert({
        client_id: input.clientId, name: input.name, summary: input.summary, phase: input.phase, status: input.status,
        start_date: input.startDate, target_launch: input.targetLaunch, next_step: input.nextStep,
      })
      .select("*")
      .single<ProjectRow>();
    if (error || !data) fail("Could not create project", error);
    return project(data);
  }
  async updateProject(id: string, patch: ProjectPatch) {
    const row: Partial<ProjectRow> = {};
    if (patch.name !== undefined) row.name = patch.name;
    if (patch.summary !== undefined) row.summary = patch.summary;
    if (patch.phase !== undefined) row.phase = patch.phase;
    if (patch.status !== undefined) row.status = patch.status;
    if (patch.targetLaunch !== undefined) row.target_launch = patch.targetLaunch;
    if (patch.nextStep !== undefined) row.next_step = patch.nextStep;
    const { data, error } = await this.db.from("projects").update(row).eq("id", id).select("*").single<ProjectRow>();
    if (error || !data) fail("Could not update project", error);
    return project(data);
  }
  async addMilestone(projectId: string, title: string, dueDate: string | null) {
    const { count } = await this.db.from("milestones").select("id", { count: "exact", head: true }).eq("project_id", projectId);
    const { data, error } = await this.db
      .from("milestones")
      .insert({ project_id: projectId, title, due_date: dueDate, sort_order: count ?? 0 })
      .select("*")
      .single<MilestoneRow>();
    if (error || !data) fail("Could not add milestone", error);
    return milestone(data);
  }
  async setMilestoneComplete(id: string, complete: boolean) {
    await this.db.from("milestones").update({ completed_at: complete ? new Date().toISOString() : null }).eq("id", id);
  }
  async deleteMilestone(id: string) {
    await this.db.from("milestones").delete().eq("id", id);
  }
  async addUpdate(projectId: string, input: Pick<ProjectUpdate, "kind" | "title" | "body" | "linkUrl" | "linkLabel">) {
    const { data, error } = await this.db
      .from("project_updates")
      .insert({ project_id: projectId, kind: input.kind, title: input.title, body: input.body, link_url: input.linkUrl, link_label: input.linkLabel })
      .select("*")
      .single<UpdateRow>();
    if (error || !data) fail("Could not post update", error);
    return update(data);
  }

  async listContracts(clientId?: string) {
    let q = this.db.from("contracts").select("*").order("sent_at", { ascending: false });
    if (clientId) q = q.eq("client_id", clientId);
    const { data, error } = await q;
    if (error) fail("Could not load agreements", error);
    return (data as ContractRow[]).map(contract);
  }
  async getContract(id: string): Promise<ContractDetail | null> {
    const { data: c } = await this.db.from("contracts").select("*").eq("id", id).maybeSingle<ContractRow>();
    if (!c) return null;
    const [client, proj] = await Promise.all([
      this.getProfile(c.client_id),
      c.project_id
        ? this.db.from("projects").select("*").eq("id", c.project_id).maybeSingle<ProjectRow>().then((r) => (r.data ? project(r.data) : null))
        : Promise.resolve(null),
    ]);
    if (!client) return null;
    return { ...contract(c), client, project: proj };
  }
  async getContractPdf(id: string, variant: "original" | "signed") {
    const { data, error } = await this.db.storage.from(BUCKET).download(`${id}/${variant}.pdf`);
    if (error || !data) return null;
    return new Uint8Array(await data.arrayBuffer());
  }
  async createContract(input: NewContractInput) {
    const { data, error } = await this.db
      .from("contracts")
      .insert({
        client_id: input.clientId, project_id: input.projectId, title: input.title.trim(),
        description: input.description?.trim() || null, document_sha256: sha256Hex(input.pdf),
      })
      .select("*")
      .single<ContractRow>();
    if (error || !data) fail("Could not create agreement", error);
    const up = await this.db.storage.from(BUCKET).upload(`${data.id}/original.pdf`, input.pdf, { contentType: "application/pdf" });
    if (up.error) {
      await this.db.from("contracts").delete().eq("id", data.id);
      fail("Could not store the PDF", up.error);
    }
    return contract(data);
  }
  async signContract(input: SignatureInput, signer: Profile) {
    const { data: c } = await this.db.from("contracts").select("*").eq("id", input.contractId).maybeSingle<ContractRow>();
    if (!c) throw new Error("Agreement not found.");
    if (c.client_id !== signer.id) throw new Error("This agreement is not yours to sign.");
    if (c.status !== "awaiting_signature") throw new Error("This agreement is no longer awaiting a signature.");
    const original = await this.getContractPdf(c.id, "original");
    if (!original) throw new Error("The agreement file is missing.");

    const signedAt = new Date();
    const signed = await stampSignature(original, {
      contractId: c.id, contractTitle: c.title, signerName: input.signerName, signerEmail: signer.email, signedAt,
      ip: input.ip, userAgent: input.userAgent, documentSha256: c.document_sha256, signatureImage: input.signatureImage,
    });
    const up = await this.db.storage.from(BUCKET).upload(`${c.id}/signed.pdf`, signed, { contentType: "application/pdf", upsert: true });
    if (up.error) fail("Could not store the signed PDF", up.error);

    const { data, error } = await this.db
      .from("contracts")
      .update({
        status: "signed", signed_at: signedAt.toISOString(), signer_name: input.signerName, signer_email: signer.email,
        signer_ip: input.ip, signer_user_agent: input.userAgent,
      })
      .eq("id", c.id)
      .eq("status", "awaiting_signature")
      .select("*")
      .single<ContractRow>();
    if (error || !data) fail("Could not record the signature", error);
    return contract(data);
  }
  async voidContract(id: string) {
    await this.db.from("contracts").update({ status: "void" }).eq("id", id).eq("status", "awaiting_signature");
  }
}
