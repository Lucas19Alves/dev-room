import test from "node:test";
import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import { PGlite } from "@electric-sql/pglite";
import "fake-indexeddb/auto";
import {
  makeFlow,
  templates,
  discoverableTemplates,
  publicTemplate,
  safeUrl,
  definitionUpdate,
} from "../src/flow/catalog.js";
import { readAccount, writeAccount } from "../src/flow/database.js";
import {
  componentData,
  componentDataEntries,
  componentIds,
  migrateAccount,
} from "../src/flow/model.js";
import {
  calculateMetrics,
  completeReview,
  getFlowHome,
  postponeReview,
  refreshFlowDerivedState,
  skipReview,
} from "../src/flow/runtime.js";
import { buildFlowExperience } from "../src/flow/experience.js";
import {
  acknowledgeProjectPathReview,
  addProjectCapture,
  addProjectFeature,
  addProjectStage,
  buildProjectChecklist,
  ensureProjectWorkspace,
  finishProject,
  projectCalendarEntries,
  projectCompletionSummary,
  projectInsights,
  projectNextStep,
  projectOutcomeOptions,
  projectResumeContext,
  recordProjectDecision,
  recordProjectStepActivity,
  rescheduleProjectTarget,
  rescheduleProjectStep,
  setProjectStepState,
  updateProjectContext,
} from "../src/flow/projectFlow.js";
import { calendarEntries } from "../src/flow/overview.js";
import { buildFlowReport } from "../src/flow/reports.js";
import { checkoutIntegrationIdentifier } from "../supabase/functions/_shared/billing.js";

const answers = {
  job: {
    targetRole: "Analista de suporte",
    seniority: "Pleno",
    locations: ["São Paulo"],
    workModels: ["Remoto"],
    weeklyApplicationGoal: 5,
    resumeUrl: "https://example.com/cv",
  },
  enem: {
    examDate: "2026-11-08",
    weeklyHours: 8,
    prioritySubjects: ["Matemática", "Redação"],
    lowConfidenceSubjects: ["Matemática"],
    weeklyQuestionGoal: 60,
    weeklyEssayGoal: 1,
  },
  code: {
    projectName: "Noma",
    projectGoal: "Entregar um Flow útil",
    projectType: "Aplicação web",
    stack: ["Vue", "Supabase"],
    currentStage: "Construção",
    essentialFeatures: ["Onboarding", "Tracker"],
  },
  college: {
    course: "Engenharia",
    semester: "2026.2",
    subjects: ["Cálculo", "Física"],
    weeklyHours: 10,
  },
  week: {
    weekStart: "2026-09-14",
    priorities: ["Revisar projeto", "Descansar"],
    commitments: ["Consulta"],
    protectedTime: "Sábado à tarde",
  },
  blank: {
    customObjective: "Organizar uma mudança",
    customCategory: "Pessoal",
    customGoals: ["Escolher bairro"],
    customStages: ["Pesquisa", "Mudança"],
    customMetrics: ["Imóveis visitados"],
    reviewCadenceDays: 14,
  },
  skill: {
    skillName: "Violão",
    startingLevel: "Começando",
    desiredOutcome: "Tocar três músicas",
    weeklyPracticeGoal: 3,
  },
  content: {
    channel: "YouTube",
    formats: ["Vídeo"],
    weeklyPublishGoal: 1,
  },
  project: {
    projectName: "Viagem",
    projectOutcome: "Roteiro e reservas concluídos",
    milestones: ["Comprar passagens", "Reservar hotel"],
  },
};

test("Stripe Checkout integration identifiers use an eight-letter Noma suffix", () => {
  assert.match(
    checkoutIntegrationIdentifier(new Uint8Array(8)),
    /^noma_checkout_[a-z]{8}$/,
  );
});

