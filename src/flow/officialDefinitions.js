import { declarativeForOfficial } from "./declarative.js";

const field = (key, label, type = "text", options = {}) => ({
  key,
  label,
  type,
  ...options,
});

const metric = (id, label, source, options = {}) => ({
  id,
  label,
  source,
  ...options,
});

const noteTemplates = {
  job: [
    {
      title: "Preparação para entrevista",
      content:
        "# Entrevista\n\n## Contexto\n\n## Perguntas\n\n## Próximo passo\n",
    },
  ],
  enem: [
    {
      title: "Caderno de erros",
      content:
        "# Erro revisado\n\n- Tema:\n- Por que errei:\n- Como resolver:\n- Revisar em:\n",
    },
  ],
  code: [
    {
      title: "Registro de decisão",
      content:
        "# Decisão\n\n## Contexto\n\n## Opções\n\n## Escolha e consequência\n",
    },
  ],
  college: [
    {
      title: "Resumo de aula",
      content: "# Aula\n\n## Conceitos\n\n## Dúvidas\n\n## Próxima revisão\n",
    },
  ],
};

const definition = (value) => {
  const onboarding = value.onboarding || { intro: "", steps: [] };
  const planStep = {
    id: "flow-plan",
    title: "O que você quer realizar e quando?",
    optional: true,
    description:
      "Registre sua intenção, um início possível e uma data-alvo. Você pode ajustar tudo depois.",
    fields: [
      field("intendedOutcome", "O que você quer alcançar?", "textarea", {
        required: true,
        default: value.objective,
        placeholder: "Descreva o resultado que faria este Flow valer a pena.",
      }),
      field("startWhen", "Quando pretende começar?", "select", {
        options: [
          "Assim que possível",
          "Nesta semana",
          "Neste mês",
          "Em uma data específica",
          "Ainda não defini",
        ],
        default: "Assim que possível",
      }),
      field("startDate", "Data de início (se já souber)", "date"),
      field("targetDate", "Prazo ou data-alvo geral", "date"),
    ],
  };
  const prepared = {
    schemaVersion: 2,
    kind: "flow_definition",
    version: 2,
    visibility: "official",
    tier: "free",
    properties: {},
    goals: [],
    stages: [],
    metrics: [],
    instructions: { summary: value.description, prompts: [] },
    review: { cadenceDays: 7, prompts: [] },
    initialData: {},
    ...value,
    onboarding: {
      ...onboarding,
      steps: [
        ...(value.skipGenericPlan ? [] : [planStep]),
        ...(onboarding.steps || []),
      ],
    },
    ...declarativeForOfficial(value),
    componentConfig: {
      tasks: {
        groups: ["Próximos passos", "Esta semana", "Depois"],
        features: {
          description: true,
          priority: true,
          dueDate: true,
          group: true,
          subtasks: true,
          recurrence: true,
          tags: true,
          goalLink: true,
          stageLink: true,
        },
      },
      notes: { templates: noteTemplates[value.id] || [] },
      links: {
        categories: ["Leitura", "Vídeo", "Documento", "Referência"],
      },
      focus: {
        presets: [value.focus || 25, 45, 60],
        shortBreakMinutes: 5,
        longBreakMinutes: 15,
      },
      ...(value.componentConfig || {}),
    },
  };
  return prepared;
};

const pathStep = (title, description, kind = "milestone") => ({
  title,
  description,
  kind,
});

const tracker = (title, singular, stages, fields, empty) => ({
  title,
  singular,
  plural:
    {
      oportunidade: "oportunidades",
      registro: "registros",
      "item do projeto": "itens do projeto",
      "item acadêmico": "itens acadêmicos",
      "item da semana": "itens da semana",
      "item da trilha": "itens da trilha",
      conteúdo: "conteúdos",
    }[singular] || "itens",
  primaryField: fields[0]?.key || "title",
  stages,
  fields,
  empty,
});

