import { refreshFlowDerivedState } from "./runtime.js";

const clone = (value) => JSON.parse(JSON.stringify(value));
const uid = () => crypto.randomUUID();

export function normalizeList(value, maxItems = Infinity) {
  const items = Array.isArray(value)
    ? value
    : String(value || "")
        .split(/[\n,;]+/)
        .map((item) => item.trim());
  return [...new Set(items.filter(Boolean))].slice(0, maxItems);
}

export function onboardingDefaults(definition, supplied = {}) {
  const answers = clone(supplied || {});
  for (const step of definition.onboarding?.steps || []) {
    for (const field of step.fields || []) {
      if (answers[field.key] === undefined && field.default !== undefined)
        answers[field.key] = clone(field.default);
      if (field.type === "multi") answers[field.key] ||= [];
      if (field.type === "boolean" && answers[field.key] === undefined)
        answers[field.key] = false;
      if (field.type === "list")
        answers[field.key] = normalizeList(
          answers[field.key],
          field.maxItems || Infinity,
        );
      if (field.type === "number" && answers[field.key] !== undefined) {
        const number = Number(answers[field.key]);
        answers[field.key] = Number.isFinite(number)
          ? Math.max(field.min ?? -Infinity, Math.min(field.max ?? Infinity, number))
          : field.default;
      }
    }
  }
  return answers;
}

const task = (text, group = "Próximos passos") => ({
  id: uid(),
  text,
  group,
  done: false,
});

const record = (status, values) => ({
  id: uid(),
  status,
  values,
  createdAt: Date.now(),
  updatedAt: Date.now(),
});

function validLink(url, title) {
  if (!url) return null;
  try {
    const parsed = new URL(url);
    if (!["http:", "https:"].includes(parsed.protocol)) return null;
    return { id: uid(), title, url: parsed.href };
  } catch {
    return null;
  }
}

function prepareJob(flow, a) {
  flow.componentData.tasks.items = [
    task(a.resumeUrl ? "Revisar o currículo para o cargo alvo" : "Preparar uma versão atual do currículo", "Perfil"),
    task(a.linkedinUrl ? "Revisar o título e o resumo do LinkedIn" : "Completar o perfil do LinkedIn", "Perfil"),
    ...(a.portfolioUrl
      ? [task("Conferir os projetos mais relevantes do portfólio", "Perfil")]
      : [task("Decidir se um portfólio ajuda nesta busca", "Perfil")]),
    task("Selecionar uma oportunidade alinhada ao cargo alvo", "Busca"),
    task("Reservar um momento para follow-ups", "Acompanhamento"),
  ];
  flow.componentData.links.items = [
    validLink(a.resumeUrl, "Currículo"),
    validLink(a.linkedinUrl, "LinkedIn"),
    validLink(a.portfolioUrl, "Portfólio"),
  ].filter(Boolean);
}

function prepareEnem(flow, a) {
  const subjects = a.prioritySubjects?.length
    ? a.prioritySubjects
    : ["Matemática"];
  flow.componentData.tracker.items = subjects.map((subject) =>
    record("Planejado", {
      subject,
      topic: "Diagnóstico inicial",
      kind: "Tópico",
      questions: 0,
      correct: 0,
      studyDate: "",
      notes: "",
    }),
  );
  flow.componentData.tasks.items = [
    task(`Fazer um diagnóstico curto de ${subjects[0]}`, "Hoje"),
    task("Resolver uma pequena lista de questões", "Prática"),
    task("Registrar os erros que merecem revisão", "Revisão"),
  ];
}

function prepareCode(flow, a, definition) {
  const features = normalizeList(a.essentialFeatures);
  flow.properties.essentialFeatureCount = features.length;
  flow.componentData.tracker.items = [
    record(a.currentStage === "Ideia" ? "Em andamento" : "Concluído", {
      title: "Definir o MVP",
      kind: "Milestone",
      dueAt: a.deadline || "",
      link: a.repositoryUrl || "",
      notes: a.projectGoal || "",
    }),
    record("Planejado", {
      title: "Publicar a primeira versão",
      kind: "Milestone",
      dueAt: a.deadline || "",
      link: "",
      notes: "",
    }),
  ];
  const names = definition.componentConfig?.kanban?.columns || [
    "Backlog",
    "Próximo",
    "Em desenvolvimento",
    "Teste",
    "Concluído",
  ];
  flow.componentData.kanban = names.map((title, index) => ({
    id: uid(),
    title,
    cards:
      index === 0
        ? features.map((title) => ({ id: uid(), title, description: "" }))
        : [],
  }));
  flow.componentData.tasks.items = [
    task("Escrever o que entra e o que fica fora do MVP", "Escopo"),
    task("Escolher o próximo incremento pequeno", "Construção"),
    task("Definir como validar a primeira versão", "Entrega"),
  ];
  const repository = validLink(a.repositoryUrl, "Repositório do projeto");
  flow.componentData.links.items = repository ? [repository] : [];
}

function prepareCollege(flow, a) {
  flow.componentData.tracker.items = normalizeList(a.subjects).map((subject) =>
    record("Planejado", {
      title: subject,
      subject,
      kind: "Disciplina",
      dueAt: "",
      professor: "",
      link: "",
      notes: "",
    }),
  );
  flow.componentData.tasks.items = [
    task("Registrar a entrega ou prova mais próxima", "Prazos"),
    task("Reunir o material de uma disciplina", "Materiais"),
    ...(a.importantDates
      ? [task("Transformar as datas importantes em itens do tracker", "Prazos")]
      : []),
  ];
}

