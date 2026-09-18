import { componentDataEntries } from "./model.js";
import { calculateMetrics, reviewStatus } from "./runtime.js";
import {
  actionMatchesItem,
  actionTemplate,
  declarativeEntityItems,
  entityStateLabels,
} from "./declarativeRuntime.js";

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
  const openLabel =
    sourceType === "tracker" && flow.definitionRef?.id === "job"
      ? "Abrir oportunidade"
      : sourceType === "tasks"
        ? "Abrir tarefa"
        : "Abrir item";
  const options = [operation(id, "open", openLabel)];
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
      id === "job" &&
      !values.nextAction &&
      values.actionCompletedAt &&
      status !== "Entrevista"
    )
      continue;
    let type = actionType(item, status);
    let shouldAct = false;
    let title = values.nextAction || "";
    let description = "";
    if (id === "enem") {
      const kind = values.kind || "Tópico";
      type =
        kind === "Revisão"
          ? "review_topic"
          : kind === "Questões" || kind === "Simulado"
            ? "practice_questions"
            : kind === "Redação"
              ? "write_essay"
              : values.notes
                ? "resume_content"
                : "study_topic";
      shouldAct = !["Concluído", "Revisado"].includes(status);
      title =
        type === "review_topic"
          ? `Revisar ${values.topic || "conteúdo"}`
          : type === "practice_questions"
            ? `Fazer questões de ${values.subject || "uma matéria"}`
            : type === "write_essay"
              ? `Escrever redação${values.topic ? ` sobre ${values.topic}` : ""}`
              : type === "resume_content"
                ? `Retomar ${values.topic || "conteúdo"}`
                : `Estudar ${values.topic || values.subject || "um tópico"}`;
      description = values.subject
        ? `${values.subject}${values.notes ? " · Há erros ou aprendizados registrados." : ""}`
        : "Escolha um tópico e registre o que ficou mais claro.";
    } else if (id === "college") {
      shouldAct = Boolean(values.dueAt) || !["Concluído"].includes(status);
      type = values.dueAt ? "upcoming_deadline" : "continue_task";
      title = values.dueAt
        ? `${values.kind || "Prazo"}: ${values.title || "item acadêmico"}`
        : `Avançar em ${values.title || values.subject || "uma disciplina"}`;
      description = values.dueAt
        ? `Data prevista: ${dateLabel(values.dueAt)}.`
        : "Um próximo passo para manter o semestre em dia.";
    } else if (id === "week") {
      shouldAct = !["Concluído"].includes(status);
      type =
        values.kind === "Compromisso" ? "upcoming_deadline" : "continue_task";
      title = values.title || "Escolher uma prioridade";
      description =
        values.kind === "Compromisso"
          ? "Um compromisso já ocupa espaço nesta semana."
          : "Uma prioridade que merece um lugar possível.";
    } else if (["skill", "content", "code", "project"].includes(id)) {
      shouldAct = !["Concluído", "Aprendido", "Publicado"].includes(status);
      type =
        id === "skill"
          ? "practice_skill"
          : id === "content"
            ? "continue_content"
            : status === "Aguardando" || status === "Bloqueado"
              ? "resolve_blocker"
              : "continue_task";
      title = values.title || values.topic || "Escolher o próximo incremento";
      description = values.notes || "Um próximo passo disponível neste Flow.";
    } else {
      shouldAct =
        Boolean(values.nextAction) ||
        status === "Entrevista" ||
        status === "Candidatura enviada" ||
        status === "Contato";
    }
    const dueAt = values.nextActionAt || "";
    const due = dateValue(dueAt);
    const isDue = due !== null && due <= now + DAY;
    if (id === "job") shouldAct ||= isDue;
    if (!shouldAct) continue;
    const company = values.company || values.title || "oportunidade";
    if (!title)
      title =
        type === "prepare_interview"
          ? `Preparar entrevista com ${company}`
          : type === "follow_up"
            ? `Fazer follow-up com ${company}`
            : `Revisar vaga ${company}`;
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
          description ||
          (due && due < now
            ? `Prazo passado em ${dateLabel(dueAt)}.`
            : stale !== null && stale >= 3
              ? `Sem atualização há ${stale} dias.`
              : dueAt
                ? `Próximo compromisso em ${dateLabel(dueAt)}.`
                : "Escolha um próximo movimento para esta oportunidade."),
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
    const taskType =
      id === "skill"
        ? "practice_skill"
        : id === "content"
          ? "continue_content"
          : id === "enem"
            ? "study_topic"
            : "continue_task";
    actions.push(
      makeAction({
        flow,
        sourceType: "tasks",
        sourceId: item.id,
        type: taskType,
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

function declarativeRecords(flow, entityId) {
  const records = declarativeEntityItems(flow, entityId);
  if (records.length) return records.map((item) => ({ item, source: "entity" }));
  const tracker = trackerItems(flow);
  return tracker.map(({ item }) => ({ item, source: "tracker" }));
}

function declarativeActions(flow, now) {
  const actions = [];
  for (const actionDefinition of flow.protocol?.actions || []) {
    for (const entry of declarativeRecords(flow, actionDefinition.entity)) {
      const item = entry.item;
      if (!actionMatchesItem(actionDefinition, item)) continue;
      if (item.values?.actionDismissedAt) continue;
      const values = item.values || {};
      const dueAt = actionDefinition.dueField
        ? values[actionDefinition.dueField] || ""
        : "";
      const due = dateValue(dueAt);
      const actionId = `${entry.source}:${actionDefinition.entity}:${item.id}:${actionDefinition.id}`;
      const operations = (actionDefinition.operations || [
        "open",
        "complete",
        "postpone",
        "dismiss",
      ]).map((type) =>
        operation(
          actionId,
          type,
          type === "open"
            ? "Abrir item"
            : type === "complete"
              ? "Concluir"
              : type === "postpone"
                ? "Adiar"
                : "Dispensar",
        ),
      );
      actions.push({
        id: actionId,
        type: actionDefinition.id,
        title: actionTemplate(actionDefinition.title, item),
        description: actionTemplate(actionDefinition.description, item),
        priority:
          due !== null && due <= now + DAY
            ? "high"
            : actionDefinition.priority || "normal",
        dueAt,
        source: entry.source,
        sourceId: item.id,
        entityType: actionDefinition.entity,
        dueField: actionDefinition.dueField || null,
        flowId: flow.id,
        actions: operations,
      });
    }
  }
  for (const entry of taskItems(flow)) {
    if (entry.item.done || entry.item.dismissedAt) continue;
    actions.push(
      makeAction({
        flow,
        sourceType: "tasks",
        sourceId: entry.item.id,
        type: "continue_task",
        title: entry.item.text || "Continuar tarefa",
        description: entry.item.description || "Um próximo passo disponível neste Flow.",
        dueAt: entry.item.dueDate,
        priority: entry.item.priority || "normal",
      }),
    );
  }
  return actions.slice(0, 12);
}

function declarativeHistory(flow) {
  return [
    ...(flow.events || []).map((event) => ({
      id: event.id,
      type: "event",
      title: event.type.replaceAll(".", " · "),
      at: event.timestamp,
      detail: event.entityType || "",
    })),
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
    .slice(0, 12);
}

function declarativeSection(flow, definition, actions, metrics, history) {
  const itemsFor = (section) =>
    section.entity
      ? declarativeRecords(flow, section.entity).map(({ item, source }) => ({
          id: item.id,
          title: item.values?.title || item.values?.topic || item.values?.company || item.text || "Sem título",
          subtitle: [item.values?.subject, item.values?.kind, item.status].filter(Boolean).join(" · "),
          status: item.status,
          dueAt: item.values?.dueAt || item.values?.when || item.values?.publishAt || item.values?.nextActionAt || "",
          source,
          sourceId: item.id,
          entityType: section.entity,
          values: clone(item.values || {}),
          item,
        }))
      : [];
  const layout = flow.experience?.layout || [];
  return layout.map((section) => ({
    ...clone(section),
    title: section.title || section.eyebrow || "",
    items:
      section.source === "actions"
        ? actions.slice(0, section.limit || 8)
        : section.source === "metrics"
          ? Object.values(metrics).slice(0, section.limit || 8)
          : section.source === "history"
            ? history.slice(0, section.limit || 8)
            : itemsFor(section).slice(0, section.limit || 20),
    stateLabels: section.entity
      ? entityStateLabels(flow.protocol?.entities?.[section.entity])
      : [],
  }));
}

function buildDeclarativeFlowExperience(flow, now) {
  const metrics = calculateMetrics(flow, now);
  const actions = declarativeActions(flow, now);
  const history = declarativeHistory(flow);
  const layout = declarativeSection(flow, flow.experience, actions, metrics, history);
  const hero = layout.find((section) => section.type === "hero") || {};
  const resolve = (value, fallback = "") => {
    if (!value || typeof value !== "object") return value || fallback;
    if (value.property) return flow.properties?.[value.property] || value.fallback || fallback;
    return value.text || fallback;
  };
  const heroContext = {
    eyebrow: hero.eyebrow || "SEU FLOW",
    title: resolve(hero.title, flow.objective),
    subtitle: resolve(hero.subtitle, flow.description),
    facts: [],
  };
  return {
    id: flow.definitionRef?.id,
    variant: "declarative",
    declarative: true,
    layout,
    context: heroContext,
    actions,
    history,
    opportunities: layout.find((section) => section.entity)?.items || [],
    sections: { hero: heroContext, layout },
    progress: { metrics: Object.values(metrics), goals: clone(flow.goals || []), stages: clone(flow.stages || []), value: flow.progress?.value ?? null },
    week: { metrics: Object.values(metrics).slice(0, 5) },
  };
}

function itemViews(flow, type = "tracker") {
  const entries = componentDataEntries(flow, type);
  return entries.flatMap(({ data }) =>
    (Array.isArray(data.items) ? data.items : []).map((item) => {
      const values = item.values || item;
      return {
        id: item.id,
        title:
          values.title ||
          values.topic ||
          values.company ||
          item.text ||
          "Sem título",
        subtitle: [values.subject, values.kind, item.status]
          .filter(Boolean)
          .join(" · "),
        status: item.status || values.status || "",
        dueAt: values.dueAt || values.when || values.publishAt || "",
        resource: values.link || values.resource || values.url || "",
        source: type,
        sourceId: item.id,
        item,
      };
    }),
  );
}

function activeItems(items) {
  return items.filter(
    (item) =>
      !["Concluído", "Aprendido", "Publicado", "Encerrada"].includes(
        item.status,
      ),
  );
}

function domainSections(
  flow,
  metrics,
  actions,
  resources,
  notes,
  tasks,
  history,
) {
  const id = flow.definitionRef?.id;
  const tracker = itemViews(flow);
  const openTracker = activeItems(tracker);
  const openTasks = tasks
    .filter((task) => !task.done && !task.dismissedAt)
    .map((task) => ({
      id: task.id,
      title: task.text || "Próximo passo",
      subtitle: task.group || "",
      status: "Aberta",
      source: "tasks",
      sourceId: task.id,
      item: task,
    }));
  const metricList = Object.values(metrics);
  const section = (label, title, items = [], extra = {}) => ({
    label,
    title,
    items: items.slice(0, 8),
    ...extra,
  });

  if (id === "enem") {
    const practice = tracker.filter((item) =>
      ["Questões", "Simulado", "Redação"].includes(item.item.values?.kind),
    );
    const review = tracker.filter(
      (item) =>
        item.item.values?.kind === "Revisão" ||
        Boolean(item.item.values?.notes),
    );
    const plan = tracker.filter(
      (item) => !practice.includes(item) && !review.includes(item),
    );
    return {
      hero: {
        eyebrow: "PREPARAÇÃO PARA O ENEM",
        title: "O que merece estudo agora",
      },
      primary: section("HOJE", "O que merece estudo agora", actions),
      secondary: [
        section("PLANO", "Prioridades e matérias", plan),
        section("PRÁTICA", "Questões, simulados e redações", practice),
        section("REVISAR", "Erros e conteúdos que precisam retornar", review),
      ],
      progress: section(
        "EVOLUÇÃO",
        "Indicadores que mostram avanço",
        metricList,
      ),
    };
  }

  if (id === "code" || id === "project") {
    const blockers = tracker.filter((item) =>
      ["Aguardando", "Bloqueado"].includes(item.status),
    );
    const decisions = tracker.filter(
      (item) => item.item.values?.kind === "Decisão",
    );
    const roadmap = tracker.filter(
      (item) => !blockers.includes(item) && !decisions.includes(item),
    );
    const kanban = componentDataEntries(flow, "kanban").flatMap(({ data }) =>
      (data || []).flatMap((column) =>
        (column.cards || []).map((card) => ({
          id: card.id,
          title: card.title || "Cartão sem título",
          subtitle: column.title,
          status: column.title,
          source: "kanban",
          sourceId: card.id,
          item: card,
        })),
      ),
    );
    return {
      hero: { eyebrow: "PROJETO EM MOVIMENTO", title: "O próximo incremento" },
      primary: section(
        "PRÓXIMO INCREMENTO",
        "Escolha o próximo movimento",
        actions,
      ),
      secondary: [
        section("EM ANDAMENTO", "O que está sendo construído", openTracker),
        section("ROADMAP", "Marcos e decisões à frente", [
          ...roadmap,
          ...kanban,
        ]),
        section("BLOQUEIOS", "O que precisa ser destravado", blockers),
        section(
          "DECISÕES",
          "Contexto para decidir melhor",
          decisions.concat(
            notes.map((note) => ({ ...note, subtitle: "Nota de decisão" })),
          ),
        ),
        section("RELEASE", "O que prepara a próxima entrega", openTasks),
      ],
      progress: section("HISTÓRICO", "Mudanças recentes", history),
    };
  }

  if (id === "college") {
    const byKind = (kind) =>
      tracker.filter((item) => item.item.values?.kind === kind);
    const deadlines = tracker
      .filter((item) => item.dueAt)
      .sort((a, b) => dateValue(a.dueAt) - dateValue(b.dueAt));
    return {
      hero: { eyebrow: "VIDA ACADÊMICA", title: "O que pede atenção hoje" },
      primary: section("HOJE", "A prioridade mais próxima", actions),
      secondary: [
        section("PRÓXIMOS PRAZOS", "Datas que merecem contexto", deadlines),
        section("DISCIPLINAS", "Seu semestre", byKind("Disciplina")),
        section("TRABALHOS", "Entregas em andamento", byKind("Trabalho")),
        section("PROVAS", "Avaliações no horizonte", byKind("Prova")),
        section("LEITURAS", "Conteúdos para acompanhar", byKind("Leitura")),
        section("MATERIAIS", "Referências reunidas", [
          ...resources,
          ...byKind("Referência"),
        ]),
      ],
      progress: section("EVOLUÇÃO", "Ritmo do semestre", metricList),
    };
  }

  if (id === "week") {
    const priorities = tracker.filter(
      (item) => item.item.values?.kind === "Prioridade",
    );
    const nextDays = tracker.filter((item) => item.item.values?.when);
    const inbox = tracker.filter((item) => item.status === "Inbox");
    const protectedTime = flow.properties?.protectedTime
      ? [
          {
            id: "protected-time",
            title: flow.properties.protectedTime,
            subtitle: "Tempo protegido",
          },
        ]
      : [];
    return {
      hero: {
        eyebrow: "UMA SEMANA MAIS LEVE",
        title: "O que importa neste momento",
      },
      primary: section("HOJE", "Uma prioridade por vez", actions),
      secondary: [
        section(
          "3 PRIORIDADES DA SEMANA",
          "O que merece caber",
          priorities.slice(0, 3),
        ),
        section("PRÓXIMOS DIAS", "Compromissos já visíveis", nextDays),
        section("INBOX", "O que ainda precisa de um lugar", inbox),
        section("TEMPO PROTEGIDO", "Espaço para você", protectedTime),
        section("REVISÃO SEMANAL", "Feche a semana com clareza", history),
      ],
      progress: null,
    };
  }

  if (id === "skill") {
    const trail = tracker.filter(
      (item) => item.item.values?.kind !== "Recurso",
    );
    const resourceItems = [
      ...resources,
      ...tracker.filter((item) => item.item.values?.kind === "Recurso"),
    ];
    return {
      hero: { eyebrow: "APRENDER FAZENDO", title: "A próxima prática" },
      primary: section(
        "PRÓXIMA PRÁTICA",
        "O passo que mantém o aprendizado vivo",
        actions,
      ),
      secondary: [
        section("TRILHA", "Fundamentos e exercícios", trail),
        section("RECURSOS", "Materiais para consultar", resourceItems),
        section(
          "MARCOS",
          "O que já está ficando natural",
          tracker.filter((item) => item.item.values?.kind === "Milestone"),
        ),
        section("REGISTRO DE PRÁTICA", "Sessões e aprendizados", history),
      ],
      progress: section("EVOLUÇÃO", "Ritmo da prática", metricList),
    };
  }

  if (id === "content") {
    const inProduction = tracker.filter((item) =>
      ["Pesquisa", "Roteiro", "Produção", "Edição"].includes(item.status),
    );
    const published = tracker.filter((item) => item.status === "Publicado");
    return {
      hero: { eyebrow: "DA IDEIA À PUBLICAÇÃO", title: "O próximo conteúdo" },
      primary: section(
        "IDEIAS",
        "O que pode virar conteúdo",
        tracker.filter((item) => item.status === "Ideia").concat(actions),
      ),
      secondary: [
        section("EM PRODUÇÃO", "Conteúdos em movimento", inProduction),
        section(
          "PRÓXIMA PUBLICAÇÃO",
          "O que chega ao público em seguida",
          tracker.filter((item) => item.dueAt),
        ),
        section("PIPELINE", "Todas as etapas visíveis", tracker),
        section("REFERÊNCIAS", "Pesquisa que sustenta o trabalho", resources),
        section("PUBLICADOS", "O que já encontrou seu público", published),
      ],
      progress: section("EVOLUÇÃO", "Ritmo editorial", metricList),
    };
  }

  return {
    hero: { eyebrow: "SEU FLOW", title: "O que importa neste momento" },
    primary: section("AGORA", "Escolha o próximo passo", actions),
    secondary: [
      section("PLANO", "O que vem depois", openTasks),
      section("CONTEXTO", "Materiais e anotações", [...resources, ...notes]),
    ],
    progress: section("PROGRESSO", "O que mudou", metricList),
  };
}

export function buildFlowExperience(flow, now = Date.now()) {
  if (!flow) return null;
  if (flow.protocol?.entities && flow.experience?.layout)
    return buildDeclarativeFlowExperience(flow, now);
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
  const sections = domainSections(
    flow,
    metrics,
    actions,
    resources,
    notes,
    tasks,
    history,
  );
  return {
    id,
    variant: id || "generic",
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
    sections,
  };
}

export function findExperienceSource(flow, sourceType, sourceId) {
  if (sourceType === "entity") {
    for (const [entityType, items] of Object.entries(
      flow?.componentData?.collections || {},
    )) {
      const item = items?.find((candidate) => candidate.id === sourceId);
      if (item) return { type: sourceType, entityType, item };
    }
  }
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
