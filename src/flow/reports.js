import { eventHistory } from "./overview.js";
import { journeyProgress } from "./journey.js";
import { calculateMetrics } from "./runtime.js";
import { isFlowArchived } from "./entitlements.js";
import { componentDataEntries } from "./model.js";

const dayMs = 86400000;

function minutesFromSessions(sessions = [], since = 0) {
  return Math.round(
    sessions
      .filter((session) => !since || (session.endedAt || 0) >= since)
      .reduce((total, session) => total + (session.seconds || 0), 0) / 60,
  );
}

function trackerItems(flow) {
  return componentDataEntries(flow, "tracker").flatMap(
    ({ data }) => data.items || [],
  );
}

function pipelineCounts(flow) {
  const stages =
    flow?.components?.find((component) => component.type === "tracker")?.config
      ?.stages || [];
  const items = trackerItems(flow);
  return stages.map((title) => ({
    title,
    count: items.filter((item) => item.status === title).length,
  }));
}

function insight(label, value, detail = "") {
  return { label, value, detail };
}

export function flowInsights(flow, now = Date.now()) {
  const id = flow?.definitionRef?.id;
  const metrics = calculateMetrics(flow, now);
  const items = trackerItems(flow);
  if (id === "job") {
    return [
      insight("Candidaturas", metrics.applications?.value ?? 0, "enviadas"),
      insight("Entrevistas", metrics.interviews?.value ?? 0),
      insight(
        "Retorno",
        `${metrics.returnRate?.value ?? 0}%`,
        "sobre o que você enviou",
      ),
      insight(
        "Em conversa",
        items.filter((item) =>
          ["Contato", "Entrevista", "Etapa técnica"].includes(item.status),
        ).length,
      ),
    ];
  }
  if (id === "enem") {
    return [
      insight("Questões", metrics.questions?.value ?? 0),
      insight("Acerto", `${metrics.accuracy?.value ?? 0}%`),
      insight("Redações", metrics.essays?.value ?? 0),
      insight("Horas", metrics.studyHours?.value ?? 0, "de estudo registrado"),
    ];
  }
  if (id === "code" || id === "project") {
    return [
      insight(
        "Marcos",
        `${metrics.milestonesDone?.value ?? 0}/${metrics.milestonesTotal?.value || metrics.milestonesDone?.value || 0}`,
      ),
      insight(
        "Bloqueios",
        items.filter((item) => item.status === "Bloqueado").length,
      ),
      insight("Sessões", metrics.sessions?.value ?? 0),
    ];
  }
  if (id === "college") {
    return [
      insight("Entregas", metrics.deliveriesDone?.value ?? 0),
      insight("Leituras", metrics.readingsDone?.value ?? 0),
      insight("Tempo", `${metrics.studyHours?.value ?? 0} h`),
    ];
  }
  if (id === "week") {
    return [
      insight("Prioridades", metrics.prioritiesDone?.value ?? 0),
      insight("Revisões", metrics.reviews?.value ?? 0),
    ];
  }
  if (id === "skill") {
    return [
      insight("Práticas", metrics.sessions?.value ?? 0),
      insight("Tempo", `${metrics.minutes?.value ?? 0} min`),
    ];
  }
  if (id === "content") {
    return [
      insight("Publicados", metrics.published?.value ?? 0),
      insight(
        "Em produção",
        items.filter((item) => !["Publicado", "Ideia"].includes(item.status))
          .length,
      ),
    ];
  }
  return Object.values(metrics)
    .slice(0, 4)
    .map((metric) => insight(metric.label, metric.value, metric.unit || ""));
}

export function buildFlowReport(flow, now = Date.now()) {
  const journey = journeyProgress(flow);
  const metrics = Object.values(calculateMetrics(flow, now));
  const weekStart = now - 7 * dayMs;
  const history = eventHistory([flow]).slice(0, 24);
  const goals = (flow.goals || []).map((goal) => ({
    id: goal.id,
    title: goal.title,
    current: goal.current ?? null,
    target: goal.target ?? null,
    unit: goal.unit || "",
    status: goal.status || "active",
  }));
  return {
    flowId: flow.id,
    name: flow.identity?.name || flow.objective,
    objective: flow.objective,
    category: flow.identity?.category || "",
    color: flow.identity?.color || "mint",
    icon: flow.identity?.icon || "✳",
    archived: isFlowArchived(flow),
    lastActiveAt: flow.updatedAt || flow.createdAt,
    journey,
    insights: flowInsights(flow, now),
    metrics,
    goals,
    pipeline: pipelineCounts(flow),
    sessions: {
      total: (flow.sessions || []).length,
      minutes: minutesFromSessions(flow.sessions),
      weekMinutes: minutesFromSessions(flow.sessions, weekStart),
    },
    reviews: (flow.review?.history || []).filter(
      (item) => item.status === "completed",
    ).length,
    history,
    shareEnabled: Boolean(flow.privacy?.shareProgress),
    offeringId: flow.privacy?.offeringId || null,
  };
}

export function buildAccountReports(flows = [], now = Date.now()) {
  return flows
    .filter((flow) => !isFlowArchived(flow))
    .map((flow) => buildFlowReport(flow, now));
}

export function buildProgressSnapshot(flow, now = Date.now()) {
  const report = buildFlowReport(flow, now);
  return {
    version: 1,
    updatedAt: now,
    name: report.name,
    objective: report.objective,
    lastActiveAt: report.lastActiveAt,
    journey: {
      completed: report.journey.completed,
      total: report.journey.total,
      percent: report.journey.percent,
      current: report.journey.current
        ? { id: report.journey.current.id, title: report.journey.current.title }
        : null,
      stages: report.journey.stages.map((stage) => ({
        id: stage.id,
        title: stage.title,
        status: stage.status,
        completedAt: stage.completedAt,
      })),
    },
    insights: report.insights,
    goals: report.goals.map(({ id, title, current, target, unit, status }) => ({
      id,
      title,
      current,
      target,
      unit,
      status,
    })),
    sessions: report.sessions,
    reviews: report.reviews,
  };
}

export function snapshotLooksPrivate(snapshot) {
  const serialized = JSON.stringify(snapshot || {});
  return (
    /https?:\/\/|@|SECRET|PRIVATE/i.test(serialized) &&
    /notes|task text/i.test(serialized)
  );
}
