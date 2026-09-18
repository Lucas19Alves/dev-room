import { componentDataEntries } from "./model.js";
import { calculateMetrics, reviewStatus } from "./runtime.js";

const DAY = 86400000;
const clone = (value) => JSON.parse(JSON.stringify(value));

function trackerItems(flow) {
  return componentDataEntries(flow, "tracker").flatMap(({ data }) =>
    Array.isArray(data.items)
      ? data.items.map((item) => ({ item, source: "tracker" }))
      : [],
  );
}

function taskItems(flow) {
  return componentDataEntries(flow, "tasks").flatMap(({ data }) =>
    Array.isArray(data.items)
      ? data.items.map((item) => ({ item, source: "tasks" }))
      : [],
  );
}

function dateValue(value) {
  if (!value) return null;
  const date = /^\d{4}-\d{2}-\d{2}$/.test(String(value))
    ? `${value}T12:00:00`
    : value;
  const time = new Date(date).getTime();
  return Number.isFinite(time) ? time : null;
}

function dateLabel(value) {
  const time = dateValue(value);
  if (time === null) return "";
  return new Intl.DateTimeFormat("pt-BR", {
    day: "2-digit",
    month: "short",
  }).format(time);
}

function daysSince(value, now) {
  const time = dateValue(value);
  return time === null ? null : Math.max(0, Math.floor((now - time) / DAY));
}

function actionType(item, status) {
  const text = `${item.values?.nextAction || ""} ${status || ""}`.toLowerCase();
  if (text.includes("entrevista") || text.includes("prepar"))
    return "prepare_interview";
  if (
    text.includes("follow") ||
    text.includes("retorno") ||
    text.includes("acompan")
  )
    return "follow_up";
  if (status === "Candidatura enviada" || status === "Contato")
    return "follow_up";
  return "continue_task";
}

function operation(id, type, label) {
  return { id: `${id}:${type}`, type, label };
}

function makeAction({
  flow,
  sourceType,
  sourceId,
  type,
  title,
  description,
  dueAt,
  priority = "normal",
}) {
  const id = `${sourceType}:${sourceId}:${type}`;
  const options = [
    operation(
      id,
      "open",
      sourceType === "tracker" ? "Abrir oportunidade" : "Abrir tarefa",
    ),
  ];
  if (type !== "review_flow")
    options.push(operation(id, "complete", "Concluir"));
  options.push(operation(id, "postpone", "Adiar"));
  if (type !== "review_flow")
    options.push(operation(id, "dismiss", "Dispensar"));
  return {
    id,
    type,
    title,
    description,
    priority,
    dueAt: dueAt || null,
    source: sourceType,
    sourceId,
    flowId: flow.id,
    actions: options,
  };
}

function jobOpportunity(entry, now) {
  const item = entry.item;
  const values = item.values || {};
  const company = values.company || "Empresa sem nome";
  const status = item.status || "Encontrada";
  const dueAt = values.nextActionAt || values.dueAt || "";
  const days = daysSince(
    values.updatedAt || item.updatedAt || values.appliedAt,
    now,
  );
  return {
    id: item.id,
    source: "tracker",
    sourceId: item.id,
    title: company,
    subtitle: values.role || "Oportunidade",
    status,
    stage: status,
    nextAction: values.nextAction || "",
    dueAt,
    dueLabel: dateLabel(dueAt),
    staleLabel:
      days !== null && days >= 3 ? `Sem atualização há ${days} dias.` : "",
    url: values.url || "",
    sourceItem: item,
  };
}

function buildActions(flow, now, id) {
  const actions = [];
  for (const entry of trackerItems(flow)) {
    const item = entry.item;
    const values = item.values || {};
    const status = item.status || "";
    if (values.actionDismissedAt) continue;
    if (
      !values.nextAction &&
      values.actionCompletedAt &&
      status !== "Entrevista"
    )
      continue;
    const type = actionType(item, status);
    const dueAt = values.nextActionAt || "";
    const due = dateValue(dueAt);
    const isDue = due !== null && due <= now + DAY;
    const shouldAct =
      Boolean(values.nextAction) ||
      status === "Entrevista" ||
      status === "Candidatura enviada" ||
      status === "Contato" ||
      isDue;
    if (!shouldAct) continue;
    const company = values.company || values.title || "oportunidade";
    const title =
      values.nextAction ||
      (type === "prepare_interview"
        ? `Preparar entrevista com ${company}`
        : type === "follow_up"
          ? `Fazer follow-up com ${company}`
          : `Revisar vaga ${company}`);
    const stale = daysSince(
      values.updatedAt || item.updatedAt || values.appliedAt,
      now,
    );
    actions.push(
      makeAction({
        flow,
        sourceType: "tracker",
        sourceId: item.id,
        type,
        title,
        description:
          due && due < now
            ? `Prazo passado em ${dateLabel(dueAt)}.`
            : stale !== null && stale >= 3
              ? `Sem atualização há ${stale} dias.`
              : dueAt
                ? `Próximo compromisso em ${dateLabel(dueAt)}.`
                : "Escolha um próximo movimento para esta oportunidade.",
        dueAt,
        priority:
          due && due < now
            ? "high"
            : due && due <= now + DAY
              ? "high"
              : "normal",
      }),
    );
  }
  for (const entry of taskItems(flow)) {
    const item = entry.item;
    if (item.done || item.dismissedAt) continue;
    actions.push(
      makeAction({
        flow,
        sourceType: "tasks",
        sourceId: item.id,
        type: "continue_task",
        title: item.text || "Continuar tarefa",
        description:
          item.description || "Um próximo passo disponível neste Flow.",
        dueAt: item.dueDate,
        priority:
          item.dueDate && dateValue(item.dueDate) < now
            ? "high"
            : item.priority || "normal",
      }),
    );
  }
  const review = reviewStatus(flow, now);
  if (review.due)
    actions.push(
      makeAction({
        flow,
        sourceType: "review",
        sourceId: "flow-review",
        type: "review_flow",
        title: "Revisar este Flow",
        description: "Veja o que mudou e escolha o próximo foco.",
        priority: "normal",
      }),
    );
  return actions
    .sort(
      (a, b) =>
        (a.priority === "high" ? -1 : 1) - (b.priority === "high" ? -1 : 1),
    )
    .slice(0, 12);
}

