import { test, expect } from "@playwright/test";

async function createBlank(page, name, objective = "Organizar este objetivo") {
  await page
    .getByRole("button", { name: "Criar do zero", exact: false })
    .click();
  await page.getByLabel("Nome do Flow", { exact: true }).fill(name);
  await page.getByRole("button", { name: "Continuar →" }).click();
  await page.getByLabel("O que você quer realizar?").fill(objective);
  await page.getByRole("button", { name: "Continuar →" }).click();
  await page.getByRole("button", { name: "Pular por agora" }).click();
  await page.getByRole("button", { name: "Continuar →" }).click();
  await page.getByRole("button", { name: "Entrar no meu Flow" }).click();
  await expect(page.getByLabel("Nome do Flow", { exact: true })).toHaveValue(
    name,
  );
}

async function openOfficial(page, name) {
  const card = page.locator(".template-card").filter({ hasText: name });
  await card.getByRole("button", { name: /Usar Flow|Criar Flow/ }).click();
}

async function fillVisibleField(page, label, value) {
  const field = page.getByLabel(label, { exact: true });
  if (!(await field.count()) || !(await field.first().isVisible())) return;
  const tag = await field.first().evaluate((element) => element.tagName);
  if (tag === "SELECT") await field.selectOption({ label: value });
  else await field.fill(value);
}

async function createOfficialWithMinimumContext(page, name, answers) {
  await openOfficial(page, name);
  await page.getByLabel("Nome do Flow", { exact: true }).fill(`Teste ${name}`);
  for (let step = 0; step < 16; step += 1) {
    for (const [label, value] of Object.entries(answers.fields || {}))
      await fillVisibleField(page, label, value);
    for (const option of answers.multi || []) {
      const button = page.getByRole("button", { name: option, exact: true });
      if ((await button.count()) && (await button.first().isVisible()))
        await button.first().click();
    }
    const displayName = page.getByLabel("Como podemos te chamar?", {
      exact: true,
    });
    if ((await displayName.count()) && (await displayName.isVisible()))
      await displayName.fill("Pessoa Noma");
    const finish = page.getByRole("button", { name: "Entrar no meu Flow" });
    if ((await finish.count()) && (await finish.isVisible())) {
      await finish.click();
      return;
    }
    await page.getByRole("button", { name: "Continuar →" }).click();
  }
  throw new Error(`Onboarding não terminou para ${name}`);
}

test("career Flow turns opportunity changes into executable actions and persists context", async ({
  page,
}) => {
  const errors = [];
  page.on("pageerror", (error) => errors.push(error.message));
  await page.goto("/app");
  await openOfficial(page, "Seu próximo capítulo");
  await page.getByLabel("Nome do Flow", { exact: true }).fill("Minha busca");
  await page.getByRole("button", { name: "Continuar →" }).click();

  await page.getByLabel("Cargo ou área desejada").fill("Analista de suporte");
  await page.getByLabel("Nível profissional").selectOption("Pleno");
  await page.getByLabel("Cidades ou regiões").fill("São Paulo");
  await page.getByRole("button", { name: "Remoto", exact: true }).click();
  await page.getByRole("button", { name: "Continuar →" }).click();

  await page.getByLabel("Meta de candidaturas por semana").fill("4");
  await page.getByRole("button", { name: "Continuar →" }).click();
  await page.getByLabel("LinkedIn").fill("https://example.com/linkedin");
  await page.getByRole("button", { name: "Continuar →" }).click();
  await page.getByRole("button", { name: "Continuar →" }).click();
  await page.getByRole("button", { name: "Entrar no meu Flow" }).click();

  await expect(
    page.getByRole("heading", { name: "Analista de suporte" }),
  ).toBeVisible();
  await page.getByRole("button", { name: "Registrar oportunidade" }).click();
  await page.getByLabel("Empresa").fill("Empresa Horizonte");
  await page.getByLabel("Cargo", { exact: true }).fill("Analista de suporte");
  await page.getByRole("button", { name: "Adicionar oportunidade" }).click();
  const status = page.getByLabel("Atualizar etapa de Empresa Horizonte");
  await expect(
    page.getByText("Empresa Horizonte", { exact: true }),
  ).toBeVisible();
  await status.selectOption("Candidatura enviada");
  await expect(
    page.getByText("Fazer follow-up com Empresa Horizonte"),
  ).toBeVisible();
  await page.getByRole("button", { name: "Planejar follow-up" }).click();
  await page
    .getByRole("textbox", { name: "Próxima ação", exact: true })
    .fill("Fazer follow-up com Empresa Horizonte");
  await page.getByLabel("Data da próxima ação").fill("2026-09-20");
  await page.getByRole("button", { name: "Salvar oportunidade" }).click();
  const action = page
    .locator(".action-card")
    .filter({ hasText: "Fazer follow-up com Empresa Horizonte" });
  await action.getByRole("button", { name: "Concluir" }).click();
  await expect(action).toHaveCount(0);
  await status.selectOption("Entrevista");
  await expect(
    page.getByText("Preparar entrevista com Empresa Horizonte"),
  ).toBeVisible();
  await expect(page.getByText("1", { exact: true }).first()).toBeVisible();
  await expect(page.locator(".sync")).toHaveText("Salvo neste dispositivo");

  await page.reload();
  await page.getByRole("button", { name: "Entrar no Flow" }).click();
  await expect(
    page.getByText("Empresa Horizonte", { exact: true }),
  ).toBeVisible();
  await expect(
    page.getByLabel("Atualizar etapa de Empresa Horizonte"),
  ).toHaveValue("Entrevista");
  await expect(
    page.getByText("Preparar entrevista com Empresa Horizonte"),
  ).toBeVisible();
  await page.screenshot({
    path: "test-results/career-flow-desktop.png",
    fullPage: true,
  });
  expect(errors).toEqual([]);
});

