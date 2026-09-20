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
  await card
    .getByRole("button", { name: /Usar Flow|Criar Flow|Conhecer Pro/ })
    .click();
}

async function useProPlan(page) {
  await page.addInitScript(() => localStorage.setItem("noma-e2e-plan", "pro"));
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
  await useProPlan(page);
  await page.goto("/app");
  await openOfficial(page, "Novo emprego");
  await page.getByLabel("Nome do Flow", { exact: true }).fill("Minha busca");
  await page.getByRole("button", { name: "Continuar →" }).click();
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
  await page.getByRole("button", { name: "Continuar →" }).click();
  await page.getByLabel("Início da semana").fill("2026-09-14");
  await page.getByRole("button", { name: "Continuar →" }).click();
  await page.getByLabel("Até três prioridades").fill("Estudar\nDescansar");
  await page.getByRole("button", { name: "Continuar →" }).click();
  await page.getByRole("button", { name: "Continuar →" }).click();
  await page.getByRole("button", { name: "Entrar no meu Flow" }).click();
  await expect(
    page.getByRole("heading", {
      name: "O que importa neste momento",
    }),
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

test("landing hero Flow preview adapts its surfaces and text to both themes", async ({
  page,
}) => {
  await page.goto("/");
  await page.evaluate(() => localStorage.setItem("noma-theme", "light"));
  await page.reload();
  const insight = page.locator(".preview-insight");
  const nowTitle = page.locator(".preview-now > strong");

  await expect(insight).toHaveCSS("background-color", "rgb(241, 245, 238)");
  await expect(nowTitle).toHaveCSS("color", "rgb(41, 66, 57)");
  await expect(page.locator(".landing-nav .theme-toggle-btn")).toHaveCount(0);
  await page.evaluate(() => localStorage.setItem("noma-theme", "dark"));
  await page.reload();
  const darkInsight = page.locator(".preview-insight");
  const darkNowTitle = page.locator(".preview-now > strong");
  await expect(page.locator("html")).toHaveAttribute("data-theme", "dark");
  await expect(darkInsight).toHaveCSS("background-color", "rgb(27, 46, 40)");
  await expect(darkNowTitle).toHaveCSS("color", "rgb(238, 245, 241)");
  await expect(page.locator(".preview-now > button")).toHaveCSS(
    "background-color",
    "rgb(82, 183, 136)",
  );

  await page.evaluate(() => localStorage.setItem("noma-theme", "light"));
  await page.reload();
  await expect(page.locator("html")).toHaveAttribute("data-theme", "light");
  await expect(page.locator(".preview-insight")).toHaveCSS(
    "background-color",
    "rgb(241, 245, 238)",
  );
});

test("mobile navigation and settings keep key controls organized", async ({
  page,
}) => {
  await page.setViewportSize({ width: 390, height: 844 });
  await page.goto("/app");

  const menuButton = page.getByRole("button", {
    name: "Abrir menu de navegação",
  });
  const sidebar = page.locator("#main-navigation");
  await expect(menuButton).toBeVisible();
  await expect(sidebar).toBeHidden();
  await expect(page.locator(".plan-topbar-button")).toHaveCSS(
    "min-height",
    "38px",
  );
  await menuButton.click();
  await expect(sidebar).toBeVisible();
  await expect(menuButton).toHaveAttribute("aria-expanded", "true");
  await expect(sidebar.getByRole("button", { name: "Hoje" })).toHaveCSS(
    "font-size",
    "12px",
  );
  await page.keyboard.press("Escape");
  await expect(sidebar).toBeHidden();
  await menuButton.click();

  const settingsButton = sidebar.locator(".mobile-account-link");
  await expect(settingsButton).toBeVisible();
  await expect(settingsButton.locator("svg")).toBeVisible();
  await settingsButton.click();
  await expect(sidebar).toBeHidden();

  await expect(
    page.getByRole("heading", { name: "Configurações" }),
  ).toBeVisible();
  await expect(
    page.getByRole("heading", { name: "Conta e plano" }),
  ).toBeVisible();
  await expect(
    page.getByText("Plano não verificado", { exact: true }),
  ).toBeVisible();
  await expect(page.getByRole("heading", { name: "Aparência" })).toBeVisible();
  await expect(
    page.getByRole("radiogroup", { name: "Selecionar tema do sistema" }),
  ).toBeVisible();
  await expect(
    page.getByRole("heading", { name: "Dados e sincronização" }),
  ).toBeVisible();
  await expect(page.getByText(/Continue com Noma Pro/)).toHaveCount(0);
  expect(
    await page.evaluate(
      () => document.documentElement.scrollWidth <= window.innerWidth,
    ),
  ).toBeTruthy();
});

test("My Flows status, archive link and plan limit stay on separate lines", async ({
  page,
}) => {
  await page.goto("/app");
  await page.getByRole("button", { name: "Meus Flows" }).click();

  const controls = page.locator(".flow-list-controls");
  await expect(controls.locator(".flow-list-status")).toHaveText(
    "Flows ativos",
  );
  await expect(controls.locator(".flow-list-archive-link")).toHaveText(
    "Ver arquivados",
  );
  await expect(controls.locator(".flow-list-plan")).toContainText(
    "espaços ativos no plano Free",
  );

  for (const viewport of [1440, 390]) {
    await page.setViewportSize({ width: viewport, height: 900 });
    const rows = await controls
      .locator(":scope > *")
      .evaluateAll((items) =>
        items.map((item) => Math.round(item.getBoundingClientRect().top)),
      );
    expect(new Set(rows).size).toBe(3);
  }
});

test("landing presents plan details and asks visitors to sign in first", async ({
  page,
}) => {
  await page.setViewportSize({ width: 390, height: 844 });
  await page.goto("/");
  await expect(page.locator(".landing-nav .theme-toggle-btn")).toHaveCount(0);
  await expect(page.getByRole("button", { name: "Entrar" })).toBeVisible();
  const planLink = page.locator(".landing-plan-button");
  await expect(planLink).toBeVisible();
  await planLink.click();
  await expect(page).toHaveURL(/#planos$/);
  await expect(
    page.getByRole("heading", { name: "Planos que acompanham o seu caminho." }),
  ).toBeVisible();
  await expect(page.locator(".plan-card-free")).toContainText("3 Flows ativos");
  const proCard = page.locator(".plan-card-pro");
  await expect(proCard.getByRole("button", { name: /Anual/ })).toHaveAttribute(
    "aria-pressed",
    "true",
  );
  await expect(proCard).toHaveClass(/plan-card-pro-annual/);
  await expect(proCard).toContainText("MELHOR CUSTO · ECONOMIZE R$ 38");
  await expect(proCard.locator(".plan-price strong")).toHaveText("R$ 190");
  await expect(proCard).toContainText("Flows exclusivos");
  await expect(proCard).toContainText("Relatórios personalizados de progresso");
  await expect(proCard).not.toContainText("Em breve");
  await expect(proCard).not.toContainText(
    "A escolha do plano acontece depois.",
  );
  await proCard.getByRole("button", { name: "Mensal" }).click();
  await expect(proCard).toHaveClass(/plan-card-pro-monthly/);
  await expect(proCard).toContainText("FLEXIBILIDADE · PAGAMENTO MENSAL");
  await expect(proCard.locator(".plan-price strong")).toHaveText("R$ 19");
  await proCard.getByRole("button", { name: /Anual/ }).click();
  await expect(proCard.locator(".plan-price strong")).toHaveText("R$ 190");
  await expect(proCard).toContainText("Economize R$ 38 no anual.");
  await expect(proCard.getByRole("button", { name: /Assinar/ })).toHaveCount(0);
  await expect(
    proCard.getByRole("button", { name: /Entrar para/ }),
  ).toBeVisible();
  const landingOverflow = await page.evaluate(() =>
    [...document.querySelectorAll("body *")]
      .map((element) => ({
        selector: `${element.tagName.toLowerCase()}.${element.className?.baseVal || element.className || ""}`,
        right: Math.round(element.getBoundingClientRect().right),
        width: Math.round(element.getBoundingClientRect().width),
      }))
      .filter((element) => element.right > window.innerWidth + 1)
      .slice(0, 8),
  );
  expect(landingOverflow, JSON.stringify(landingOverflow)).toEqual([]);
});

test("authentication screen keeps theme selection in settings only", async ({
  page,
}) => {
  await page.goto("/login");
  await expect(page.locator(".theme-toggle-btn")).toHaveCount(0);
  await expect(page.locator(".theme-segmented")).toHaveCount(0);
});

test("workspace plan button opens billing choices without leaving the app", async ({
  page,
}) => {
  await page.goto("/app");
  await expect(page.locator(".topbar .theme-toggle-btn")).toHaveCount(0);
  await page.getByRole("button", { name: "Conhecer os planos" }).click();
  await expect(
    page.getByRole("heading", { name: "Escolha seu plano" }),
  ).toBeVisible();
  await expect(
    page.getByRole("button", { name: "Assinar Noma Pro" }),
  ).toBeVisible();
  await expect(page.getByRole("button", { name: /Anual/ })).toBeVisible();
  await page.getByRole("button", { name: "Mensal" }).click();
  await expect(page.locator(".plan-card-pro .plan-price strong")).toHaveText(
    "R$ 19",
  );
});

test("official Flows expose their own experience journeys", async ({
  page,
}) => {
  await useProPlan(page);
  await page.goto("/app");
  const journeys = [
    {
      name: "Estude para o concurso",
      heading: "O que merece estudo agora",
      answers: {
        fields: {
          "Concurso ou processo seletivo": "Analista administrativo",
          "Data da prova": "2026-11-08",
          "Matérias prioritárias": "Português\nDireito administrativo",
          "Horas disponíveis por semana": "8",
        },
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
      heading: "Organizar estudos",
      answers: { fields: { "O que você quer realizar?": "Organizar estudos" } },
    },
    {
      name: "Planejando uma festa",
      heading: "O que importa neste momento",
      answers: { fields: { "Nome ou ocasião": "Festa de aniversário" } },
    },
    {
      name: "Aprendendo um novo idioma",
      heading: "O que importa neste momento",
      answers: {
        fields: {
          Idioma: "Italiano",
          "Nível atual": "Começando",
          "Práticas por semana": "3",
        },
      },
    },
    {
      name: "Domine as ferramentas de escritório",
      heading: "O que importa neste momento",
      answers: {
        fields: {
          "Resultado desejado": "Criar relatórios de trabalho",
          "Práticas por semana": "2",
        },
        multi: ["Planilhas"],
      },
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

test("Pro templates are visible to Free users but require the plan before onboarding", async ({
  page,
}) => {
  await page.goto("/app");
  const proCard = page
    .locator(".template-card")
    .filter({ hasText: "Novo emprego" });
  await expect(proCard.locator(".template-tier")).toHaveText("NOMA PRO");
  await proCard.getByRole("button", { name: /Conhecer Pro/ }).click();
  await expect(
    page.getByRole("heading", { name: "Escolha seu plano" }),
  ).toBeVisible();
  await expect(
    page.getByText(/Novo emprego faz parte dos Flows Noma Pro/),
  ).toBeVisible();
  await expect(page.getByLabel("Nome do Flow", { exact: true })).toHaveCount(0);
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
  await useProPlan(page);
  await page.goto("/app");
  await openOfficial(page, "Estude para o concurso");
  await page.getByRole("button", { name: "Continuar →" }).click();
  await page.getByRole("button", { name: "Continuar →" }).click();
  await page
    .getByLabel("Concurso ou processo seletivo")
    .fill("Analista administrativo");
  await page.getByRole("button", { name: "Continuar →" }).click();
  await page
    .getByLabel("Matérias prioritárias")
    .fill("Português\nDireito administrativo");
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
    page.getByRole("heading", {
      name: "O que você quer colocar em movimento?",
    }),
  ).toBeVisible();
  const second = await context.newPage();
  await second.goto("/app");
  await expect(second.getByRole("alert")).toContainText("outra aba");
  await page.close();
  await second.getByRole("button", { name: "Tentar novamente" }).click();
  await expect(
    second.getByRole("heading", {
      name: "O que você quer colocar em movimento?",
    }),
  ).toBeVisible();
});
