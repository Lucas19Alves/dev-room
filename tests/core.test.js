import test from "node:test";
import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import { PGlite } from "@electric-sql/pglite";
import "fake-indexeddb/auto";
import {
  makeFlow,
  templates,
  publicTemplate,
  safeUrl,
  definitionUpdate,
} from "../src/flow/catalog.js";
import { readAccount, writeAccount } from "../src/flow/database.js";
import { componentIds, migrateAccount } from "../src/flow/model.js";
import {
  calculateMetrics,
  completeReview,
  getFlowHome,
  postponeReview,
  skipReview,
} from "../src/flow/runtime.js";

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

test("every official Flow creates a specialized, versioned instance", () => {
  assert.equal(templates.length, 9);
  for (const template of templates) {
    const flow = makeFlow(template, template.name, answers[template.id]);
    assert.equal(flow.definitionRef.id, template.id);
    assert.equal(flow.definitionRef.version, 2);
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
      assert.ok(flow.components.find((item) => item.type === "tracker").config.fields.length > 0);
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
  assert.ok(job.componentData.tasks.items.some((item) => item.group === "Perfil"));
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
  assert.deepEqual(
    code.componentData.kanban.map((column) => column.title),
    ["Backlog", "Próximo", "Em desenvolvimento", "Teste", "Concluído"],
  );
  assert.equal(code.componentData.kanban[0].cards.length, 2);

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
});

test("reviews can complete, postpone and skip while preserving history", () => {
  const flow = makeFlow(
    templates.find((item) => item.id === "code"),
    "Projeto",
    answers.code,
  );
  const start = Date.now();
  completeReview(flow, [{ prompt: "O que avançou?", answer: "Onboarding" }], start);
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
  const old = makeFlow({ ...definition, version: 1 }, "Busca antiga", answers.job);
  old.componentData.notes.text = "Conteúdo preservado";
  assert.deepEqual(definitionUpdate(old), {
    id: "job",
    currentVersion: 1,
    availableVersion: 2,
  });
  assert.equal(old.componentData.notes.text, "Conteúdo preservado");
  assert.equal(definitionUpdate(makeFlow(definition, "Atual", answers.job)), null);
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
        identity: { name: "Busca", category: "Carreira", color: "blue", icon: "↗" },
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
