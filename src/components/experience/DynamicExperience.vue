<script setup>
import { computed, ref } from "vue";
import { reviewStatus } from "../../flow/runtime.js";
import ExperienceActionList from "./ExperienceActionList.vue";
import ExperienceItems from "./ExperienceItems.vue";
import "./experience.css";

const props = defineProps({
  flow: { type: Object, required: true },
  update: { type: Object, default: null },
  experience: { type: Object, required: true },
});
const emit = defineEmits(["review", "metric", "action", "command"]);
const review = computed(() => reviewStatus(props.flow));
const layout = computed(() => props.experience.layout || []);
const hero = computed(
  () => layout.value.find((section) => section.type === "hero") || {},
);
const formOpen = ref(false);
const editingId = ref(null);
const formEntity = ref("");
const formStatus = ref("");
const formValues = ref({});

function entityDefinition(entity) {
  return props.flow.protocol?.entities?.[entity] || { fields: [], states: [] };
}
function fieldValue(field) {
  const value = formValues.value[field.key];
  if (Array.isArray(value)) return value.join("\n");
  return value ?? field.default ?? "";
}
function setField(field, value) {
  formValues.value[field.key] =
    field.type === "multi-select"
      ? String(value || "")
          .split(/[\n,;]+/)
          .map((item) => item.trim())
          .filter(Boolean)
      : value;
}
function resolve(value, fallback = "") {
  if (!value || typeof value !== "object") return value || fallback;
  if (value.property)
    return (
      props.flow.properties?.[value.property] || value.fallback || fallback
    );
  return value.text || fallback;
}
function openCreate(section) {
  formEntity.value = section.entity;
  editingId.value = null;
  formStatus.value = entityDefinition(section.entity).states?.[0]?.label || "";
  formValues.value = {};
  formOpen.value = true;
}
function openEdit(section, item) {
  formEntity.value = section.entity;
  editingId.value = item.sourceId;
  formStatus.value =
    item.status || entityDefinition(section.entity).states?.[0]?.label || "";
  formValues.value = { ...(item.values || {}) };
  formOpen.value = true;
}
function submitEntity() {
  emit("command", {
    type: editingId.value ? "update_entity" : "create_entity",
    entity: formEntity.value,
    ...(editingId.value
      ? { entityId: editingId.value }
      : { status: formStatus.value }),
    values: { ...formValues.value },
  });
  if (editingId.value && formStatus.value) {
    emit("command", {
      type: "transition_entity",
      entity: formEntity.value,
      entityId: editingId.value,
      to: formStatus.value,
    });
  }
  formOpen.value = false;
  editingId.value = null;
}
function transition(section, item, event) {
  emit("command", {
    type: "transition_entity",
    entity: section.entity,
    entityId: item.sourceId,
    to: event.target.value,
  });
}
function actionFor(item) {
  return props.experience.actions.find(
    (action) =>
      action.sourceId === item.sourceId &&
      action.entityType === item.entityType,
  );
}
function openAction(item) {
  const action = actionFor(item);
  if (!action) return openEdit({ entity: item.entityType }, item);
  const open = action.actions.find((operation) => operation.type === "open");
  emit("action", action, open);
}
</script>

