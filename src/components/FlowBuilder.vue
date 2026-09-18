<script setup>
import { computed, ref } from "vue";
import { buildFlowExperience } from "../flow/experience.js";
import DynamicExperience from "./experience/DynamicExperience.vue";

const emit = defineEmits(["complete", "cancel"]);
const step = ref(0);
const name = ref("");
const description = ref("");
const objective = ref("");
const category = ref("Personalizado");
const icon = ref("✳");
const color = ref("mint");
const displayName = ref("Pessoa Noma");
const entities = ref([]);
const stages = ref("");
const highlights = ref(["next-actions", "collection", "progress"]);
const cadenceDays = ref(7);
const fieldDrafts = ref({});

const presets = [
  { id: "tasks", label: "Tarefas", description: "Passos simples para concluir." },
  { id: "stages", label: "Algo que passa por etapas", description: "Uma coleção com estados e caminho." },
  { id: "deadlines", label: "Datas e prazos", description: "Itens com datas para chamar atenção." },
  { id: "practice", label: "Hábitos e práticas", description: "Registros recorrentes e check-ins." },
  { id: "content", label: "Conteúdos", description: "Ideias, materiais e publicações." },
  { id: "simple", label: "Começar simples", description: "Você pode aprofundar depois." },
];
const fieldTypes = ["text", "textarea", "number", "date", "datetime", "boolean", "url", "select", "multi-select"];
const sectionOptions = [
  ["next-actions", "Agora"],
  ["collection", "Lista"],
  ["pipeline", "Pipeline"],
  ["progress", "Progresso"],
  ["agenda", "Agenda"],
  ["resources", "Materiais"],
  ["notes", "Notas"],
  ["metrics", "Métricas"],
];

