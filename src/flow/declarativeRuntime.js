import {
  COMMAND_TYPES,
  FIELD_TYPES,
  RULE_OPERATORS,
} from "./declarative.js";

const DAY = 86400000;
const clone = (value) => JSON.parse(JSON.stringify(value));
const uid = () => crypto.randomUUID();

function entityDefinition(flow, entity) {
  return flow?.protocol?.entities?.[entity] || null;
}

function entityItems(flow, entity, create = false) {
  flow.componentData ||= {};
  flow.componentData.collections ||= {};
  if (create) flow.componentData.collections[entity] ||= [];
  return flow.componentData.collections[entity] || [];
}

export function declarativeEntityItems(flow, entity) {
  return entityItems(flow, entity).map((item) => ({
    ...item,
    values: { ...(item.values || {}) },
  }));
}

function fieldDefinition(entity, key) {
  return entity?.fields?.find((field) => field.key === key || field.id === key);
}

function normalizeValue(field, value) {
  if (value === undefined || value === null || value === "") {
    return field?.default !== undefined ? clone(field.default) : value;
  }
  switch (field?.type) {
    case "number": {
      const number = Number(value);
      return Number.isFinite(number) ? number : null;
    }
    case "boolean":
      return Boolean(value);
    case "multi-select":
      return Array.isArray(value) ? value.slice(0, 50) : [String(value)];
    case "date":
    case "datetime":
    case "url":
    case "text":
    case "textarea":
    case "select":
    default:
      return String(value);
  }
}

function normalizedValues(entity, values = {}, partial = false) {
  const result = {};
  for (const field of entity?.fields || []) {
    if (!partial && field.default !== undefined)
      result[field.key] = clone(field.default);
    if (values[field.key] !== undefined)
      result[field.key] = normalizeValue(field, values[field.key]);
    if (field.required && !partial && !String(result[field.key] ?? "").trim())
      throw new Error(`Preencha ${field.label}.`);
    if (
      ["select", "multi-select"].includes(field.type) &&
      result[field.key] !== undefined
    ) {
      const selected = Array.isArray(result[field.key])
        ? result[field.key]
        : [result[field.key]];
      if (field.options?.length && selected.some((item) => !field.options.includes(item)))
        throw new Error(`Há uma opção inválida em ${field.label}.`);
    }
  }
  return result;
}

function findItem(flow, entity, id) {
  return entityItems(flow, entity).find((item) => item.id === id) || null;
}

function readValue(item, field) {
  if (field === "status") return item?.status;
  if (field === "completed") return Boolean(item?.completed || item?.values?.completed);
  return item?.values?.[field];
}

function toTime(value) {
  const normalized = /^\d{4}-\d{2}-\d{2}$/.test(String(value || ""))
    ? `${value}T12:00:00`
    : value;
  const time = normalized ? new Date(normalized).getTime() : NaN;
  return Number.isFinite(time) ? time : null;
}

function compare(operator, actual, expected, now = Date.now()) {
  if (operator === "exists") return actual !== undefined && actual !== null && actual !== "";
  if (operator === "contains")
    return Array.isArray(actual)
      ? actual.includes(expected)
      : String(actual || "").toLowerCase().includes(String(expected || "").toLowerCase());
  if (operator === "greater_than") return Number(actual) > Number(expected);
  if (operator === "less_than") return Number(actual) < Number(expected);
  if (operator === "days_before" || operator === "days_after") {
    const time = toTime(actual);
    const target = toTime(expected) ?? Number(expected);
    if (time === null) return false;
    const difference = (target - time) / DAY;
    return operator === "days_before" ? difference >= 0 : difference <= 0;
  }
  if (operator === "not_equals") return actual !== expected;
  return Array.isArray(expected) ? expected.includes(actual) : actual === expected;
}

export function matchesDeclarativeCondition(condition, context = {}, now = Date.now()) {
  if (!condition) return true;
  if (condition.all) return condition.all.every((item) => matchesDeclarativeCondition(item, context, now));
  if (condition.any) return condition.any.some((item) => matchesDeclarativeCondition(item, context, now));
  if (condition.event && condition.event !== context.event?.type) return false;
  if (condition.entity && condition.entity !== context.entity) return false;
  if (condition.field) {
    const actual = readValue(context.item, condition.field);
    const operator = condition.operator || "equals";
    return compare(operator, actual, condition.value ?? condition.values, now);
  }
  if (condition.statuses) return condition.statuses.includes(context.item?.status);
  return true;
}

function appendEvent(flow, type, context = {}, now = Date.now()) {
  flow.events ||= [];
  const event = {
    id: uid(),
    flowId: flow.id,
    type,
    ...((context.entity || context.entityType)
      ? { entityType: context.entity || context.entityType }
      : {}),
    ...(context.entityId ? { entityId: context.entityId } : {}),
    timestamp: now,
    metadata: clone(context.metadata || {}),
  };
  flow.events.push(event);
  return event;
}

function applyRuleEffects(flow, event, now) {
  for (const rule of flow.protocol?.rules || []) {
    const context = {
      event,
      entity: event.entityType,
      item: event.entityType ? findItem(flow, event.entityType, event.entityId) : null,
    };
    if (!matchesDeclarativeCondition(rule.when, context, now)) continue;
    for (const effect of rule.then || []) {
      if (effect.type !== "schedule_action") continue;
      const item = context.item;
      if (!item) continue;
      item.values ||= {};
      if (effect.field) {
        const base = toTime(item.values[effect.field]) || now;
        item.values[effect.field] = new Date(base + Number(effect.days || 0) * DAY)
          .toISOString()
          .slice(0, 10);
      }
      Object.assign(item.values, clone(effect.set || {}));
      item.updatedAt = now;
    }
  }
}