test("every official Flow creates a specialized, versioned instance", () => {
  assert.equal(discoverableTemplates.length, 12);
  assert.equal(
    discoverableTemplates.filter((template) => template.tier === "pro").length,
    6,
  );
  assert.equal(
    discoverableTemplates.filter((template) => template.tier === "free").length,
    6,
  );
  for (const template of templates) {
    const flow = makeFlow(template, template.name, answers[template.id]);
    assert.equal(flow.definitionRef.id, template.id);
    assert.equal(flow.definitionRef.version, template.version || 2);
    assert.equal(flow.definitionRef.tier, template.tier);
    assert.deepEqual(flow.result, {
      status: "in_progress",
      summary: "",
      completedAt: null,
    });
    if (template.id === "code") {
      assert.ok(
        !template.onboarding.steps.some((step) => step.id === "flow-plan"),
      );
      assert.equal(template.onboarding.allowComponentSelection, false);
    } else {
      assert.ok(
        template.onboarding.steps.some((step) => step.id === "flow-plan"),
      );
    }
    assert.deepEqual(flow.onboarding.answers, {
      ...flow.onboarding.answers,
    });
    assert.ok(flow.objective);
    assert.ok(flow.review.prompts.length >= 3);
    assert.ok(Array.isArray(flow.review.history));
    assert.ok(flow.metricDefinitions.length > 0);
    assert.ok(flow.goals.length > 0 || template.id === "blank");
    assert.ok(flow.stages.length > 0);
    if (template.id !== "blank") {
      assert.ok(componentIds(flow).includes("tracker"));
      assert.ok(
        flow.components.find((item) => item.type === "tracker").config.fields
          .length > 0,
      );
    }
  }
});

test("official onboarding answers create useful initial data", () => {
  const job = makeFlow(
    templates.find((item) => item.id === "job"),
    "Minha busca",
    answers.job,
  );
  assert.equal(job.properties.targetRole, "Analista de suporte");
  assert.equal(job.goals[0].target, 5);
  assert.ok(
    job.componentData.tasks.items.some((item) => item.group === "Perfil"),
  );
  assert.equal(job.componentData.links.items[0].title, "Currículo");
  assert.equal(getFlowHome(job).title, "Analista de suporte");

  const enem = makeFlow(
    templates.find((item) => item.id === "enem"),
    "ENEM",
    answers.enem,
  );
  assert.equal(enem.componentData.tracker.items.length, 2);
  assert.match(getFlowHome(enem).title, /Matemática/);

  const code = makeFlow(
    templates.find((item) => item.id === "code"),
    "Projeto",
    answers.code,
  );
  assert.ok(code.componentData.codeProject.steps.length > 0);
  assert.equal(code.componentData.codeProject.steps[0].status, "active");
  assert.ok(
    code.componentData.codeProject.steps.every(
      (step) => step.status !== "completed",
    ),
  );
  assert.ok(code.componentData.codeProject.features.length === 0);

  const week = makeFlow(
    templates.find((item) => item.id === "week"),
    "Semana",
    answers.week,
  );
  assert.equal(
    week.componentData.tracker.items.filter(
      (item) => item.values.kind === "Prioridade",
    ).length,
    2,
  );

  const blank = makeFlow(
    templates.find((item) => item.id === "blank"),
    "Mudança",
    answers.blank,
  );
  const manualId = blank.metricDefinitions.find(
    (item) => item.source.type === "manual",
  ).id;
  blank.properties.manualMetrics[manualId] = 3;
  assert.equal(calculateMetrics(blank)[manualId].value, 3);
});

test("metrics reflect activity without inventing outcome progress", () => {
  const flow = makeFlow(
    templates.find((item) => item.id === "job"),
    "Busca",
    answers.job,
  );
  flow.componentData.tracker.items.push(
    {
      id: "one",
      status: "Candidatura enviada",
      values: {
        company: "Empresa A",
        role: "Analista",
        appliedAt: new Date().toISOString().slice(0, 10),
      },
    },
    {
      id: "two",
      status: "Entrevista",
      values: {
        company: "Empresa B",
        role: "Analista",
        appliedAt: new Date().toISOString().slice(0, 10),
      },
    },
  );
  const metrics = calculateMetrics(flow);
  assert.equal(metrics.applications.value, 2);
  assert.equal(metrics.interviews.value, 1);
  assert.equal(metrics.responses.value, 1);
  assert.equal(metrics.returnRate.value, 50);
  assert.equal(flow.progress.value, null);
  refreshFlowDerivedState(flow);
  assert.equal(
    flow.goals.find((goal) => goal.id === "weekly-applications").current,
    2,
  );
});

test("code project progress derives from its stages and does not invent completed work", () => {
  const flow = makeFlow(
    templates.find((item) => item.id === "code"),
    "Projeto",
    {
      ...answers.code,
      projectObjective: "Concluir MVP",
      currentStage: "Implementação",
    },
  );
  const project = ensureProjectWorkspace(flow);
  assert.ok(
    project.steps.some(
      (step) => step.title === "Entender o ponto atual: Implementação",
    ),
  );
  assert.equal(project.declaredInitialStage, "Implementação");
  assert.equal(project.derivedStage, "Implementação");
  assert.ok(project.steps.every((step) => step.checklist.length > 0));
  assert.ok(project.steps.every((step) => Number(step.size) > 0));
  assert.ok(project.steps.every((step) => step.status !== "completed"));
  assert.equal(projectInsights(flow).completed, 0);
  assert.ok(
    project.steps.some((step) => step.isFocus && step.status === "active"),
  );
});