function notesFor(flow) {
  return componentDataEntries(flow, "notes").flatMap(({ data }) => {
    if (Array.isArray(data.items)) return data.items;
    return data.text
      ? [
          {
            id: "legacy-note",
            title: "Nota",
            content: data.text,
            updatedAt: flow.updatedAt,
          },
        ]
      : [];
  });
}

function resourcesFor(flow) {
  return componentDataEntries(flow, "links").flatMap(({ data }) =>
    (data.items || []).map((item) => ({ ...item, source: "links" })),
  );
}

export function buildFlowExperience(flow, now = Date.now()) {
  if (!flow) return null;
  const id = flow.definitionRef?.id;
  const metrics = calculateMetrics(flow, now);
  const actions = buildActions(flow, now, id);
  const opportunities = trackerItems(flow).map((entry) =>
    jobOpportunity(entry, now),
  );
  const resources = resourcesFor(flow);
  const notes = notesFor(flow);
  const tasks = taskItems(flow).map(({ item }) => item);
  const properties = flow.properties || {};
  const currentStage =
    flow.stages?.find((stage) => stage.status === "current")?.title || "";
  const job = id === "job";
  const title = job
    ? properties.targetRole || "Seu próximo capítulo"
    : properties.skillName ||
      properties.projectName ||
      properties.channel ||
      flow.objective;
  const context = {
    eyebrow: job ? "SUA BUSCA, COM CONTEXTO" : "CONTINUE DE ONDE PAROU",
    title,
    subtitle: job
      ? "Uma visão viva das oportunidades, conversas e próximos movimentos."
      : flow.context?.summary || flow.description,
    facts: [
      properties.seniority,
      (properties.workModels || []).join(" · "),
      currentStage ? `Etapa atual: ${currentStage}` : "",
    ].filter(Boolean),
  };
  const metricList = Object.values(metrics);
  const week = {
    metrics: job
      ? metricList.filter((metric) =>
          ["weeklyApplications", "interviews", "responses"].includes(metric.id),
        )
      : metricList.slice(0, 3),
  };
  const commitments = actions.filter((action) => action.dueAt).slice(0, 5);
  const preparation = {
    resources: resources.slice(0, 6),
    notes: notes.slice(0, 4),
    tasks: tasks.filter((task) => !task.done).slice(0, 4),
  };
  const history = [
    ...(flow.sessions || []).map((session) => ({
      id: session.id,
      type: "session",
      title: "Sessão de foco concluída",
      at: session.endedAt,
      detail: `${Math.floor((session.seconds || 0) / 60)} min`,
    })),
    ...(flow.review?.history || []).map((review) => ({
      id: review.id,
      type: "review",
      title: `Revisão ${review.status === "completed" ? "concluída" : review.status}`,
      at: review.createdAt,
      detail: "",
    })),
  ]
    .filter((entry) => entry.at)
    .sort((a, b) => b.at - a.at)
    .slice(0, 6);
  return {
    id,
    context,
    actions,
    week,
    opportunities: opportunities.slice(0, 12),
    commitments,
    preparation,
    progress: {
      metrics: metricList,
      goals: clone(flow.goals || []),
      stages: clone(flow.stages || []),
      value: flow.progress?.value ?? null,
    },
    history,
  };
}

export function findExperienceSource(flow, sourceType, sourceId) {
  if (sourceType === "tracker") {
    for (const { data } of componentDataEntries(flow, "tracker")) {
      const item = data.items?.find((candidate) => candidate.id === sourceId);
      if (item) return { type: sourceType, item };
    }
  }
  if (sourceType === "tasks") {
    for (const { data } of componentDataEntries(flow, "tasks")) {
      const item = data.items?.find((candidate) => candidate.id === sourceId);
      if (item) return { type: sourceType, item };
    }
  }
  return null;
}