test("blank Flow progressively configures, isolates and persists content", async ({
  page,
}) => {
  await page.goto("/app");
  await createBlank(page, "Espaço A");
  await page.getByRole("button", { name: "Personalizar Flow" }).click();
  await page.getByLabel("Notas deste Flow").fill("Conteúdo privado A");
  await page.getByLabel("Nova tarefa", { exact: true }).fill("Primeiro passo");
  await page.getByLabel("Adicionar tarefa", { exact: true }).click();
  await page.getByLabel("Descobrir Flows", { exact: true }).click();
  await createBlank(page, "Espaço B", "Outro objetivo");
  await page.getByRole("button", { name: "Personalizar Flow" }).click();
  await expect(page.getByLabel("Notas deste Flow")).toHaveValue("");
  await page.getByRole("button", { name: "Espaço A", exact: true }).click();
  await page.getByRole("button", { name: "Personalizar Flow" }).click();
  await expect(page.getByLabel("Notas deste Flow")).toHaveValue(
    "Conteúdo privado A",
  );
  await expect(
    page.getByRole("checkbox", { name: "Primeiro passo" }),
  ).toBeVisible();
  await page.reload();
  await page.getByRole("button", { name: "Espaço A", exact: true }).click();
  await page.getByRole("button", { name: "Personalizar Flow" }).click();
  await expect(page.getByLabel("Notas deste Flow")).toHaveValue(
    "Conteúdo privado A",
  );
});

test("landing and specialized onboarding remain usable on mobile", async ({
  page,
}) => {
  await page.setViewportSize({ width: 390, height: 844 });
  await page.goto("/");
  await expect(
    page.getByRole("heading", { level: 1, name: /Um lugar para/ }),
  ).toBeVisible();
  expect(
    await page.evaluate(
      () => document.documentElement.scrollWidth <= innerWidth,
    ),
  ).toBeTruthy();
  await page.goto("/app");
  await openOfficial(page, "Uma semana mais leve");
  await page.getByRole("button", { name: "Continuar →" }).click();
  await page.getByLabel("Início da semana").fill("2026-09-14");
  await page.getByRole("button", { name: "Continuar →" }).click();
  await page.getByLabel("Até três prioridades").fill("Estudar\nDescansar");
  await page.getByRole("button", { name: "Continuar →" }).click();
  await page.getByRole("button", { name: "Continuar →" }).click();
  await page.getByRole("button", { name: "Entrar no meu Flow" }).click();
  await expect(
    page.getByRole("heading", { name: "O que importa neste momento" }),
  ).toBeVisible();
  expect(
    await page.evaluate(
      () => document.documentElement.scrollWidth <= innerWidth,
    ),
  ).toBeTruthy();
  await page.screenshot({
    path: "test-results/weekly-flow-mobile.png",
    fullPage: true,
  });
});