test("project objective, type and stage compose different deterministic steps", () => {
  const definition = templates.find((item) => item.id === "code");
  const base = makeFlow(definition, "Projeto sem nome", {
    projectObjective: "Fazer deploy",
    projectType: ["API/serviço"],
    stack: ["Rust", "Ferramenta própria"],
    currentStage: "Deploy",
    sessionDuration: "Livre",
    targetWindow: "Sem prazo",
  });
  const project = ensureProjectWorkspace(base);
  assert.equal(project.steps[0].status, "decision");
  assert.match(project.steps[0].title, /nome do projeto/i);
  assert.ok(
    project.steps.some((step) => step.title === "Validar contrato e respostas"),
  );
  assert.ok(
    project.steps.some(
      (step) => step.title === "Entender o ponto atual: Deploy" && step.isFocus,
    ),
  );
  assert.ok(
    project.steps
      .filter((step) => step.source !== "onboarding")
      .every((step) => !["planning", "release"].includes(step.type)),
  );
  assert.ok(project.steps.every((step) => step.status !== "completed"));
  assert.equal(base.properties.sessionMode, "free");
  assert.ok(
    project.steps.some((step) => step.tools.includes("Ferramenta própria")),
  );
  assert.deepEqual(
    projectOutcomeOptions("Fazer deploy", ["API/serviço"])[0],
    "Endpoints essenciais testados",
  );
});

test("project stages enforce blocker and decision context, keep dependencies informational and replan overdue dates", () => {
  const flow = makeFlow(
    templates.find((item) => item.id === "code"),
    "Projeto",
    answers.code,
  );
  const project = ensureProjectWorkspace(flow);
  const existing = project.steps.find((step) => step.isFocus);
  assert.throws(
    () => addProjectStage(flow, { name: "Acesso", status: "blocked" }),
    /bloqueando/i,
  );
  assert.throws(
    () => addProjectStage(flow, { name: "Banco", status: "decision" }),
    /decisão/i,
  );
  const dependent = addProjectStage(flow, {
    name: "Integração",
    dependencies: [existing.id],
    size: 2,
  });
  assert.equal(dependent.status, "planned");
  assert.deepEqual(dependent.dependencies, [existing.id]);
  const available = addProjectStage(flow, { name: "Pode começar agora" });
  assert.notEqual(projectNextStep(project).id, dependent.id);
  assert.equal(
    projectNextStep({ steps: [existing, dependent, available] }).id,
    available.id,
  );
  const windowed = addProjectStage(flow, {
    name: "Janela flexível",
    dueWindow: "Próxima semana",
  });
  assert.equal(windowed.dateWindow, "next_week");
  assert.ok(windowed.dueAt);
  const overdue = addProjectStage(flow, {
    name: "Prazo",
    dueAt: "2020-01-01",
    status: "active",
    blockedReason: "",
  });
  assert.equal(
    projectInsights(flow).overdueSteps.some((step) => step.id === overdue.id),
    true,
  );
  rescheduleProjectStep(flow, overdue.id, "proxima-semana");
  assert.equal(
    projectInsights(flow).overdueSteps.some((step) => step.id === overdue.id),
    false,
  );
  assert.equal(overdue.status, "active");
  project.targetAt = "2020-01-01";
  assert.equal(projectInsights(flow).targetOverdue, true);
  rescheduleProjectTarget(flow, "proxima-semana");
  assert.equal(projectInsights(flow).targetOverdue, false);
});

