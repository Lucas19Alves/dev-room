const DAY = 86400000;

export const PROJECT_OBJECTIVES = [
  "Tirar ideia do papel",
  "Concluir MVP",
  "Evoluir projeto",
  "Criar funcionalidades",
  "Estabilizar/corrigir",
  "Preparar release",
  "Fazer deploy",
  "Retomar projeto",
];

export const PROJECT_TYPES = [
  "Site",
  "Aplicação web",
  "Aplicativo mobile",
  "API/serviço",
  "Automação",
  "Biblioteca/pacote",
  "Jogo",
  "Ferramenta interna",
  "Outro",
];

export const PROJECT_STAGES = [
  "Ideia",
  "Planejamento",
  "Implementação",
  "Validação",
  "Integração",
  "Release",
  "Deploy",
  "Manutenção",
  "Não sei ainda",
];

export const STACK_CATALOG = [
  "JavaScript",
  "TypeScript",
  "Python",
  "Java",
  "C#",
  "C++",
  "Go",
  "Rust",
  "PHP",
  "Ruby",
  "Swift",
  "Kotlin",
  "Dart",
  "HTML",
  "CSS",
  "Vue",
  "React",
  "Angular",
  "Svelte",
  "Nuxt",
  "Next.js",
  "Node.js",
  "Express",
  "NestJS",
  "Vite",
  "Tailwind CSS",
  "Bootstrap",
  "Sass",
  "Pinia",
  "Supabase",
  "Firebase",
  "PostgreSQL",
  "MySQL",
  "MongoDB",
  "Redis",
  "SQLite",
  "Prisma",
  "Drizzle",
  "Docker",
  "Kubernetes",
  "AWS",
  "Azure",
  "Google Cloud",
  "Cloudflare",
  "Vercel",
  "Netlify",
  "Playwright",
  "Vitest",
  "Jest",
  "GitHub Actions",
];

const deviconIds = {
  JavaScript: "javascript",
  TypeScript: "typescript",
  Python: "python",
  Java: "java",
  "C#": "csharp",
  "C++": "cplusplus",
  Go: "go",
  Rust: "rust",
  PHP: "php",
  Ruby: "ruby",
  Swift: "swift",
  Kotlin: "kotlin",
  Dart: "dart",
  HTML: "html5",
  CSS: "css3",
  Vue: "vuejs",
  React: "react",
  Angular: "angular",
  Svelte: "svelte",
  Nuxt: "nuxtjs",
  "Next.js": "nextjs",
  "Node.js": "nodejs",
  Express: "express",
  NestJS: "nestjs",
  Vite: "vitejs",
  "Tailwind CSS": "tailwindcss",
  Bootstrap: "bootstrap",
  Sass: "sass",
  Pinia: "pinia",
  Supabase: "supabase",
  Firebase: "firebase",
  PostgreSQL: "postgresql",
  MySQL: "mysql",
  MongoDB: "mongodb",
  Redis: "redis",
  SQLite: "sqlite",
  Prisma: "prisma",
  Drizzle: "drizzle",
  Docker: "docker",
  Kubernetes: "kubernetes",
  AWS: "amazonwebservices",
  Azure: "azure",
  "Google Cloud": "googlecloud",
  Cloudflare: "cloudflare",
  Vercel: "vercel",
  Netlify: "netlify",
  Playwright: "playwright",
  Vitest: "vitest",
  Jest: "jest",
  "GitHub Actions": "githubactions",
};

// Labels and identifiers follow the local Devicon catalog; unknown user entries remain valid custom values.
export const DEVICON_STACK_CATALOG = STACK_CATALOG.map((name) => ({
  name,
  iconClass: `devicon-${deviconIds[name] || name.toLowerCase().replace(/[^a-z0-9]+/g, "")}-plain`,
}));