export const officialDefinitions = [
  definition({
    id: "job",
    name: "Novo emprego",
    category: "Carreira",
    tier: "pro",
    icon: "↗",
    color: "blue",
    objective: "Organizar uma busca por trabalho com clareza e ritmo real.",
    description:
      "Acompanhe oportunidades, prepare conversas e transforme cada próximo passo em movimento.",
    tag: "NOVAS POSSIBILIDADES",
    focus: 25,
    components: ["tracker", "tasks", "notes", "links", "focus"],
    onboarding: {
      intro: "Vamos preparar um espaço para a busca que faz sentido para você.",
      steps: [
        {
          id: "direction",
          title: "O que você procura agora?",
          description:
            "Uma direção clara ajuda o Flow a destacar o que importa.",
          fields: [
            field("targetRole", "Cargo ou área desejada", "text", {
              required: true,
              placeholder: "Ex.: Analista de suporte",
            }),
            field("seniority", "Nível profissional", "select", {
              options: [
                "Estágio",
                "Júnior",
                "Pleno",
                "Sênior",
                "Liderança",
                "Flexível",
              ],
            }),
            field("locations", "Cidades ou regiões", "list", {
              placeholder: "Ex.: Recife, São Paulo",
            }),
            field("workModels", "Modelos de trabalho", "multi", {
              options: ["Remoto", "Híbrido", "Presencial"],
            }),
          ],
        },
        {
          id: "rhythm",
          title: "Qual ritmo cabe na sua semana?",
          optional: true,
          fields: [
            field(
              "weeklyApplicationGoal",
              "Meta de candidaturas por semana",
              "number",
              { min: 1, max: 50, default: 5 },
            ),
            field("deadline", "Data ou urgência", "date"),
            field("salaryExpectation", "Faixa salarial desejada", "text", {
              placeholder: "Opcional",
            }),
            field("focusMinutes", "Duração de uma sessão", "number", {
              min: 10,
              max: 180,
              default: 25,
              suffix: "min",
            }),
          ],
        },
        {
          id: "profile",
          title: "Traga o que você já tem.",
          optional: true,
          fields: [
            field("resumeUrl", "Currículo", "url", {
              placeholder: "https://…",
            }),
            field("linkedinUrl", "LinkedIn", "url", {
              placeholder: "https://…",
            }),
            field("portfolioUrl", "Portfólio", "url", {
              placeholder: "https://…",
            }),
            field(
              "trackContacts",
              "Acompanhar contatos e recrutadores",
              "boolean",
              { default: true },
            ),
          ],
        },
      ],
    },
    stages: [
      pathStep(
        "Preparar a base",
        "Currículo, perfil e materiais prontos para a busca que você escolheu.",
        "checkpoint",
      ),
      pathStep(
        "Abrir o radar",
        "Encontre e salve oportunidades que combinam com o cargo desejado.",
        "practice",
      ),
      pathStep(
        "Candidatar com ritmo",
        "Envie candidaturas da semana e registre o que foi feito.",
        "practice",
      ),
      pathStep(
        "Acompanhar conversas",
        "Follow-ups, entrevistas e próximas ações com data.",
        "practice",
      ),
      pathStep(
        "Decidir o próximo capítulo",
        "Ofertas, recusas conscientes e o encerramento do ciclo.",
        "milestone",
      ),
    ],
    goals: [
      {
        id: "weekly-applications",
        title: "Candidaturas da semana",
        metricId: "weeklyApplications",
        targetProperty: "weeklyApplicationGoal",
        unit: "candidaturas",
      },
      {
        id: "profile-ready",
        title: "Base profissional preparada",
        metricId: "profileReady",
        target: 3,
        unit: "itens",
      },
    ],
    componentConfig: {
      tracker: tracker(
        "Oportunidades",
        "oportunidade",
        [
          "Encontrada",
          "Salva",
          "Candidatura enviada",
          "Contato",
          "Entrevista",
          "Etapa técnica",
          "Oferta",
          "Encerrada",
        ],
        [
          field("company", "Empresa", "text", { required: true }),
          field("role", "Cargo", "text", { required: true }),
          field("url", "Link da vaga", "url"),
          field("location", "Localização", "text"),
          field("workModel", "Modelo", "select", {
            options: ["Remoto", "Híbrido", "Presencial", "Não informado"],
          }),
          field("salary", "Salário ou faixa", "text"),
          field("appliedAt", "Data da candidatura", "date"),
          field("contact", "Contato ou recrutador", "text"),
          field("nextAction", "Próxima ação", "text"),
          field("nextActionAt", "Data da próxima ação", "date"),
          field("notes", "Observações", "textarea"),
        ],
        "Guarde a primeira vaga que merece sua atenção.",
      ),
    },
    metrics: [
      metric("applications", "Candidaturas", {
        type: "tracker",
        statuses: [
          "Candidatura enviada",
          "Contato",
          "Entrevista",
          "Etapa técnica",
          "Oferta",
        ],
      }),
      metric(
        "weeklyApplications",
        "Nesta semana",
        {
          type: "tracker",
          statuses: [
            "Candidatura enviada",
            "Contato",
            "Entrevista",
            "Etapa técnica",
            "Oferta",
          ],
          dateField: "appliedAt",
          windowDays: 7,
        },
        { targetProperty: "weeklyApplicationGoal" },
      ),
      metric("responses", "Respostas", {
        type: "tracker",
        statuses: ["Contato", "Entrevista", "Etapa técnica", "Oferta"],
      }),
      metric("interviews", "Entrevistas", {
        type: "tracker",
        statuses: ["Entrevista", "Etapa técnica", "Oferta"],
      }),
      metric("offers", "Ofertas", { type: "tracker", statuses: ["Oferta"] }),
      metric(
        "returnRate",
        "Taxa de retorno",
        { type: "rate", numerator: "responses", denominator: "applications" },
        { unit: "%" },
      ),
      metric(
        "profileReady",
        "Base profissional",
        { type: "tasks", done: true, group: "Perfil" },
        { target: 3 },
      ),
    ],
    instructions: {
      summary:
        "A busca ganha clareza quando cada oportunidade tem contexto e próximo passo.",
      prompts: [
        "Atualize o pipeline",
        "Prepare a conversa mais próxima",
        "Faça um follow-up respeitoso",
      ],
    },
    review: {
      cadenceDays: 7,
      prompts: [
        "Quais vagas realmente valeram a candidatura?",
        "Há candidaturas aguardando follow-up?",
        "Alguma entrevista exige preparação?",
        "O que deve receber atenção na próxima semana?",
      ],
    },
  }),
  definition({
    id: "enem",
    name: "Meu próximo passo: ENEM",
    category: "Estudos",
    legacyOnly: true,
    tier: "free",
    icon: "✳",
    color: "mint",
    objective:
      "Construir uma preparação consistente para o ENEM sem perder o ritmo.",
    description:
      "Organize prioridades, pratique com foco e volte aos erros quando eles ainda estiverem frescos.",
    tag: "COMECE POR AQUI",
    focus: 40,
    components: ["tracker", "tasks", "focus", "notes", "links", "music"],
    onboarding: {
      intro: "Seu plano começa pelo tempo real que existe na sua semana.",
      steps: [
        {
          id: "goal",
          title: "Onde está sua linha de chegada?",
          fields: [
            field("examDate", "Data ou meta da prova", "date"),
            field("weeklyHours", "Horas disponíveis por semana", "number", {
              min: 1,
              max: 80,
              default: 8,
            }),
            field("focusMinutes", "Duração preferida das sessões", "number", {
              min: 10,
              max: 180,
              default: 40,
              suffix: "min",
            }),
          ],
        },
        {
          id: "subjects",
          title: "O que merece mais atenção?",
          fields: [
            field("prioritySubjects", "Matérias prioritárias", "multi", {
              required: true,
              options: [
                "Linguagens",
                "Matemática",
                "Ciências Humanas",
                "Ciências da Natureza",
                "Redação",
              ],
            }),
            field(
              "lowConfidenceSubjects",
              "Onde você sente menos confiança?",
              "multi",
              {
                options: [
                  "Linguagens",
                  "Matemática",
                  "Ciências Humanas",
                  "Ciências da Natureza",
                  "Redação",
                ],
              },
            ),
          ],
        },
        {
          id: "practice",
          title: "Escolha metas possíveis para uma semana.",
          optional: true,
          fields: [
            field("weeklyQuestionGoal", "Questões por semana", "number", {
              min: 1,
              max: 1000,
              default: 60,
            }),
            field("weeklyEssayGoal", "Redações por semana", "number", {
              min: 0,
              max: 14,
              default: 1,
            }),
            field("weeklyReviewGoal", "Tópicos para revisar", "number", {
              min: 1,
              max: 100,
              default: 6,
            }),
          ],
        },
      ],
    },
    stages: [
      pathStep(
        "Diagnóstico",
        "Veja o que já está claro e o que pede reforço.",
        "checkpoint",
      ),
      pathStep(
        "Planejamento",
        "Distribua matérias, horas e metas da semana.",
        "lesson",
      ),
      pathStep(
        "Estudo",
        "Avance nos tópicos prioritários com sessões reais.",
        "practice",
      ),
      pathStep(
        "Prática",
        "Resolva questões e registre erros para revisar.",
        "practice",
      ),
      pathStep(
        "Revisão",
        "Volte ao caderno de erros antes de acumular matéria nova.",
        "review",
      ),
      pathStep(
        "Simulados",
        "Meça o ritmo em condições próximas da prova.",
        "milestone",
      ),
    ],
    goals: [
      {
        id: "weekly-hours",
        title: "Horas de estudo na semana",
        metricId: "studyHours",
        targetProperty: "weeklyHours",
        unit: "h",
      },
      {
        id: "weekly-questions",
        title: "Questões resolvidas",
        metricId: "questions",
        targetProperty: "weeklyQuestionGoal",
        unit: "questões",
      },
      {
        id: "weekly-essays",
        title: "Redações concluídas",
        metricId: "essays",
        targetProperty: "weeklyEssayGoal",
        unit: "redações",
      },
      {
        id: "weekly-reviews",
        title: "Conteúdos revisados",
        metricId: "reviewedTopics",
        targetProperty: "weeklyReviewGoal",
        unit: "tópicos",
      },
    ],
    componentConfig: {
      tracker: tracker(
        "Registro de estudo",
        "registro",
        ["Planejado", "Em estudo", "Praticado", "Revisado", "Concluído"],
        [
          field("subject", "Matéria", "select", {
            required: true,
            options: [
              "Linguagens",
              "Matemática",
              "Ciências Humanas",
              "Ciências da Natureza",
              "Redação",
            ],
          }),
          field("topic", "Tópico ou atividade", "text", { required: true }),
          field("kind", "Tipo", "select", {
            options: ["Tópico", "Questões", "Revisão", "Redação", "Simulado"],
          }),
          field("questions", "Questões realizadas", "number", { min: 0 }),
          field("correct", "Acertos", "number", { min: 0 }),
          field("studyDate", "Data", "date"),
          field("notes", "Erros e aprendizados", "textarea"),
        ],
        "Comece pelo assunto que mais precisa de clareza.",
      ),
    },
    metrics: [
      metric(
        "studyMinutes",
        "Tempo estudado",
        { type: "sessions", aggregate: "minutes", windowDays: 7 },
        { unit: "min" },
      ),
      metric(
        "studyHours",
        "Horas na semana",
        { type: "sessions", aggregate: "hours", windowDays: 7 },
        { unit: "h", targetProperty: "weeklyHours" },
      ),
      metric("sessions", "Sessões", {
        type: "sessions",
        aggregate: "count",
        windowDays: 7,
      }),
      metric(
        "questions",
        "Questões",
        {
          type: "trackerSum",
          field: "questions",
          windowDays: 7,
          dateField: "studyDate",
        },
        { targetProperty: "weeklyQuestionGoal" },
      ),
      metric(
        "accuracy",
        "Taxa de acerto",
        {
          type: "trackerRatio",
          numeratorField: "correct",
          denominatorField: "questions",
        },
        { unit: "%" },
      ),
      metric(
        "essays",
        "Redações",
        {
          type: "tracker",
          field: "kind",
          values: ["Redação"],
          statuses: ["Concluído"],
        },
        { targetProperty: "weeklyEssayGoal" },
      ),
      metric("simulations", "Simulados", {
        type: "tracker",
        field: "kind",
        values: ["Simulado"],
        statuses: ["Concluído"],
      }),
      metric(
        "reviewedTopics",
        "Tópicos revisados",
        { type: "tracker", statuses: ["Revisado", "Concluído"] },
        { targetProperty: "weeklyReviewGoal" },
      ),
    ],
    instructions: {
      summary:
        "Priorize uma matéria, pratique e registre o que precisa voltar para revisão.",
      prompts: [
        "Estude uma prioridade",
        "Resolva questões",
        "Registre um erro que merece revisão",
      ],
    },
    review: {
      cadenceDays: 7,
      prompts: [
        "O que você estudou?",
        "Onde teve mais dificuldade?",
        "O que funcionou bem?",
        "O que deve ser priorizado na próxima semana?",
      ],
    },
  }),
  definition({
    id: "code",
    name: "Do código ao deploy",
    category: "Programação",
    icon: "⌘",
    color: "lavender",
    objective: "Levar uma ideia de software até uma entrega com direção.",
    description:
      "Defina o escopo, construa com foco, teste antes de entregar e aprenda no caminho.",
    tag: "DEEP WORK",
    focus: 50,
    components: [
      "tracker",
      "kanban",
      "focus",
      "snippets",
      "notes",
      "links",
      "deploy",
      "playground",
    ],
    version: 3,
    skipGenericPlan: true,
    onboarding: {
      intro:
        "Conte o que quer fazer. O Noma combina etapas adequadas ao seu projeto e ao ponto em que ele está.",
      hideNameStep: true,
      allowComponentSelection: false,
      steps: [
        {
          id: "project-intention",
          title: "O que você quer fazer?",
          fields: [
            field("projectObjective", "Objetivo deste projeto", "select", {
              required: true,
              options: [
                "Tirar ideia do papel",
                "Concluir MVP",
                "Evoluir projeto",
                "Criar funcionalidades",
                "Estabilizar/corrigir",
                "Preparar release",
                "Fazer deploy",
                "Retomar projeto",
              ],
            }),
            field("projectName", "Nome do projeto", "text", {
              placeholder: "Opcional",
            }),
            field("projectGoal", "Contexto ou resultado desejado", "textarea", {
              placeholder: "O que este trabalho deve mudar ou resolver?",
            }),
            field("startWhen", "Quando quer começar?", "select", {
              options: [
                "Hoje",
                "Esta semana",
                "Próxima semana",
                "Data específica",
                "Sem data",
              ],
              default: "Hoje",
            }),
            field("startDate", "Data de início", "date", {
              visibleWhen: { key: "startWhen", value: "Data específica" },
            }),
          ],
        },
        {
          id: "project-result",
          title: "Como será uma versão pronta para você?",
          fields: [
            field("projectType", "Tipo de projeto", "multi", {
              options: [
                "Site",
                "Aplicação web",
                "Aplicativo mobile",
                "API/serviço",
                "Automação",
                "Biblioteca/pacote",
                "Jogo",
                "Ferramenta interna",
                "Outro",
              ],
            }),
            field("targetWindow", "Janela-alvo", "select", {
              options: [
                "Sem prazo",
                "7 dias",
                "2 semanas",
                "1 mês",
                "3 meses",
                "Data específica",
              ],
              default: "Sem prazo",
            }),
            field("targetDate", "Data-alvo", "date", {
              visibleWhen: { key: "targetWindow", value: "Data específica" },
            }),
            field(
              "intendedOutcome",
              "Quando esta versão estará pronta para você?",
              "select",
              {
                optionsFrom: "projectOutcomeOptions",
              },
            ),
          ],
        },
        {
          id: "project-context",
          title: "Qual é o contexto técnico atual?",
          fields: [
            field("stack", "Stack ou ferramentas", "autocomplete-multi", {
              placeholder: "Busque tecnologias ou digite para adicionar",
            }),
            field("currentStage", "Estágio atual", "select", {
              options: [
                "Ideia",
                "Planejamento",
                "Implementação",
                "Validação",
                "Integração",
                "Release",
                "Deploy",
                "Manutenção",
                "Não sei ainda",
              ],
              default: "Não sei ainda",
            }),
            field("repositoryUrl", "Repositório ou link", "url", {
              placeholder: "Opcional",
            }),
            field("sessionDuration", "Duração da sessão de foco", "select", {
              options: [
                "15 minutos",
                "25 minutos",
                "45 minutos",
                "60 minutos",
                "90 minutos",
                "Livre",
              ],
              default: "25 minutos",
            }),
          ],
        },
      ],
    },
    stages: [],
    goals: [
      {
        id: "mvp-defined",
        title: "MVP definido",
        metricId: "milestonesDone",
        target: 1,
        unit: "marco",
      },
      {
        id: "essential-features",
        title: "Funcionalidades essenciais",
        metricId: "featuresDone",
        targetProperty: "essentialFeatureCount",
        unit: "itens",
      },
      {
        id: "first-release",
        title: "Primeira versão publicada",
        metricId: "milestonesDone",
        target: 2,
        unit: "marcos",
      },
    ],
    componentConfig: {
      tracker: tracker(
        "Marcos e decisões",
        "item do projeto",
        ["Planejado", "Em andamento", "Bloqueado", "Concluído"],
        [
          field("title", "Título", "text", { required: true }),
          field("kind", "Tipo", "select", {
            options: ["Milestone", "Feature", "Bug", "Decisão"],
          }),
          field("dueAt", "Prazo", "date"),
          field("link", "Referência", "url"),
          field("notes", "Contexto", "textarea"),
        ],
        "Registre um milestone, uma decisão ou algo que precisa ser construído.",
      ),
      kanban: {
        columns: [
          "Backlog",
          "Próximo",
          "Em desenvolvimento",
          "Teste",
          "Concluído",
        ],
      },
    },
    metrics: [
      metric("sessions", "Sessões", { type: "sessions", aggregate: "count" }),
      metric(
        "minutes",
        "Tempo dedicado",
        { type: "sessions", aggregate: "minutes" },
        { unit: "min" },
      ),
      metric("tasksDone", "Tarefas concluídas", { type: "tasks", done: true }),
      metric(
        "featuresDone",
        "Funcionalidades concluídas",
        { type: "kanban", column: "Concluído" },
        { targetProperty: "essentialFeatureCount" },
      ),
      metric("milestonesDone", "Milestones concluídos", {
        type: "tracker",
        field: "kind",
        values: ["Milestone"],
        statuses: ["Concluído"],
      }),
      metric("milestonesTotal", "Milestones planejados", {
        type: "tracker",
        field: "kind",
        values: ["Milestone"],
      }),
    ],
    progress: {
      mode: "ratio",
      numeratorMetric: "milestonesDone",
      denominatorMetric: "milestonesTotal",
    },
    instructions: {
      summary:
        "Mantenha o escopo visível e leve um pequeno incremento até concluído.",
      prompts: [
        "Escolha o próximo incremento",
        "Registre uma decisão",
        "Teste antes de publicar",
      ],
    },
    review: {
      cadenceDays: 7,
      prompts: [
        "O que avançou?",
        "O que está bloqueando?",
        "O escopo ainda faz sentido?",
        "Qual é o próximo milestone?",
      ],
    },
  }),
  definition({
    id: "college",
    name: "Faculdade em dia",
    category: "Estudos",
    tier: "pro",
    icon: "▧",
    color: "yellow",
    objective: "Manter a faculdade em dia sem perder o fio do semestre.",
    description:
      "Reúna disciplinas, entregas e prazos em um só lugar e veja o que precisa de atenção primeiro.",
    tag: "VIDA ACADÊMICA",
    focus: 50,
    components: ["tracker", "tasks", "focus", "notes", "links"],
    onboarding: {
      intro:
        "Organize o semestre a partir das disciplinas e datas que já conhece.",
      steps: [
        {
          id: "course",
          title: "Em que momento da faculdade você está?",
          fields: [
            field("course", "Curso", "text", { required: true }),
            field("semester", "Período ou semestre", "text", {
              required: true,
              placeholder: "Ex.: 3º semestre · 2026.2",
            }),
            field("weeklyHours", "Horas disponíveis por semana", "number", {
              min: 1,
              max: 80,
              default: 8,
            }),
          ],
        },
        {
          id: "subjects",
          title: "Quais disciplinas estão com você?",
          fields: [
            field("subjects", "Disciplinas", "list", {
              required: true,
              placeholder: "Uma por linha ou separadas por vírgula",
            }),
            field(
              "importantDates",
              "Datas importantes já conhecidas",
              "textarea",
              { placeholder: "Ex.: 18/10 — prova de Cálculo" },
            ),
            field("focusMinutes", "Duração de uma sessão", "number", {
              min: 10,
              max: 180,
              default: 50,
              suffix: "min",
            }),
          ],
        },
      ],
    },
    stages: [
      pathStep(
        "Organizar o semestre",
        "Disciplinas, datas e carga semanal no mesmo lugar.",
        "checkpoint",
      ),
      pathStep(
        "Acompanhar aulas",
        "Registre o que precisa de revisão depois de cada disciplina.",
        "practice",
      ),
      pathStep(
        "Entregas",
        "Trabalhos e prazos visíveis com antecedência.",
        "practice",
      ),
      pathStep(
        "Provas",
        "Prepare revisões e datas de avaliação.",
        "checkpoint",
      ),
      pathStep(
        "Fechar o ciclo",
        "Leituras em dia e o que ficou para o próximo período.",
        "review",
      ),
    ],
    goals: [
      {
        id: "deliveries",
        title: "Entregas concluídas",
        metricId: "deliveriesDone",
        unit: "entregas",
      },
      {
        id: "readings",
        title: "Leituras concluídas",
        metricId: "readingsDone",
        unit: "leituras",
      },
      {
        id: "study-time",
        title: "Tempo de estudo",
        metricId: "studyHours",
        targetProperty: "weeklyHours",
        unit: "h",
      },
    ],
    componentConfig: {
      tracker: tracker(
        "Vida acadêmica",
        "item acadêmico",
        ["Planejado", "Em andamento", "Concluído"],
        [
          field("title", "Título", "text", { required: true }),
          field("subject", "Disciplina", "select", {
            optionsFromProperty: "subjects",
          }),
          field("kind", "Tipo", "select", {
            options: ["Trabalho", "Prova", "Leitura", "Referência", "Prazo"],
          }),
          field("dueAt", "Data", "date"),
          field("professor", "Professor", "text"),
          field("link", "Material ou referência", "url"),
          field("notes", "Observações", "textarea"),
        ],
        "Adicione uma prova, leitura, entrega ou prazo que já está no horizonte.",
      ),
    },
    metrics: [
      metric("deliveriesDone", "Entregas concluídas", {
        type: "tracker",
        field: "kind",
        values: ["Trabalho"],
        statuses: ["Concluído"],
      }),
      metric("readingsDone", "Leituras concluídas", {
        type: "tracker",
        field: "kind",
        values: ["Leitura"],
        statuses: ["Concluído"],
      }),
      metric("sessions", "Sessões de estudo", {
        type: "sessions",
        aggregate: "count",
      }),
      metric(
        "minutes",
        "Tempo dedicado",
        { type: "sessions", aggregate: "minutes" },
        { unit: "min" },
      ),
      metric(
        "studyHours",
        "Horas na semana",
        { type: "sessions", aggregate: "hours", windowDays: 7 },
        { unit: "h", targetProperty: "weeklyHours" },
      ),
      metric("upcoming", "Prazos próximos", {
        type: "trackerDue",
        days: 14,
        statusesNot: ["Concluído"],
      }),
    ],
    instructions: {
      summary:
        "Veja primeiro o prazo mais próximo e deixe o material da disciplina ao alcance.",
      prompts: [
        "Confira os próximos 14 dias",
        "Escolha uma entrega",
        "Reserve uma sessão de estudo",
      ],
    },
    review: {
      cadenceDays: 7,
      prompts: [
        "Quais entregas avançaram?",
        "Que prazo se aproximou?",
        "Qual disciplina precisa de mais atenção?",
        "O que cabe na próxima semana?",
      ],
    },
  }),
  definition({
    id: "week",
    name: "Uma semana mais leve",
    category: "Organização",
    icon: "◈",
    color: "peach",
    objective: "Organizar a semana com espaço para o que importa.",
    description:
      "Escolha até três prioridades, proteja seu tempo e deixe o resto da vida encontrar seu lugar.",
    tag: "ENCONTRE SEU RITMO",
    focus: 25,
    components: ["tracker", "tasks", "notes"],
    onboarding: {
      intro: "Uma semana possível começa pelo que já ocupa espaço.",
      steps: [
        {
          id: "week",
          title: "Como esta semana começa?",
          fields: [
            field("weekStart", "Início da semana", "date"),
            field("commitments", "Compromissos já marcados", "list", {
              placeholder: "Um por linha ou separados por vírgula",
            }),
            field(
              "availability",
              "Quanto tempo livre você percebe?",
              "select",
              { options: ["Pouco", "Algum", "Bastante", "Ainda não sei"] },
            ),
          ],
        },
        {
          id: "priorities",
          title: "O que merece caber?",
          fields: [
            field("priorities", "Até três prioridades", "list", {
              required: true,
              maxItems: 3,
            }),
            field(
              "protectedTime",
              "Algo que você quer proteger para si",
              "text",
              { placeholder: "Ex.: uma noite sem compromissos" },
            ),
            field("habit", "Um hábito para lembrar", "text", {
              placeholder: "Opcional",
            }),
          ],
        },
      ],
    },
    stages: [
      pathStep(
        "Capturar",
        "Tire da cabeça o que está pedindo atenção.",
        "practice",
      ),
      pathStep(
        "Priorizar",
        "Escolha até três movimentos que realmente importam.",
        "checkpoint",
      ),
      pathStep(
        "Proteger tempo",
        "Reserve espaço para o que você quer cuidar.",
        "practice",
      ),
      pathStep(
        "Revisar a semana",
        "Veja o que avançou e o que pode esperar.",
        "review",
      ),
    ],
    goals: [
      {
        id: "priorities",
        title: "Prioridades concluídas",
        metricId: "prioritiesDone",
        targetProperty: "priorityCount",
        unit: "prioridades",
      },
      {
        id: "weekly-review",
        title: "Revisão da semana",
        metricId: "reviews",
        target: 1,
        unit: "revisão",
      },
    ],
    componentConfig: {
      tracker: tracker(
        "Semana",
        "item da semana",
        ["Inbox", "Prioridades", "Esta semana", "Hoje", "Depois", "Concluído"],
        [
          field("title", "O que precisa de um lugar?", "text", {
            required: true,
          }),
          field("kind", "Tipo", "select", {
            options: ["Tarefa", "Compromisso", "Prioridade", "Hábito"],
          }),
          field("when", "Quando", "date"),
          field("notes", "Observação", "textarea"),
        ],
        "Capture algo da cabeça antes de decidir quando fazer.",
      ),
    },
    metrics: [
      metric(
        "prioritiesDone",
        "Prioridades concluídas",
        {
          type: "tracker",
          field: "kind",
          values: ["Prioridade"],
          statuses: ["Concluído"],
        },
        { targetProperty: "priorityCount" },
      ),
      metric("tasksDone", "Tarefas concluídas", {
        type: "tracker",
        statuses: ["Concluído"],
      }),
      metric("reviews", "Semanas revisadas", {
        type: "reviews",
        status: "completed",
      }),
    ],
    instructions: {
      summary:
        "Três prioridades bastam. Preserve espaço para imprevistos e para você.",
      prompts: [
        "Escolha o que importa hoje",
        "Confira um compromisso",
        "Deixe algo para depois sem culpa",
      ],
    },
    review: {
      cadenceDays: 7,
      prompts: [
        "O que foi importante de verdade?",
        "O que pode sair da próxima semana?",
        "O que precisa ser remarcado?",
        "Que tempo você quer proteger?",
      ],
    },
  }),
  definition({
    id: "blank",
    name: "Do seu jeito",
    category: "Personalizado",
    icon: "+",
    color: "plain",
    objective: "Criar um espaço próprio para um objetivo do seu jeito.",
    description:
      "Comece simples e adicione só o que realmente ajuda você a avançar.",
    tag: "CRIE DO ZERO",
    focus: 25,
    components: ["tasks", "notes"],
    onboarding: {
      intro: "Você decide quanto configurar agora.",
      steps: [
        {
          id: "purpose",
          title: "Dê uma direção ao espaço.",
          fields: [
            field("customObjective", "O que você quer realizar?", "textarea", {
              required: true,
            }),
            field("customCategory", "Categoria", "select", {
              options: [
                "Estudos",
                "Programação",
                "Organização",
                "Carreira",
                "Criativo",
                "Pessoal",
                "Personalizado",
              ],
            }),
            field("customIcon", "Símbolo", "select", {
              options: ["✳", "◈", "◇", "△", "↗", "⌘", "+"],
            }),
            field("customColor", "Cor", "select", {
              options: ["mint", "blue", "lavender", "peach", "yellow", "plain"],
            }),
          ],
        },
        {
          id: "structure",
          title: "Quer deixar um caminho preparado?",
          optional: true,
          fields: [
            field("customGoals", "Metas", "list", {
              placeholder: "Uma por linha ou separadas por vírgula",
            }),
            field("customStages", "Etapas", "list", {
              placeholder: "Uma por linha ou separadas por vírgula",
            }),
            field("customMetrics", "Indicadores que quer acompanhar", "list"),
            field(
              "reviewCadenceDays",
              "Revisar a cada quantos dias?",
              "number",
              { min: 1, max: 90, default: 7 },
            ),
          ],
        },
      ],
    },
    stages: [],
    goals: [],
    metrics: [
      metric("sessions", "Sessões", { type: "sessions", aggregate: "count" }),
      metric(
        "minutes",
        "Tempo dedicado",
        { type: "sessions", aggregate: "minutes" },
        { unit: "min" },
      ),
      metric("tasksDone", "Passos concluídos", { type: "tasks", done: true }),
    ],
    instructions: {
      summary: "Use somente a estrutura que ajuda a avançar.",
      prompts: ["Qual é o próximo passo?"],
    },
    review: {
      cadenceDays: 7,
      prompts: [
        "O que avançou?",
        "O que mudou no objetivo?",
        "Qual é o próximo passo?",
      ],
    },
  }),
  definition({
    id: "skill",
    name: "Aprender uma habilidade",
    category: "Estudos",
    icon: "◇",
    color: "mint",
    objective: "Transformar prática em progresso real.",
    description:
      "Defina uma trilha, pratique com intenção e acompanhe os marcos do seu aprendizado.",
    tag: "APRENDER FAZENDO",
    focus: 35,
    components: ["tracker", "tasks", "focus", "notes", "links"],
    onboarding: {
      intro: "Aprender fica mais claro quando a próxima prática está visível.",
      steps: [
        {
          id: "skill",
          title: "O que você quer aprender?",
          fields: [
            field("skillName", "Habilidade", "text", { required: true }),
            field("startingLevel", "Nível atual", "select", {
              options: ["Começando", "Básico", "Intermediário", "Avançado"],
            }),
            field(
              "desiredOutcome",
              "O que você quer conseguir fazer?",
              "textarea",
              { required: true },
            ),
          ],
        },
        {
          id: "practice",
          title: "Que ritmo cabe agora?",
          optional: true,
          fields: [
            field("weeklyPracticeGoal", "Práticas por semana", "number", {
              min: 1,
              max: 21,
              default: 3,
            }),
            field("resources", "Recursos que já escolheu", "list"),
            field("focusMinutes", "Duração de uma prática", "number", {
              min: 10,
              max: 180,
              default: 35,
            }),
          ],
        },
      ],
    },
    stages: [
      pathStep(
        "Fundamentos",
        "Entenda o mínimo para começar a praticar.",
        "lesson",
      ),
      pathStep(
        "Prática guiada",
        "Repita com referência, sem exigir perfeição.",
        "practice",
      ),
      pathStep(
        "Prática própria",
        "Faça sozinho e registre o que ficou mais claro.",
        "practice",
      ),
      pathStep(
        "Projeto",
        "Use a habilidade em algo que você quer mostrar.",
        "milestone",
      ),
      pathStep(
        "Revisão",
        "Volte ao que ainda trava e ajuste a próxima prática.",
        "review",
      ),
    ],
    goals: [
      {
        id: "practices",
        title: "Práticas na semana",
        metricId: "sessions",
        targetProperty: "weeklyPracticeGoal",
        unit: "práticas",
      },
    ],
    componentConfig: {
      tracker: tracker(
        "Trilha de aprendizado",
        "item da trilha",
        ["A explorar", "Praticando", "Revisar", "Aprendido"],
        [
          field("title", "Tema ou prática", "text", { required: true }),
          field("kind", "Tipo", "select", {
            options: [
              "Fundamento",
              "Exercício",
              "Projeto",
              "Recurso",
              "Milestone",
            ],
          }),
          field("resource", "Link", "url"),
          field("notes", "O que aprendi", "textarea"),
        ],
        "Adicione o primeiro fundamento ou prática da sua trilha.",
      ),
    },
    metrics: [
      metric(
        "sessions",
        "Práticas",
        { type: "sessions", aggregate: "count", windowDays: 7 },
        { targetProperty: "weeklyPracticeGoal" },
      ),
      metric(
        "minutes",
        "Tempo praticado",
        { type: "sessions", aggregate: "minutes" },
        { unit: "min" },
      ),
      metric("learned", "Itens aprendidos", {
        type: "tracker",
        statuses: ["Aprendido"],
      }),
    ],
    review: {
      cadenceDays: 7,
      prompts: [
        "O que você praticou?",
        "O que começou a ficar mais natural?",
        "Onde ainda há dúvida?",
        "Qual é a próxima prática?",
      ],
    },
  }),
  definition({
    id: "content",
    name: "Criar conteúdo",
    category: "Criativo",
    icon: "◐",
    color: "lavender",
    objective: "Levar ideias de conteúdo até a publicação sem perder o rumo.",
    description:
      "Reúna pesquisa, roteiro, produção e publicação em um fluxo que mantém o contexto vivo.",
    tag: "DA IDEIA À PUBLICAÇÃO",
    focus: 40,
    components: ["tracker", "tasks", "focus", "notes", "links"],
    onboarding: {
      intro:
        "Prepare um pipeline que combine com o conteúdo que você quer criar.",
      steps: [
        {
          id: "channel",
          title: "Onde e o que você quer publicar?",
          fields: [
            field("channel", "Canal ou plataforma", "text", { required: true }),
            field("formats", "Formatos", "list", {
              required: true,
              placeholder: "Ex.: vídeo curto, artigo",
            }),
            field("contentGoal", "Qual é a intenção do conteúdo?", "textarea"),
          ],
        },
        {
          id: "rhythm",
          title: "Qual ritmo parece possível?",
          optional: true,
          fields: [
            field("weeklyPublishGoal", "Publicações por semana", "number", {
              min: 1,
              max: 30,
              default: 1,
            }),
            field("focusMinutes", "Duração de uma sessão", "number", {
              min: 10,
              max: 180,
              default: 40,
            }),
          ],
        },
      ],
    },
    stages: [
      pathStep(
        "Escolher o tema",
        "Uma ideia com público e formato definidos.",
        "lesson",
      ),
      pathStep(
        "Preparar",
        "Pesquisa e roteiro suficientes para produzir.",
        "checkpoint",
      ),
      pathStep(
        "Produzir",
        "Grave, escreva ou desenhe o material bruto.",
        "practice",
      ),
      pathStep("Publicar", "Coloque no ar e registre o link.", "milestone"),
      pathStep(
        "Observar o retorno",
        "Anote o que repetir na próxima peça.",
        "review",
      ),
    ],
    goals: [
      {
        id: "published",
        title: "Publicações da semana",
        metricId: "published",
        targetProperty: "weeklyPublishGoal",
        unit: "conteúdos",
      },
    ],
    componentConfig: {
      tracker: tracker(
        "Pipeline de conteúdo",
        "conteúdo",
        ["Ideia", "Pesquisa", "Roteiro", "Produção", "Edição", "Publicado"],
        [
          field("title", "Título ou ideia", "text", { required: true }),
          field("format", "Formato", "select", {
            optionsFromProperty: "formats",
          }),
          field("publishAt", "Data planejada", "date"),
          field("link", "Link publicado ou referência", "url"),
          field("notes", "Notas", "textarea"),
        ],
        "Capture uma ideia antes que ela se perca.",
      ),
    },
    metrics: [
      metric(
        "published",
        "Publicados",
        { type: "tracker", statuses: ["Publicado"] },
        { targetProperty: "weeklyPublishGoal" },
      ),
      metric("inProgress", "Em produção", {
        type: "tracker",
        statuses: ["Pesquisa", "Roteiro", "Produção", "Edição"],
      }),
      metric("sessions", "Sessões", { type: "sessions", aggregate: "count" }),
    ],
    progress: { mode: "pipeline" },
    review: {
      cadenceDays: 7,
      prompts: [
        "O que foi publicado?",
        "Que ideia merece continuar?",
        "Onde o processo travou?",
        "Qual conteúdo vem em seguida?",
      ],
    },
  }),
  definition({
    id: "project",
    name: "Projeto pessoal",
    category: "Pessoal",
    tier: "pro",
    icon: "△",
    color: "peach",
    objective:
      "Conduzir um projeto pessoal com começo, passos claros e conclusão.",
    description:
      "Para mudanças, viagens, eventos, reformas e outros projetos que precisam virar resultado concreto.",
    tag: "UM PASSO DE CADA VEZ",
    focus: 30,
    components: ["tracker", "tasks", "focus", "notes", "links"],
    onboarding: {
      intro: "Dê contorno ao projeto sem precisar prever tudo agora.",
      steps: [
        {
          id: "project",
          title: "Que projeto é este?",
          fields: [
            field("projectName", "Nome do projeto", "text", { required: true }),
            field(
              "projectOutcome",
              "Como você saberá que terminou?",
              "textarea",
              { required: true },
            ),
            field("deadline", "Data desejada", "date"),
          ],
        },
        {
          id: "plan",
          title: "Quais partes você já enxerga?",
          optional: true,
          fields: [
            field("milestones", "Marcos", "list"),
            field("constraints", "Limites ou cuidados", "textarea"),
            field("focusMinutes", "Duração de uma sessão", "number", {
              min: 10,
              max: 180,
              default: 30,
            }),
          ],
        },
      ],
    },
    stages: [
      pathStep("Definição", "O resultado desejado, em uma frase.", "lesson"),
      pathStep(
        "Planejamento",
        "Marcos, prazos e o primeiro passo concreto.",
        "checkpoint",
      ),
      pathStep("Execução", "Avance um incremento visível.", "practice"),
      pathStep(
        "Ajustes",
        "Desbloqueie o que parou e decida o que corta.",
        "review",
      ),
      pathStep(
        "Concluído",
        "Encerre ou registre o que fica para a próxima volta.",
        "milestone",
      ),
    ],
    goals: [
      {
        id: "milestones",
        title: "Marcos concluídos",
        metricId: "milestonesDone",
        targetProperty: "milestoneCount",
        unit: "marcos",
      },
    ],
    componentConfig: {
      tracker: tracker(
        "Plano do projeto",
        "item do projeto",
        ["Planejado", "Em andamento", "Aguardando", "Concluído"],
        [
          field("title", "Título", "text", { required: true }),
          field("kind", "Tipo", "select", {
            options: ["Milestone", "Tarefa", "Decisão", "Custo", "Contato"],
          }),
          field("dueAt", "Data", "date"),
          field("link", "Referência", "url"),
          field("notes", "Contexto", "textarea"),
        ],
        "Adicione um marco ou o primeiro passo concreto.",
      ),
    },
    metrics: [
      metric("milestonesDone", "Marcos concluídos", {
        type: "tracker",
        field: "kind",
        values: ["Milestone"],
        statuses: ["Concluído"],
      }),
      metric("milestonesTotal", "Marcos planejados", {
        type: "tracker",
        field: "kind",
        values: ["Milestone"],
      }),
      metric("tasksDone", "Itens concluídos", {
        type: "tracker",
        statuses: ["Concluído"],
      }),
      metric("sessions", "Sessões", { type: "sessions", aggregate: "count" }),
    ],
    progress: {
      mode: "ratio",
      numeratorMetric: "milestonesDone",
      denominatorMetric: "milestonesTotal",
    },
    review: {
      cadenceDays: 7,
      prompts: [
        "O que avançou?",
        "O que ficou esperando?",
        "Algum limite mudou?",
        "Qual é o próximo marco?",
      ],
    },
  }),
  definition({
    id: "party",
    name: "Planejando uma festa",
    category: "Pessoal",
    icon: "✳",
    color: "lavender",
    tier: "free",
    objective: "Planejar uma festa do primeiro detalhe até o dia acontecer.",
    description:
      "Organize convidados, espaço, fornecedores, orçamento e decisões sem deixar os detalhes se perderem.",
    tag: "CELEBRE COM CALMA",
    focus: 25,
    components: ["tracker", "tasks", "notes", "links"],
    onboarding: {
      intro: "Vamos transformar a ideia da festa em um plano possível.",
      steps: [
        {
          id: "event",
          title: "Que encontro você está preparando?",
          fields: [
            field("eventName", "Nome ou ocasião", "text", { required: true }),
            field("eventDate", "Data da festa", "date"),
            field("guestCount", "Número estimado de convidados", "number", {
              min: 1,
              max: 10000,
            }),
            field("budget", "Orçamento aproximado", "number", { min: 0 }),
          ],
        },
        {
          id: "details",
          title: "O que já está decidido?",
          optional: true,
          fields: [
            field("venue", "Local ou formato", "text"),
            field("style", "Estilo ou tema", "text"),
            field("mustHave", "O que não pode faltar?", "list"),
          ],
        },
      ],
    },
    stages: [
      pathStep(
        "Definir a ideia",
        "Ocasião, tamanho e clima da festa.",
        "lesson",
      ),
      pathStep(
        "Escolher local e data",
        "Confirme espaço, horário e estrutura.",
        "checkpoint",
      ),
      pathStep(
        "Organizar pessoas e serviços",
        "Convites, fornecedores e confirmações.",
        "practice",
      ),
      pathStep(
        "Preparar o dia",
        "Confira compras, montagem e responsáveis.",
        "practice",
      ),
      pathStep(
        "Celebrar e registrar",
        "Finalize o que ficou pendente e guarde memórias.",
        "milestone",
      ),
    ],
    goals: [
      {
        id: "planning-items",
        title: "Itens de planejamento concluídos",
        metricId: "itemsDone",
        unit: "itens",
      },
    ],
    componentConfig: {
      tracker: tracker(
        "Plano da festa",
        "item da festa",
        [
          "Ideia",
          "Pesquisar",
          "Aguardando confirmação",
          "Confirmado",
          "Concluído",
        ],
        [
          field("title", "O que precisa ser organizado?", "text", {
            required: true,
          }),
          field("kind", "Tipo de item", "select", {
            options: [
              "Convidado",
              "Local",
              "Fornecedor",
              "Compra",
              "Decisão",
              "Tarefa",
            ],
          }),
          field("dueAt", "Data ou prazo", "date"),
          field("cost", "Custo previsto", "number"),
          field("contact", "Pessoa ou contato", "text"),
          field("link", "Referência", "url"),
          field("notes", "Detalhes", "textarea"),
        ],
        "Adicione a primeira decisão, pessoa ou tarefa da festa.",
      ),
    },
    metrics: [
      metric("itemsDone", "Itens concluídos", {
        type: "tracker",
        statuses: ["Concluído"],
      }),
      metric("itemsOpen", "Itens em aberto", {
        type: "tracker",
        statuses: [
          "Ideia",
          "Pesquisar",
          "Aguardando confirmação",
          "Confirmado",
        ],
      }),
    ],
    progress: {
      mode: "ratio",
      numeratorMetric: "itemsDone",
      denominatorMetric: "itemsOpen",
    },
    instructions: {
      summary:
        "Cuide primeiro das decisões que destravam outras pessoas e fornecedores.",
      prompts: [
        "O que precisa de confirmação?",
        "Qual prazo pode afetar o evento?",
        "Quem precisa receber uma atualização?",
      ],
    },
    review: {
      cadenceDays: 7,
      prompts: [
        "O que já está confirmado?",
        "O orçamento ainda está dentro do planejado?",
        "Qual detalhe precisa de uma decisão?",
      ],
    },
  }),
  definition({
    id: "language",
    name: "Aprendendo um novo idioma",
    category: "Estudos",
    icon: "文",
    color: "blue",
    tier: "pro",
    objective: "Construir confiança em um novo idioma com prática consistente.",
    description:
      "Defina uma direção, acompanhe vocabulário e situações reais e registre o que já consegue fazer.",
    tag: "PRÁTICA QUE VIRA CONFIANÇA",
    focus: 25,
    components: ["tracker", "tasks", "focus", "notes", "links"],
    onboarding: {
      intro: "Prepare uma trilha que caiba na sua vida e no seu nível atual.",
      steps: [
        {
          id: "language",
          title: "Qual idioma e para quê?",
          fields: [
            field("languageName", "Idioma", "text", { required: true }),
            field("languageReason", "Onde quer usar o idioma?", "textarea"),
            field("startingLevel", "Nível atual", "select", {
              options: [
                "Iniciante",
                "Básico",
                "Intermediário",
                "Avançado",
                "Não sei ainda",
              ],
            }),
            field("weeklyPracticeGoal", "Práticas por semana", "number", {
              min: 1,
              max: 14,
              default: 3,
            }),
          ],
        },
        {
          id: "practice",
          title: "Como você prefere praticar?",
          optional: true,
          fields: [
            field("practiceModes", "Práticas que quer combinar", "multi", {
              options: [
                "Conversação",
                "Escuta",
                "Leitura",
                "Escrita",
                "Vocabulário",
                "Gramática",
              ],
            }),
            field("resources", "Materiais para começar", "list"),
          ],
        },
      ],
    },
    stages: [
      pathStep(
        "Mapear seu ponto de partida",
        "Escolha situações e habilidades prioritárias.",
        "lesson",
      ),
      pathStep(
        "Construir vocabulário útil",
        "Guarde palavras e expressões dentro de contexto.",
        "practice",
      ),
      pathStep(
        "Praticar compreensão",
        "Alterne escuta e leitura com material acessível.",
        "practice",
      ),
      pathStep(
        "Usar o idioma",
        "Faça uma conversa ou produção curta no idioma.",
        "practice",
      ),
      pathStep(
        "Revisar e ampliar",
        "Registre o que já consegue fazer e escolha o próximo desafio.",
        "milestone",
      ),
    ],
    goals: [
      {
        id: "weekly-practice",
        title: "Práticas da semana",
        metricId: "practiceCount",
        targetProperty: "weeklyPracticeGoal",
        unit: "práticas",
      },
      {
        id: "learned-items",
        title: "Itens aprendidos",
        metricId: "learnedCount",
        unit: "itens",
      },
    ],
    componentConfig: {
      tracker: tracker(
        "Trilha de idioma",
        "prática de idioma",
        [
          "Para explorar",
          "Planejado",
          "Em prática",
          "Praticado",
          "Revisar",
          "Aprendido",
        ],
        [
          field("title", "O que estudar ou praticar?", "text", {
            required: true,
          }),
          field("kind", "Tipo", "select", {
            options: [
              "Vocabulário",
              "Gramática",
              "Escuta",
              "Leitura",
              "Escrita",
              "Conversação",
            ],
          }),
          field("dueAt", "Próxima prática", "date"),
          field("resource", "Material ou situação", "url"),
          field("notes", "Exemplo, dúvida ou reflexão", "textarea"),
        ],
        "Registre uma situação real em que quer usar o idioma.",
      ),
    },
    metrics: [
      metric(
        "practiceCount",
        "Práticas concluídas",
        { type: "tracker", statuses: ["Praticado", "Aprendido"] },
        { targetProperty: "weeklyPracticeGoal" },
      ),
      metric("learnedCount", "Itens aprendidos", {
        type: "tracker",
        statuses: ["Aprendido"],
      }),
      metric("sessions", "Sessões de foco", {
        type: "sessions",
        aggregate: "count",
        windowDays: 7,
      }),
    ],
    progress: { mode: "indicators" },
    instructions: {
      summary:
        "Pratique para usar o idioma em situações concretas, não apenas para acumular conteúdo.",
      prompts: [
        "O que você consegue dizer hoje?",
        "Que expressão vale revisar?",
        "Qual será a próxima prática real?",
      ],
    },
    review: {
      cadenceDays: 7,
      prompts: [
        "Que situação ficou mais fácil?",
        "O que você praticou nesta semana?",
        "Qual habilidade merece atenção agora?",
      ],
    },
  }),
  definition({
    id: "office",
    name: "Domine as ferramentas de escritório",
    category: "Aprendizado",
    icon: "▦",
    color: "mint",
    tier: "pro",
    objective:
      "Aprender ferramentas de escritório aplicando cada recurso em tarefas reais.",
    description:
      "Organize uma trilha prática para documentos, planilhas, apresentações e colaboração no trabalho.",
    tag: "APRENDER FAZENDO",
    focus: 30,
    components: ["tracker", "tasks", "focus", "notes", "links"],
    onboarding: {
      intro: "Escolha as ferramentas e situações de trabalho que quer dominar.",
      steps: [
        {
          id: "office-goal",
          title: "O que você quer conseguir fazer?",
          fields: [
            field("officeGoal", "Resultado desejado", "textarea", {
              required: true,
            }),
            field("officeTools", "Ferramentas prioritárias", "multi", {
              required: true,
              options: [
                "Documentos",
                "Planilhas",
                "Apresentações",
                "E-mail e agenda",
                "Armazenamento e colaboração",
              ],
            }),
            field("startingLevel", "Nível atual", "select", {
              options: ["Começando", "Básico", "Intermediário", "Avançado"],
            }),
          ],
        },
        {
          id: "practice-project",
          title: "Qual entrega pode servir de prática?",
          optional: true,
          fields: [
            field(
              "practiceProject",
              "Documento, planilha ou apresentação",
              "text",
            ),
            field("weeklyPracticeGoal", "Práticas por semana", "number", {
              min: 1,
              max: 14,
              default: 2,
            }),
            field("resources", "Cursos e materiais", "list"),
          ],
        },
      ],
    },
    stages: [
      pathStep(
        "Escolher uma entrega real",
        "Defina o que você quer produzir ou resolver.",
        "lesson",
      ),
      pathStep(
        "Aprender o recurso necessário",
        "Estude só o que ajuda na entrega atual.",
        "practice",
      ),
      pathStep(
        "Aplicar e revisar",
        "Use o recurso, confira o resultado e anote o que aprendeu.",
        "practice",
      ),
      pathStep(
        "Ampliar sua autonomia",
        "Repita com uma tarefa um pouco mais complexa.",
        "milestone",
      ),
    ],
    goals: [
      {
        id: "weekly-practice",
        title: "Práticas aplicadas",
        metricId: "practiceCount",
        targetProperty: "weeklyPracticeGoal",
        unit: "práticas",
      },
      {
        id: "deliveries",
        title: "Entregas concluídas",
        metricId: "deliveryCount",
        unit: "entregas",
      },
    ],
    componentConfig: {
      tracker: tracker(
        "Trilha de ferramentas",
        "atividade prática",
        [
          "Na trilha",
          "Planejada",
          "Em prática",
          "Aplicada",
          "Revisar",
          "Concluída",
        ],
        [
          field("title", "Recurso ou entrega", "text", { required: true }),
          field("kind", "Ferramenta", "select", {
            options: [
              "Documentos",
              "Planilhas",
              "Apresentações",
              "E-mail e agenda",
              "Colaboração",
            ],
          }),
          field("dueAt", "Próxima prática", "date"),
          field("link", "Arquivo ou material", "url"),
          field("notes", "O que aprendeu ou precisa revisar?", "textarea"),
        ],
        "Adicione uma entrega pequena que possa praticar.",
      ),
    },
    metrics: [
      metric(
        "practiceCount",
        "Práticas aplicadas",
        { type: "tracker", statuses: ["Aplicada", "Concluída"] },
        { targetProperty: "weeklyPracticeGoal" },
      ),
      metric("deliveryCount", "Entregas concluídas", {
        type: "tracker",
        field: "kind",
        statuses: ["Concluída"],
      }),
      metric("sessions", "Sessões de foco", {
        type: "sessions",
        aggregate: "count",
        windowDays: 7,
      }),
    ],
    progress: { mode: "indicators" },
    instructions: {
      summary:
        "Cada recurso aprendido deve ajudar a concluir uma entrega real.",
      prompts: [
        "Qual arquivo você quer conseguir criar?",
        "Que recurso precisa aprender primeiro?",
        "Como vai conferir o resultado?",
      ],
    },
    review: {
      cadenceDays: 7,
      prompts: [
        "Que entrega você concluiu?",
        "Que recurso ficou mais fácil?",
        "Qual tarefa real será a próxima prática?",
      ],
    },
  }),
  definition({
    id: "contest",
    name: "Estude para o concurso",
    category: "Estudos",
    icon: "▤",
    color: "yellow",
    tier: "pro",
    entity: { id: "study_record" },
    experience: {
      schemaVersion: 1,
      version: 1,
      layout: [
        {
          type: "hero",
          eyebrow: "PREPARAÇÃO PARA CONCURSO",
          title: "O que merece estudo agora",
          subtitle: "Edital, prática e revisão conectados ao seu objetivo.",
        },
        { type: "next-actions", title: "Hoje", source: "actions", limit: 5 },
        {
          type: "collection",
          title: "Plano de estudo",
          entity: "study_record",
          create: true,
          createLabel: "Adicionar atividade",
        },
        { type: "metrics", title: "Evolução", source: "metrics", limit: 4 },
        {
          type: "timeline",
          title: "Histórico de preparação",
          source: "history",
        },
      ],
    },
    objective:
      "Preparar-se para um concurso com prioridades, prática e revisão.",
    description:
      "Acompanhe edital, disciplinas, questões e simulados para direcionar seu estudo até a prova.",
    tag: "PREPARAÇÃO PARA CONCURSO",
    focus: 40,
    components: ["tracker", "tasks", "focus", "notes", "links"],
    onboarding: {
      intro:
        "Comece pelo concurso e pelas matérias que mais precisam de atenção.",
      steps: [
        {
          id: "target-exam",
          title: "Qual prova você está preparando?",
          fields: [
            field("examName", "Concurso ou processo seletivo", "text", {
              required: true,
            }),
            field("examRole", "Cargo ou área", "text"),
            field("examOrganization", "Órgão ou banca", "text"),
            field("examDate", "Data da prova", "date"),
            field("examNotice", "Link do edital", "url"),
          ],
        },
        {
          id: "study-plan",
          title: "Como organizar sua preparação?",
          optional: true,
          fields: [
            field("prioritySubjects", "Matérias prioritárias", "list", {
              required: true,
              maxItems: 8,
            }),
            field("weeklyHours", "Horas disponíveis por semana", "number", {
              min: 1,
              max: 80,
              default: 8,
            }),
            field("weeklyQuestionGoal", "Questões por semana", "number", {
              min: 1,
              max: 1000,
              default: 60,
            }),
            field(
              "lowConfidenceSubjects",
              "Matérias que mais preocupam",
              "list",
            ),
          ],
        },
      ],
    },
    stages: [
      pathStep(
        "Ler o edital",
        "Entenda matérias, pesos, etapas e regras da prova.",
        "lesson",
      ),
      pathStep(
        "Priorizar matérias",
        "Distribua atenção conforme peso, domínio e prazo.",
        "checkpoint",
      ),
      pathStep(
        "Estudar e praticar",
        "Alterne conteúdo, questões e revisão ativa.",
        "practice",
      ),
      pathStep(
        "Simular a prova",
        "Treine tempo, estratégia e resistência.",
        "practice",
      ),
      pathStep(
        "Revisar a preparação",
        "Observe resultados e ajuste o plano até a prova.",
        "milestone",
      ),
    ],
    goals: [
      {
        id: "weekly-questions",
        title: "Questões resolvidas",
        metricId: "questions",
        targetProperty: "weeklyQuestionGoal",
        unit: "questões",
      },
      {
        id: "subjects-reviewed",
        title: "Matérias revisadas",
        metricId: "subjectsReviewed",
        unit: "matérias",
      },
    ],
    componentConfig: {
      tracker: tracker(
        "Plano de preparação",
        "atividade de estudo",
        ["Planejado", "Em estudo", "Praticado", "Revisar", "Concluído"],
        [
          field("subject", "Matéria", "text", { required: true }),
          field("topic", "Conteúdo ou atividade", "text", { required: true }),
          field("kind", "Tipo", "select", {
            options: ["Conteúdo", "Questões", "Revisão", "Simulado"],
          }),
          field("questions", "Questões resolvidas", "number"),
          field("correct", "Acertos", "number"),
          field("studyDate", "Data de estudo", "date"),
          field("notes", "Erros e aprendizados", "textarea"),
        ],
        "Adicione uma matéria do edital ou a primeira sessão de estudo.",
      ),
    },
    metrics: [
      metric(
        "questions",
        "Questões resolvidas",
        {
          type: "tracker",
          field: "kind",
          values: ["Questões", "Simulado"],
          aggregate: "sum",
          valueField: "questions",
        },
        { targetProperty: "weeklyQuestionGoal" },
      ),
      metric("subjectsReviewed", "Matérias revisadas", {
        type: "tracker",
        field: "kind",
        values: ["Revisão"],
        aggregate: "count",
      }),
      metric("sessions", "Sessões de estudo", {
        type: "sessions",
        aggregate: "count",
        windowDays: 7,
      }),
    ],
    progress: { mode: "indicators" },
    instructions: {
      summary:
        "Distribua a preparação a partir do edital e use questões para descobrir o que precisa voltar.",
      prompts: [
        "Qual matéria tem maior peso?",
        "Que erro precisa ser revisado?",
        "Quando será o próximo simulado?",
      ],
    },
    review: {
      cadenceDays: 7,
      prompts: [
        "Que matérias avançaram?",
        "O desempenho em questões mudou?",
        "O plano ainda cabe até a prova?",
        "Qual conteúdo precisa voltar?",
      ],
    },
  }),
];