test("feature planning creates four checkpoints and projection waits for real history", () => {
  const flow = makeFlow(
    templates.find((item) => item.id === "code"),
    "Projeto",
    answers.code,
  );
  const feature = addProjectFeature(flow, {
    name: "Login",
    area: "Autenticação",
    tools: ["Vue"],
    size: "Média",
    completionCriteria: "Entrar com email",
  });
  assert.deepEqual(
    feature.checkpoints.map((item) => item.title),
    ["Planejar", "Implementar", "Validar", "Integrar"],
  );
  const parent = ensureProjectWorkspace(flow).steps.find(
    (step) => step.featureId === feature.id,
  );
  assert.ok(parent.checklist.length >= 8);
  assert.ok(
    parent.checklist.some(
      (item) => item.text === "Testar entrada e saída da conta",
    ),
  );
  assert.equal(projectInsights(flow).estimateAt, null);
  assert.ok(projectInsights(flow).remainingSessions >= 3);
  const now = Date.now();
  const completed = ensureProjectWorkspace(flow).steps.find(
    (step) => step.isFocus,
  );
  completed.size = 2;
  setProjectStepState(flow, completed.id, "completed");
  flow.sessions.push({
    id: "session-1",
    stageId: completed.id,
    seconds: 25 * 60,
    endedAt: now - 14 * 86400000,
  });
  const secondCompleted = ensureProjectWorkspace(flow).steps.find(
    (step) => step.status === "active",
  );
  secondCompleted.size = 2;
  setProjectStepState(flow, secondCompleted.id, "completed");
  flow.sessions.push({
    id: "session-2",
    stageId: secondCompleted.id,
    seconds: 25 * 60,
    endedAt: now - 7 * 86400000,
  });
  flow.sessions.push({
    id: "session-3",
    stageId: secondCompleted.id,
    seconds: 90 * 60,
    endedAt: now,
  });
  const insight = projectInsights(flow, now);
  assert.ok(insight.remainingSessions > 0);
  assert.ok(insight.focusSessionsPerWeek > 0);
  assert.ok(insight.estimateAt > now);
  assert.ok(insight.estimateAt - now > 86400000);
  setProjectStepState(flow, parent.id, "completed");
  assert.equal(feature.status, "completed");
});

test("code project resumes real work and keeps replanning under user control", () => {
  const flow = makeFlow(
    templates.find((item) => item.id === "code"),
    "Retomada",
    {
      ...answers.code,
      projectObjective: "Criar funcionalidades",
      projectType: ["Aplicação web"],
      stack: ["Vue", "Supabase", "Playwright"],
      currentStage: "Implementação",
    },
  );
  const project = ensureProjectWorkspace(flow);
  const implementation = project.steps.find(
    (step) => step.type === "implementation",
  );
  assert.ok(
    implementation.checklist.some((item) => item.text.includes("interface")),
  );
  assert.ok(
    implementation.checklist.some((item) => item.text.includes("Supabase")),
  );
  assert.ok(
    buildProjectChecklist({
      objective: "Fazer deploy",
      projectTypes: ["Aplicação web"],
      stack: ["Vercel"],
      stepType: "deployment",
    }).some((item) => item.includes("Vercel")),
  );

  const later = addProjectStage(flow, {
    name: "Retomar autenticação",
    type: "implementation",
    size: "Pequena",
  });
  recordProjectStepActivity(flow, later.id);
  assert.equal(projectResumeContext(flow).lastWorkedStep.id, later.id);
  assert.equal(projectResumeContext(flow).resumeStep.id, later.id);

  const previousIds = project.steps.map((step) => step.id);
  updateProjectContext(flow, {
    objective: "Evoluir projeto",
    description: "Melhorar a entrada no produto",
    projectTypes: ["Aplicação web", "API/serviço"],
    stack: ["Vue", "Supabase"],
    intendedOutcome: "Fluxo de entrada validado",
    targetWindow: "2 semanas",
  });
  assert.deepEqual(
    project.steps
      .filter((step) => previousIds.includes(step.id))
      .map((step) => step.id),
    previousIds,
  );
  assert.equal(project.pathReview.pending, true);
  acknowledgeProjectPathReview(flow, true);
  assert.equal(project.pathReview.pending, false);

  const stepsBeforeIdea = project.steps.length;
  addProjectCapture(flow, { kind: "idea", text: "Adicionar entrada social" });
  assert.equal(project.steps.length, stepsBeforeIdea);
  const bug = addProjectCapture(flow, {
    kind: "bug",
    text: "Corrigir expiração da sessão",
  });
  assert.ok(project.steps.some((step) => step.id === bug.stepId));
  assert.equal(project.pathReview.pending, true);

  recordProjectDecision(flow, {
    title: "Retomar autenticação",
    text: "Manter login por email nesta versão",
    stepId: later.id,
  });
  assert.equal(project.decisions.length, 1);
  for (const step of [...project.steps])
    setProjectStepState(flow, step.id, "completed");
  const summary = projectCompletionSummary(flow);
  assert.equal(summary.ready, true);
  assert.ok(summary.optionalPending.includes("Adicionar entrada social"));
  finishProject(flow, "close");
  assert.equal(project.lifecycle, "closed");
  assert.equal(project.versions.length, 1);
  finishProject(flow, "new-version");
  assert.equal(project.lifecycle, "active");
  assert.equal(project.currentVersion, 2);
  assert.ok(
    project.steps.some(
      (step) =>
        step.status === "active" &&
        step.title === "Definir o objetivo da versão 2",
    ),
  );
});