const modulesByObjective = {
  "Tirar ideia do papel": [
    [
      "Dar forma à ideia",
      "planning",
      "Descreva o problema, para quem existe e qual mudança você quer ver.",
    ],
    [
      "Definir o menor recorte útil",
      "planning",
      "Escolha um resultado pequeno que possa ser validado.",
    ],
    [
      "Construir um primeiro caminho",
      "implementation",
      "Implemente o menor fluxo que demonstra a ideia.",
    ],
    [
      "Validar com um cenário real",
      "validation",
      "Confira se o caminho resolve o problema escolhido.",
    ],
    [
      "Preparar uma entrega inicial",
      "release",
      "Registre o que está pronto e o que fica para depois.",
    ],
  ],
  "Concluir MVP": [
    [
      "Confirmar o escopo do MVP",
      "planning",
      "Defina o que precisa existir para a versão ser útil.",
    ],
    [
      "Implementar o fluxo principal",
      "implementation",
      "Conclua o percurso central antes de ampliar o escopo.",
    ],
    [
      "Validar os caminhos essenciais",
      "validation",
      "Teste os cenários de sucesso e os erros mais prováveis.",
    ],
    [
      "Integrar a versão",
      "integration",
      "Reúna as partes e verifique o comportamento em conjunto.",
    ],
    [
      "Publicar o MVP",
      "deployment",
      "Prepare e disponibilize uma versão utilizável.",
    ],
  ],
  "Evoluir projeto": [
    [
      "Entender o estado atual",
      "planning",
      "Revise o que existe, o que funciona e o que pede evolução.",
    ],
    [
      "Escolher o próximo incremento",
      "planning",
      "Priorize uma melhoria por impacto e esforço.",
    ],
    [
      "Implementar a evolução",
      "implementation",
      "Faça uma mudança pequena e observável.",
    ],
    [
      "Verificar regressões",
      "validation",
      "Confirme o novo comportamento e proteja os caminhos existentes.",
    ],
    [
      "Integrar e observar",
      "integration",
      "Entregue a melhoria e registre o que aprendeu.",
    ],
  ],
  "Criar funcionalidades": [
    [
      "Desenhar o comportamento esperado",
      "planning",
      "Defina quem usa, o que acontece e como saber que funcionou.",
    ],
    [
      "Implementar a funcionalidade",
      "implementation",
      "Construa o caminho principal com o menor escopo possível.",
    ],
    [
      "Validar critérios e erros",
      "validation",
      "Teste os critérios de conclusão e os casos de falha.",
    ],
    [
      "Integrar ao projeto",
      "integration",
      "Conecte a funcionalidade aos fluxos existentes.",
    ],
  ],
  "Estabilizar/corrigir": [
    [
      "Mapear falhas e riscos",
      "stability",
      "Registre sintomas, frequência e impacto antes de corrigir.",
    ],
    [
      "Corrigir o risco prioritário",
      "implementation",
      "Escolha uma causa e faça uma correção isolada.",
    ],
    [
      "Executar regressão",
      "validation",
      "Verifique a correção e os caminhos próximos.",
    ],
    [
      "Observar a estabilidade",
      "monitoring",
      "Acompanhe o comportamento após a correção.",
    ],
  ],
  "Preparar release": [
    [
      "Revisar o conteúdo da release",
      "planning",
      "Confirme escopo, mudanças e itens que ficam de fora.",
    ],
    [
      "Fechar pendências de release",
      "implementation",
      "Resolva os itens necessários para disponibilizar a versão.",
    ],
    [
      "Validar a versão candidata",
      "validation",
      "Faça uma verificação final dos caminhos e ambientes.",
    ],
    [
      "Preparar notas e rollback",
      "release",
      "Registre mudanças, riscos e como voltar atrás.",
    ],
    [
      "Publicar a release",
      "deployment",
      "Disponibilize a versão e confirme o resultado.",
    ],
  ],
  "Fazer deploy": [
    [
      "Conferir o ambiente de destino",
      "planning",
      "Verifique variáveis, permissões e configuração do ambiente.",
    ],
    [
      "Preparar artefato e configuração",
      "release",
      "Gere a versão e confira o que será publicado.",
    ],
    [
      "Executar o deploy",
      "deployment",
      "Publique a versão no ambiente escolhido.",
    ],
    [
      "Validar a aplicação publicada",
      "validation",
      "Faça uma verificação rápida dos caminhos essenciais.",
    ],
  ],
  "Retomar projeto": [
    [
      "Reconstruir o contexto atual",
      "planning",
      "Registre o que existe, o que mudou e o que ficou pendente.",
    ],
    [
      "Escolher um próximo passo viável",
      "planning",
      "Selecione uma ação pequena que retome o movimento.",
    ],
    [
      "Retomar a implementação",
      "implementation",
      "Continue do ponto mais concreto disponível.",
    ],
    [
      "Validar o estado retomado",
      "validation",
      "Confira o que ainda funciona e atualize o contexto.",
    ],
  ],
};

const typeModules = {
  Site: [
    "Conferir navegação e conteúdo",
    "validation",
    "Revise navegação, leitura e comportamento em telas pequenas.",
  ],
  "Aplicação web": [
    "Conferir fluxos e estados",
    "validation",
    "Revise estados de carregamento, vazio, erro e sucesso.",
  ],
  "Aplicativo mobile": [
    "Validar em dispositivos",
    "validation",
    "Confira toque, tamanhos de tela e permissões necessárias.",
  ],
  "API/serviço": [
    "Validar contrato e respostas",
    "validation",
    "Confira contratos, erros, autenticação e limites.",
  ],
  Automação: [
    "Testar execução e recuperação",
    "validation",
    "Confira entradas, falhas recuperáveis e execução repetida.",
  ],
  "Biblioteca/pacote": [
    "Validar instalação e exemplo",
    "validation",
    "Confira instalação, uso principal e documentação mínima.",
  ],
  Jogo: [
    "Validar ciclo de jogo",
    "validation",
    "Confira controles, progressão e recuperação do estado.",
  ],
  "Ferramenta interna": [
    "Validar o fluxo operacional",
    "validation",
    "Teste o caminho de ponta a ponta com dados representativos.",
  ],
};

const stageAliases = {
  Ideia: ["planning"],
  Planejamento: ["planning"],
  Escopo: ["planning"],
  Implementação: ["implementation"],
  Construção: ["implementation"],
  Validação: ["validation", "stability"],
  Testes: ["validation"],
  Integração: ["integration"],
  Release: ["release"],
  Deploy: ["deployment"],
  Manutenção: ["monitoring", "stability"],
  Iteração: ["implementation", "monitoring"],
};

const stageOrder = {
  planning: 0,
  stability: 1,
  implementation: 1,
  validation: 2,
  integration: 3,
  release: 4,
  deployment: 5,
  monitoring: 6,
  decision: 0,
};

const stageLabels = {
  planning: "Planejamento",
  stability: "Correção",
  implementation: "Implementação",
  validation: "Validação",
  integration: "Integração",
  release: "Preparação da versão",
  deployment: "Publicação",
  monitoring: "Acompanhamento",
  decision: "Decisão",
};

export const PROJECT_SIZE_SESSIONS = {
  Pequena: 1,
  Média: 3,
  Grande: 6,
};

export const FEATURE_AREAS = [
  "Interface",
  "Autenticação",
  "API",
  "Dados",
  "Integração",
  "Infra",
  "Pagamentos",
  "Qualidade",
  "Outro",
];