function taskData(flow) {
  const component = (flow.components || []).find(
    (candidate) => candidate.type === "tasks" && candidate.enabled !== false,
  );
  flow.componentData ||= {};
  const key = component?.id || "tasks";
  flow.componentData[key] ||= { items: [] };
  flow.componentData[key].items ||= [];
  return flow.componentData[key];
}

function commandEvent(type, entity, item, metadata = {}) {
  return {
    type,
    entity,
    entityId: item?.id,
    metadata,
  };
}

export function executeDeclarativeCommand(flow, command, now = Date.now()) {
  if (!flow || !command || !COMMAND_TYPES.includes(command.type))
    throw new Error("Comando declarativo não permitido.");
  if (!flow.protocol) throw new Error("Este Flow não possui um protocolo declarativo.");
  let event;
  let result = null;
  const entity = entityDefinition(flow, command.entity);
  switch (command.type) {
    case "create_entity": {
      if (!entity) throw new Error("Coleção desconhecida.");
      const values = normalizedValues(entity, command.values);
      const items = entityItems(flow, command.entity, true);
      result = {
        id: command.id || uid(),
        status: command.status || entity.states?.[0]?.label || "Aberto",
        values,
        createdAt: now,
        updatedAt: now,
      };
      items.push(result);
      event = commandEvent("entity.created", command.entity, result);
      break;
    }
    case "update_entity": {
      if (!entity) throw new Error("Coleção desconhecida.");
      result = findItem(flow, command.entity, command.entityId);
      if (!result) throw new Error("Item não encontrado.");
      Object.assign(result.values, normalizedValues(entity, command.values, true));
      result.updatedAt = now;
      event = commandEvent("entity.updated", command.entity, result);
      break;
    }
    case "transition_entity": {
      if (!entity) throw new Error("Coleção desconhecida.");
      result = findItem(flow, command.entity, command.entityId);
      if (!result) throw new Error("Item não encontrado.");
      const state = entity.states?.find(
        (candidate) => candidate.id === command.to || candidate.label === command.to,
      );
      if (!state) throw new Error("Etapa não permitida.");
      const from = result.status;
      result.status = state.label;
      result.updatedAt = now;
      event = commandEvent("entity.transitioned", command.entity, result, { from, to: state.label });
      break;
    }
    case "complete_entity": {
      if (!entity) throw new Error("Coleção desconhecida.");
      result = findItem(flow, command.entity, command.entityId);
      if (!result) throw new Error("Item não encontrado.");
      result.completed = true;
      const completed = entity.states?.find((state) => /conclu|aprend|public|closed/i.test(state.label));
      if (completed) result.status = completed.label;
      result.updatedAt = now;
      event = commandEvent("entity.completed", command.entity, result);
      break;
    }
    case "create_task": {
      result = { id: command.id || uid(), text: String(command.text || "Próximo passo"), done: false, group: command.group || "Próximos passos", createdAt: now };
      taskData(flow).items.push(result);
      event = commandEvent("task.created", null, result);
      break;
    }
    case "complete_task": {
      result = taskData(flow).items.find((item) => item.id === command.taskId);
      if (!result) throw new Error("Tarefa não encontrada.");
      result.done = true;
      result.completedAt = now;
      event = commandEvent("task.completed", null, result);
      break;
    }
    case "schedule_action": {
      result = findItem(flow, command.entity, command.entityId);
      if (!result) throw new Error("Item não encontrado.");
      result.values ||= {};
      const base = toTime(result.values[command.field]) || now;
      result.values[command.field] = new Date(base + Number(command.days || 2) * DAY).toISOString().slice(0, 10);
      Object.assign(result.values, clone(command.set || {}));
      result.updatedAt = now;
      event = commandEvent("action.scheduled", command.entity, result, { field: command.field });
      break;
    }
    case "record_checkin":
      flow.checkins ||= [];
      result = { id: uid(), createdAt: now, ...clone(command.values || {}) };
      flow.checkins.push(result);
      event = commandEvent("checkin.recorded", null, result);
      break;
    case "add_note": {
      flow.componentData.notes ||= { items: [] };
      flow.componentData.notes.items ||= [];
      result = { id: uid(), title: command.title || "Nova nota", content: command.content || "", createdAt: now, updatedAt: now };
      flow.componentData.notes.items.push(result);
      event = commandEvent("note.added", null, result);
      break;
    }
    case "add_resource": {
      flow.componentData.links ||= { items: [] };
      flow.componentData.links.items ||= [];
      result = { id: uid(), title: command.title || command.url, url: command.url, addedAt: now };
      flow.componentData.links.items.push(result);
      event = commandEvent("resource.added", null, result);
      break;
    }
    default:
      throw new Error("Comando não implementado.");
  }
  if (event) {
    const stored = appendEvent(flow, event.type, event, now);
    applyRuleEffects(flow, stored, now);
  }
  return { result, event };
}

export function actionMatchesItem(action, item) {
  if (action.statuses?.length && !action.statuses.includes(item.status)) return false;
  for (const [field, values] of Object.entries(action.values || {})) {
    const actual = readValue(item, field);
    if (!Array.isArray(values) ? actual !== values : !values.includes(actual)) return false;
  }
  return true;
}

export function actionTemplate(template, item) {
  const values = item.values || {};
  return String(template || "Próximo passo").replace(/\{([a-zA-Z0-9_]+)\}/g, (_, key) => values[key] ?? item[key] ?? "");
}

export function entityFieldType(entity, key) {
  return fieldDefinition(entity, key)?.type || FIELD_TYPES[0];
}

export function entityStateLabels(entity) {
  return (entity?.states || []).map((state) => state.label || state.id);
}
