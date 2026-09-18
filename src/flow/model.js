export const ACCOUNT_SCHEMA_VERSION = 3;
export const FLOW_SCHEMA_VERSION = 2;

import { applyDefinitionSetup } from "./setup.js";
import { refreshFlowDerivedState } from "./runtime.js";

const clone = (value) => JSON.parse(JSON.stringify(value));
const id = () => crypto.randomUUID();
const boundedMinutes = (value) =>
  Math.max(1, Math.min(180, Number(value) || 25));

export function activeComponents(flow) {
  return (flow?.components || [])
    .filter((component) => component?.enabled !== false)
    .sort((a, b) => a.order - b.order);
}

export function componentIds(flow) {
  return activeComponents(flow).map((component) => component.type);
}

export function componentData(flow, type, fallback = {}) {
  if (!flow) return clone(fallback);
  flow.componentData ||= {};
  if (flow.componentData[type] === undefined)
    flow.componentData[type] = clone(fallback);
  return flow.componentData[type];
}

export function createFlowInstance(
  definition,
  customName = "",
  onboardingAnswers = {},
) {
  const now = Date.now();
  const name = (customName || definition.name || "Novo Flow")
    .trim()
    .slice(0, 100);
  const selectedComponents = Array.from(
    new Map(
      (definition.components || []).map((component, order) => {
        const normalized =
          typeof component === "string"
            ? { id: component, type: component, order }
            : { ...component, order };
        return [normalized.id || normalized.type, normalized];
      }),
    ).values(),
  );
  const tasks = (definition.tasks || []).map((text) => ({
    id: id(),
    text,
    done: false,
  }));
  const focusMinutes = boundedMinutes(definition.focus);
  const flow = {
    schemaVersion: FLOW_SCHEMA_VERSION,
    kind: "flow_instance",
    id: id(),
    definitionRef: {
      source: definition.owner
        ? "community"
        : definition.kind === "flow_definition"
          ? "official"
          : "custom",
      id: definition.id || null,
      version: definition.version || 1,
    },
    identity: {
      name,
      category: definition.category || "Personalizado",
      color: definition.color || "mint",
      icon: definition.icon || "✳",
    },
    objective: definition.objective || definition.description || name,
    description:
      definition.description || "Um espaço preparado para este objetivo.",
    onboarding: {
      status: "completed",
      currentStep: 0,
      answers: clone(onboardingAnswers || {}),
      completedAt: now,
      definition: clone(definition.onboarding || { intro: "", steps: [] }),
    },
    properties: { focusMinutes, ...clone(definition.properties || {}) },
    goals: clone(definition.goals || []),
    stages: clone(definition.stages || []),
    components: selectedComponents.map((component, order) => ({
      id: component.id || component.type,
      type: component.type,
      order,
      enabled: component.enabled !== false,
      config: {
        ...clone(definition.componentConfig?.[component.type] || {}),
        ...clone(component.config || {}),
      },
    })),
    componentData: {
      focus: { minutes: focusMinutes, state: null },
      tasks: { items: tasks },
      notes: { text: "" },
      links: { items: [] },
      ...clone(definition.initialData || {}),
    },
    metricDefinitions: clone(definition.metrics || []),
    metrics: {},
    progress: {
      strategy: clone(definition.progress || { mode: "indicators" }),
      value: null,
      updatedAt: now,
    },
    sessions: [],
    context: clone(definition.instructions || { summary: "", prompts: [] }),
    review: {
      cadenceDays: definition.review?.cadenceDays || 7,
      prompts: clone(definition.review?.prompts || []),
      lastAt: null,
      nextAt: now + (definition.review?.cadenceDays || 7) * 86400000,
      history: [],
    },
    privacy: { visibility: "private", sharedDefinitionId: null },
    createdAt: now,
    updatedAt: now,
  };
  return applyDefinitionSetup(flow, definition, onboardingAnswers);
}

