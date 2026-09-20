import { validateDefinitionData } from "./declarativeValidation.js";
export { DEFINITION_LIMITS } from "./declarativeValidation.js";
export const DECLARATIVE_SCHEMA_VERSION = 1;

export const FIELD_TYPES = Object.freeze([
  "text",
  "textarea",
  "number",
  "date",
  "datetime",
  "boolean",
  "url",
  "select",
  "multi-select",
]);

export const RULE_OPERATORS = Object.freeze([
  "equals",
  "not_equals",
  "greater_than",
  "less_than",
  "contains",
  "exists",
  "days_before",
  "days_after",
]);

export const COMMAND_TYPES = Object.freeze([
  "create_entity",
  "update_entity",
  "transition_entity",
  "complete_entity",
  "create_task",
  "complete_task",
  "schedule_action",
  "record_checkin",
  "add_note",
  "add_resource",
  "complete_action",
  "postpone_action",
  "dismiss_action",
  "transition_stage",
  "emit_event",
]);

export const SECTION_TYPES = Object.freeze([
  "hero",
  "next-actions",
  "collection",
  "pipeline",
  "timeline",
  "checklist",
  "progress",
  "metrics",
  "resources",
  "notes",
  "agenda",
  "stages",
  "text",
  "checkins",
]);

const clone = (value) => JSON.parse(JSON.stringify(value));

function normalizeField(field = {}) {
  const type = field.type === "multi" ? "multi-select" : field.type;
  return {
    id: field.id || field.key || "field",
    key: field.key || field.id || "field",
    label: field.label || field.key || "Campo",
    type: FIELD_TYPES.includes(type) ? type : "text",
    ...(field.required ? { required: true } : {}),
    ...(field.default !== undefined ? { default: clone(field.default) } : {}),
    ...(field.options ? { options: clone(field.options) } : {}),
    ...(field.optionsFromProperty
      ? { optionsFromProperty: field.optionsFromProperty }
      : {}),
    ...(field.placeholder ? { placeholder: field.placeholder } : {}),
  };
}

function normalizedStates(states = []) {
  return states.map((state, order) =>
    typeof state === "string"
      ? { id: state, label: state, order }
      : {
          id: state.id || state.label || `state-${order + 1}`,
          label: state.label || state.id || `Estado ${order + 1}`,
          order,
          ...(state.terminal ? { terminal: true } : {}),
        },
  );
}

export function protocolFromDefinition(definition = {}) {
  if (definition.protocol) return clone(definition.protocol);
  const tracker = definition.componentConfig?.tracker;
  const entityId = definition.entity?.id || "item";
  const fields = (tracker?.fields || []).map(normalizeField);
  const states = normalizedStates(tracker?.stages || definition.stages || []);
  return {
    schemaVersion: DECLARATIVE_SCHEMA_VERSION,
    version: 1,
    entities: {
      [entityId]: {
        id: entityId,
        label: definition.entity?.label || tracker?.title || "Itens",
        singular: definition.entity?.singular || tracker?.singular || "item",
        primaryField: tracker?.primaryField || fields[0]?.key || "title",
        ...(tracker ? { storage: { component: "tracker" } } : {}),
        fields,
        states,
      },
    },
    commands: [...COMMAND_TYPES],
    events: [
      "entity.created",
      "entity.updated",
      "entity.transitioned",
      "entity.completed",
      "task.completed",
      "checkin.recorded",
      "review.completed",
    ],
    rules: [],
    actions: [],
  };
}

export function experienceFromDefinition(definition = {}) {
  if (definition.experience) return clone(definition.experience);
  const protocol = protocolFromDefinition(definition);
  const entity = Object.keys(protocol.entities)[0];
  return {
    schemaVersion: DECLARATIVE_SCHEMA_VERSION,
    version: 1,
    layout: [
      {
        type: "hero",
        eyebrow: "SEU FLOW",
        title: definition.objective || definition.name || "O que importa agora",
        subtitle: definition.description || "Um próximo passo possível.",
      },
      { type: "next-actions", title: "Agora", source: "actions", limit: 5 },
      {
        type: "collection",
        title: definition.componentConfig?.tracker?.title || "Itens",
        entity,
        create: true,
      },
      { type: "progress", title: "Progresso", source: "metrics" },
    ],
  };
}

export function validateDeclarativeDefinition(definition, options = {}) {
  return validateDefinitionData(
    definition,
    {
      fields: FIELD_TYPES,
      operators: RULE_OPERATORS,
      commands: COMMAND_TYPES,
      sections: SECTION_TYPES,
    },
    options,
  );
}

const common = {
  schemaVersion: DECLARATIVE_SCHEMA_VERSION,
  version: 1,
  commands: [...COMMAND_TYPES],
  events: [
    "entity.created",
    "entity.updated",
    "entity.transitioned",
    "entity.completed",
    "task.completed",
    "checkin.recorded",
    "review.completed",
  ],
};

const operations = ["open", "complete", "postpone", "dismiss"];

