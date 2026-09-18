<script setup>
import { computed, ref, watch } from "vue";
import { useFlowComponentStorage } from "../composables/useFlowComponentStorage.js";
import ToolLayout from "./ui/ToolLayout.vue";

const props = defineProps({
  flow: { type: Object, required: true },
  componentConfig: { type: Object, default: () => ({}) },
  storageKey: { type: String, default: "tasks" },
});
const { state, save } = useFlowComponentStorage(
  props.storageKey,
  { items: [] },
  180,
  "tasks",
);
const query = ref("");
const view = ref("all");
const quickTitle = ref("");
const expanded = ref(null);

const defaults = {
  description: true,
  priority: true,
  dueDate: true,
  group: true,
  subtasks: true,
  recurrence: true,
  tags: true,
  goalLink: true,
  stageLink: true,
};
const features = computed(() => ({
  ...defaults,
  ...(props.componentConfig.features || {}),
}));
const items = computed(() => state.value.items || []);
const today = () => new Date().toISOString().slice(0, 10);
const hasDates = computed(() => items.value.some((item) => item.dueDate));
const doneCount = computed(
  () => items.value.filter((item) => item.done).length,
);
const views = computed(() => [
  { id: "all", label: "Todas" },
  ...(hasDates.value
    ? [
        { id: "today", label: "Hoje" },
        { id: "upcoming", label: "Próximas" },
        { id: "overdue", label: "Atrasadas" },
      ]
    : []),
  { id: "done", label: "Concluídas" },
]);
const visibleItems = computed(() => {
  const needle = query.value.trim().toLowerCase();
  const now = today();
  return items.value.filter((item) => {
    const matches =
      !needle ||
      [item.text, item.description, item.group, ...(item.tags || [])]
        .filter(Boolean)
        .join(" ")
        .toLowerCase()
        .includes(needle);
    if (!matches) return false;
    if (view.value === "done") return item.done;
    if (view.value === "today") return !item.done && item.dueDate === now;
    if (view.value === "upcoming") return !item.done && item.dueDate > now;
    if (view.value === "overdue") return !item.done && item.dueDate < now;
    return true;
  });
});

function normalized(item) {
  const now = Date.now();
  return {
    id: item.id || crypto.randomUUID(),
    text: item.text || item.title || "",
    done: Boolean(item.done),
    description: item.description || "",
    priority: item.priority || "none",
    dueDate: item.dueDate || item.due || "",
    group: item.group || "Próximos passos",
    subtasks: Array.isArray(item.subtasks) ? item.subtasks : [],
    recurrence: item.recurrence || "none",
    tags: Array.isArray(item.tags) ? item.tags : [],
    goalId: item.goalId || "",
    stageId: item.stageId || "",
    createdAt: item.createdAt || now,
    updatedAt: item.updatedAt || now,
  };
}
state.value.items = items.value.map(normalized);

function add() {
  const text = quickTitle.value.trim();
  if (!text) return;
  state.value.items.push(
    normalized({
      text,
      group: props.componentConfig.defaultGroup || "Próximos passos",
      priority: props.componentConfig.defaultPriority || "none",
    }),
  );
  quickTitle.value = "";
  save();
}
function remove(item) {
  state.value.items = items.value.filter(
    (candidate) => candidate.id !== item.id,
  );
  save();
}
function nextDate(value, recurrence) {
  if (!value || recurrence === "none") return "";
  const date = new Date(`${value}T12:00:00`);
  date.setDate(date.getDate() + (recurrence === "weekly" ? 7 : 1));
  return date.toISOString().slice(0, 10);
}
function toggleDone(item) {
  item.updatedAt = Date.now();
  if (item.done && item.recurrence !== "none") {
    state.value.items.push(
      normalized({
        ...item,
        id: crypto.randomUUID(),
        done: false,
        dueDate: nextDate(item.dueDate, item.recurrence),
      }),
    );
  }
  save();
}
function addSubtask(item) {
  item.subtasks.push({ id: crypto.randomUUID(), text: "", done: false });
}
function updateTags(item, value) {
  item.tags = value
    .split(",")
    .map((tag) => tag.trim())
    .filter(Boolean);
}
watch(views, (available) => {
  if (!available.some((item) => item.id === view.value)) view.value = "all";
});
</script>