<template>
  <main class="specialized-experience declarative-experience">
    <header class="specialized-experience__hero">
      <div>
        <span class="eyebrow">{{ resolve(hero.eyebrow, "SEU FLOW") }}</span>
        <h2>{{ resolve(hero.title, flow.objective) }}</h2>
        <p>{{ resolve(hero.subtitle, flow.description) }}</p>
      </div>
      <div class="specialized-experience__review">
        <span :class="{ due: review.due }">{{
          review.due ? "Revisão disponível" : `Revisão em ${review.days} dias`
        }}</span>
        <button class="outline" @click="emit('review')">Revisar Flow</button>
      </div>
    </header>

    <section
      v-for="section in layout"
      v-show="section.type !== 'hero'"
      :key="section.id || `${section.type}-${section.title}`"
      class="specialized-experience__section"
      :class="{
        'specialized-experience__section--accent':
          section.type === 'next-actions',
      }"
    >
      <div class="specialized-experience__heading">
        <div>
          <span class="eyebrow">{{ section.title }}</span>
          <h3>{{ section.subtitle || section.title }}</h3>
        </div>
        <button
          v-if="section.create"
          class="dark-button"
          @click="openCreate(section)"
        >
          {{ section.createLabel || "Adicionar item" }}
        </button>
      </div>

      <ExperienceActionList
        v-if="section.type === 'next-actions'"
        :actions="section.items || []"
        empty-title="Nada pede atenção agora."
        @action="(action, operation) => emit('action', action, operation)"
      />

      <form
        v-else-if="section.entity && formOpen && formEntity === section.entity"
        class="declarative-entity-form"
        @submit.prevent="submitEntity"
      >
        <label
          v-for="field in entityDefinition(section.entity).fields"
          :key="field.key"
          class="tool-field"
        >
          {{ field.label }}<span v-if="!field.required"> · opcional</span>
          <textarea
            v-if="['textarea', 'multi-select'].includes(field.type)"
            :value="fieldValue(field)"
            :required="field.required"
            :placeholder="field.placeholder"
            rows="2"
            @input="setField(field, $event.target.value)"
          ></textarea>
          <select
            v-else-if="field.type === 'select'"
            :value="fieldValue(field)"
            :required="field.required"
            @change="setField(field, $event.target.value)"
          >
            <option value="">Escolher depois</option>
            <option v-for="option in field.options" :key="option">
              {{ option }}
            </option>
          </select>
          <input
            v-else
            :value="fieldValue(field)"
            :type="field.type"
            :required="field.required"
            :placeholder="field.placeholder"
            @input="setField(field, $event.target.value)"
          />
        </label>
        <label
          v-if="entityDefinition(section.entity).states?.length"
          class="tool-field"
          >Etapa
          <select v-model="formStatus">
            <option
              v-for="state in entityDefinition(section.entity).states"
              :key="state.id"
              :value="state.label"
            >
              {{ state.label }}
            </option>
          </select>
        </label>
        <div class="declarative-entity-form__actions">
          <button type="button" class="outline" @click="formOpen = false">
            Cancelar</button
          ><button class="dark-button">
            {{
              editingId
                ? section.entity === "opportunity"
                  ? "Salvar oportunidade"
                  : "Salvar item"
                : section.entity === "opportunity"
                  ? "Adicionar oportunidade"
                  : "Adicionar item"
            }}
          </button>
        </div>
      </form>

      <div v-else-if="section.entity" class="declarative-collection">
        <article
          v-for="item in section.items || []"
          :key="item.id"
          class="declarative-collection__item"
        >
          <div>
            <strong>{{ item.title }}</strong
            ><small>{{ item.subtitle || item.status }}</small
            ><span v-if="item.dueAt">{{ item.dueAt }}</span>
          </div>
          <div class="declarative-collection__controls">
            <select
              v-if="section.stateLabels?.length"
              :value="item.status"
              :aria-label="`Atualizar etapa de ${item.title}`"
              @change="transition(section, item, $event)"
            >
              <option v-for="state in section.stateLabels" :key="state">
                {{ state }}
              </option>
            </select>
            <button
              v-if="actionFor(item)"
              class="outline"
              @click="openAction(item)"
            >
              Abrir
            </button>
            <button class="text-button" @click="openEdit(section, item)">
              {{
                item.values?.nextAction || item.values?.nextActionAt
                  ? section.entity === "opportunity"
                    ? "Editar próximo passo"
                    : "Editar item"
                  : section.entity === "opportunity"
                    ? "Planejar follow-up"
                    : "Editar item"
              }}
            </button>
          </div>
        </article>
        <ExperienceItems v-if="!(section.items || []).length" :items="[]" />
      </div>

      <div
        v-else-if="section.type === 'metrics' || section.type === 'progress'"
        class="experience-metric-strip"
      >
        <article
          v-for="metric in section.items || []"
          :key="metric.id"
          class="experience-metric"
        >
          <small>{{ metric.label }}</small
          ><strong
            >{{ metric.value }} <em>{{ metric.unit }}</em></strong
          >
        </article>
      </div>
      <ExperienceItems
        v-else-if="section.type === 'timeline'"
        :items="section.items || []"
      />
      <ExperienceItems
        v-else-if="section.type !== 'text'"
        :items="section.items || []"
        :cards="section.type === 'checklist' || section.type === 'stages'"
      />
      <p v-else class="declarative-text">{{ section.text }}</p>
    </section>

    <div v-if="update" class="specialized-empty" role="status">
      Há uma versão mais nova deste ponto de partida (v{{
        update.availableVersion
      }}).
    </div>
  </main>
</template>

<style scoped>
.declarative-entity-form {
  display: grid;
  grid-template-columns: repeat(2, minmax(0, 1fr));
  gap: 0.75rem;
  padding: 1rem;
  border-radius: 15px;
  background: var(--noma-surface-soft);
}
.declarative-entity-form__actions {
  display: flex;
  grid-column: 1 / -1;
  justify-content: flex-end;
  gap: 0.5rem;
}
.declarative-collection {
  display: grid;
  gap: 0.1rem;
}
.declarative-collection__item {
  display: grid;
  grid-template-columns: minmax(0, 1fr) auto;
  align-items: center;
  gap: 1rem;
  padding: 0.85rem 0;
  border-bottom: 1px solid var(--noma-border);
}
.declarative-collection__item > div:first-child {
  display: grid;
  gap: 0.2rem;
}
.declarative-collection__item small,
.declarative-collection__item span {
  color: var(--noma-ink-soft);
  font-size: 0.8rem;
}
.declarative-collection__controls {
  display: flex;
  flex-wrap: wrap;
  justify-content: flex-end;
  align-items: center;
  gap: 0.45rem;
}
.declarative-text {
  margin: 0;
  color: var(--noma-ink-soft);
}
@media (max-width: 760px) {
  .declarative-entity-form {
    grid-template-columns: 1fr;
  }
  .declarative-entity-form__actions {
    grid-column: auto;
    justify-content: flex-start;
  }
  .declarative-collection__item {
    grid-template-columns: 1fr;
  }
  .declarative-collection__controls {
    justify-content: flex-start;
  }
}
</style>
