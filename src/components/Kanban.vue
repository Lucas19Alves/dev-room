<script setup>
import { computed, ref } from "vue";
import draggable from "vuedraggable";
import { useFlowComponentStorage } from "../composables/useFlowComponentStorage";
import ToolLayout from "./ui/ToolLayout.vue";
const props = defineProps({
  storageKey: { type: String, default: "kanban" },
  componentConfig: { type: Object, default: () => ({}) },
  flow: { type: Object, required: true },
});
const defaultColumns = (
  props.componentConfig.columns?.length
    ? props.componentConfig.columns
    : ["A fazer", "Em andamento", "Concluído"]
).map((column) => ({
  id:
    typeof column === "string"
      ? crypto.randomUUID()
      : column.id || crypto.randomUUID(),
  title: typeof column === "string" ? column : column.title,
  cards: [],
}));
const { state: columns, save } = useFlowComponentStorage(
  props.storageKey,
  defaultColumns,
  180,
  "kanban",
);
const titles = ref({}),
  pendingDelete = ref(null);
const count = computed(() =>
  columns.value.reduce((n, c) => n + c.cards.length, 0),
);
function addCard(column) {
  const title = titles.value[column.id]?.trim();
  if (!title) return;
  column.cards.push({
    id: crypto.randomUUID(),
    title,
    description: "",
    priority: "none",
    tags: [],
    dueDate: "",
    goalId: "",
    stageId: "",
  });
  titles.value[column.id] = "";
}
function removeColumn(column) {
  if (column.cards.length && pendingDelete.value !== column.id) {
    pendingDelete.value = column.id;
    return;
  }
  columns.value = columns.value.filter((c) => c.id !== column.id);
  pendingDelete.value = null;
}
function moveCard(column, card, target) {
  const destination = columns.value.find((c) => c.id === target);
  if (!destination) return;
  column.cards = column.cards.filter((c) => c.id !== card.id);
  destination.cards.push(card);
  save();
}
function tags(card, value) {
  card.tags = value
    .split(",")
    .map((tag) => tag.trim())
    .filter(Boolean);
  save();
}
</script>
<template>
  <ToolLayout
    :caption="`${count} tarefas · cada ideia no seu próximo estágio.`"
    id="kanban-main"
    ><template #actions
      ><button
        class="outline"
        @click="
          columns.push({
            id: crypto.randomUUID(),
            title: 'Nova etapa',
            cards: [],
          })
        "
      >
        ＋ Nova coluna
      </button></template
    >
    <div class="kanban-grid" id="kanban-board">
      <section v-for="column in columns" :key="column.id" class="kanban-column">
        <div class="kanban-heading">
          <span class="kanban-dot"></span
          ><input
            v-model="column.title"
            aria-label="Nome da coluna"
            maxlength="40"
          /><small>{{ column.cards.length }}</small
          ><button
            class="tool-icon"
            :aria-label="`Excluir coluna ${column.title}`"
            @click="removeColumn(column)"
          >
            ×
          </button>
        </div>
        <div
          v-if="pendingDelete === column.id"
          class="tool-inline-warning"
          role="alert"
        >
          Excluir esta coluna e suas tarefas?<button
            @click="removeColumn(column)"
          >
            Excluir</button
          ><button @click="pendingDelete = null">Cancelar</button>
        </div>
        <draggable
          v-model="column.cards"
          group="kanban"
          item-key="id"
          handle=".card-grip"
          class="kanban-items"
          ghost-class="kanban-ghost"
          ><template #item="{ element: card }"
            ><article class="kanban-task">
              <div class="tool-row">
                <span class="card-grip" title="Arrastar tarefa">⠿</span
                ><input
                  v-model="card.title"
                  aria-label="Título da tarefa Kanban"
                /><button
                  class="tool-icon"
                  aria-label="Excluir tarefa Kanban"
                  @click="
                    column.cards = column.cards.filter((c) => c.id !== card.id)
                  "
                >
                  ×
                </button>
              </div>
              <textarea
                v-model="card.description"
                placeholder="Uma nota sobre este passo…"
                aria-label="Descrição da tarefa"
                rows="2"
              ></textarea>
              <div class="kanban-card-fields">
                <label class="tool-field"
                  >Prioridade<select v-model="card.priority">
                    <option value="none">Sem prioridade</option>
                    <option value="low">Baixa</option>
                    <option value="medium">Média</option>
                    <option value="high">Alta</option>
                  </select></label
                >
                <label class="tool-field"
                  >Prazo<input v-model="card.dueDate" type="date"
                /></label>
                <label class="tool-field"
                  >Tags<input
                    :value="(card.tags || []).join(', ')"
                    @change="tags(card, $event.target.value)"
                /></label>
                <label v-if="flow.goals?.length" class="tool-field"
                  >Meta<select v-model="card.goalId">
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
                <label v-if="flow.stages?.length" class="tool-field"
                  >Etapa<select v-model="card.stageId">
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
              </div>
              <select
                :value="column.id"
                aria-label="Mover tarefa para coluna"
                @change="moveCard(column, card, $event.target.value)"
              >
                <option
                  v-for="target in columns"
                  :key="target.id"
                  :value="target.id"
                >
                  {{ target.title }}
                </option>
              </select>
            </article></template
          ></draggable
        >
        <p v-if="!column.cards.length" class="tool-empty compact">
          Espaço para o próximo passo.
        </p>
        <form class="inline-form" @submit.prevent="addCard(column)">
          <input
            v-model="titles[column.id]"
            placeholder="Nova tarefa…"
            :aria-label="`Nova tarefa em ${column.title}`"
          /><button :aria-label="`Adicionar tarefa em ${column.title}`">
            ＋
          </button>
        </form>
      </section>
    </div></ToolLayout
  >
</template>
<style scoped>
.kanban-card-fields {
  display: grid;
  grid-template-columns: repeat(2, minmax(0, 1fr));
  gap: 0.5rem;
  margin: 0.6rem 0;
}
@media (max-width: 620px) {
  .kanban-card-fields {
    grid-template-columns: 1fr;
  }
}
</style>
