<script setup>
import { ref } from "vue";

defineProps({
  actions: { type: Array, default: () => [] },
  emptyTitle: { type: String, default: "Nada pede atenção agora." },
  emptyText: {
    type: String,
    default: "Quando algo mudar, aparecerá aqui com um próximo passo.",
  },
});
const emit = defineEmits(["action"]);
const opened = ref(null);

function run(action, operation) {
  if (operation.type === "open") opened.value = action;
  else opened.value = null;
  emit("action", action, operation);
}
</script>

<template>
  <div class="experience-actions">
    <article
      v-for="action in actions.slice(0, 6)"
      :key="action.id"
      class="experience-action"
      :class="`experience-action--${action.priority}`"
    >
      <div class="experience-action__copy">
        <span v-if="action.dueAt" class="experience-action__due">{{
          action.dueAt
        }}</span>
        <strong>{{ action.title }}</strong>
        <p>{{ action.description }}</p>
      </div>
      <div class="experience-action__controls">
        <button
          v-for="operation in action.actions"
          :key="operation.id"
          :class="operation.type === 'complete' ? 'dark-button' : 'outline'"
          @click="run(action, operation)"
        >
          {{ operation.label }}
        </button>
      </div>
    </article>
    <aside v-if="opened" class="experience-action-detail" aria-live="polite">
      <span class="eyebrow">ITEM VINCULADO</span>
      <strong>{{ opened.title }}</strong>
      <p>{{ opened.description }}</p>
    </aside>
    <div v-if="!actions.length" class="experience-empty-state">
      <strong>{{ emptyTitle }}</strong>
      <p>{{ emptyText }}</p>
    </div>
  </div>
</template>

<style scoped>
.experience-actions {
  display: grid;
  gap: 0.65rem;
}
.experience-action {
  display: grid;
  grid-template-columns: minmax(0, 1fr) auto;
  gap: 1rem;
  align-items: center;
  padding: 1rem 1.1rem;
  border: 1px solid var(--noma-border);
  border-radius: 16px;
  background: var(--noma-surface);
}
.experience-action--high {
  border-inline-start: 4px solid var(--noma-warning);
}
.experience-action__copy {
  display: grid;
  gap: 0.25rem;
}
.experience-action__copy strong {
  font-size: 1rem;
}
.experience-action__copy p {
  margin: 0;
  color: var(--noma-ink-soft);
}
.experience-action__due {
  color: var(--noma-danger);
  font-size: 0.75rem;
  font-weight: 700;
}
.experience-action__controls {
  display: flex;
  flex-wrap: wrap;
  justify-content: flex-end;
  gap: 0.4rem;
}
.experience-action__controls button {
  min-height: 32px;
}
.experience-empty-state {
  padding: 1.2rem;
  border-radius: 14px;
  background: var(--noma-surface-soft);
  color: var(--noma-ink-soft);
}
.experience-empty-state strong {
  display: block;
  color: var(--noma-ink);
}
.experience-empty-state p {
  margin: 0.35rem 0 0;
}
.experience-action-detail {
  display: grid;
  gap: 0.3rem;
  padding: 0.9rem 1rem;
  border: 1px solid var(--noma-border);
  border-radius: 14px;
  background: var(--noma-brand-soft);
}
.experience-action-detail p {
  margin: 0;
  color: var(--noma-ink-soft);
}
@media (max-width: 760px) {
  .experience-action {
    grid-template-columns: 1fr;
  }
  .experience-action__controls {
    justify-content: flex-start;
  }
}
</style>
