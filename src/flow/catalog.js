import {
  createFlowInstance,
  emptyAccount,
  toPublicDefinition,
} from "./model.js";
import { officialDefinitions } from "./officialDefinitions.js";

export const components = [
  [
    "focus",
    "Foco",
    "◷",
    "Sessões livres ou temporizadas ligadas ao seu objetivo.",
  ],
  ["tasks", "Tarefas", "☑", "Transforme objetivos em próximos passos."],
  ["tracker", "Tracker", "◎", "Acompanhe itens, etapas e próximos passos."],
  ["notes", "Notas", "▤", "Suas ideias, sempre por perto."],
  ["links", "Recursos", "↗", "Referências organizadas para o seu objetivo."],
  ["music", "Música", "♫", "Uma trilha para entrar no ritmo."],
  ["kanban", "Kanban", "▥", "Visualize cada etapa do trabalho."],
  ["snippets", "Snippets", "⌘", "Trechos de código para reutilizar."],
  ["playground", "Playground", "⌨", "Experimente HTML, CSS e JavaScript."],
  ["converter", "Conversor", "⇄", "Conversões úteis sem sair do Flow."],
  ["water", "Hidratação", "♧", "Lembre de fazer uma pausa."],
  ["deploy", "Checklist de deploy", "↑", "Prepare a entrega do seu projeto."],
  ["fake", "Dados de teste", "⌗", "Gere dados para protótipos."],
  ["timer", "Timer", "◴", "Faça uma contagem regressiva independente."],
].map(([id, name, icon, description]) => ({ id, name, icon, description }));

export const templates = officialDefinitions;
export const clone = (value) => JSON.parse(JSON.stringify(value));
export const makeFlow = createFlowInstance;
export const publicTemplate = toPublicDefinition;
export { emptyAccount };

export function latestDefinition(flow) {
  if (flow?.definitionRef?.source !== "official") return null;
  return templates.find((item) => item.id === flow.definitionRef.id) || null;
}

export function definitionUpdate(flow) {
  const latest = latestDefinition(flow);
  if (!latest || latest.version <= (flow.definitionRef?.version || 1))
    return null;
  return {
    id: latest.id,
    currentVersion: flow.definitionRef.version || 1,
    availableVersion: latest.version,
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
