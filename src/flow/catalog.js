import {
  createFlowInstance,
  emptyAccount,
  toPublicDefinition,
} from "./model.js";

export const components = [
  ["focus", "Pomodoro", "◷", "Um intervalo de cada vez."],
  ["tasks", "Checklist", "☑", "Transforme objetivos em próximos passos."],
  ["notes", "Notas", "▤", "Suas ideias, sempre por perto."],
  ["links", "Links", "↗", "Referências para o seu objetivo."],
  ["music", "Música", "♫", "Uma trilha para entrar no ritmo."],
  ["kanban", "Kanban", "▥", "Visualize cada etapa do trabalho."],
  ["snippets", "Snippets", "⌘", "Trechos de código para reutilizar."],
  ["playground", "Playground", "⌨", "Experimente HTML, CSS e JavaScript."],
  ["converter", "Conversor", "⇄", "Conversões úteis sem sair do Flow."],
  ["water", "Hidratação", "♧", "Lembre de fazer uma pausa."],
  ["deploy", "Checklist de deploy", "↑", "Prepare a entrega do seu projeto."],
  ["fake", "Dados de teste", "⌗", "Gere dados para protótipos."],
  ["timer", "Cronômetro", "◴", "Meça o tempo de uma atividade."],
].map(([id, name, icon, description]) => ({ id, name, icon, description }));

const definition = (value) => ({
  schemaVersion: 2,
  kind: "flow_definition",
  version: 1,
  visibility: "official",
  onboarding: {
    intro: value.description,
    steps: [
      "Defina seu objetivo",
      "Escolha os componentes",
      "Prepare o primeiro passo",
    ],
  },
  properties: {},
  goals: [],
  stages: [],
  metrics: [
    { id: "minutes", label: "Tempo dedicado", unit: "min", aggregation: "sum" },
    {
      id: "sessions",
      label: "Sessões concluídas",
      unit: "sessão",
      aggregation: "count",
    },
  ],
  instructions: { summary: value.description, prompts: [] },
  review: {
    cadenceDays: 7,
    prompts: ["O que avançou?", "Qual é o próximo passo?"],
  },
  initialData: {},
  ...value,
});

export const templates = [
  definition({
    id: "enem",
    name: "Meu próximo passo: ENEM",
    category: "Estudos",
    icon: "✳",
    color: "mint",
    objective: "Construir uma rotina sustentável de preparação para o ENEM.",
    description:
      "Da revisão à redação. Um espaço para chegar mais perto da sua aprovação.",
    components: ["focus", "tasks", "notes", "links", "music"],
    focus: 25,
    tasks: [
      "Revisar o conteúdo de hoje",
      "Resolver 10 questões",
      "Anotar dúvidas para a próxima revisão",
    ],
    tag: "COMECE POR AQUI",
  }),
  definition({
    id: "code",
    name: "Do código ao deploy",
    category: "Programação",
    icon: "⌘",
    color: "lavender",
    objective: "Levar uma ideia de software até uma entrega validada.",
    description:
      "Menos abas abertas. Mais espaço para construir sua próxima ideia.",
    components: ["focus", "kanban", "snippets", "notes", "playground"],
    focus: 50,
    tasks: [],
    tag: "DEEP WORK",
  }),
  definition({
    id: "week",
    name: "Uma semana mais leve",
    category: "Organização",
    icon: "◈",
    color: "peach",
    objective: "Organizar prioridades com espaço realista para descanso.",
    description: "Tire os planos da cabeça e dê um lugar para cada prioridade.",
    components: ["tasks", "notes", "links"],
    focus: 25,
    tasks: [
      "Definir as três prioridades da semana",
      "Reservar um momento de descanso",
    ],
    tag: "ENCONTRE SEU RITMO",
  }),
  definition({
    id: "job",
    name: "Seu próximo capítulo",
    category: "Carreira",
    icon: "↗",
    color: "blue",
    objective: "Conduzir uma busca de trabalho organizada e consciente.",
    description:
      "Organize vagas, prepare entrevistas e acompanhe suas candidaturas.",
    components: ["kanban", "tasks", "notes", "links"],
    focus: 25,
    tasks: [
      "Atualizar o currículo",
      "Selecionar vagas alinhadas ao meu perfil",
    ],
    tag: "NOVAS POSSIBILIDADES",
  }),
  definition({
    id: "college",
    name: "Faculdade em dia",
    category: "Estudos",
    icon: "▧",
    color: "yellow",
    objective:
      "Concluir trabalhos acadêmicos com contexto e referências reunidos.",
    description:
      "Referências, entregas e ideias reunidas para o seu próximo trabalho.",
    components: ["focus", "tasks", "notes", "links"],
    focus: 50,
    tasks: ["Organizar referências", "Escrever o primeiro rascunho"],
    tag: "IDEIAS EM MOVIMENTO",
  }),
  definition({
    id: "blank",
    name: "Do seu jeito",
    category: "Personalizado",
    icon: "+",
    color: "plain",
    objective: "Criar um espaço próprio para um objetivo específico.",
    description:
      "Uma tela em branco. Escolha os componentes e encontre seu próprio Flow.",
    components: [],
    focus: 25,
    tasks: [],
    tag: "CRIE DO ZERO",
  }),
];

export const clone = (value) => JSON.parse(JSON.stringify(value));
export const makeFlow = createFlowInstance;
export const publicTemplate = toPublicDefinition;
export { emptyAccount };

export function safeUrl(value) {
  try {
    const url = new URL(value);
    return ["http:", "https:"].includes(url.protocol) ? url.href : null;
  } catch {
    return null;
  }
}