function slug(value, fallback = "item") {
  return String(value || fallback)
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "_")
    .replace(/^_|_$/g, "") || fallback;
}
function addPreset(preset) {
  if (["tasks", "simple"].includes(preset.id)) return;
  if (entities.value.length) return;
  const entityId = preset.id === "content" ? "conteudo" : "atividade";
  entities.value.push({
    id: entityId,
    label: preset.id === "content" ? "Conteúdos" : "Atividades",
    singular: preset.id === "content" ? "conteúdo" : "atividade",
    fields:
      preset.id === "content"
        ? [
            { key: "title", label: "Título", type: "text", required: true },
            { key: "format", label: "Formato", type: "select", options: ["Vídeo", "Texto", "Aula", "Outro"] },
            { key: "publishAt", label: "Data planejada", type: "date" },
          ]
        : [
            { key: "title", label: "Título", type: "text", required: true },
            { key: "module", label: "Módulo", type: "text" },
            { key: "dueAt", label: "Prazo", type: "date" },
            { key: "completed", label: "Concluído", type: "boolean" },
          ],
    states: preset.id === "stages" ? ["Planejado", "Em andamento", "Concluído"] : [],
  });
}
function addEntity() {
  const index = entities.value.length + 1;
  entities.value.push({ id: `colecao_${index}`, label: `Coleção ${index}`, singular: "item", fields: [{ key: "title", label: "Título", type: "text", required: true }], states: [] });
}
function addField(entity) {
  const draft = fieldDrafts.value[entity.id] || { label: "Novo campo", type: "text", options: "" };
  const key = slug(draft.label, `campo_${entity.fields.length + 1}`);
  entity.fields.push({
    key,
    label: draft.label || key,
    type: draft.type,
    ...(draft.type === "select" || draft.type === "multi-select"
      ? { options: String(draft.options || "").split(/[\n,;]+/).map((item) => item.trim()).filter(Boolean) }
      : {}),
  });
  fieldDrafts.value[entity.id] = { label: "Novo campo", type: "text", options: "" };
}
function toggleSection(type) {
  highlights.value = highlights.value.includes(type)
    ? highlights.value.filter((item) => item !== type)
    : [...highlights.value, type];
}
function moveSection(index, direction) {
  const target = index + direction;
  if (target < 0 || target >= highlights.value.length) return;
  [highlights.value[index], highlights.value[target]] = [highlights.value[target], highlights.value[index]];
}
function skipCollection() {
  step.value = 5;
}
function protocolDefinition() {
  const normalizedEntities = {};
  for (const source of entities.value) {
    const id = slug(source.id || source.label);
    normalizedEntities[id] = {
      id,
      label: source.label || "Itens",
      singular: source.singular || "item",
      primaryField: source.fields[0]?.key || "title",
      fields: source.fields.map((field) => ({ ...field })),
      states: source.states.map((label, order) => ({ id: slug(label, `state_${order}`), label, order })),
    };
  }
  const commands = ["create_entity", "update_entity", "transition_entity", "complete_entity", "create_task", "complete_task", "schedule_action", "record_checkin", "add_note", "add_resource"];
  const actions = Object.values(normalizedEntities).flatMap((entity) => {
    const primary = entity.primaryField;
    const dueField = entity.fields.find((field) => ["date", "datetime"].includes(field.type))?.key;
    return [
      {
        id: `continue_${entity.id}`,
        entity: entity.id,
        title: `Continuar {${primary}}`,
        description: "Um próximo passo disponível neste Flow.",
        ...(dueField ? { dueField } : {}),
        operations: ["open", "complete", "postpone", "dismiss"],
      },
    ];
  });
  return {
    schemaVersion: 1,
    version: 1,
    entities: normalizedEntities,
    commands,
    events: ["entity.created", "entity.updated", "entity.transitioned", "entity.completed", "task.completed", "checkin.recorded", "review.completed"],
    rules: [],
    actions,
  };
}
function experienceDefinition(protocol) {
  const layout = [
    { type: "hero", eyebrow: "SEU FLOW", title: objective.value || name.value, subtitle: description.value || "Um espaço preparado para continuar." },
  ];
  for (const type of highlights.value) {
    if (type === "collection") {
      for (const entity of Object.values(protocol.entities)) layout.push({ type: "collection", title: entity.label, entity: entity.id, create: true, createLabel: `Adicionar ${entity.singular}` });
    } else if (type === "pipeline") {
      for (const entity of Object.values(protocol.entities).filter((item) => item.states.length)) layout.push({ type: "pipeline", title: `${entity.label} por etapa`, entity: entity.id, create: false });
    } else if (type === "next-actions") layout.push({ type: "next-actions", title: "Agora", source: "actions", limit: 5 });
    else if (type === "progress" || type === "metrics") layout.push({ type: type === "progress" ? "progress" : "metrics", title: type === "progress" ? "Progresso" : "Métricas", source: "metrics" });
    else layout.push({ type, title: sectionOptions.find(([id]) => id === type)?.[1] || type, source: type });
  }
  if (!layout.some((section) => section.type === "next-actions")) layout.push({ type: "next-actions", title: "Agora", source: "actions", limit: 5 });
  return { schemaVersion: 1, version: 1, layout };
}
function buildDefinition() {
  const protocol = protocolDefinition();
  return {
    schemaVersion: 2,
    definitionSchemaVersion: 1,
    kind: "flow_definition",
    version: 1,
    visibility: "private",
    id: null,
    name: name.value.trim() || "Novo Flow",
    category: category.value || "Personalizado",
    icon: icon.value,
    color: color.value,
    objective: objective.value.trim() || name.value.trim() || "Um objetivo em movimento",
    description: description.value.trim() || "Um espaço preparado para continuar.",
    components: ["tasks", "notes"],
    onboarding: { intro: "Este Flow foi criado por você.", steps: [] },
    properties: { focusMinutes: 25 },
    goals: Object.values(protocol.entities).map((entity) => ({ id: `${entity.id}-completed`, title: `${entity.label} concluídos`, metricId: `${entity.id}-completed`, unit: "itens" })),
    stages: stages.value.split(/[\n,;]+/).map((item) => item.trim()).filter(Boolean),
    metrics: Object.values(protocol.entities).map((entity) => ({ id: `${entity.id}-completed`, label: `${entity.label} concluídos`, source: { type: "entity", entity: entity.id, completed: true } })),
    progress: { mode: "indicators" },
    instructions: { summary: description.value.trim(), prompts: ["Qual é o próximo passo?"] },
    review: { cadenceDays: Math.max(1, Number(cadenceDays.value) || 7), prompts: ["O que avançou?", "O que precisa de atenção?", "Qual é o próximo passo?"] },
    protocol,
    experience: experienceDefinition(protocol),
    initialData: { collections: Object.fromEntries(Object.keys(protocol.entities).map((id) => [id, []])) },
  };
}
const previewFlow = computed(() => {
  const definition = buildDefinition();
  return {
    id: "builder-preview",
    definitionRef: { id: null, version: 1 },
    identity: { name: definition.name, category: definition.category, icon: definition.icon, color: definition.color },
    objective: definition.objective,
    description: definition.description,
    properties: definition.properties,
    protocol: definition.protocol,
    experience: definition.experience,
    componentData: { collections: definition.initialData.collections, tasks: { items: [] }, notes: { items: [] } },
    metricDefinitions: definition.metrics,
    goals: definition.goals,
    stages: definition.stages.map((title, order) => ({ id: slug(title), title, order, status: order === 0 ? "current" : "upcoming" })),
    metrics: {},
    progress: { strategy: definition.progress, value: null },
    sessions: [],
    events: [],
    review: { nextAt: Date.now() + 7 * 86400000, history: [] },
  };
});
const previewExperience = computed(() => buildFlowExperience(previewFlow.value));
const canContinue = computed(() => (step.value === 0 ? Boolean(name.value.trim()) : step.value === 1 ? Boolean(objective.value.trim()) : true));
function next() {
  if (!canContinue.value) return;
  step.value = Math.min(6, step.value + 1);
}
function finish() {
  if (!canContinue.value) return;
  emit("complete", { name: name.value.trim(), displayName: displayName.value.trim() || "Pessoa Noma", answers: {}, components: ["tasks", "notes"], definition: buildDefinition() });
}
</script>