const checklistByType = {
  planning: [
    "Definir o resultado esperado",
    "Listar o que entra e o que fica para depois",
    "Escolher o próximo passo concreto",
  ],
  implementation: [
    "Confirmar o comportamento esperado",
    "Construir o caminho principal",
    "Revisar o que foi alterado",
  ],
  validation: [
    "Testar o caminho principal",
    "Testar erros e casos alternativos",
    "Registrar o que precisa ser corrigido",
  ],
  integration: [
    "Conectar a mudança ao restante do projeto",
    "Verificar se os caminhos existentes continuam funcionando",
    "Confirmar que a mudança está pronta para seguir",
  ],
  release: [
    "Revisar o que será entregue",
    "Registrar mudanças e riscos",
    "Preparar uma forma segura de desfazer a mudança",
  ],
  deployment: [
    "Conferir configurações e acessos",
    "Publicar a versão",
    "Abrir a versão publicada e conferir o essencial",
  ],
  stability: [
    "Reproduzir o problema",
    "Corrigir a causa principal",
    "Confirmar que o problema não voltou",
  ],
  monitoring: [
    "Definir o que precisa ser observado",
    "Conferir sinais e erros",
    "Registrar o resultado do acompanhamento",
  ],
  decision: [
    "Reunir as opções",
    "Comparar impactos e limites",
    "Registrar a escolha",
  ],
};

const featureChecklistByArea = {
  Interface: [
    "Conferir estados de carregamento, vazio e erro",
    "Testar em telas pequenas e grandes",
  ],
  Autenticação: [
    "Testar entrada e saída da conta",
    "Testar acesso negado e recuperação",
  ],
  API: ["Definir entradas e respostas", "Testar erros, autenticação e limites"],
  Dados: [
    "Revisar regras e migração dos dados",
    "Testar leitura, gravação e recuperação",
  ],
  Integração: [
    "Validar credenciais e ambiente de teste",
    "Testar falha e nova tentativa",
  ],
  Infra: [
    "Conferir variáveis, acessos e ambientes",
    "Validar logs e forma de recuperação",
  ],
  Pagamentos: [
    "Testar pagamento aprovado, recusado e cancelado",
    "Confirmar eventos e atualização do acesso",
  ],
  Qualidade: [
    "Definir os cenários essenciais",
    "Automatizar ou registrar a verificação",
  ],
  Outro: ["Definir o comportamento principal", "Testar o resultado esperado"],
};

const checklistItems = (items = []) =>
  items.map((text) => ({ id: makeId(), text, done: false }));

function sizeForType(type) {
  return ["implementation", "validation", "integration", "stability"].includes(
    type,
  )
    ? "Média"
    : "Pequena";
}

function sessionsForSize(value, fallback = null) {
  if (PROJECT_SIZE_SESSIONS[value]) return PROJECT_SIZE_SESSIONS[value];
  const numeric = Number(value);
  return numeric > 0 ? numeric : fallback;
}

function dependenciesCompleted(project, step) {
  return (step.dependencies || []).every((id) => {
    const dependency = project.steps.find((item) => item.id === id);
    return (
      !dependency || ["completed", "dismissed"].includes(dependency.status)
    );
  });
}

export function projectNextStep(project, afterOrder = -1) {
  const available = [...(project?.steps || [])]
    .filter(
      (step) =>
        step.status === "planned" && dependenciesCompleted(project, step),
    )
    .sort((a, b) => a.order - b.order);
  return (
    available.find((step) => step.order > afterOrder) || available[0] || null
  );
}

export function deriveProjectStage(project) {
  const steps = [...(project?.steps || [])].sort((a, b) => a.order - b.order);
  const focus =
    steps.find((step) => step.isFocus && step.status === "active") ||
    steps.find((step) => step.status === "active");
  if (focus) return stageLabels[focus.type] || "Em andamento";
  const next = projectNextStep(project);
  if (next) return stageLabels[next.type] || "Próximo passo";
  if (
    steps.length &&
    steps.every((step) => ["completed", "dismissed"].includes(step.status))
  )
    return "Concluído";
  const latest = [...steps]
    .reverse()
    .find((step) => step.status === "completed");
  return latest ? stageLabels[latest.type] || "Em andamento" : "Planejamento";
}

const outcomeOptions = {
  "Tirar ideia do papel": [
    "Protótipo que demonstra a ideia",
    "Primeiro fluxo utilizável",
    "Versão inicial publicada",
  ],
  "Concluir MVP": [
    "Fluxo principal funcionando",
    "MVP validado por alguém",
    "MVP publicado",
  ],
  "Evoluir projeto": [
    "Melhoria entregue",
    "Próxima versão publicada",
    "Mudança validada em uso",
  ],
  "Criar funcionalidades": [
    "Funcionalidade utilizável",
    "Funcionalidade testada e integrada",
    "Funcionalidade publicada",
  ],
  "Estabilizar/corrigir": [
    "Falha prioritária corrigida",
    "Caminhos críticos estáveis",
    "Versão estável publicada",
  ],
  "Preparar release": [
    "Versão candidata validada",
    "Release publicada",
    "Release observada em produção",
  ],
  "Fazer deploy": [
    "Aplicação publicada",
    "Deploy validado no ambiente final",
    "Deploy com monitoramento confirmado",
  ],
  "Retomar projeto": [
    "Contexto recuperado e próximo passo executado",
    "Versão retomada e validada",
    "Projeto novamente em movimento",
  ],
};

