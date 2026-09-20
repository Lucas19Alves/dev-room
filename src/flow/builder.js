import { COMMAND_TYPES } from "./declarative.js";

export const builderFieldTypes = [
  ["text", "Texto curto"],
  ["textarea", "Texto longo"],
  ["number", "Número"],
  ["date", "Data"],
  ["datetime", "Data e hora"],
  ["boolean", "Sim ou não"],
  ["url", "Link"],
  ["select", "Escolher uma opção"],
  ["multi-select", "Escolher várias opções"],
];
export const builderSections = [
  ["next-actions", "Agora", "O próximo movimento, com contexto."],
  ["collection", "Listas", "O que você está acompanhando."],
  ["pipeline", "Por etapa", "Veja o caminho de cada item."],
  ["agenda", "Agenda", "Prazos e datas já registrados."],
  ["progress", "Progresso", "Metas e avanços reais."],
  ["resources", "Materiais", "Links para consultar quando precisar."],
  ["notes", "Notas", "Contexto que vale guardar."],
  ["stages", "Caminho", "Marcos do objetivo completo."],
  [
    "checkins",
    "Registro de prática",
    "Uma pausa breve para perceber o avanço.",
  ],
  ["metrics", "Indicadores", "Números que ajudam a decidir."],
  ["timeline", "Histórico", "O que aconteceu neste Flow."],
];
export const builderPresets = [
  {
    id: "tasks",
    label: "Tarefas",
    description: "Pequenos passos, com um prazo quando fizer sentido.",
    singular: "tarefa",
    fields: [
      ["title", "O que fazer", "text"],
      ["dueAt", "Prazo", "date"],
    ],
    states: ["A fazer", "Em andamento", "Concluído"],
  },
  {
    id: "stages",
    label: "Algo que passa por etapas",
    description: "Atividades, oportunidades ou entregas com um caminho.",
    singular: "atividade",
    collection: "Atividades",
    fields: [
      ["title", "Título", "text"],
      ["module", "Módulo", "text"],
      [
        "kind",
        "Tipo de atividade",
        "select",
        ["Leitura", "Exercício", "Projeto", "Avaliação"],
      ],
      ["dueAt", "Prazo", "date"],
    ],
    states: ["Planejado", "Em andamento", "Concluído"],
  },
  {
    id: "content",
    label: "Conteúdos",
    description: "Aulas, ideias e assuntos para aprender ou produzir.",
    singular: "conteúdo",
    fields: [
      ["title", "Título", "text"],
      ["kind", "Formato", "select", ["Aula", "Texto", "Vídeo", "Exercício"]],
      ["url", "Material", "url"],
    ],
    states: ["Para começar", "Em andamento", "Concluído"],
  },
  {
    id: "people",
    label: "Pessoas e contatos",
    description: "Fornecedores, parceiros e conversas importantes.",
    singular: "contato",
    collection: "Contatos",
    fields: [
      ["name", "Nome", "text"],
      ["contact", "Contato", "text"],
      ["budget", "Valor previsto", "number"],
      ["dueAt", "Próximo contato", "date"],
    ],
    states: ["Pesquisar", "Conversar", "Decidir", "Confirmado"],
  },
  {
    id: "deadlines",
    label: "Datas e prazos",
    description: "Compromissos que merecem atenção antes de chegar.",
    singular: "compromisso",
    collection: "Compromissos",
    fields: [
      ["title", "Compromisso", "text"],
      ["dueAt", "Data", "date"],
    ],
    states: ["Previsto", "Concluído"],
  },
  {
    id: "practice",
    label: "Práticas",
    description: "Repetir, perceber o avanço e ajustar o próximo passo.",
    singular: "prática",
    collection: "Práticas",
    fields: [
      ["title", "O que praticar", "text"],
      ["dueAt", "Próxima prática", "date"],
      ["minutes", "Minutos", "number"],
      ["reflection", "O que aprendi", "textarea"],
    ],
    states: ["Planejado", "Em prática", "Concluído"],
  },
  {
    id: "projects",
    label: "Projetos",
    description: "Entregas, prioridades e decisões que precisam avançar.",
    singular: "entrega",
    collection: "Entregas",
    fields: [
      ["title", "Entrega", "text"],
      ["dueAt", "Prazo", "date"],
      ["priority", "Prioridade", "select", ["Alta", "Normal", "Baixa"]],
    ],
    states: ["Ideia", "Em andamento", "Bloqueado", "Concluído"],
  },
  {
    id: "simple",
    label: "Começar simples",
    description: "Um próximo passo e espaço para o que surgir.",
    singular: "passo",
    collection: "Próximos passos",
    fields: [["title", "Próximo passo", "text"]],
    states: ["A fazer", "Concluído"],
  },
];
export function builderSlug(value, fallback = "item") {
  return (
    String(value || fallback)
      .normalize("NFD")
      .replace(/[\u0300-\u036f]/g, "")
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, "_")
      .replace(/^_|_$/g, "")
      .slice(0, 38) || fallback
  );
}
export function newBuilderCollection(preset, index = 1) {
  return {
    id: `${preset.id}_${index}`,
    preset: preset.id,
    label: preset.collection || preset.label,
    singular: preset.singular,
    fields: preset.fields.map(([key, label, type, options], order) => ({
      key,
      label,
      type,
      required: order === 0,
      ...(options ? { options: [...options] } : {}),
    })),
    states: [...preset.states],
    sequential: false,
    target: 0,
  };
}
export function buildCustomDefinition(draft) {
  const sourceCollections = draft.collections.length
    ? draft.collections
    : [
        newBuilderCollection(
          builderPresets.find((preset) => preset.id === "simple"),
        ),
      ];
  const entities = Object.fromEntries(
    sourceCollections.map((collection) => [
      collection.id,
      {
        id: collection.id,
        label: collection.label.trim() || "Itens",
        singular: collection.singular.trim() || "item",
        primaryField: collection.fields[0].key,
        fields: collection.fields.map((field) => ({
          ...field,
          id: field.key,
          ...(field.options ? { options: [...field.options] } : {}),
        })),
        states: collection.states
          .filter(Boolean)
          .map((label, order, states) => ({
            id: builderSlug(label, `state_${order}`),
            label,
            order,
            terminal: order === states.length - 1,
          })),
        ...(collection.sequential
          ? {
              transitions: collection.states
                .slice(0, -1)
                .map((label, order) => ({
                  from: label,
                  to: collection.states[order + 1],
                })),
            }
          : {}),
      },
    ]),
  );
  const actions = Object.values(entities).map((entity) => ({
    id: `continue_${entity.id}`,
    entity: entity.id,
    title: `Continuar {${entity.primaryField}}`,
    description: "Um próximo passo possível para este objetivo.",
    dueField: entity.fields.find((field) =>
      ["date", "datetime"].includes(field.type),
    )?.key,
    operations: ["open", "complete", "postpone", "dismiss"],
  }));
  const rules = [];
  for (const [index, reminder] of (draft.reminders || []).entries()) {
    const entity = entities[reminder.collection];
    if (!entity) continue;
    const id = `reminder_${index + 1}`;
    const dateField =
      reminder.field ||
      entity.fields.find((field) => ["date", "datetime"].includes(field.type))
        ?.key;
    const action = {
      id,
      entity: entity.id,
      title: reminder.title.trim() || `Retomar {${entity.primaryField}}`,
      description:
        reminder.kind === "deadline"
          ? "Este prazo está se aproximando."
          : "Vale olhar para este próximo passo.",
      priority: "normal",
      ...(dateField ? { dueField: dateField } : {}),
      operations: ["open", "complete", "postpone", "dismiss"],
    };
    if (reminder.kind === "deadline")
      action.when = {
        field: dateField,
        operator: "days_before",
        value: Number(reminder.days) || 1,
      };
    else if (reminder.kind === "transition") {
      action.statuses = [reminder.state];
      rules.push({
        id,
        when: {
          event: "entity.transitioned",
          entity: entity.id,
          field: "status",
          operator: "equals",
          value: reminder.state,
        },
        then: [
          {
            type: "schedule_action",
            actionId: id,
            ...(dateField ? { field: dateField } : {}),
            days: Number(reminder.days) || 1,
          },
        ],
      });
    } else
      action.when = {
        field: "updatedAt",
        operator: "days_after",
        value: Number(reminder.days) || 7,
      };
    actions.push(action);
  }
  const metrics = sourceCollections.flatMap((collection) => [
    {
      id: `${collection.id}_completed`,
      label: `${collection.label}: concluídos`,
      target: Number(collection.target) || undefined,
      source: { type: "entity", entity: collection.id, completed: true },
      unit: "itens",
    },
    {
      id: `${collection.id}_total`,
      label: `${collection.label}: total`,
      source: { type: "entity", entity: collection.id },
      unit: "itens",
    },
  ]);
  const sections = draft.sections.length
    ? draft.sections
    : ["next-actions", "collection"];
  const layout = [
    {
      id: "intro",
      type: "hero",
      eyebrow: draft.name.trim(),
      title: draft.objective.trim(),
      subtitle: draft.description.trim(),
    },
  ];
  for (const type of sections) {
    if (["collection", "pipeline"].includes(type)) {
      for (const entity of Object.values(entities).filter(
        (item) => type !== "pipeline" || item.states.length,
      ))
        layout.push({
          id: `${type}_${entity.id}`,
          type,
          entity: entity.id,
          title:
            type === "pipeline" ? `${entity.label} por etapa` : entity.label,
          create: true,
          createLabel: `Adicionar ${entity.singular}`,
          emptyTitle: `Comece com ${entity.singular === "item" ? "um item" : "uma ideia"}.`,
          emptyText: `Guarde o que você quer acompanhar em ${entity.label.toLowerCase()}.`,
        });
    } else
      layout.push({
        id: type,
        type,
        title: builderSections.find(([key]) => key === type)?.[1] || type,
        source:
          type === "next-actions"
            ? "actions"
            : type === "timeline"
              ? "history"
              : type,
        limit: type === "next-actions" ? 5 : 50,
      });
  }
  const reviewDays = draft.reviewEnabled
    ? Math.max(1, Math.min(90, Number(draft.cadenceDays) || 7))
    : 7;
  return JSON.parse(
    JSON.stringify({
      schemaVersion: 2,
      definitionSchemaVersion: 1,
      kind: "flow_definition",
      version: 1,
      visibility: "private",
      id: null,
      name: draft.name.trim() || "Novo Flow",
      objective: draft.objective.trim() || draft.name.trim(),
      description: draft.description.trim(),
      category: draft.category || "Personalizado",
      icon: draft.icon || "✳",
      color: draft.color || "mint",
      components: ["tasks", "notes", "links"],
      onboarding: { intro: "Um caminho para você fazer seu.", steps: [] },
      properties: { focusMinutes: 25 },
      goals: sourceCollections
        .filter((collection) => Number(collection.target) > 0)
        .map((collection) => ({
          id: `${collection.id}_goal`,
          title: `Concluir ${collection.target} em ${collection.label}`,
          metricId: `${collection.id}_completed`,
          target: Number(collection.target),
          unit: "itens",
        })),
      stages: (draft.stages || []).map((title, order) => ({
        id: `stage_${order}`,
        title,
        order,
      })),
      metrics,
      progress: { mode: "indicators" },
      instructions: {
        summary: draft.description.trim(),
        prompts: ["Qual é o próximo movimento?"],
      },
      review: {
        enabled: Boolean(draft.reviewEnabled),
        cadenceDays: reviewDays,
        prompts: [
          "O que avançou?",
          "O que pede atenção?",
          "Qual é o próximo passo?",
        ],
      },
      protocol: {
        schemaVersion: 1,
        version: 1,
        entities,
        commands: [...COMMAND_TYPES],
        events: [
          "entity.created",
          "entity.updated",
          "entity.transitioned",
          "entity.completed",
          "checkin.recorded",
          "review.completed",
        ],
        actions,
        rules,
      },
      experience: { schemaVersion: 1, version: 1, layout },
      initialData: {
        collections: Object.fromEntries(
          Object.keys(entities).map((key) => [key, []]),
        ),
      },
    }),
  );
}