function migrateLegacyFlow(flow) {
  if (
    flow?.schemaVersion === FLOW_SCHEMA_VERSION &&
    flow.kind === "flow_instance"
  ) {
    const migrated = clone(flow);
    migrated.components = (migrated.components || []).map((component, order) =>
      typeof component === "string"
        ? { id: component, type: component, order, enabled: true, config: {} }
        : { enabled: true, config: {}, ...component, order },
    );
    migrated.componentData ||= {};
    migrated.definitionRef ||= { source: "custom", id: null, version: 1 };
    migrated.identity ||= {
      name: "Flow recuperado",
      category: "Personalizado",
      color: "mint",
      icon: "✳",
    };
    migrated.onboarding ||= {
      status: "completed",
      currentStep: 0,
      answers: {},
      completedAt: migrated.createdAt || Date.now(),
      definition: { intro: "", steps: [] },
    };
    migrated.onboarding.answers ||= {};
    migrated.properties ||= { focusMinutes: 25 };
    migrated.goals ||= [];
    migrated.stages = (migrated.stages || []).map((stage, order) =>
      typeof stage === "string"
        ? {
            id: `stage-${order + 1}`,
            title: stage,
            order,
            status: order === 0 ? "current" : "upcoming",
          }
        : { order, status: "upcoming", ...stage },
    );
    migrated.metricDefinitions ||= [];
    migrated.metrics ||= {};
    migrated.progress ||= {
      strategy: { mode: "indicators" },
      value: null,
      updatedAt: Date.now(),
    };
    migrated.progress.strategy ||= { mode: "indicators" };
    migrated.sessions ||= [];
    migrated.context ||= { summary: migrated.description || "", prompts: [] };
    migrated.review ||= { cadenceDays: 7, prompts: [] };
    migrated.review.history ||= [];
    migrated.review.nextAt ||=
      Date.now() + (migrated.review.cadenceDays || 7) * 86400000;
    migrated.privacy ||= { visibility: "private", sharedDefinitionId: null };
    return refreshFlowDerivedState(migrated);
  }
  const data = clone(flow?.data || {});
  const definition = {
    id: null,
    name: flow?.name || "Flow recuperado",
    category: flow?.category || "Personalizado",
    color: flow?.color || "mint",
    icon: flow?.icon || "✳",
    description: "Flow migrado com segurança para a estrutura do Noma.",
    objective: flow?.name || "Retomar este objetivo",
    components: Array.isArray(flow?.components)
      ? flow.components
      : ["tasks", "notes"],
    focus: data.focusMinutes,
    tasks: [],
  };
  const migrated = createFlowInstance(definition, definition.name);
  migrated.id = flow?.id || migrated.id;
  migrated.createdAt = flow?.createdAt || migrated.createdAt;
  migrated.updatedAt = flow?.updatedAt || migrated.updatedAt;
  migrated.sessions = clone(flow?.sessions || []);
  migrated.componentData.focus = {
    minutes: boundedMinutes(data.focusMinutes),
    state: clone(data.focusState || null),
  };
  migrated.componentData.tasks = { items: clone(data.tasks || []) };
  migrated.componentData.notes = { text: data.notesText || "" };
  migrated.componentData.links = { items: clone(data.links || []) };
  const aliases = {
    "kanban-board": "kanban",
    codePlayground: "playground",
    deployChecklist: "deploy",
    waterReminder: "water",
    timer: "timer",
    snippets: "snippets",
  };
  for (const [oldKey, type] of Object.entries(aliases))
    if (data[oldKey] !== undefined)
      migrated.componentData[type] = clone(data[oldKey]);
  if (data.currencyAmount !== undefined)
    migrated.componentData.converter = {
      amount: data.currencyAmount,
      from: data.currencyFrom || "USD",
      to: data.currencyTo || "BRL",
      result: null,
    };
  return migrated;
}

export function migrateAccount(input) {
  const account = input && typeof input === "object" ? clone(input) : {};
  return {
    version: ACCOUNT_SCHEMA_VERSION,
    name: typeof account.name === "string" ? account.name : "",
    onboarded: Boolean(account.onboarded || account.flows?.length),
    flows: Array.isArray(account.flows)
      ? account.flows.map(migrateLegacyFlow)
      : [],
    activeSession: account.activeSession || null,
    preferences: account.preferences || { reduceMotion: false },
  };
}

export function emptyAccount() {
  return migrateAccount(null);
}

export function toPublicDefinition(flow) {
  const ids = componentIds(flow);
  return {
    schemaVersion: FLOW_SCHEMA_VERSION,
    kind: "flow_definition",
    version: flow.definitionRef?.version || 1,
    name: flow.identity.name,
    category: flow.identity.category,
    color: flow.identity.color,
    icon: flow.identity.icon,
    objective: flow.objective,
    description: flow.description,
    onboarding: clone(flow.onboarding?.definition || { intro: "", steps: [] }),
    properties: { focusMinutes: flow.properties?.focusMinutes || 25 },
    goals: clone(flow.goals || []).map(
      ({ id, title, description, metricId, targetProperty, unit }) => ({
        id,
        title,
        description,
        metricId,
        targetProperty,
        unit,
      }),
    ),
    stages: clone(flow.stages || []).map(
      ({ id, title, description, order }) => ({
        id,
        title,
        description,
        order,
      }),
    ),
    components: ids,
    componentConfig: Object.fromEntries(
      (flow.components || []).map((component) => [
        component.type,
        clone(component.config || {}),
      ]),
    ),
    initialData: {},
    metrics: clone(flow.metricDefinitions || []),
    progress: clone(flow.progress?.strategy || { mode: "indicators" }),
    instructions: clone(flow.context || { summary: "", prompts: [] }),
    review: {
      cadenceDays: flow.review?.cadenceDays || 7,
      prompts: clone(flow.review?.prompts || []),
    },
    focus: flow.properties?.focusMinutes || 25,
    tasks: [],
    tag: "DA COMUNIDADE",
  };
}
