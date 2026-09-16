export const components = [
  {
    id: "focus",
    name: "Pomodoro",
    icon: "◷",
    description: "Um intervalo de cada vez.",
  },
  {
    id: "tasks",
    name: "Checklist",
    icon: "☑",
    description: "Transforme objetivos em próximos passos.",
  },
  {
    id: "notes",
    name: "Notas",
    icon: "▤",
    description: "Suas ideias, sempre por perto.",
  },
  {
    id: "links",
    name: "Links",
    icon: "↗",
    description: "Referências para o seu objetivo.",
  },
  {
    id: "music",
    name: "Música",
    icon: "♫",
    description: "Uma trilha para entrar no ritmo.",
  },
  {
    id: "kanban",
    name: "Kanban",
    icon: "▥",
    description: "Visualize cada etapa do trabalho.",
  },
  {
    id: "snippets",
    name: "Snippets",
    icon: "⌘",
    description: "Trechos de código para reutilizar.",
  },
  {
    id: "playground",
    name: "Playground",
    icon: "⌨",
    description: "Experimente HTML, CSS e JavaScript.",
  },
  {
    id: "converter",
    name: "Conversor",
    icon: "⇄",
    description: "Conversões úteis sem sair do Flow.",
  },
  {
    id: "water",
    name: "Hidratação",
    icon: "♧",
    description: "Lembre de fazer uma pausa.",
  },
  {
    id: "deploy",
    name: "Checklist de deploy",
    icon: "↑",
    description: "Prepare a entrega do seu projeto.",
  },
  {
    id: "fake",
    name: "Dados de teste",
    icon: "⌗",
    description: "Gere dados para protótipos.",
  },
  {
    id: "timer",
    name: "Cronômetro",
    icon: "◴",
    description: "Meça o tempo de uma atividade.",
  },
];
export const templates = [
  {
    id: "enem",
    name: "Meu próximo passo: ENEM",
    category: "Estudos",
    icon: "✳",
    color: "mint",
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
  },
  {
    id: "code",
    name: "Do código ao deploy",
    category: "Programação",
    icon: "⌘",
    color: "lavender",
    description:
      "Menos abas abertas. Mais espaço para construir sua próxima ideia.",
    components: ["focus", "kanban", "snippets", "notes", "playground"],
    focus: 50,
    tasks: [],
    tag: "DEEP WORK",
  },
  {
    id: "week",
    name: "Uma semana mais leve",
    category: "Organização",
    icon: "◈",
    color: "peach",
    description: "Tire os planos da cabeça e dê um lugar para cada prioridade.",
    components: ["tasks", "notes", "links"],
    focus: 25,
    tasks: [
      "Definir as três prioridades da semana",
      "Reservar um momento de descanso",
    ],
    tag: "ENCONTRE SEU RITMO",
  },
  {
    id: "job",
    name: "Seu próximo capítulo",
    category: "Carreira",
    icon: "↗",
    color: "blue",
    description:
      "Organize vagas, prepare entrevistas e acompanhe suas candidaturas.",
    components: ["kanban", "tasks", "notes", "links"],
    focus: 25,
    tasks: [
      "Atualizar o currículo",
      "Selecionar vagas alinhadas ao meu perfil",
    ],
    tag: "NOVAS POSSIBILIDADES",
  },
  {
    id: "college",
    name: "Faculdade em dia",
    category: "Estudos",
    icon: "▧",
    color: "yellow",
    description:
      "Referências, entregas e ideias reunidas para o seu próximo trabalho.",
    components: ["focus", "tasks", "notes", "links"],
    focus: 50,
    tasks: ["Organizar referências", "Escrever o primeiro rascunho"],
    tag: "IDEIAS EM MOVIMENTO",
  },
  {
    id: "blank",
    name: "Do seu jeito",
    category: "Personalizado",
    icon: "+",
    color: "plain",
    description:
      "Uma tela em branco. Escolha os componentes e encontre seu próprio Flow.",
    components: [],
    focus: 25,
    tasks: [],
    tag: "CRIE DO ZERO",
  },
];
export const clone = (value) => JSON.parse(JSON.stringify(value));
export function makeFlow(template, name = template.name) {
  const selected = [...new Set(template.components)].filter((id) =>
    components.some((c) => c.id === id),
  );
  return {
    id: crypto.randomUUID(),
    name: name.trim().slice(0, 100) || template.name,
    category: template.category || "Personalizado",
    color: template.color || "mint",
    icon: template.icon || "✳",
    components: selected,
    createdAt: Date.now(),
    updatedAt: Date.now(),
    data: {
      tasks: (template.tasks || []).map((text) => ({
        id: crypto.randomUUID(),
        text,
        done: false,
      })),
      notesText: "",
      links: [],
      focusMinutes: Math.max(1, Math.min(180, Number(template.focus) || 25)),
    },
    sessions: [],
  };
}
export function publicTemplate(flow) {
  // Only the layout/configuration is shared. Notes, tasks, URLs and history stay private.
  return {
    name: flow.name,
    category: flow.category,
    color: flow.color,
    icon: flow.icon,
    components: flow.components.filter((id) =>
      components.some((c) => c.id === id),
    ),
    focus: flow.data.focusMinutes || 25,
    tasks: [],
    description: `Um Flow de ${flow.category.toLowerCase()} com ${flow.components.length} componentes.`,
    tag: "DA COMUNIDADE",
  };
}
export function emptyAccount() {
  return {
    version: 2,
    name: "",
    onboarded: false,
    flows: [],
    activeSession: null,
  };
}
export function safeUrl(value) {
  try {
    const url = new URL(value);
    return ["http:", "https:"].includes(url.protocol) ? url.href : null;
  } catch {
    return null;
  }
}