test("official Flows expose their own experience journeys", async ({
  page,
}) => {
  await page.goto("/app");
  const journeys = [
    {
      name: "Meu próximo passo: ENEM",
      heading: "O que merece estudo agora",
      answers: {
        fields: {
          "Data ou meta da prova": "2026-11-08",
          "Horas disponíveis por semana": "8",
        },
        multi: ["Matemática"],
      },
    },
    {
      name: "Do código ao deploy",
      heading: "O próximo incremento",
      answers: {
        fields: {
          "Nome do projeto": "Projeto Noma",
          "O que esta primeira versão precisa resolver?":
            "Provar a experiência",
        },
      },
    },
    {
      name: "Faculdade em dia",
      heading: "O que pede atenção hoje",
      answers: {
        fields: {
          Curso: "Engenharia",
          "Período ou semestre": "2026.2",
          Disciplinas: "Cálculo\nFísica",
        },
      },
    },
    {
      name: "Uma semana mais leve",
      heading: "O que importa neste momento",
      answers: {
        fields: { "Até três prioridades": "Estudar\nDescansar" },
      },
    },
    {
      name: "Aprender uma habilidade",
      heading: "A próxima prática",
      answers: {
        fields: {
          Habilidade: "Violão",
          "O que você quer conseguir fazer?": "Tocar três músicas",
        },
      },
    },
    {
      name: "Criar conteúdo",
      heading: "O próximo conteúdo",
      answers: {
        fields: {
          "Canal ou plataforma": "YouTube",
          Formatos: "Vídeo",
        },
      },
    },
    {
      name: "Projeto pessoal",
      heading: "O próximo incremento",
      answers: {
        fields: {
          "Nome do projeto": "Mudança",
          "Como você saberá que terminou?": "Casa organizada",
        },
      },
    },
    {
      name: "Do seu jeito",
      heading: "O que importa neste momento",
      answers: { fields: { "O que você quer realizar?": "Organizar estudos" } },
    },
  ];

  for (const journey of journeys) {
    await createOfficialWithMinimumContext(page, journey.name, journey.answers);
    await expect(
      page.getByRole("heading", { name: journey.heading }).first(),
    ).toBeVisible();
    await page.getByLabel("Descobrir Flows", { exact: true }).click();
  }
});

test("legacy data migrates once without deleting the source", async ({
  page,
}) => {
  await page.addInitScript(() => {
    if (!localStorage.getItem("legacy-workspace"))
      localStorage.setItem(
        "legacy-workspace",
        JSON.stringify({
          nome: "Legado",
          tasks: [{ id: 1, text: "Tarefa antiga", done: false }],
          notes: [{ text: "Nota antiga" }],
        }),
      );
  });
  await page.goto("/app");
  await page.getByLabel("Meus Flows", { exact: true }).click();
  await page.getByRole("button", { name: "Entrar no Flow" }).click();
  await page.getByRole("button", { name: "Personalizar Flow" }).click();
  await expect(page.getByLabel("Notas deste Flow")).toHaveValue("Nota antiga");
  await expect(
    page.getByRole("checkbox", { name: "Tarefa antiga" }),
  ).toBeVisible();
  await page.reload();
  await page.getByLabel("Meus Flows", { exact: true }).click();
  await expect(
    page.getByRole("button", { name: "Entrar no Flow" }),
  ).toHaveCount(1);
  expect(
    await page.evaluate(() =>
      Boolean(localStorage.getItem("legacy-workspace")),
    ),
  ).toBeTruthy();
});

test("focus cycle survives navigation and reload; pausing stops elapsed time", async ({
  page,
}) => {
  await page.goto("/app");
  await openOfficial(page, "Meu próximo passo: ENEM");
  await page.getByRole("button", { name: "Continuar →" }).click();
  await page.getByLabel("Data ou meta da prova").fill("2026-11-08");
  await page.getByRole("button", { name: "Continuar →" }).click();
  await page
    .getByRole("button", { name: "Matemática", exact: true })
    .first()
    .click();
  await page.getByRole("button", { name: "Continuar →" }).click();
  await page.getByRole("button", { name: "Continuar →" }).click();
  await page.getByRole("button", { name: "Continuar →" }).click();
  await page.getByRole("button", { name: "Entrar no meu Flow" }).click();
  await page.getByRole("button", { name: "Personalizar Flow" }).click();
  await page.getByRole("button", { name: "Iniciar", exact: true }).click();
  await expect(page.locator(".sync")).toHaveText("Salvo neste dispositivo");
  await page.reload();
  await page.getByRole("button", { name: "Entrar no Flow" }).click();
  await page.getByRole("button", { name: "Personalizar Flow" }).click();
  await expect(
    page.getByRole("button", { name: "Pausar", exact: true }),
  ).toBeVisible();
  await page.getByRole("button", { name: "Pausar", exact: true }).click();
  const paused = await page.getByText("Pausa").count();
  await page.clock.install();
  await page.clock.fastForward(5000);
  await expect(page.getByText("Pausa")).toHaveCount(paused);
});

