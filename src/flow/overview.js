import { buildFlowExperience } from "./experience.js";
import { componentDataEntries } from "./model.js";
import { isFlowArchived } from "./entitlements.js";
import { projectCalendarEntries } from "./projectFlow.js";

export function dateTime(value) {
  if (value === null || value === undefined || value === "") return null;
  const parsed =
    typeof value === "number"
      ? value
      : new Date(
          /^\d{4}-\d{2}-\d{2}$/.test(value) ? `${value}T12:00:00` : value,
        ).getTime();
  return Number.isFinite(parsed) ? parsed : null;
}
export function dayKey(value = Date.now()) {
  const time = dateTime(value);
  if (time === null) return "";
  const date = new Date(time);
  return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, "0")}-${String(date.getDate()).padStart(2, "0")}`;
}
export function dayOffset(days, value = Date.now()) {
  const date = new Date(value);
  date.setDate(date.getDate() + days);
  return dayKey(date.getTime());
}
export function displayDate(value, withTime = false) {
  const time = dateTime(value);
  if (time === null) return "Sem data";
  return new Intl.DateTimeFormat("pt-BR", {
    day: "numeric",
    month: "short",
    ...(withTime ? { hour: "2-digit", minute: "2-digit" } : {}),
  }).format(time);
}

export function overviewActions(flows = [], now = Date.now()) {
  const seen = new Set();
  const priority = { urgent: 0, high: 1, normal: 2, medium: 2, low: 3 };
  return flows
    .filter((flow) => !isFlowArchived(flow))
    .flatMap((flow) =>
      (buildFlowExperience(flow, now).actions || []).map((action) => ({
        ...action,
        flowName: flow.identity.name,
        color: flow.identity.color,
      })),
    )
    .filter((action) => {
      const key = `${action.flowId}:${action.id}`;
      if (seen.has(key)) return false;
      seen.add(key);
      return true;
    })
    .sort((a, b) => {
      const aDue = dateTime(a.dueAt),
        bDue = dateTime(b.dueAt);
      const aOverdue = aDue !== null && dayKey(aDue) < dayKey(now);
      const bOverdue = bDue !== null && dayKey(bDue) < dayKey(now);
      return (
        Number(bOverdue) - Number(aOverdue) ||
        (priority[a.priority] ?? 2) - (priority[b.priority] ?? 2) ||
        (aDue ?? Infinity) - (bDue ?? Infinity) ||
        a.id.localeCompare(b.id)
      );
    });
}
export function todayGroups(flows = [], now = Date.now()) {
  const actions = overviewActions(flows, now),
    today = dayKey(now);
  const immediate = actions.filter(
    (action) => !action.dueAt || dayKey(action.dueAt) <= today,
  );
  return [
    {
      id: "now",
      title: "Agora",
      description: "Um próximo movimento de cada vez.",
      actions: immediate.slice(0, 3),
    },
    {
      id: "today",
      title: "Ainda hoje",
      description: "Depois de cuidar do que importa primeiro.",
      actions: immediate.slice(3, 8),
    },
    {
      id: "soon",
      title: "Próximos dias",
      description: "Um pouco de antecedência faz diferença.",
      actions: actions
        .filter(
          (action) =>
            dayKey(action.dueAt) > today &&
            dayKey(action.dueAt) <= dayOffset(7, now),
        )
        .slice(0, 5),
    },
  ];
}

const eventLabels = {
  "entity.created": "Novo item adicionado",
  "entity.updated": "Contexto atualizado",
  "entity.transitioned": "Uma etapa avançou",
  "entity.completed": "Item concluído",
  "task.created": "Próximo passo criado",
  "task.completed": "Próximo passo concluído",
  "action.completed": "Ação concluída",
  "action.scheduled": "Próximo passo agendado",
  "action.dismissed": "Ação dispensada",
  "checkin.recorded": "Prática registrada",
  "review.completed": "Flow revisado",
  "note.added": "Anotação registrada",
  "resource.added": "Material guardado",
  "session.completed": "Momento de foco concluído",
  application_submitted: "Candidatura enviada",
  interview_scheduled: "Entrevista marcada",
  milestone_completed: "Marco alcançado",
  study_session_completed: "Estudo concluído",
  review_completed: "Flow revisado",
  entity_transitioned: "Uma etapa avançou",
};
export function eventHistory(flows = []) {
  return flows
    .flatMap((flow) => {
      const events = (flow.events || []).map((event) => ({
        ...event,
        title:
          event.title ||
          event.metadata?.title ||
          eventLabels[event.type] ||
          "Seu Flow avançou",
        detail: event.metadata?.to || "",
      }));
      for (const session of flow.sessions || [])
        if (
          !events.some(
            (event) =>
              event.type === "session.completed" &&
              (event.entityId === session.id || event.sourceId === session.id),
          )
        )
          events.push({
            id: `session:${session.id}`,
            type: "session.completed",
            timestamp: session.endedAt,
            title: "Momento de foco concluído",
            detail: `${Math.floor(session.seconds / 60)} min de atenção`,
          });
      for (const review of flow.review?.history || [])
        if (
          !events.some(
            (event) =>
              event.type === "review.completed" &&
              (event.entityId === review.id ||
                event.timestamp === review.completedAt),
          )
        )
          events.push({
            id: `review:${review.id}`,
            type: "review.completed",
            timestamp: review.completedAt || review.createdAt,
            title: "Flow revisado",
          });
      return events
        .filter((event) => dateTime(event.timestamp) !== null)
        .map((event) => ({
          ...event,
          id: `${flow.id}:${event.id}`,
          flowId: flow.id,
          flowName: flow.identity.name,
          color: flow.identity.color,
        }));
    })
    .sort(
      (a, b) =>
        dateTime(b.timestamp) - dateTime(a.timestamp) ||
        a.id.localeCompare(b.id),
    );
}

export function calendarEntries(flows = [], now = Date.now()) {
  const entries = new Map();
  function add(flow, entry) {
    if (dateTime(entry.date) === null) return;
    const key = `${flow.id}:${entry.sourceId}:${dayKey(entry.date)}`;
    if (!entries.has(key))
      entries.set(key, {
        ...entry,
        id: key,
        flowId: flow.id,
        flowName: flow.identity.name,
        color: flow.identity.color,
      });
  }
  for (const flow of flows.filter((flow) => !isFlowArchived(flow))) {
    if (flow.definitionRef?.id === "code")
      for (const entry of projectCalendarEntries(flow)) add(flow, entry);
    for (const action of buildFlowExperience(flow, now).actions || [])
      add(flow, {
        title: action.title,
        date: action.dueAt,
        sourceId: action.sourceId,
        action,
        kind: "Próximo passo",
      });
    for (const [entityId, definition] of Object.entries(
      flow.protocol?.entities || {},
    )) {
      const records = flow.componentData?.collections?.[entityId] || [];
      for (const item of records.filter((item) => !item.completed))
        for (const field of definition.fields || [])
          if (["date", "datetime"].includes(field.type))
            add(flow, {
              title:
                item.values?.[definition.primaryField] ||
                definition.singular ||
                definition.label,
              date: item.values?.[field.key || field.id],
              sourceId: item.id,
              kind: field.label,
              source: "entity",
              entityType: entityId,
            });
    }
    for (const { data } of flow.definitionRef?.id === "code"
      ? []
      : componentDataEntries(flow, "tasks"))
      for (const item of data.items || [])
        if (!item.done)
          add(flow, {
            title: item.text,
            date: item.dueDate || item.dueAt,
            sourceId: item.id,
            kind: "Prazo",
            source: "tasks",
          });
    for (const { data } of flow.definitionRef?.id === "code"
      ? []
      : componentDataEntries(flow, "tracker"))
      for (const item of data.items || [])
        for (const field of [
          "dueAt",
          "dueDate",
          "deadline",
          "nextActionAt",
          "scheduledAt",
          "reviewAt",
          "eventDate",
        ])
          add(flow, {
            title:
              item.values?.title ||
              item.values?.company ||
              item.values?.topic ||
              "Compromisso",
            date: item.values?.[field],
            sourceId: item.id,
            kind: "Compromisso",
            source: "tracker",
          });
    if (flow.review?.enabled !== false)
      add(flow, {
        title: `Revisar ${flow.identity.name}`,
        date: flow.review?.nextAt,
        sourceId: `review:${flow.id}`,
        kind: "Revisão",
      });
  }
  return [...entries.values()].sort(
    (a, b) => dateTime(a.date) - dateTime(b.date) || a.id.localeCompare(b.id),
  );
}