const outcomeByType = {
  "API/serviço": "Endpoints essenciais testados",
  Automação: "Fluxo automatizado executado com sucesso",
  "Biblioteca/pacote": "Pacote instalável com exemplo funcional",
  "Aplicativo mobile": "Fluxo principal funcionando em dispositivo",
  "Aplicação web": "Fluxo principal funcionando",
  Site: "Páginas principais acessíveis e publicadas",
  Jogo: "Ciclo jogável funcionando do início ao fim",
};

export function projectOutcomeOptions(objective, projectTypes = []) {
  const options = [
    ...(outcomeOptions[objective] || outcomeOptions["Evoluir projeto"]),
  ];
  const tailored = [...projectTypes]
    .map((type) => outcomeByType[type])
    .filter(Boolean);
  return [...new Set([...tailored, ...options])];
}

const makeId = () =>
  globalThis.crypto?.randomUUID?.() ||
  `step-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;
const isoDay = (value) => {
  if (!value) return "";
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "";
  const local = new Date(date.getTime() - date.getTimezoneOffset() * 60000);
  return local.toISOString().slice(0, 10);
};
const dateForDays = (days, now) => isoDay(now + days * DAY);
const dateFromWindow = (window, specificDate, now = Date.now()) => {
  if (window === "Data específica") return specificDate || "";
  if (window === "Esta semana") return dateForDays(3, now);
  if (window === "Próxima semana") return dateForDays(7, now);
  return "";
};

function targetDateFor(answers, now) {
  if (answers.targetWindow === "Data específica")
    return answers.targetDate || "";
  const days = { "7 dias": 7, "2 semanas": 14, "1 mês": 30, "3 meses": 90 }[
    answers.targetWindow
  ];
  return days ? dateForDays(days, now) : "";
}

function startDateFor(answers, now) {
  if (answers.startWhen === "Data específica") return answers.startDate || "";
  const days = { Hoje: 0, "Esta semana": 2, "Próxima semana": 7 }[
    answers.startWhen
  ];
  return days === undefined ? "" : dateForDays(days, now);
}

function dueDatesFor(count, startAt, targetAt, now) {
  if (!targetAt || !count) return [];
  const startTime = startAt ? new Date(`${startAt}T12:00:00`).getTime() : now;
  const endTime = new Date(`${targetAt}T12:00:00`).getTime();
  const base = Number.isFinite(startTime) ? startTime : Date.now();
  if (!Number.isFinite(endTime) || endTime < base)
    return Array(count).fill(targetAt);
  return Array.from({ length: count }, (_, index) =>
    isoDay(base + ((endTime - base) * (index + 1)) / count),
  );
}

function moduleStep(
  [title, type, objective, moduleSource = "objective"],
  index,
  answers,
  date,
  source = moduleSource,
) {
  const standardTools = ["notes", "links", "focus"];
  if (["implementation", "validation", "integration"].includes(type))
    standardTools.push("snippets", "playground");
  if (["release", "deployment", "monitoring"].includes(type))
    standardTools.push("deploy");
  const sizeLabel = sizeForType(type);
  return {
    id: makeId(),
    title,
    type,
    objective,
    order: index,
    status: "planned",
    isFocus: false,
    dueAt: date || "",
    dateWindow: date ? "flexible" : "none",
    dependencies: [],
    size: PROJECT_SIZE_SESSIONS[sizeLabel],
    sizeLabel,
    tools: [...new Set([...standardTools, ...(answers.stack || [])])],
    checklist: checklistItems(
      checklistByType[type] || checklistByType.planning,
    ),
    notes: "",
    links: [],
    snippets: [],
    scratchpad: "",
    deployUrl: "",
    sessionIds: [],
    source,
    createdAt: Date.now(),
    updatedAt: Date.now(),
  };
}

export function createProjectWorkspace(rawAnswers = {}, now = Date.now()) {
  const answers = { ...rawAnswers };
  const objective = answers.projectObjective || "Evoluir projeto";
  const types = Array.isArray(answers.projectType)
    ? answers.projectType
    : answers.projectType
      ? [answers.projectType]
      : [];
  const stack = Array.isArray(answers.stack)
    ? answers.stack
    : String(answers.stack || "")
        .split(/[\n,;]+/)
        .map((item) => item.trim())
        .filter(Boolean);
  const startAt = startDateFor(answers, now);
  const targetAt = targetDateFor(answers, now);
  let modules = [
    ...(modulesByObjective[objective] || modulesByObjective["Evoluir projeto"]),
  ];
  for (const typeModule of types
    .map((type) => typeModules[type])
    .filter(Boolean)) {
    if (modules.some(([title]) => title === typeModule[0])) continue;
    const validationIndex = modules.findIndex(
      ([, type]) => type === "validation",
    );
    modules.splice(
      validationIndex < 0 ? modules.length : validationIndex,
      0,
      typeModule,
    );
  }
  const currentKinds = stageAliases[answers.currentStage] || [];
  if (currentKinds.length) {
    const currentIndex = modules.findIndex(([, kind]) =>
      currentKinds.includes(kind),
    );
    if (currentIndex >= 0) modules = modules.slice(currentIndex);
    else {
      const currentRank = Math.min(
        ...currentKinds.map((kind) => stageOrder[kind] ?? 0),
      );
      modules = modules.filter(
        ([, kind]) => (stageOrder[kind] ?? 0) >= currentRank,
      );
    }
  }
  if (answers.currentStage && answers.currentStage !== "Não sei ainda") {
    const kind = currentKinds[0] || "planning";
    modules.unshift([
      `Entender o ponto atual: ${answers.currentStage}`,
      kind,
      `Confira o que já está pronto, o que falta e escolha o próximo passo.`,
      "current-stage",
    ]);
  }
  const focusIndex = 0;
  const dates = dueDatesFor(modules.length, startAt, targetAt, now);
  const steps = modules.map((module, index) => {
    const step = moduleStep(
      module,
      index,
      { ...answers, stack },
      dates[index] || "",
    );
    if (index === focusIndex) {
      step.status = "active";
      step.isFocus = true;
    }
    return step;
  });
  if (!String(answers.projectName || "").trim()) {
    steps.unshift({
      ...moduleStep(
        [
          "Definir o nome do projeto",
          "decision",
          "Escolha um nome que represente este projeto e facilite encontrá-lo.",
        ],
        0,
        { stack },
        "",
        "onboarding",
      ),
      status: "decision",
      decisionRequired: "Que nome representa este projeto?",
      isFocus: false,
    });
    steps.forEach((step, index) => {
      step.order = index;
    });
  }
  const workspace = {
    schemaVersion: 2,
    projectName: String(answers.projectName || "").trim() || "Projeto sem nome",
    objective,
    description: answers.projectGoal || "",
    projectTypes: types,
    stack,
    startAt,
    targetAt,
    targetWindow: answers.targetWindow || "Sem prazo",
    intendedOutcome: answers.intendedOutcome || "",
    declaredInitialStage: answers.currentStage || "Não sei ainda",
    derivedStage: "Planejamento",
    currentStage: answers.currentStage || "Não sei ainda",
    sessionDuration: answers.sessionDuration || "25 minutos",
    repositoryUrl: answers.repositoryUrl || "",
    features: [],
    steps,
  };
  workspace.derivedStage = deriveProjectStage(workspace);
  workspace.currentStage = workspace.derivedStage;
  return workspace;
}

function oldStatus(status) {
  const value = String(status || "").toLowerCase();
  if (["concluído", "concluída", "completed", "done"].includes(value))
    return "completed";
  if (["bloqueado", "blocked"].includes(value)) return "blocked";
  if (["decisão", "decision"].includes(value)) return "decision";
  if (["dispensado", "dismissed"].includes(value)) return "dismissed";
  if (["em andamento", "active", "current"].includes(value)) return "active";
  return "planned";
}

export function ensureProjectWorkspace(flow) {
  if (!flow || flow.definitionRef?.id !== "code") return null;
  flow.componentData ||= {};
  const current = flow.componentData.codeProject;
  if (current && Array.isArray(current.steps)) {
    current.schemaVersion = 2;
    current.declaredInitialStage ||=
      current.currentStage ||
      flow.onboarding?.answers?.currentStage ||
      "Não sei ainda";
    current.features ||= [];
    current.steps.forEach((step) => {
      step.dependencies ||= [];
      if (
        step.source !== "manual" &&
        !step.featureId &&
        (!Array.isArray(step.checklist) || !step.checklist.length)
      )
        step.checklist = checklistItems(
          checklistByType[step.type] || checklistByType.planning,
        );
      if (step.source !== "manual" && !(Number(step.size) > 0)) {
        step.sizeLabel = sizeForType(step.type);
        step.size = PROJECT_SIZE_SESSIONS[step.sizeLabel];
      } else if (!step.sizeLabel && Number(step.size) > 0) {
        step.sizeLabel =
          Number(step.size) <= 1
            ? "Pequena"
            : Number(step.size) >= 6
              ? "Grande"
              : "Média";
      }
    });
    current.derivedStage = deriveProjectStage(current);
    current.currentStage = current.derivedStage;
    return current;
  }
  const answers = flow.onboarding?.answers || {};
  const workspace = createProjectWorkspace(
    {
      projectName:
        answers.projectName ||
        (flow.identity?.name !== "Projeto sem nome" ? flow.identity?.name : ""),
      projectGoal: answers.projectGoal || flow.objective,
      projectObjective: answers.projectObjective || "Evoluir projeto",
      projectType: answers.projectType || [],
      stack: answers.stack || [],
      currentStage: answers.currentStage || "Não sei ainda",
      startWhen: answers.startWhen || "Sem data",
      targetWindow: answers.targetWindow || "Sem prazo",
      targetDate: answers.targetDate || answers.deadline || "",
      sessionDuration:
        answers.sessionDuration ||
        `${flow.properties?.focusMinutes || 25} minutos`,
      repositoryUrl: answers.repositoryUrl || "",
    },
    flow.createdAt || Date.now(),
  );
  const tracker = flow.componentData.tracker?.items || [];
  for (const legacyStage of flow.stages || []) {
    if (workspace.steps.some((step) => step.legacyId === legacyStage.id))
      continue;
    const wasCurrent = ["current", "active"].includes(legacyStage.status);
    workspace.steps.push({
      ...moduleStep(
        [
          legacyStage.title || "Etapa recuperada",
          "implementation",
          legacyStage.description || "Etapa migrada do roadmap anterior.",
        ],
        workspace.steps.length,
        { stack: workspace.stack },
        legacyStage.dueAt || "",
        "legacy-roadmap",
      ),
      id: makeId(),
      legacyId: legacyStage.id,
      legacyStatus: legacyStage.status || "upcoming",
      status: wasCurrent ? "active" : "planned",
      isFocus: wasCurrent,
    });
  }
  for (const item of tracker) {
    if (workspace.steps.some((step) => step.legacyId === item.id)) continue;
    const values = item.values || {};
    const isDecision = values.kind === "Decisão";
    workspace.steps.push({
      ...moduleStep(
        [
          values.title || values.topic || "Etapa recuperada",
          isDecision ? "decision" : "implementation",
          values.notes || "Conteúdo migrado do acompanhamento anterior.",
        ],
        workspace.steps.length,
        { stack: workspace.stack },
        values.dueAt || "",
        "legacy-tracker",
      ),
      id: makeId(),
      legacyId: item.id,
      status: oldStatus(item.status),
      notes: values.notes || "",
      links: values.link ? [{ title: "Referência", url: values.link }] : [],
      ...(isDecision
        ? {
            decisionRequired:
              values.notes || "Revise a decisão registrada anteriormente.",
          }
        : {}),
    });
  }
  for (const column of flow.componentData.kanban || [])
    for (const card of column.cards || []) {
      if (workspace.features.some((feature) => feature.legacyId === card.id))
        continue;
      workspace.features.push({
        id: makeId(),
        legacyId: card.id,
        name: card.title || "Funcionalidade recuperada",
        area: "",
        tools: [...workspace.stack],
        dueAt: "",
        size: null,
        status: oldStatus(
          column.title === "Concluído" ? "completed" : "planned",
        ),
        completionCriteria: card.description || "",
        checkpoints: [],
      });
    }
  const tasks = flow.componentData.tasks?.items || [];
  for (const item of tasks) {
    if (workspace.steps.some((step) => step.legacyId === item.id)) continue;
    workspace.steps.push({
      ...moduleStep(
        [
          item.text || "Passo recuperado",
          "implementation",
          `Migrado do grupo ${item.group || "anterior"}.`,
        ],
        workspace.steps.length,
        { stack: workspace.stack },
        "",
        "legacy-task",
      ),
      id: makeId(),
      legacyId: item.id,
      status: item.done ? "completed" : "planned",
    });
  }
  workspace.steps.forEach((step, index) => {
    step.order = index;
  });
  if (
    !workspace.steps.some((step) => step.isFocus && step.status === "active")
  ) {
    const firstPlanned = workspace.steps.find(
      (step) => step.status === "planned",
    );
    if (firstPlanned) {
      firstPlanned.status = "active";
      firstPlanned.isFocus = true;
    }
  }
  flow.componentData.codeProject = workspace;
  return workspace;
}

function event(flow, step, type, extra = {}) {
  flow.events ||= [];
  flow.events.push({
    id: makeId(),
    type,
    source: "project-step",
    sourceId: step.id,
    flowId: flow.id,
    at: Date.now(),
    ...extra,
  });
  step.updatedAt = Date.now();
}

export function addProjectStage(flow, input) {
  const project = ensureProjectWorkspace(flow);
  const title = String(input.name || "").trim();
  if (!title) throw new Error("Informe o nome da etapa.");
  if (input.status === "blocked" && !String(input.blockedReason || "").trim())
    throw new Error("Explique o que está bloqueando esta etapa.");
  if (
    input.status === "decision" &&
    !String(input.decisionRequired || "").trim()
  )
    throw new Error("Descreva a decisão que precisa ser tomada.");
  const dueAt =
    input.dueAt || dateFromWindow(input.dueWindow, input.specificDate);
  const dateWindow =
    {
      "Esta semana": "this_week",
      "Próxima semana": "next_week",
      "Data específica": "specific",
    }[input.dueWindow] || (dueAt ? "specific" : "none");
  const sizeLabel = PROJECT_SIZE_SESSIONS[input.size]
    ? input.size
    : input.sizeLabel || "";
  const step = {
    ...moduleStep(
      [title, input.type || "implementation", input.objective || ""],
      project.steps.length,
      { stack: project.stack },
      dueAt,
      "manual",
    ),
    status: input.status || "planned",
    dateWindow,
    isFocus: false,
    dependencies: input.dependencies || [],
    size: sessionsForSize(input.size, null),
    sizeLabel,
    blockedReason: input.blockedReason || "",
    decisionRequired: input.decisionRequired || "",
    tools: [
      ...new Set([
        ...(input.tools || project.stack),
        "notes",
        "links",
        "focus",
      ]),
    ],
  };
  project.steps.push(step);
  project.steps.forEach((item, index) => {
    item.order = index;
  });
  event(flow, step, "project_step_created");
  project.derivedStage = deriveProjectStage(project);
  project.currentStage = project.derivedStage;
  return step;
}

export function addProjectFeature(flow, input) {
  const project = ensureProjectWorkspace(flow);
  const name = String(input.name || "").trim();
  if (!name) throw new Error("Informe o nome da funcionalidade.");
  if (input.status === "blocked" && !String(input.blockedReason || "").trim())
    throw new Error("Explique o que está bloqueando esta funcionalidade.");
  if (
    input.status === "decision" &&
    !String(input.decisionRequired || "").trim()
  )
    throw new Error("Descreva a decisão necessária para esta funcionalidade.");
  const dueAt =
    input.dueAt || dateFromWindow(input.dueWindow, input.specificDate);
  const featureId = makeId();
  const checkpoints = ["Planejar", "Implementar", "Validar", "Integrar"].map(
    (title, index) => ({
      id: makeId(),
      title,
      status: index === 0 ? "active" : "planned",
    }),
  );
  const feature = {
    id: featureId,
    name,
    area: FEATURE_AREAS.includes(input.area)
      ? input.area
      : input.area || "Outro",
    tools: input.tools || [...project.stack],
    dueAt,
    dateWindow: input.dueWindow || (dueAt ? "Data específica" : "Sem data"),
    size: sessionsForSize(input.size, PROJECT_SIZE_SESSIONS.Média),
    sizeLabel: PROJECT_SIZE_SESSIONS[input.size] ? input.size : "Média",
    status: input.status || "planned",
    dependencies: input.dependencies || [],
    blockedReason: input.blockedReason || "",
    decisionRequired: input.decisionRequired || "",
    completionCriteria: input.completionCriteria || "",
    checkpoints,
    createdAt: Date.now(),
  };
  project.features.push(feature);
  const parent = addProjectStage(flow, {
    name,
    type: "implementation",
    objective:
      input.completionCriteria ||
      `Concluir a funcionalidade${input.area ? ` em ${input.area}` : ""}.`,
    dueAt,
    dueWindow: input.dueWindow,
    specificDate: input.specificDate,
    tools: feature.tools,
    status: input.status,
    dependencies: input.dependencies,
    size: input.size || "Média",
    blockedReason: input.blockedReason,
    decisionRequired: input.decisionRequired,
  });
  parent.featureId = featureId;
  parent.sizeLabel = feature.sizeLabel;
  parent.size = feature.size;
  parent.checklist = [
    ...checkpoints.map((checkpoint) => ({
      id: checkpoint.id,
      text: checkpoint.title,
      done: false,
    })),
    ...checklistItems(
      featureChecklistByArea[feature.area] || featureChecklistByArea.Outro,
    ),
  ];
  return feature;
}

export function setProjectStepState(flow, stepId, status, details = {}) {
  const project = ensureProjectWorkspace(flow);
  const step = project.steps.find((item) => item.id === stepId);
  if (!step) throw new Error("Etapa não encontrada.");
  if (
    ![
      "planned",
      "active",
      "blocked",
      "decision",
      "completed",
      "dismissed",
    ].includes(status)
  )
    throw new Error("Estado de etapa inválido.");
  if (
    status === "blocked" &&
    !String(details.blockedReason ?? step.blockedReason ?? "").trim()
  )
    throw new Error("Explique o que está bloqueando esta etapa.");
  if (
    status === "decision" &&
    !String(details.decisionRequired ?? step.decisionRequired ?? "").trim()
  )
    throw new Error("Descreva a decisão que precisa ser tomada.");
  const previous = step.status;
  step.status = status;
  if (details.blockedReason !== undefined)
    step.blockedReason = details.blockedReason;
  if (details.decisionRequired !== undefined)
    step.decisionRequired = details.decisionRequired;
  if (status === "completed") step.completedAt = Date.now();
  const feature = project.features.find((item) => item.id === step.featureId);
  if (feature) feature.status = status;
  if (status === "active") {
    project.steps.forEach((item) => {
      if (item.id !== step.id) item.isFocus = false;
    });
    step.isFocus = true;
  } else if (["completed", "dismissed"].includes(status) && step.isFocus) {
    step.isFocus = false;
    const next = projectNextStep(project, step.order);
    if (next) {
      const previousNextStatus = next.status;
      next.status = "active";
      next.isFocus = true;
      event(flow, next, "project_step_activated", {
        previous: previousNextStatus,
        status: "active",
      });
    }
  }
  event(flow, step, "project_step_state_changed", { previous, status });
  project.derivedStage = deriveProjectStage(project);
  project.currentStage = project.derivedStage;
  return step;
}

export function rescheduleProjectStep(flow, stepId, choice, specificDate = "") {
  const project = ensureProjectWorkspace(flow);
  const step = project.steps.find((item) => item.id === stepId);
  if (!step) throw new Error("Etapa não encontrada.");
  if (choice === "remover") {
    step.dueAt = "";
    step.dateWindow = "none";
  } else if (choice === "data") {
    if (!specificDate) throw new Error("Escolha uma data.");
    step.dueAt = specificDate;
    step.dateWindow = "flexible";
  } else if (choice === "esta-semana") {
    step.dueAt = dateForDays(3, Date.now());
    step.dateWindow = "this_week";
  } else if (choice === "proxima-semana") {
    step.dueAt = dateForDays(7, Date.now());
    step.dateWindow = "next_week";
  } else throw new Error("Opção de replanejamento inválida.");
  event(flow, step, "project_step_rescheduled", { dueAt: step.dueAt });
  return step;
}

export function rescheduleProjectTarget(flow, choice, specificDate = "") {
  const project = ensureProjectWorkspace(flow);
  const targetAt = dateFromWindow(
    choice === "remover"
      ? "Sem data"
      : choice === "esta-semana"
        ? "Esta semana"
        : choice === "proxima-semana"
          ? "Próxima semana"
          : "Data específica",
    specificDate,
  );
  if (choice === "data" && !specificDate) throw new Error("Escolha uma data.");
  if (!["remover", "esta-semana", "proxima-semana", "data"].includes(choice))
    throw new Error("Opção de replanejamento inválida.");
  project.targetAt = targetAt;
  project.targetWindow =
    choice === "remover"
      ? "Sem prazo"
      : choice === "esta-semana"
        ? "Esta semana"
        : choice === "proxima-semana"
          ? "Próxima semana"
          : "Data específica";
  flow.properties.targetDate = targetAt;
  flow.events ||= [];
  flow.events.push({
    id: makeId(),
    type: "project_target_rescheduled",
    source: "project-target",
    flowId: flow.id,
    at: Date.now(),
    targetAt,
  });
  return project;
}

export function projectInsights(flow, now = Date.now()) {
  const project = ensureProjectWorkspace(flow);
  const steps = project.steps;
  const completed = steps.filter((step) => step.status === "completed");
  const active = steps.filter((step) => step.status === "active");
  const blocked = steps.filter((step) => step.status === "blocked");
  const decisions = steps.filter((step) => step.status === "decision");
  const overdue = steps.filter(
    (step) =>
      step.dueAt &&
      new Date(`${step.dueAt}T23:59:59`).getTime() < now &&
      !["completed", "dismissed"].includes(step.status),
  );
  const targetOverdue = Boolean(
    project.targetAt &&
    new Date(`${project.targetAt}T23:59:59`).getTime() < now &&
    steps.some((step) => !["completed", "dismissed"].includes(step.status)),
  );
  const sessions = flow.sessions || [];
  const minutes = Math.round(
    sessions.reduce((sum, session) => sum + (Number(session.seconds) || 0), 0) /
      60,
  );
  const sizedRemaining = steps.filter(
    (step) =>
      !["completed", "dismissed"].includes(step.status) &&
      Number(step.size) > 0,
  );
  const remainingSessions = sizedRemaining.length
    ? sizedRemaining.reduce((sum, step) => sum + Number(step.size), 0)
    : null;
  const datedSessions = sessions
    .filter(
      (session) =>
        Number(session.seconds) > 0 && Number.isFinite(Number(session.endedAt)),
    )
    .sort((a, b) => Number(a.endedAt) - Number(b.endedAt));
  const historyDays = datedSessions.length
    ? Math.max(1, (now - Number(datedSessions[0].endedAt)) / DAY)
    : 0;
  const historySufficient = datedSessions.length >= 3 && historyDays >= 7;
  const focusSessionsPerWeek = historySufficient
    ? Math.round((datedSessions.length / (historyDays / 7)) * 10) / 10
    : null;
  const estimateAt =
    focusSessionsPerWeek && remainingSessions !== null
      ? now + (remainingSessions / focusSessionsPerWeek) * 7 * DAY
      : null;
  const completedDates = completed
    .map((step) => step.completedAt)
    .filter(Boolean)
    .map((value) => new Date(value).getTime())
    .filter(Number.isFinite);
  const elapsedDays =
    completedDates.length > 1
      ? Math.max(
          1,
          (Math.max(...completedDates) - Math.min(...completedDates)) / DAY,
        )
      : 0;
  const pacePerWeek =
    elapsedDays > 0
      ? Math.round((completed.length / elapsedDays) * 7 * 10) / 10
      : null;
  const featureDone = project.features.filter(
    (feature) => feature.status === "completed",
  ).length;
  const events = flow.events || [];
  const projectEvents = events.filter((item) =>
    ["project-step", "project-target"].includes(item.source),
  );
  return {
    total: steps.length,
    completed: completed.length,
    active: active.length,
    blocked: blocked.length,
    decisions: decisions.length,
    overdue: overdue.length + Number(targetOverdue),
    targetOverdue,
    sessions: sessions.length,
    minutes,
    features: project.features.length,
    featuresCompleted: featureDone,
    updates: projectEvents.length,
    lastUpdateAt: projectEvents.at(-1)?.at || null,
    pacePerWeek,
    focusSessionsPerWeek,
    derivedStage: project.derivedStage,
    overdueSteps: overdue,
    remainingSessions,
    estimateAt,
  };
}

export function projectCalendarEntries(flow) {
  const project = ensureProjectWorkspace(flow);
  if (!project) return [];
  const entries = [];
  if (project.startAt)
    entries.push({
      title: `Início de ${flow.identity.name}`,
      date: project.startAt,
      sourceId: "project:start",
      kind: "Início do projeto",
      source: "codeProject",
    });
  if (project.targetAt)
    entries.push({
      title: project.intendedOutcome || `Prazo de ${flow.identity.name}`,
      date: project.targetAt,
      sourceId: "project:target",
      kind: "Prazo do projeto",
      source: "codeProject",
    });
  for (const step of project.steps || []) {
    if (
      step.featureId ||
      !step.dueAt ||
      ["completed", "dismissed"].includes(step.status)
    )
      continue;
    entries.push({
      title: step.title,
      date: step.dueAt,
      sourceId: step.id,
      kind:
        step.status === "decision" || step.type === "decision"
          ? "Decisão"
          : "Passo do projeto",
      source: "codeProject",
    });
  }
  for (const feature of project.features || []) {
    if (!feature.dueAt || ["completed", "dismissed"].includes(feature.status))
      continue;
    entries.push({
      title: feature.name,
      date: feature.dueAt,
      sourceId: feature.id,
      kind: "Funcionalidade",
      source: "codeProject",
    });
  }
  return entries;
}

export function projectStatusLabel(step, now = Date.now()) {
  if (!step) return "Sem etapa em foco";
  if (
    step.dueAt &&
    new Date(`${step.dueAt}T23:59:59`).getTime() < now &&
    !["completed", "dismissed"].includes(step.status)
  )
    return "Data passou · pode replanejar";
  return (
    {
      planned: "Planejada",
      active: "Em foco",
      blocked: "Bloqueada",
      decision: "Decisão pendente",
      completed: "Concluída",
      dismissed: "Dispensada",
    }[step.status] || "Planejada"
  );
}

export function recordProjectSession(flow, stepId, seconds = 0) {
  const project = ensureProjectWorkspace(flow);
  const step = project.steps.find((item) => item.id === stepId);
  if (!step) return;
  step.sessionIds ||= [];
  const session = {
    id: makeId(),
    stageId: step.id,
    seconds: Math.max(0, Number(seconds) || 0),
    endedAt: Date.now(),
    mode: "free",
  };
  flow.sessions ||= [];
  flow.sessions.push(session);
  step.sessionIds.push(session.id);
  event(flow, step, "project_focus_session_recorded", {
    sessionId: session.id,
  });
  return session;
}
