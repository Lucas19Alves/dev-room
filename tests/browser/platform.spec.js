import { test, expect } from "@playwright/test";
async function create(page, name) {
  await page
    .getByRole("button", { name: "Criar do zero", exact: false })
    .click();
  await page.getByLabel("Nome do Flow", { exact: true }).fill(name);
  await page.getByRole("button", { name: "Continuar →" }).click();
  await page
    .getByRole("button", { name: "Notas Adicionar", exact: false })
    .click();
  await page
    .getByRole("button", { name: "Checklist Adicionar", exact: false })
    .click();
  await page.getByRole("button", { name: "Continuar →" }).click();
  await page.getByLabel("Como podemos te chamar?").fill("Pessoa de teste");
  await page.getByRole("button", { name: "Entrar no meu Flow" }).click();
  await expect(page.getByLabel("Nome do Flow", { exact: true })).toHaveValue(
    name,
  );
}
test("create, isolate, persist, customize and complete a session", async ({
  page,
}) => {
  const errors = [];
  page.on("pageerror", (e) => errors.push(e.message));
  await page.goto("/");
  await expect(
    page.getByRole("heading", { name: "O que você quer fazer hoje?" }),
  ).toBeVisible();
  await page.screenshot({
    path: "test-results/discovery-desktop.png",
    fullPage: true,
  });
  await create(page, "Estudos A");
  await page.getByLabel("Notas deste Flow").fill("Conteúdo privado do Flow A");
  await page
    .getByLabel("Nova tarefa", { exact: true })
    .fill("Revisar matemática");
  await page.getByLabel("Adicionar tarefa", { exact: true }).click();
  await page.getByRole("button", { name: "Começar", exact: false }).click();
  await page.getByRole("checkbox", { name: "Revisar matemática" }).check();
  await page
    .getByRole("button", { name: "Concluir sessão", exact: true })
    .click();
  await expect(
    page.getByText("1 tarefas concluídas · 0 ciclos de foco"),
  ).toBeVisible();
  const download = page.waitForEvent("download");
  await page.getByRole("button", { name: "Baixar cartão" }).click();
  expect((await download).suggestedFilename()).toBe("meu-flow.png");
  await page.getByLabel("Fechar diálogo").click();
  await page.getByLabel("Descobrir Flows", { exact: true }).click();
  await create(page, "Trabalho B");
  await expect(page.getByLabel("Notas deste Flow")).toHaveValue("");
  await expect(page.getByLabel("Texto da tarefa")).toHaveCount(0);
  await page.getByLabel("Notas deste Flow").fill("Conteúdo B");
  await page.getByRole("button", { name: "Estudos A", exact: true }).click();
  await expect(page.getByLabel("Notas deste Flow")).toHaveValue(
    "Conteúdo privado do Flow A",
  );
  await page.getByLabel("Remover Notas", { exact: true }).click();
  await expect(page.getByLabel("Notas deste Flow")).toHaveCount(0);
  await page.getByRole("button", { name: "Componentes", exact: false }).click();
  await page
    .getByRole("button", { name: "Notas Adicionar", exact: false })
    .click();
  await expect(page.getByLabel("Notas deste Flow")).toHaveValue(
    "Conteúdo privado do Flow A",
  );
  await expect(page.locator(".sync")).toHaveText("Salvo neste dispositivo");
  await page.reload();
  await page.getByRole("button", { name: "Estudos A", exact: true }).click();
  await expect(page.getByLabel("Notas deste Flow")).toHaveValue(
    "Conteúdo privado do Flow A",
  );
  await expect(
    page.getByRole("checkbox", { name: "Revisar matemática" }),
  ).toBeChecked();
  await page.screenshot({
    path: "test-results/workspace-desktop.png",
    fullPage: true,
  });
  await page.getByLabel("Minha jornada", { exact: true }).click();
  await expect(page.getByRole("button", { name: "Ver cartão" })).toHaveCount(1);
  expect(errors).toEqual([]);
});
test("mobile discovery and setup remains usable", async ({ page }) => {
  await page.setViewportSize({ width: 390, height: 844 });
  await page.goto("/");
  await expect(
    page.getByRole("heading", { name: "O que você quer fazer hoje?" }),
  ).toBeVisible();
  await page.screenshot({
    path: "test-results/discovery-mobile.png",
    fullPage: true,
  });
  expect(
    await page.evaluate(
      () => document.documentElement.scrollWidth <= innerWidth,
    ),
  ).toBeTruthy();
  await create(page, "Mobile");
  expect(
    await page.evaluate(
      () => document.documentElement.scrollWidth <= innerWidth,
    ),
  ).toBeTruthy();
});
test("legacy data migrates once without deleting the source", async ({
  page,
}) => {
  await page.addInitScript(() => {
    if (!localStorage.getItem("dev-room-data"))
      localStorage.setItem(
        "dev-room-data",
        JSON.stringify({
          nome: "Legado",
          tasks: [{ id: 1, text: "Tarefa antiga", done: false }],
          notes: [{ text: "Nota antiga" }],
        }),
      );
  });
  await page.goto("/");
  await page.getByLabel("Meus Flows", { exact: true }).click();
  await page.getByRole("button", { name: "Entrar no Flow" }).click();
  await expect(page.getByLabel("Notas deste Flow")).toHaveValue("Nota antiga");
  await expect(
    page.getByRole("checkbox", { name: "Tarefa antiga" }),
  ).toBeVisible();
  await expect(page.locator(".sync")).toHaveText("Salvo neste dispositivo");
  await page.reload();
  await page.getByLabel("Meus Flows", { exact: true }).click();
  await expect(
    page.getByRole("button", { name: "Entrar no Flow" }),
  ).toHaveCount(1);
  expect(
    await page.evaluate(() => !!localStorage.getItem("dev-room-data")),
  ).toBeTruthy();
});

test("focus cycle survives navigation and reload; pausing stops elapsed time", async ({
  page,
}) => {
  await page.goto("/");
  await page
    .getByRole("button", { name: "Encontrar meu primeiro Flow" })
    .click();
  await page.getByRole("button", { name: "Continuar →" }).click();
  await page.getByRole("button", { name: "Continuar →" }).click();
  await page.getByLabel("Como podemos te chamar?").fill("Foco");
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
  await expect(
    page.getByRole("button", { name: "Iniciar", exact: true }),
  ).toBeVisible();
});
test("all reusable components mount and developer content stays in its Flow", async ({
  page,
}) => {
  const errors = [];
  page.on("pageerror", (e) => errors.push(e.message));
  await page.goto("/");
  await create(page, "Ferramentas");
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
  await page.getByLabel("Descobrir Flows", { exact: true }).click();
  await create(page, "Outro espaço");
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
  await page.goto("/");
  await expect(
    page.getByRole("heading", { name: "O que você quer fazer hoje?" }),
  ).toBeVisible();
  const second = await context.newPage();
  await second.goto("/");
  await expect(second.getByRole("alert")).toContainText("outra aba");
  await page.close();
  await second.getByRole("button", { name: "Tentar novamente" }).click();
  await expect(
    second.getByRole("heading", { name: "O que você quer fazer hoje?" }),
  ).toBeVisible();
});