export const officialDeclarativeTemplates = Object.freeze({
  job: {
    protocol: {
      ...common,
      entities: {
        opportunity: {
          id: "opportunity",
          label: "Oportunidades",
          singular: "oportunidade",
          primaryField: "company",
          fields: [
            { id: "company", label: "Empresa", type: "text", required: true },
            { id: "role", label: "Cargo", type: "text", required: true },
            { id: "url", label: "Link da vaga", type: "url" },
            { id: "nextAction", label: "Próxima ação", type: "text" },
            { id: "nextActionAt", label: "Data da próxima ação", type: "date" },
          ],
          states: [
            "Encontrada",
            "Salva",
            "Candidatura enviada",
            "Contato",
            "Entrevista",
            "Etapa técnica",
            "Oferta",
            "Encerrada",
          ].map((label, order) => ({ id: label, label, order })),
        },
      },
      rules: [
        {
          id: "schedule-follow-up",
          when: {
            entity: "opportunity",
            field: "status",
            operator: "equals",
            value: "Candidatura enviada",
          },
          then: [
            {
              type: "schedule_action",
              actionId: "follow_up",
              field: "nextActionAt",
              days: 5,
              set: { nextAction: "Fazer follow-up" },
            },
          ],
        },
      ],
      actions: [
        {
          id: "follow_up",
          entity: "opportunity",
          statuses: ["Candidatura enviada", "Contato"],
          title: "Fazer follow-up com {company}",
          description: "Escolha um retorno respeitoso para esta oportunidade.",
          dueField: "nextActionAt",
          priority: "normal",
          operations,
        },
        {
          id: "prepare_interview",
          entity: "opportunity",
          statuses: ["Entrevista", "Etapa técnica"],
          title: "Preparar entrevista com {company}",
          description: "Reúna contexto e exemplos antes da conversa.",
          operations,
        },
      ],
    },
    experience: {
      schemaVersion: DECLARATIVE_SCHEMA_VERSION,
      version: 1,
      layout: [
        {
          type: "hero",
          eyebrow: "SUA BUSCA, COM CONTEXTO",
          title: { property: "targetRole", fallback: "Novo emprego" },
          subtitle: "Uma visão viva das oportunidades e próximos movimentos.",
        },
        { type: "next-actions", title: "Agora", source: "actions", limit: 5 },
        {
          type: "collection",
          title: "Oportunidades",
          entity: "opportunity",
          create: true,
          createLabel: "Registrar oportunidade",
        },
        { type: "metrics", title: "Sua semana", source: "metrics", limit: 3 },
        { type: "timeline", title: "Histórico recente", source: "history" },
      ],
    },
  },
  enem: {
    protocol: {
      ...common,
      entities: {
        study_record: {
          id: "study_record",
          label: "Práticas de estudo",
          singular: "atividade de estudo",
          primaryField: "topic",
          fields: [
            {
              id: "subject",
              label: "Matéria",
              type: "select",
              options: [
                "Linguagens",
                "Matemática",
                "Ciências Humanas",
                "Ciências da Natureza",
                "Redação",
              ],
            },
            {
              id: "topic",
              label: "Tópico ou atividade",
              type: "text",
              required: true,
            },
            {
              id: "kind",
              label: "Tipo",
              type: "select",
              options: ["Tópico", "Questões", "Revisão", "Redação", "Simulado"],
            },
            { id: "questions", label: "Questões realizadas", type: "number" },
            { id: "correct", label: "Acertos", type: "number" },
            { id: "studyDate", label: "Data", type: "date" },
            { id: "notes", label: "Erros e aprendizados", type: "textarea" },
          ],
          states: [
            "Planejado",
            "Em estudo",
            "Praticado",
            "Revisado",
            "Concluído",
          ].map((label, order) => ({ id: label, label, order })),
        },
      },
      rules: [
        {
          id: "review-difficult-topic",
          when: { entity: "study_record", field: "notes", operator: "exists" },
          then: [
            {
              type: "schedule_action",
              actionId: "review_topic",
              field: "studyDate",
              days: 2,
            },
          ],
        },
      ],
      actions: [
        {
          id: "study_topic",
          entity: "study_record",
          statuses: ["Planejado", "Em estudo"],
          title: "Estudar {topic}",
          description: "Continue pelo tópico que merece clareza.",
          operations,
        },
        {
          id: "practice_questions",
          entity: "study_record",
          values: { kind: ["Questões", "Simulado"] },
          statuses: ["Planejado", "Em estudo", "Praticado"],
          title: "Fazer questões de {subject}",
          description:
            "Registre questões e acertos para acompanhar sua evolução.",
          operations,
        },
        {
          id: "write_essay",
          entity: "study_record",
          values: { kind: ["Redação"] },
          statuses: ["Planejado", "Em estudo"],
          title: "Escrever redação",
          description: "Produza uma redação e registre o aprendizado.",
          operations,
        },
        {
          id: "review_topic",
          entity: "study_record",
          values: { kind: ["Revisão"] },
          statuses: ["Planejado", "Em estudo", "Praticado"],
          title: "Revisar {topic}",
          description: "Retorne ao erro enquanto ele ainda está fresco.",
          operations,
        },
      ],
    },
    experience: {
      schemaVersion: DECLARATIVE_SCHEMA_VERSION,
      version: 1,
      layout: [
        {
          type: "hero",
          eyebrow: "PREPARAÇÃO PARA O ENEM",
          title: "O que merece estudo agora",
          subtitle: "Estude, pratique e revise sem perder o fio.",
        },
        { type: "next-actions", title: "Hoje", source: "actions", limit: 5 },
        {
          type: "collection",
          title: "Plano de estudo",
          entity: "study_record",
          create: true,
          createLabel: "Adicionar estudo",
        },
        { type: "metrics", title: "Evolução", source: "metrics", limit: 5 },
        { type: "timeline", title: "Histórico recente", source: "history" },
      ],
    },
  },
});

export function declarativeForOfficial(definition = {}) {
  const preset = officialDeclarativeTemplates[definition.id];
  if (preset) return clone(preset);
  return {
    protocol: protocolFromDefinition(definition),
    experience: experienceFromDefinition(definition),
  };
}