<template>
  <div class="flow-builder">
    <div class="eyebrow">CRIAR UM FLOW / {{ step + 1 }} DE 7</div>
    <h2>{{ ["Dê um nome ao que você quer realizar.", "Qual é o propósito deste Flow?", "O que você quer acompanhar?", "Quais etapas isso percorre?", "O que você quer ver neste Flow?", "Quando o Noma deve chamar sua atenção?", "Veja como vai ficar."][step] }}</h2>
    <p class="onboarding-description">{{ ["Comece simples. Você poderá aprofundar quando fizer sentido.", "Um objetivo claro ajuda o Flow a destacar o próximo passo.", "Escolha uma base ou crie uma coleção própria.", "Etapas são opcionais e podem ser ajustadas depois.", "Escolha apenas os blocos que ajudam você a continuar.", "Uma revisão periódica mantém o contexto vivo.", "Este é o mesmo renderer usado pelo Flow depois de salvo."][step] }}</p>
    <div class="step-progress" aria-hidden="true"><i v-for="index in 7" :key="index" :class="{ filled: step >= index - 1 }"></i></div>

    <div v-if="step === 0" class="onboarding-fields"><label class="tool-field">Nome do Flow<input v-model="name" autofocus placeholder="Ex.: Introdução a Redes — Turma 2026" /></label></div>
    <div v-else-if="step === 1" class="onboarding-fields"><label class="tool-field">O que você quer realizar?<textarea v-model="objective" rows="3" placeholder="Ex.: Acompanhar uma disciplina com meus alunos"></textarea></label><label class="tool-field">Descrição · opcional<textarea v-model="description" rows="2" placeholder="O que torna este Flow útil?"></textarea></label><div class="builder-inline-fields"><label class="tool-field">Categoria<select v-model="category"><option>Personalizado</option><option>Estudos</option><option>Organização</option><option>Carreira</option><option>Projetos</option><option>Criativo</option></select></label><label class="tool-field">Símbolo<select v-model="icon"><option>✳</option><option>◈</option><option>◇</option><option>△</option><option>↗</option><option>⌘</option></select></label><label class="tool-field">Cor<select v-model="color"><option>mint</option><option>blue</option><option>lavender</option><option>peach</option><option>yellow</option></select></label></div></div>
    <div v-else-if="step === 2" class="builder-step"><div class="builder-presets"><button v-for="preset in presets" :key="preset.id" class="builder-preset" type="button" @click="addPreset(preset)"><strong>{{ preset.label }}</strong><small>{{ preset.description }}</small></button></div><button class="outline" type="button" @click="addEntity">＋ Criar outra coleção</button><article v-for="entity in entities" :key="entity.id" class="builder-entity"><div class="builder-inline-fields"><label class="tool-field">Nome da coleção<input v-model="entity.label" /></label><label class="tool-field">Nome no singular<input v-model="entity.singular" /></label></div><div class="builder-fields"><span class="eyebrow">CAMPOS</span><div v-for="field in entity.fields" :key="field.key" class="builder-field"><input v-model="field.label" aria-label="Nome do campo" /><select v-model="field.type" aria-label="Tipo do campo"><option v-for="type in fieldTypes" :key="type">{{ type }}</option></select></div><div class="builder-field builder-field--new"><input v-model="fieldDrafts[entity.id].label" aria-label="Nome do novo campo" placeholder="Nome do novo campo" /><select v-model="fieldDrafts[entity.id].type" aria-label="Tipo do novo campo"><option v-for="type in fieldTypes" :key="type">{{ type }}</option></select><button class="outline" type="button" @click="addField(entity)">Adicionar campo</button></div></div></article></div>
    <div v-else-if="step === 3" class="builder-step"><label class="tool-field">Etapas · opcional<textarea v-model="stages" rows="5" placeholder="Uma por linha: Fundamentos\nTCP/IP\nSwitching\nRouting\nSegurança"></textarea></label><p class="hint">As etapas são apenas dados do Flow. O Noma usará os mesmos estados para listas, ações e progresso.</p></div>
    <div v-else-if="step === 4" class="builder-step"><fieldset class="builder-options"><legend>O que você quer ver neste Flow?</legend><label v-for="[id, label] in sectionOptions" :key="id"><input type="checkbox" :checked="highlights.includes(id)" @change="toggleSection(id)" />{{ label }}</label></fieldset><div class="builder-order"><span class="eyebrow">ORDEM DOS BLOCOS</span><div v-for="(id, index) in highlights" :key="id"><span>{{ sectionOptions.find(([item]) => item === id)?.[1] || id }}</span><button type="button" aria-label="Mover bloco para cima" :disabled="index === 0" @click="moveSection(index, -1)">↑</button><button type="button" aria-label="Mover bloco para baixo" :disabled="index === highlights.length - 1" @click="moveSection(index, 1)">↓</button></div></div></div>
    <div v-else-if="step === 5" class="builder-step"><label class="tool-field">Revisar a cada quantos dias? · opcional<input v-model="cadenceDays" type="number" min="1" max="90" /></label><label class="onboarding-toggle"><input v-model="displayName" placeholder="Seu nome" /><span>Como podemos te chamar?</span></label></div>
    <div v-else class="builder-preview"><DynamicExperience :flow="previewFlow" :experience="previewExperience" @action="() => {}" @command="() => {}" @review="() => {}" /></div>

    <footer><button v-if="step > 0" type="button" class="outline" @click="step--">← Voltar</button><button v-if="[2, 3, 4].includes(step)" type="button" class="text-button" @click="skipCollection">Pular por agora</button><button v-if="step < 6" type="button" class="dark-button" :disabled="!canContinue" @click="next">Continuar →</button><button v-else type="button" class="dark-button" :disabled="!canContinue" @click="finish">Entrar no meu Flow ↗</button><button type="button" class="text-button" @click="emit('cancel')">Cancelar</button></footer>
  </div>
