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
  await card.getByRole("button", { name: /Usar Flow/ }).click();
}

test("career Flow supports a real pipeline, session, review and reload", async ({
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
  await expect(page.getByText("0 / 4", { exact: true })).toBeVisible();

  await page
    .getByRole("button", { name: "Adicionar oportunidade", exact: false })
    .click();
  await page.getByLabel("Empresa").fill("Empresa Horizonte");
  await page.getByLabel("Cargo", { exact: true }).fill("Analista de suporte");
  await page.getByLabel("Link da vaga").fill("https://example.com/vaga");
  await page.getByLabel("Data da candidatura").fill("2026-09-18");
  await page
    .getByLabel("Próxima ação · opcional", { exact: true })
    .fill("Preparar entrevista");
  await page
    .getByLabel("Data da próxima ação · opcional", { exact: true })
    .fill("2026-09-19");
  await page.getByRole("button", { name: "Adicionar ao Flow" }).click();

  const status = page.getByLabel("Atualizar etapa de Empresa Horizonte");
  await status.selectOption("Candidatura enviada");
  await expect(page.getByText("1 / 4", { exact: true })).toBeVisible();
  await status.selectOption("Entrevista");
  await expect(page.getByText("Entrevistas").locator("..")).toContainText("1");

  await page.getByRole("button", { name: "Começar", exact: false }).click();
  await page
    .getByRole("button", { name: "Concluir sessão", exact: true })
    .click();
  await expect(page.getByText(/tarefas concluídas/)).toBeVisible();
  await page.getByLabel("Fechar diálogo").click();

  await page.getByRole("button", { name: "Revisar agora" }).click();
  await page
    .getByLabel("Quais vagas realmente valeram a candidatura?")
    .fill("A oportunidade da Empresa Horizonte.");
  await page
    .getByLabel("Alguma entrevista exige preparação?")
    .fill("Sim, revisar exemplos de atendimento.");
  await page.getByRole("button", { name: "Concluir revisão" }).click();
  await expect(page.getByText("1 revisão concluída")).toBeVisible();
  await expect(page.locator(".sync")).toHaveText("Salvo neste dispositivo");

  await page.reload();
  await page.getByRole("button", { name: "Entrar no Flow" }).click();
  await expect(
    page.getByText("Empresa Horizonte", { exact: true }),
  ).toBeVisible();
  await expect(
    page.getByLabel("Atualizar etapa de Empresa Horizonte"),
  ).toHaveValue("Entrevista");
  await expect(page.getByText("1 revisão concluída")).toBeVisible();
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
  await page.getByLabel("Notas deste Flow").fill("Conteúdo privado A");
  await page.getByLabel("Nova tarefa", { exact: true }).fill("Primeiro passo");
  await page.getByLabel("Adicionar tarefa", { exact: true }).click();
  await page.getByLabel("Descobrir Flows", { exact: true }).click();
  await createBlank(page, "Espaço B", "Outro objetivo");
  await expect(page.getByLabel("Notas deste Flow")).toHaveValue("");
  await page.getByRole("button", { name: "Espaço A", exact: true }).click();
  await expect(page.getByLabel("Notas deste Flow")).toHaveValue(
    "Conteúdo privado A",
  );
  await expect(
    page.getByRole("checkbox", { name: "Primeiro passo" }),
  ).toBeVisible();
  await page.reload();
  await page.getByRole("button", { name: "Espaço A", exact: true }).click();
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
    page.getByText("Até três prioridades. Um pouco por vez."),
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
  await page.getByRole("button", { name: "Iniciar", exact: true }).click();
  await expect(page.locator(".sync")).toHaveText("Salvo neste dispositivo");
  await page.reload();
  await page.getByRole("button", { name: "Continuar sessão" }).click();
  await expect(
    page.getByRole("button", { name: "Pausar", exact: true }),
  ).toBeVisible();
  await page.getByRole("button", { name: "Ⅱ Pausar", exact: true }).click();
  const paused = await page.locator(".session-time").textContent();
  await page.clock.install();
  await page.clock.fastForward(5000);
  await expect(page.locator(".session-time")).toHaveText(paused);
});

test("reusable tools mount, keep Flow isolation and avoid mobile overflow", async ({
  page,
}) => {
  const errors = [];
  page.on("pageerror", (error) => errors.push(error.message));
  await page.goto("/app");
  await createBlank(page, "Ferramentas");
  await page.getByRole("button", { name: "Componentes", exact: false }).click();
  for (const name of [
    "Kanban",
    "Snippets",
    "Playground",
    "Conversor",
    "Hidratação",
    "Checklist de deploy",
    "Dados de teste",
    "Cronômetro",
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
  await page.getByRole("button", { name: "Componentes", exact: false }).click();
  await page
    .getByRole("button", { name: "Playground Adicionar", exact: false })
    .click();
  await expect(page.getByLabel("HTML", { exact: true })).not.toHaveValue(
    "<h1>Privado A</h1>",
  );
  await page.getByRole("button", { name: "Ferramentas", exact: true }).click();
  await expect(page.getByLabel("HTML", { exact: true })).toHaveValue(
    "<h1>Privado A</h1>",
  );
  expect(errors).toEqual([]);
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