<template>
  <ToolLayout :caption="`${doneCount} de ${items.length} tarefas concluídas.`">
    <template #actions>
      <label class="tasks-search"
        ><span class="sr-only">Buscar tarefas</span
        ><input v-model="query" type="search" placeholder="Buscar tarefas"
      /></label>
    </template>
    <form class="inline-form" @submit.prevent="add">
      <input
        v-model="quickTitle"
        aria-label="Nova tarefa"
        placeholder="Qual é o próximo passo?"
      />
      <button class="dark-button" type="submit" aria-label="Adicionar tarefa">
        Adicionar
      </button>
    </form>
    <div class="tasks-filters" aria-label="Visualizações de tarefas">
      <button
        v-for="item in views"
        :key="item.id"
        :class="{ active: view === item.id }"
        @click="view = item.id"
      >
        {{ item.label }}
      </button>
    </div>
    <div v-if="visibleItems.length" class="tasks-list">
      <article v-for="item in visibleItems" :key="item.id" class="task-card">
        <div class="task-card__main">
          <input
            v-model="item.done"
            type="checkbox"
            :aria-label="`Concluir ${item.text}`"
            @change="toggleDone(item)"
          />
          <button
            class="task-card__title"
            :class="{ done: item.done }"
            @click="expanded = expanded === item.id ? null : item.id"
          >
            {{ item.text }}
          </button>
          <span v-if="item.priority !== 'none'" class="task-priority">{{
            { low: "Baixa", medium: "Média", high: "Alta" }[item.priority]
          }}</span>
          <time v-if="item.dueDate">{{
            new Date(`${item.dueDate}T12:00:00`).toLocaleDateString("pt-BR")
          }}</time>
          <button
            class="tool-icon"
            :aria-label="`Excluir ${item.text}`"
            @click="remove(item)"
          >
            ×
          </button>
        </div>
        <div v-if="expanded === item.id" class="task-details">
          <label class="tool-field"
            >Título<input v-model="item.text" @change="save"
          /></label>
          <label v-if="features.description" class="tool-field task-wide"
            >Descrição<textarea
              v-model="item.description"
              rows="3"
              @change="save"
            ></textarea>
          </label>
          <label v-if="features.priority" class="tool-field"
            >Prioridade<select v-model="item.priority" @change="save">
              <option value="none">Sem prioridade</option>
              <option value="low">Baixa</option>
              <option value="medium">Média</option>
              <option value="high">Alta</option>
            </select></label
          >
          <label v-if="features.dueDate" class="tool-field"
            >Prazo<input v-model="item.dueDate" type="date" @change="save"
          /></label>
          <label v-if="features.group" class="tool-field"
            >Grupo<input
              v-model="item.group"
              list="task-groups"
              @change="save" /><datalist id="task-groups">
              <option
                v-for="group in componentConfig.groups || []"
                :key="group"
                :value="group"
              /></datalist
          ></label>
          <label v-if="features.recurrence" class="tool-field"
            >Recorrência<select v-model="item.recurrence" @change="save">
              <option value="none">Não repetir</option>
              <option value="daily">Diária</option>
              <option value="weekly">Semanal</option>
            </select></label
          >
          <label v-if="features.tags" class="tool-field task-wide"
            >Tags<input
              :value="item.tags.join(', ')"
              placeholder="estudo, revisão"
              @change="
                updateTags(item, $event.target.value);
                save();
              "
          /></label>
          <label
            v-if="features.goalLink && flow.goals?.length"
            class="tool-field"
            >Meta<select v-model="item.goalId" @change="save">
              <option value="">Sem vínculo</option>
              <option
                v-for="goal in flow.goals"
                :key="goal.id"
                :value="goal.id"
              >
                {{ goal.title }}
              </option>
            </select></label
          >
          <label
            v-if="features.stageLink && flow.stages?.length"
            class="tool-field"
            >Etapa<select v-model="item.stageId" @change="save">
              <option value="">Sem vínculo</option>
              <option
                v-for="stage in flow.stages"
                :key="stage.id"
                :value="stage.id"
              >
                {{ stage.title }}
              </option>
            </select></label
          >
          <div v-if="features.subtasks" class="task-subtasks task-wide">
            <strong>Subtarefas</strong
            ><label v-for="subtask in item.subtasks" :key="subtask.id"
              ><input
                v-model="subtask.done"
                type="checkbox"
                @change="save" /><input
                v-model="subtask.text"
                aria-label="Subtarefa"
                @change="save" /></label
            ><button class="outline" @click="addSubtask(item)">
              ＋ Subtarefa
            </button>
          </div>
        </div>
      </article>
    </div>
    <div v-else class="tool-empty">
      <span>☑</span>
      <p>
        {{
          query
            ? "Nenhuma tarefa corresponde à busca."
            : "Seu próximo passo pode ser pequeno. Comece por ele."
        }}
      </p>
    </div>
  </ToolLayout>
</template>

<style scoped>
.tasks-search input {
  min-width: 12rem;
}
.tasks-filters {
  display: flex;
  gap: 0.45rem;
  flex-wrap: wrap;
  margin: 1rem 0;
}
.tasks-filters button {
  border: 1px solid var(--noma-border);
  border-radius: 999px;
  padding: 0.4rem 0.75rem;
  background: transparent;
}
.tasks-filters button.active {
  background: var(--noma-ink);
  color: white;
}
.tasks-list {
  display: grid;
  gap: 0.6rem;
}
.task-card {
  border: 1px solid var(--noma-border);
  border-radius: 14px;
  padding: 0.8rem;
}
.task-card__main {
  display: flex;
  align-items: center;
  gap: 0.65rem;
}
.task-card__title {
  border: 0;
  background: none;
  text-align: left;
  font-weight: 650;
  flex: 1;
}
.task-card__title.done {
  text-decoration: line-through;
  opacity: 0.55;
}
.task-priority {
  font-size: 0.72rem;
  background: var(--noma-surface-soft);
  padding: 0.25rem 0.45rem;
  border-radius: 999px;
}
.task-card time {
  font-size: 0.75rem;
  color: var(--noma-ink-muted);
}
.task-details {
  display: grid;
  grid-template-columns: repeat(2, minmax(0, 1fr));
  gap: 0.75rem;
  margin-top: 0.9rem;
  padding-top: 0.9rem;
  border-top: 1px solid var(--noma-border);
}
.task-wide {
  grid-column: 1/-1;
}
.task-subtasks {
  display: grid;
  gap: 0.45rem;
}
.task-subtasks label {
  display: flex;
  gap: 0.5rem;
}
.task-subtasks label input:last-child {
  flex: 1;
}
@media (max-width: 680px) {
  .tasks-search input {
    min-width: 0;
    width: 100%;
  }
  .task-details {
    grid-template-columns: 1fr;
  }
  .task-wide {
    grid-column: auto;
  }
  .task-card__main {
    align-items: flex-start;
    flex-wrap: wrap;
  }
  .task-card__title {
    min-width: 60%;
  }
}
</style>