</template>

<style scoped>
.flow-builder { display: grid; gap: 1rem; }
.builder-inline-fields { display: grid; grid-template-columns: repeat(3, minmax(0, 1fr)); gap: .7rem; }
.builder-presets { display: grid; grid-template-columns: repeat(2, minmax(0, 1fr)); gap: .6rem; }
.builder-preset { display: grid; gap: .25rem; padding: .85rem; text-align: left; border: 1px solid var(--noma-border); border-radius: 13px; background: var(--noma-surface); }
.builder-preset:hover, .builder-preset:focus-visible { border-color: var(--noma-brand); background: var(--noma-surface-soft); }
.builder-preset small, .builder-field input { color: var(--noma-ink-soft); }
.builder-entity { display: grid; gap: .8rem; padding: 1rem; border: 1px solid var(--noma-border); border-radius: 14px; }
.builder-fields { display: grid; gap: .4rem; }
.builder-field { display: grid; grid-template-columns: 1fr 12rem auto; gap: .45rem; }
.builder-field input, .builder-field select { min-height: 2.25rem; border: 1px solid var(--noma-border); border-radius: 8px; padding: .45rem .6rem; background: var(--noma-surface); }
.builder-options { display: grid; gap: .55rem; border: 1px solid var(--noma-border); border-radius: 13px; padding: 1rem; }
.builder-order { display: grid; gap: .35rem; }
.builder-order > div { display: flex; align-items: center; gap: .4rem; padding: .45rem .6rem; border-bottom: 1px solid var(--noma-border); }
.builder-order > div span { flex: 1; }
.builder-preview { max-height: 28rem; overflow: auto; border: 1px solid var(--noma-border); border-radius: 14px; padding: .8rem; }
.builder-preview :deep(.specialized-experience__hero) { padding-top: .2rem; }
@media (max-width: 700px) { .builder-inline-fields, .builder-presets { grid-template-columns: 1fr; } .builder-field { grid-template-columns: 1fr; } }
</style>
