<script setup>
import { computed, ref } from "vue";
import ToolLayout from "./ui/ToolLayout.vue";
import { formatClock } from "../flow/time.js";

const props = defineProps({
  flow: { type: Object, required: true },
  componentConfig: { type: Object, default: () => ({}) },
  storageKey: { type: String, default: "focus" },
  display: { type: Function, required: true },
  running: { type: Function, required: true },
  onToggle: { type: Function, required: true },
  onReset: { type: Function, required: true },
  onSessionToggle: { type: Function, required: true },
  session: { type: Object, default: null },
  sessionSeconds: { type: Number, default: 0 },
});
const mode = ref("pomodoro");
const customMinutes = ref(45);
const taskId = ref("");
const goalId = ref("");
const stageId = ref("");
const data = computed(
  () =>
    props.flow.componentData?.[props.storageKey] ||
    props.flow.componentData?.focus ||
    {},
);
const state = computed(() => data.value.state || {});
const presets = computed(() => props.componentConfig.presets || [25, 45, 60]);
const tasks = computed(() =>
  (props.flow.components || [])
    .filter(
      (component) => component.type === "tasks" && component.enabled !== false,
    )
    .flatMap(
      (component) => props.flow.componentData?.[component.id]?.items || [],
    )
    .filter((task) => !task.done),
);
function selectMinutes(minutes) {
  mode.value = "custom";
  customMinutes.value = minutes;
  props.onReset(props.storageKey, minutes);
}
function toggle() {
  props.onToggle(props.storageKey, {
    mode: mode.value,
    taskId: taskId.value || null,
    goalId: goalId.value || null,
    stageId: stageId.value || null,
  });
}
function toggleFree() {
  mode.value = "free";
  props.onSessionToggle({
    componentId: props.storageKey,
    mode: "free",
    taskId: taskId.value || null,
    goalId: goalId.value || null,
    stageId: stageId.value || null,
  });
}
</script>
<template>
  <ToolLayout
    caption="Uma sessão ligada ao objetivo, à etapa ou à tarefa que você escolheu."
  >
    <div class="focus-modes" aria-label="Modo de foco">
      <button :class="{ active: mode === 'free' }" @click="toggleFree">
        Livre
      </button>
      <button
        :class="{ active: mode === 'pomodoro' }"
        @click="
          mode = 'pomodoro';
          onReset(storageKey, data.minutes || 25);
        "
      >
        Pomodoro
      </button>
      <button
        v-for="minutes in presets"
        :key="minutes"
        :class="{ active: mode === 'custom' && customMinutes === minutes }"
        @click="selectMinutes(minutes)"
      >
        {{ minutes }} min
      </button>
    </div>
    <div class="timer-ring">
      <strong>{{
        mode === "free" ? formatClock(sessionSeconds) : display(storageKey)
      }}</strong>
      <small>{{
        mode === "free"
          ? "Sessão livre"
          : state.break
            ? "Pausa"
            : "Tempo de foco"
      }}</small>
    </div>
    <div class="focus-context">
      <label v-if="tasks.length" class="tool-field"
        >Tarefa<select v-model="taskId">
          <option value="">Sem vínculo</option>
          <option v-for="task in tasks" :key="task.id" :value="task.id">
            {{ task.text }}
          </option>
        </select></label
      >
      <label v-if="flow.goals?.length" class="tool-field"
        >Meta<select v-model="goalId">
          <option value="">Sem vínculo</option>
          <option v-for="goal in flow.goals" :key="goal.id" :value="goal.id">
            {{ goal.title }}
          </option>
        </select></label
      >
      <label v-if="flow.stages?.length" class="tool-field"
        >Etapa<select v-model="stageId">
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
    <div class="button-group focus-actions">
      <button v-if="mode === 'free'" class="dark-button" @click="toggleFree">
        {{ session?.running ? "Pausar sessão" : "Iniciar sessão livre" }}
      </button>
      <button v-else class="dark-button" @click="toggle">
        {{ running(storageKey) ? "Pausar" : "Iniciar" }}
      </button>
      <button
        v-if="mode !== 'free'"
        class="outline"
        @click="
          onReset(
            storageKey,
            mode === 'custom' ? customMinutes : data.minutes || 25,
          )
        "
      >
        Reiniciar
      </button>
    </div>
  </ToolLayout>
</template>
<style scoped>
.focus-modes {
  display: flex;
  justify-content: center;
  gap: 0.45rem;
  flex-wrap: wrap;
}
.focus-modes button {
  border: 1px solid var(--noma-border);
  background: transparent;
  border-radius: 999px;
  padding: 0.45rem 0.75rem;
}
.focus-modes button.active {
  background: var(--noma-ink);
  color: white;
}
.focus-context {
  display: grid;
  grid-template-columns: repeat(3, minmax(0, 1fr));
  gap: 0.7rem;
  margin: 1rem 0;
}
.focus-actions {
  justify-content: center;
}
@media (max-width: 700px) {
  .focus-context {
    grid-template-columns: 1fr;
  }
}
</style>