test("reusable tools mount, keep Flow isolation and avoid mobile overflow", async ({
  page,
}) => {
  const errors = [];
  page.on("pageerror", (error) => errors.push(error.message));
  await page.goto("/app");
  await createBlank(page, "Ferramentas");
  await page.getByRole("button", { name: "Personalizar Flow" }).click();
  for (const name of [
    "Kanban",
    "Snippets",
    "Playground",
    "Conversor",
    "Hidratação",
    "Checklist de deploy",
    "Dados de teste",
    "Timer",
    "Música",
  ])
    await page
      .getByRole("button", { name: `${name} Adicionar`, exact: false })
      .click();
  await expect(page.locator("#kanban-main")).toBeVisible();
  await page.locator("#fakedata-generate-btn").click();
  await expect(page.locator("#fakedata-result-text")).not.toBeEmpty();
  await page.getByLabel("HTML", { exact: true }).fill("<h1>Privado A</h1>");
  await page.setViewportSize({ width: 390, height: 844 });
  expect(
    await page.evaluate(
      () => document.documentElement.scrollWidth <= innerWidth,
    ),
  ).toBeTruthy();
  await page.setViewportSize({ width: 1440, height: 1000 });
  await page.getByLabel("Descobrir Flows", { exact: true }).click();
  await createBlank(page, "Outro espaço");
  await page.getByRole("button", { name: "Personalizar Flow" }).click();
  await page
    .getByRole("button", { name: "Playground Adicionar", exact: false })
    .click();
  await expect(page.getByLabel("HTML", { exact: true })).not.toHaveValue(
    "<h1>Privado A</h1>",
  );
  await page.getByRole("button", { name: "Ferramentas", exact: true }).click();
  await page.getByRole("button", { name: "Personalizar Flow" }).click();
  await expect(page.getByLabel("HTML", { exact: true })).toHaveValue(
    "<h1>Privado A</h1>",
  );
  expect(errors).toEqual([]);
});

test("duplicate component instances keep independent data after reload", async ({
  page,
}) => {
  await page.goto("/app");
  await createBlank(page, "Instâncias");
  await page.getByRole("button", { name: "Personalizar Flow" }).click();
  await page.getByLabel("Notas deste Flow").fill("Nota principal");
  await page
    .getByRole("button", { name: "Notas Adicionar", exact: false })
    .click();
  await expect(page.getByLabel("Notas deste Flow")).toHaveCount(2);
  await page.getByLabel("Notas deste Flow").nth(1).fill("Nota separada");
  await expect(page.locator(".sync")).toHaveText("Salvo neste dispositivo");
  await page.reload();
  await page.getByRole("button", { name: "Entrar no Flow" }).click();
  await page.getByRole("button", { name: "Personalizar Flow" }).click();
  await expect(page.getByLabel("Notas deste Flow").nth(0)).toHaveValue(
    "Nota principal",
  );
  await expect(page.getByLabel("Notas deste Flow").nth(1)).toHaveValue(
    "Nota separada",
  );
});

test("a second tab cannot silently overwrite local work", async ({
  page,
  context,
}) => {
  await page.goto("/app");
  await expect(
    page.getByRole("heading", { name: "O que você quer fazer hoje?" }),
  ).toBeVisible();
  const second = await context.newPage();
  await second.goto("/app");
  await expect(second.getByRole("alert")).toContainText("outra aba");
  await page.close();
  await second.getByRole("button", { name: "Tentar novamente" }).click();
  await expect(
    second.getByRole("heading", { name: "O que você quer fazer hoje?" }),
  ).toBeVisible();
});