test("code project is the source of truth for insights and the global calendar", () => {
  const flow = makeFlow(
    templates.find((item) => item.id === "code"),
    "Projeto com datas",
    {
      ...answers.code,
      startWhen: "Hoje",
      targetWindow: "2 semanas",
      currentStage: "Implementação",
    },
  );
  const project = ensureProjectWorkspace(flow);
  const decision = addProjectStage(flow, {
    name: "Escolher provedor",
    type: "decision",
    status: "decision",
    decisionRequired: "Qual serviço usar?",
    dueAt: project.targetAt,
  });
  addProjectFeature(flow, {
    name: "Login",
    area: "Autenticação",
    dueAt: project.targetAt,
    size: "Pequena",
  });
  flow.componentData.tracker.items.push({
    id: "legacy-only",
    status: "Concluído",
    values: { title: "Não duplicar", dueAt: project.targetAt },
  });
  const direct = projectCalendarEntries(flow);
  assert.ok(direct.some((entry) => entry.kind === "Início do projeto"));
  assert.ok(direct.some((entry) => entry.kind === "Prazo do projeto"));
  assert.ok(
    direct.some(
      (entry) => entry.sourceId === decision.id && entry.kind === "Decisão",
    ),
  );
  assert.ok(direct.some((entry) => entry.kind === "Funcionalidade"));
  assert.equal(direct.filter((entry) => entry.title === "Login").length, 1);
  const global = calendarEntries([flow]);
  assert.ok(global.some((entry) => entry.source === "codeProject"));
  assert.ok(!global.some((entry) => entry.title === "Não duplicar"));
  assert.equal(projectInsights(flow).completed, 0);
  const report = buildFlowReport(flow);
  assert.equal(report.pipeline.length, 0);
  assert.equal(report.journey.total, project.steps.length);
  assert.equal(report.goals.length, 0);
  assert.equal(
    report.insights.find((item) => item.label === "Passos concluídos").value,
    `0/${project.steps.length}`,
  );
});

test("legacy code Flow component data is preserved when its project workspace is initialized", () => {
  const flow = makeFlow(
    templates.find((item) => item.id === "code"),
    "Projeto antigo",
    answers.code,
  );
  delete flow.componentData.codeProject;
  flow.componentData.tracker.items.push({
    id: "legacy-milestone",
    status: "Planejado",
    values: { title: "Marco antigo", kind: "Milestone", notes: "preservar" },
  });
  flow.componentData.kanban = [
    {
      id: "legacy-column",
      title: "Backlog",
      cards: [
        {
          id: "legacy-feature",
          title: "Busca antiga",
          description: "Contexto",
        },
      ],
    },
  ];
  const project = ensureProjectWorkspace(flow);
  assert.ok(project.steps.some((step) => step.legacyId === "legacy-milestone"));
  assert.ok(
    project.features.some((feature) => feature.legacyId === "legacy-feature"),
  );
  assert.equal(flow.componentData.tracker.items[0].values.notes, "preservar");
  assert.equal(flow.componentData.kanban[0].cards[0].title, "Busca antiga");
});

test("reviews can complete, postpone and skip while preserving history", () => {
  const flow = makeFlow(
    templates.find((item) => item.id === "code"),
    "Projeto",
    answers.code,
  );
  const start = Date.now();
  completeReview(
    flow,
    [{ prompt: "O que avançou?", answer: "Onboarding" }],
    start,
  );
  assert.equal(flow.review.history[0].status, "completed");
  assert.equal(flow.review.lastAt, start);
  assert.ok(flow.review.nextAt > start);
  postponeReview(flow, 2, start + 1000);
  skipReview(flow, start + 2000);
  assert.deepEqual(
    flow.review.history.map((item) => item.status),
    ["completed", "postponed", "skipped"],
  );
});

test("definition updates are detected without overwriting an instance", () => {
  const definition = templates.find((item) => item.id === "job");
  const old = makeFlow(
    { ...definition, version: 1 },
    "Busca antiga",
    answers.job,
  );
  old.componentData.notes.text = "Conteúdo preservado";
  assert.deepEqual(definitionUpdate(old), {
    id: "job",
    currentVersion: 1,
    availableVersion: 2,
  });
  assert.equal(old.componentData.notes.text, "Conteúdo preservado");
  assert.equal(
    definitionUpdate(makeFlow(definition, "Atual", answers.job)),
    null,
  );
});