function prepareWeek(flow, a) {
  const priorities = normalizeList(a.priorities, 3);
  const commitments = normalizeList(a.commitments);
  flow.properties.priorityCount = priorities.length;
  flow.componentData.tracker.items = [
    ...priorities.map((title) =>
      record("Prioridades", { title, kind: "Prioridade", when: "", notes: "" }),
    ),
    ...commitments.map((title) =>
      record("Esta semana", { title, kind: "Compromisso", when: "", notes: "" }),
    ),
    ...(a.habit
      ? [record("Esta semana", { title: a.habit, kind: "Hábito", when: "", notes: "" })]
      : []),
  ];
  flow.componentData.tasks.items = [
    ...(a.protectedTime
      ? [task(`Proteger: ${a.protectedTime}`, "Cuidado")]
      : []),
    task("Escolher uma prioridade para hoje", "Hoje"),
  ];
}

function prepareBlank(flow, a) {
  if (a.customObjective) flow.objective = a.customObjective;
  if (a.customCategory) flow.identity.category = a.customCategory;
  if (a.customIcon) flow.identity.icon = a.customIcon;
  if (a.customColor) flow.identity.color = a.customColor;
  const goals = normalizeList(a.customGoals);
  const stages = normalizeList(a.customStages);
  const metrics = normalizeList(a.customMetrics);
  if (goals.length)
    flow.goals = goals.map((title, index) => ({
      id: `custom-goal-${index + 1}`,
      title,
      unit: "passos",
    }));
  if (stages.length)
    flow.stages = stages.map((title, index) => ({
      id: `custom-stage-${index + 1}`,
      title,
      order: index,
      status: index === 0 ? "current" : "upcoming",
    }));
  if (metrics.length)
    flow.metricDefinitions.push(
      ...metrics.map((label, index) => ({
        id: `custom-metric-${index + 1}`,
        label,
        source: { type: "manual" },
      })),
    );
  flow.review.cadenceDays = Number(a.reviewCadenceDays) || 7;
  flow.review.nextAt = Date.now() + flow.review.cadenceDays * 86400000;
}

function prepareSkill(flow, a) {
  flow.componentData.tracker.items = normalizeList(a.resources).map((title) =>
    record("A explorar", { title, kind: "Recurso", resource: "", notes: "" }),
  );
  flow.componentData.tasks.items = [
    task(`Fazer a primeira prática de ${a.skillName || "sua habilidade"}`, "Prática"),
    task("Registrar o que ficou mais claro", "Revisão"),
  ];
}

function prepareContent(flow) {
  flow.componentData.tasks.items = [
    task("Capturar uma ideia que vale desenvolver", "Ideias"),
    task("Escolher um próximo conteúdo", "Produção"),
  ];
}

function prepareProject(flow, a) {
  const milestones = normalizeList(a.milestones);
  flow.properties.milestoneCount = milestones.length;
  flow.componentData.tracker.items = milestones.map((title) =>
    record("Planejado", {
      title,
      kind: "Milestone",
      dueAt: a.deadline || "",
      link: "",
      notes: "",
    }),
  );
  flow.componentData.tasks.items = [
    task("Definir o primeiro passo concreto", "Começo"),
    ...(a.constraints ? [task("Revisar limites e cuidados do projeto", "Contexto")] : []),
  ];
}

export function applyDefinitionSetup(flow, definition, suppliedAnswers = {}) {
  const answers = onboardingDefaults(definition, suppliedAnswers);
  flow.onboarding.answers = clone(answers);
  flow.properties = { ...flow.properties, ...clone(answers) };
  flow.properties.focusMinutes = Math.max(
    1,
    Math.min(180, Number(answers.focusMinutes || definition.focus) || 25),
  );
  flow.goals = clone(definition.goals || []).map((goal) => ({
    ...goal,
    target: goal.targetProperty
      ? Number(flow.properties[goal.targetProperty]) || null
      : goal.target || null,
  }));
  const currentStage = answers.currentStage;
  flow.stages = (definition.stages || []).map((stage, index) => ({
    id: String(stage).toLowerCase().replace(/[^a-z0-9]+/g, "-") || `stage-${index}`,
    title: stage,
    order: index,
    status:
      stage === currentStage || (!currentStage && index === 0)
        ? "current"
        : currentStage && index < definition.stages.indexOf(currentStage)
          ? "completed"
          : "upcoming",
  }));
  flow.progress.strategy = clone(definition.progress || { mode: "indicators" });
  flow.componentData.tracker ||= { items: [] };
  flow.componentData.tasks ||= { items: [] };
  flow.componentData.links ||= { items: [] };

  const handlers = {
    job: prepareJob,
    enem: prepareEnem,
    code: prepareCode,
    college: prepareCollege,
    week: prepareWeek,
    blank: prepareBlank,
    skill: prepareSkill,
    content: prepareContent,
    project: prepareProject,
  };
  handlers[definition.id]?.(flow, answers, definition);
  refreshFlowDerivedState(flow);
  return flow;
}
