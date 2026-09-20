import { supabase } from "./supabase.js";
import { publicTemplate } from "./catalog.js";
import { buildProgressSnapshot } from "./reports.js";
import { validateDeclarativeDefinition } from "./declarative.js";

export function emptyStudio() {
  return {
    offerings: [],
    enrollments: [],
    learners: [],
    codes: [],
    loading: false,
    error: "",
  };
}

export function formatPrice(cents, currency = "BRL") {
  const value = Number(cents) || 0;
  if (value <= 0) return "Gratuito";
  return new Intl.NumberFormat("pt-BR", {
    style: "currency",
    currency,
  }).format(value / 100);
}

export function accessModeLabel(mode) {
  return (
    {
      open: "Inscrição aberta",
      invite: "Por convite",
      paid: "Pago, com código de acesso",
    }[mode] || "Inscrição aberta"
  );
}

function randomCode(length = 8) {
  const alphabet = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789";
  return Array.from(
    { length },
    () => alphabet[Math.floor(Math.random() * alphabet.length)],
  ).join("");
}

function asOffering(row) {
  return {
    id: row.id,
    creatorId: row.creator_id,
    templateId: row.template_id,
    title: row.title,
    summary: row.summary || "",
    audience: row.audience || "learners",
    accessMode: row.access_mode,
    priceCents: row.price_cents || 0,
    currency: row.currency || "BRL",
    inviteCode: row.invite_code,
    status: row.status,
    createdAt: row.created_at,
    blueprint: row.blueprint || row.flow_templates?.blueprint || null,
  };
}

export async function listPublishedOfferings() {
  if (!supabase) return [];
  const { data, error } = await supabase
    .from("flow_offerings")
    .select("*, flow_templates(blueprint)")
    .eq("status", "published")
    .order("created_at", { ascending: false })
    .limit(100);
  if (error) throw error;
  return (data || [])
    .map((row) => asOffering(row))
    .filter((offering) => {
      const blueprint = offering.blueprint;
      return (
        blueprint &&
        typeof blueprint.name === "string" &&
        Array.isArray(blueprint.components) &&
        validateDeclarativeDefinition(blueprint).valid
      );
    });
}

export async function listCreatorOfferings() {
  if (!supabase) return [];
  const { data, error } = await supabase
    .from("flow_offerings")
    .select("*, flow_templates(blueprint)")
    .order("created_at", { ascending: false });
  if (error) throw error;
  return (data || []).map(asOffering);
}

export async function publishOffering(flow, draft = {}) {
  if (!supabase)
    throw new Error("Conecte-se para publicar um Flow para outras pessoas.");
  const blueprint = publicTemplate(flow);
  const { data: template, error: templateError } = await supabase
    .from("flow_templates")
    .insert({
      blueprint,
      definition_version: blueprint.version || 1,
      status: "published",
    })
    .select("id")
    .single();
  if (templateError) throw templateError;
  const accessMode = draft.accessMode || flow.offering?.accessMode || "open";
  const priceCents = Math.max(
    0,
    Number(draft.priceCents ?? flow.offering?.priceCents) || 0,
  );
  const { data, error } = await supabase
    .from("flow_offerings")
    .insert({
      template_id: template.id,
      title: (draft.title || flow.identity.name).trim().slice(0, 120),
      summary: (draft.summary || flow.objective || flow.description || "")
        .trim()
        .slice(0, 500),
      audience: "learners",
      access_mode:
        accessMode === "paid" && priceCents > 0 ? "paid" : accessMode,
      price_cents: accessMode === "paid" ? priceCents : 0,
      currency: "BRL",
      invite_code: randomCode(),
      status: "published",
    })
    .select("*")
    .single();
  if (error) throw error;
  flow.privacy ||= {};
  flow.privacy.sharedDefinitionId = template.id;
  flow.privacy.offeringId = data.id;
  flow.offering = {
    audience: "learners",
    accessMode: data.access_mode,
    priceCents: data.price_cents,
  };
  return { offering: asOffering({ ...data, blueprint }), shareId: template.id };
}

export async function generateAccessCodes(offeringId, count = 1, note = "") {
  if (!supabase) throw new Error("Conecte-se para gerar códigos de acesso.");
  const rows = Array.from(
    { length: Math.max(1, Math.min(50, Number(count) || 1)) },
    () => ({
      offering_id: offeringId,
      code: randomCode(10),
      note: note.slice(0, 80),
    }),
  );
  const { data, error } = await supabase
    .from("flow_access_codes")
    .insert(rows)
    .select("*");
  if (error) throw error;
  return data;
}

export async function listAccessCodes(offeringId) {
  if (!supabase) return [];
  const { data, error } = await supabase
    .from("flow_access_codes")
    .select("*")
    .eq("offering_id", offeringId)
    .order("created_at", { ascending: false });
  if (error) throw error;
  return data || [];
}

export async function enrollInOffering(offeringId, accessCode = "") {
  if (!supabase) throw new Error("Conecte-se para entrar neste Flow.");
  const { data, error } = await supabase.rpc("enroll_in_offering", {
    target_offering: offeringId,
    access_code: accessCode?.trim() || null,
  });
  if (error) throw error;
  return data;
}

export async function loadCreatorRoster(offeringId) {
  if (!supabase) return [];
  const { data: sharesRows, error } = await supabase
    .from("flow_progress_shares")
    .select("learner_id, snapshot, updated_at")
    .eq("offering_id", offeringId);
  if (error) throw error;
  const { data: enrollments, error: enrollmentError } = await supabase
    .from("flow_enrollments")
    .select("id, learner_id, status, enrolled_at")
    .eq("offering_id", offeringId)
    .order("enrolled_at", { ascending: false });
  if (enrollmentError) throw enrollmentError;
  const shares = new Map(
    (sharesRows || []).map((row) => [row.learner_id, row]),
  );
  return (enrollments || []).map((enrollment) => ({
    enrollmentId: enrollment.id,
    learnerId: enrollment.learner_id,
    status: enrollment.status,
    enrolledAt: enrollment.enrolled_at,
    share: shares.get(enrollment.learner_id) || null,
  }));
}

export async function shareFlowProgress(flow) {
  if (!supabase) throw new Error("Conecte-se para compartilhar o progresso.");
  const offeringId = flow.privacy?.offeringId;
  if (!offeringId)
    throw new Error("Este Flow ainda não está ligado a uma turma.");
  const snapshot = buildProgressSnapshot(flow);
  const { data: session, error: sessionError } = await supabase.auth.getUser();
  if (sessionError || !session.user)
    throw new Error("Conecte-se para compartilhar o progresso.");
  const { error } = await supabase.from("flow_progress_shares").upsert(
    {
      offering_id: offeringId,
      learner_id: session.user.id,
      snapshot,
      updated_at: new Date().toISOString(),
    },
    { onConflict: "offering_id,learner_id" },
  );
  if (error) throw error;
  flow.privacy.shareProgress = true;
  flow.privacy.lastSharedAt = Date.now();
  return snapshot;
}

export function offeringToTemplate(offering) {
  return {
    ...offering.blueprint,
    id: offering.templateId || offering.id,
    owner: offering.creatorId,
    offeringId: offering.id,
    tag: offering.priceCents > 0 ? "TURMA PAGA" : "TURMA",
    accessMode: offering.accessMode,
    priceCents: offering.priceCents,
    inviteCode: offering.inviteCode,
  };
}