test("Flow instances are independent and public models exclude private content", () => {
  const a = makeFlow(templates[0]),
    b = makeFlow(templates[0]);
  a.componentData.tasks.items[0].text = "PRIVATE";
  a.componentData.notes.text = "SECRET";
  a.componentData.links.items = [{ url: "https://private.example" }];
  a.sessions.push({ seconds: 50 });
  assert.notEqual(a.id, b.id);
  assert.notEqual(
    a.componentData.tasks.items[0].text,
    b.componentData.tasks.items[0].text,
  );
  const serialized = JSON.stringify(publicTemplate(a));
  assert.ok(!serialized.includes("PRIVATE"));
  assert.ok(!serialized.includes("SECRET"));
  assert.ok(!serialized.includes("private.example"));
  assert.equal(publicTemplate(a).sessions, undefined);
  assert.equal(safeUrl("javascript:alert(1)"), null);
  assert.equal(safeUrl("data:text/html,x"), null);
  assert.equal(safeUrl("https://example.com"), "https://example.com/");
});
test("publishing keeps the reusable definition and strips personal onboarding", () => {
  const flow = makeFlow(
    templates.find((item) => item.id === "job"),
    "Busca confidencial",
    {
      ...answers.job,
      targetRole: "Cargo secreto",
      salaryExpectation: "R$ 99.999",
      linkedinUrl: "https://example.com/perfil-privado",
    },
  );
  flow.componentData.tracker.items.push({
    id: "private-opportunity",
    status: "Entrevista",
    values: { company: "Empresa secreta" },
  });
  const published = JSON.stringify(publicTemplate(flow));
  assert.ok(published.includes("Cargo ou área desejada"));
  assert.ok(!published.includes("Cargo secreto"));
  assert.ok(!published.includes("99.999"));
  assert.ok(!published.includes("perfil-privado"));
  assert.ok(!published.includes("Empresa secreta"));
});
test("Flow v1 migrates without losing component content", () => {
  const account = migrateAccount({
    version: 2,
    name: "Pessoa",
    flows: [
      {
        id: "old",
        name: "Legado",
        category: "Estudos",
        color: "mint",
        icon: "✳",
        components: ["tasks", "notes"],
        data: {
          tasks: [{ id: "t", text: "Preservar", done: false }],
          notesText: "Contexto",
          focusMinutes: 40,
        },
        sessions: [{ id: "s", seconds: 60 }],
      },
    ],
  });
  const flow = account.flows[0];
  assert.equal(account.version, 3);
  assert.equal(flow.schemaVersion, 2);
  assert.equal(flow.identity.name, "Legado");
  assert.deepEqual(componentIds(flow), ["tasks", "notes"]);
  assert.equal(flow.componentData.tasks.items[0].text, "Preservar");
  assert.equal(flow.componentData.notes.text, "Contexto");
  assert.equal(flow.sessions.length, 1);
});
test("early Flow v2 instances gain review and progress fields without data loss", () => {
  const account = migrateAccount({
    version: 3,
    flows: [
      {
        schemaVersion: 2,
        kind: "flow_instance",
        id: "v2-early",
        definitionRef: { source: "official", id: "job", version: 1 },
        identity: {
          name: "Busca",
          category: "Carreira",
          color: "blue",
          icon: "↗",
        },
        components: [{ id: "notes", type: "notes", order: 0 }],
        componentData: { notes: { text: "Não perder" } },
        review: { cadenceDays: 7, prompts: ["O que avançou?"] },
        sessions: [],
      },
    ],
  });
  const flow = account.flows[0];
  assert.equal(flow.componentData.notes.text, "Não perder");
  assert.deepEqual(flow.review.history, []);
  assert.equal(flow.progress.strategy.mode, "indicators");
  assert.ok(flow.review.nextAt);
});
test("component data migrates from type keys to stable instance ids without loss", () => {
  const account = migrateAccount({
    version: 3,
    flows: [
      {
        schemaVersion: 2,
        kind: "flow_instance",
        id: "namespaces",
        identity: {
          name: "Teste",
          category: "Pessoal",
          color: "mint",
          icon: "✳",
        },
        components: [
          { id: "tasks-primary", type: "tasks", order: 0 },
          { id: "tasks-secondary", type: "tasks", order: 1 },
        ],
        componentData: {
          tasks: { items: [{ id: "legacy", text: "Preservar", done: false }] },
        },
        sessions: [],
      },
    ],
  });
  const flow = account.flows[0];
  assert.equal(flow.componentData.tasks.items[0].text, "Preservar");
  assert.equal(flow.componentData["tasks-primary"].items[0].text, "Preservar");
  componentData(flow, "tasks-secondary", { items: [] }).items.push({
    id: "new",
    text: "Separada",
  });
  assert.equal(flow.componentData["tasks-primary"].items.length, 1);
  assert.equal(flow.componentData["tasks-secondary"].items.length, 1);
  assert.deepEqual(
    componentDataEntries(flow, "tasks").map(({ component }) => component.id),
    ["tasks-primary", "tasks-secondary"],
  );
});
test("tasks and focus sessions contribute to goals and stages", () => {
  const flow = makeFlow(
    templates.find((item) => item.id === "project"),
    "Projeto vinculado",
    answers.project,
  );
  const goal = flow.goals[0];
  const stage = flow.stages[0];
  flow.componentData.tasks.items.push({
    id: "linked-task",
    text: "Passo vinculado",
    done: true,
    goalId: goal.id,
    stageId: stage.id,
  });
  flow.sessions.push({
    id: "linked-session",
    seconds: 900,
    goalId: goal.id,
    stageId: stage.id,
  });
  refreshFlowDerivedState(flow);
  assert.equal(flow.goals[0].contributions.tasksDone, 1);
  assert.equal(flow.goals[0].contributions.focusSeconds, 900);
  assert.equal(flow.stages[0].contributions.tasksDone, 1);
  assert.equal(flow.stages[0].contributions.focusSeconds, 900);
});
test("career experience emits structured executable actions from real sources", () => {
  const flow = makeFlow(
    templates.find((item) => item.id === "job"),
    "Busca",
    answers.job,
  );
  const opportunity = {
    id: "opportunity-action",
    status: "Candidatura enviada",
    values: {
      company: "Empresa Norte",
      role: "Analista",
      nextAction: "",
      nextActionAt: "",
    },
  };
  flow.componentData.tracker.items.push(opportunity);
  const experience = buildFlowExperience(flow, Date.now());
  const action = experience.actions.find(
    (item) => item.sourceId === opportunity.id,
  );
  assert.equal(action.type, "follow_up");
  assert.equal(action.source, "tracker");
  assert.equal(action.flowId, flow.id);
  assert.equal(action.title, "Fazer follow-up com Empresa Norte");
  assert.deepEqual(
    action.actions.map((item) => item.type),
    ["open", "complete", "postpone", "dismiss"],
  );
  assert.ok(
    experience.opportunities.some((item) => item.title === "Empresa Norte"),
  );
  assert.ok(
    experience.week.metrics.some((item) => item.id === "weeklyApplications"),
  );
});
test("official experiences keep domain-specific sections and actions", () => {
  const cases = [
    ["enem", "PLANO", ["study_topic"]],
    ["code", "ROADMAP", []],
    ["college", "DISCIPLINAS", ["continue_task"]],
    ["week", "3 PRIORIDADES DA SEMANA", ["continue_task"]],
    ["skill", "TRILHA", ["practice_skill"]],
    ["content", "PIPELINE", ["continue_content"]],
    ["project", "ROADMAP", ["continue_task"]],
    ["blank", "CONTEXTO", []],
  ];
  for (const [id, sectionLabel, actionTypes] of cases) {
    const flow = makeFlow(
      templates.find((template) => template.id === id),
      `Experiência ${id}`,
      answers[id],
    );
    const experience = buildFlowExperience(flow);
    assert.equal(experience.variant, id);
    assert.ok(
      experience.sections.secondary.some(
        (section) => section.label === sectionLabel,
      ),
    );
    for (const actionType of actionTypes)
      assert.ok(
        experience.actions.some((action) => action.type === actionType),
        `${id} should expose ${actionType}`,
      );
  }
});
test("IndexedDB survives reads and separates account namespaces", async () => {
  await writeAccount("guest", { account: { name: "Local" } });
  await writeAccount("user:a", { account: { name: "Alice" } });
  assert.equal((await readAccount("guest")).account.name, "Local");
  assert.equal((await readAccount("user:a")).account.name, "Alice");
  assert.equal(await readAccount("user:b"), undefined);
});
test("Postgres migration enforces ownership, public templates and atomic conflicts", async () => {
  const db = new PGlite();
  try {
    await db.exec(
      `create schema auth; create role anon; create role authenticated; create table auth.users(id uuid primary key); create function auth.uid() returns uuid language sql stable as $$ select nullif(current_setting('request.jwt.claim.sub',true),'')::uuid $$; grant usage on schema auth to anon, authenticated; grant execute on function auth.uid() to anon, authenticated; insert into auth.users values ('11111111-1111-4111-8111-111111111111'),('22222222-2222-4222-8222-222222222222');`,
    );
    await db.exec(
      await readFile(
        new URL(
          "../supabase/migrations/202609160001_flow_platform.sql",
          import.meta.url,
        ),
        "utf8",
      ),
    );
    await db.exec(
      await readFile(
        new URL(
          "../supabase/migrations/202609170001_flow_definition_v2.sql",
          import.meta.url,
        ),
        "utf8",
      ),
    );
    await db.exec(
      `set role authenticated; set request.jwt.claim.sub='11111111-1111-4111-8111-111111111111'; grant insert, update on public.flow_accounts to authenticated;`,
    );
    assert.equal(
      (
        await db.query(
          `select public.save_flow_account('{"flows":[]}'::jsonb,0) as revision`,
        )
      ).rows[0].revision,
      1,
    );
    await assert.rejects(
      db.query(`select public.save_flow_account('{}'::jsonb,0)`),
      /revision_conflict/,
    );
    assert.equal(
      (
        await db.query(
          `select public.save_flow_account('{"flows":[1]}'::jsonb,1) as revision`,
        )
      ).rows[0].revision,
      2,
    );
    await db.query(
      `insert into public.flow_templates(blueprint) values ('{"name":"Public","components":["focus"]}')`,
    );
    await assert.rejects(
      db.query(
        `insert into public.flow_templates(blueprint) values ('{"name":"Invalid"}')`,
      ),
      /flow_templates_blueprint_shape_check/,
    );
    await db.exec(
      `set request.jwt.claim.sub='22222222-2222-4222-8222-222222222222'`,
    );
    assert.equal(
      (await db.query("select * from public.flow_accounts")).rows.length,
      0,
    );
    await assert.rejects(
      db.query(
        `insert into public.flow_templates(user_id,blueprint) values ('11111111-1111-4111-8111-111111111111','{}')`,
      ),
      /row-level security/,
    );
    assert.equal(
      (await db.query("delete from public.flow_templates returning id")).rows
        .length,
      0,
    );
    assert.equal(
      (await db.query(`update public.flow_accounts set payload='{}'`)).rows
        .length,
      0,
    );
    await db.exec(`set role anon; set request.jwt.claim.sub=''`);
    assert.equal(
      (await db.query("select * from public.flow_templates")).rows.length,
      1,
    );
    await assert.rejects(
      db.query("select * from public.flow_accounts"),
      /permission denied/,
    );
    await assert.rejects(
      db.query(`select public.save_flow_account('{}'::jsonb,0)`),
      /permission denied/,
    );
  } finally {
    await db.close();
  }
});

test("Pro Flow creation is checked in Postgres and existing Flows remain editable", async () => {
  const db = new PGlite();
  try {
    await db.exec(`
      create role anon;
      create role authenticated;
      create schema noma_private;
      create table public.flow_accounts(user_id uuid primary key, payload jsonb not null);
      create function noma_private.my_entitlements() returns jsonb
        language sql stable as $$
          select jsonb_build_object('plan', current_setting('noma.test_plan', true))
        $$;
    `);
    await db.exec(
      await readFile(
        new URL(
          "../supabase/migrations/202609200001_gate_pro_flow_creation.sql",
          import.meta.url,
        ),
        "utf8",
      ),
    );
    await db.exec("set noma.test_plan='free'");
    await assert.rejects(
      db.exec(
        `insert into public.flow_accounts values ('11111111-1111-4111-8111-111111111111', '{"flows":[{"id":"paid","definitionRef":{"id":"contest","tier":"free"}}]}')`,
      ),
      /pro_flow_required/,
    );
    await db.exec("set noma.test_plan='pro'");
    await db.exec(
      `insert into public.flow_accounts values ('11111111-1111-4111-8111-111111111111', '{"flows":[{"id":"old","definitionRef":{"id":"project","tier":"free"}}]}')`,
    );
    await db.exec("set noma.test_plan='free'");
    await db.exec(
      `update public.flow_accounts set payload='{"flows":[{"id":"old","definitionRef":{"id":"project","tier":"free"}},{"id":"new-free","definitionRef":{"id":"blank","tier":"free"}}]}'`,
    );
    await db.exec("set noma.test_plan='pro'");
    await db.exec(
      `update public.flow_accounts set payload='{"flows":[{"id":"old","definitionRef":{"id":"project","tier":"free"}},{"id":"new-free","definitionRef":{"id":"blank","tier":"free"}},{"id":"paid","definitionRef":{"id":"contest","tier":"pro"}}]}'`,
    );
  } finally {
    await db.close();
  }
});
