<script setup>
import { computed, ref } from "vue";
import { useFlowComponentStorage } from "../composables/useFlowComponentStorage.js";
import ToolLayout from "./ui/ToolLayout.vue";

const props = defineProps({
  flow: { type: Object, required: true },
  componentConfig: { type: Object, default: () => ({}) },
  storageKey: { type: String, default: "tracker" },
});

const { state: tracker, save } = useFlowComponentStorage(props.storageKey, {
  items: [],
});
const editingId = ref(null);
const formOpen = ref(false);
const form = ref({ status: "", values: {} });
const pendingDelete = ref(null);

const stages = computed(() =>
  props.componentConfig.stages?.length
    ? props.componentConfig.stages
    : ["Planejado", "Em andamento", "Concluído"],
);
const fields = computed(() => props.componentConfig.fields || []);
const primaryField = computed(
  () => props.componentConfig.primaryField || fields.value[0]?.key || "title",
);
const items = computed(() => tracker.value.items || []);

function optionsFor(field) {
  return field.optionsFromProperty
    ? props.flow.properties?.[field.optionsFromProperty] || []
    : field.options || [];
}

function emptyForm() {
  return {
    status: stages.value[0],
    values: Object.fromEntries(
      fields.value.map((field) => [
        field.key,
        field.type === "number" ? 0 : "",
      ]),
    ),
  };
}

function startAdd() {
  editingId.value = null;
  form.value = emptyForm();
  formOpen.value = true;
}

function startEdit(item) {
  editingId.value = item.id;
  form.value = JSON.parse(JSON.stringify(item));
  formOpen.value = true;
}

function validUrl(value) {
  try {
    const url = new URL(value);
    return ["http:", "https:"].includes(url.protocol) ? url.href : null;
  } catch {
    return null;
  }
}

function submit() {
  if (
    fields.value.some(
      (field) =>
        field.required && !String(form.value.values[field.key] || "").trim(),
    )
  )
    return;
  const now = Date.now();
  if (editingId.value) {
    const index = tracker.value.items.findIndex(
      (item) => item.id === editingId.value,
    );
    if (index >= 0)
      tracker.value.items[index] = {
        ...form.value,
        id: editingId.value,
        updatedAt: now,
      };
  } else {
    tracker.value.items.push({
      ...form.value,
      id: crypto.randomUUID(),
      createdAt: now,
      updatedAt: now,
    });
  }
  save();
  formOpen.value = false;
  editingId.value = null;
}

function remove(item) {
  if (pendingDelete.value !== item.id) {
    pendingDelete.value = item.id;
    return;
  }
  tracker.value.items = tracker.value.items.filter(
    (candidate) => candidate.id !== item.id,
  );
  pendingDelete.value = null;
  save();
}

function changeStatus(item, status) {
  item.status = status;
  item.updatedAt = Date.now();
  save();
}

function secondaryValues(item) {
  return fields.value
    .filter(
      (field) =>
        field.key !== primaryField.value &&
        !["textarea", "url"].includes(field.type) &&
        item.values?.[field.key] !== "" &&
        item.values?.[field.key] !== undefined &&
        item.values?.[field.key] !== 0,
    )
    .slice(0, 3)
    .map((field) => `${field.label}: ${item.values[field.key]}`);
}
</script>

<template>
  <ToolLayout
    :caption="`${items.length} ${items.length === 1 ? componentConfig.singular || 'item' : componentConfig.plural || 'itens'} neste Flow.`"
    id="structured-tracker"
  >
    <template #actions>
      <button
        class="dark-button"
        @click="formOpen ? (formOpen = false) : startAdd()"
      >
        {{
          formOpen
            ? "Fechar"
            : `＋ Adicionar ${componentConfig.singular || "item"}`
        }}
      </button>
    </template>

    <form v-if="formOpen" class="tracker-editor" @submit.prevent="submit">
      <div class="tracker-editor__heading">
        <div>
          <span class="tool-section-label">{{
            editingId ? "EDITAR" : "NOVO REGISTRO"
          }}</span>
          <h4>{{ componentConfig.title || "Tracker" }}</h4>
        </div>
        <button
          type="button"
          class="tool-icon"
          aria-label="Fechar formulário"
          @click="formOpen = false"
        >
          ×
        </button>
      </div>
      <div class="tracker-fields">
        <label
          v-for="field in fields"
          :key="field.key"
          class="tool-field"
          :class="{ 'tracker-field--wide': field.type === 'textarea' }"
          :for="`tracker-${field.key}`"
        >
          {{ field.label }}<span v-if="!field.required"> · opcional</span>
          <textarea
            v-if="field.type === 'textarea'"
            :id="`tracker-${field.key}`"
            v-model="form.values[field.key]"
            rows="3"
          ></textarea>
          <select
            v-else-if="field.type === 'select'"
            :id="`tracker-${field.key}`"
            v-model="form.values[field.key]"
          >
            <option value="">Escolher depois</option>
            <option
              v-for="option in optionsFor(field)"
              :key="option"
              :value="option"
            >
              {{ option }}
            </option>
          </select>
          <input
            v-else
            :id="`tracker-${field.key}`"
            v-model="form.values[field.key]"
            :type="field.type"
            :min="field.min"
            :placeholder="field.placeholder"
          />
        </label>
        <label class="tool-field" for="tracker-status"
          >Etapa<select id="tracker-status" v-model="form.status">
            <option v-for="stage in stages" :key="stage" :value="stage">
              {{ stage }}
            </option>
          </select></label
        >
      </div>
      <div class="button-group tracker-editor__actions">
        <button type="button" class="outline" @click="formOpen = false">
          Cancelar
        </button>
        <button class="dark-button">
          {{ editingId ? "Salvar alterações" : "Adicionar ao Flow" }}
        </button>
      </div>
    </form>

    <div v-if="items.length" class="tracker-groups">
      <section v-for="stage in stages" :key="stage" class="tracker-group">
        <header>
          <span>{{ stage }}</span>
          <small>{{
            items.filter((item) => item.status === stage).length
          }}</small>
        </header>
        <div class="tracker-list">
          <article
            v-for="item in items.filter(
              (candidate) => candidate.status === stage,
            )"
            :key="item.id"
            class="tracker-card"
          >
            <div class="tracker-card__main">
              <button class="tracker-card__title" @click="startEdit(item)">
                {{
                  item.values?.[primaryField] ||
                  `Sem ${fields.find((field) => field.key === primaryField)?.label?.toLowerCase() || "título"}`
                }}
              </button>
              <p v-if="secondaryValues(item).length">
                {{ secondaryValues(item).join(" · ") }}
              </p>
              <a
                v-for="field in fields.filter(
                  (candidate) =>
                    candidate.type === 'url' &&
                    validUrl(item.values?.[candidate.key]),
                )"
                :key="field.key"
                :href="validUrl(item.values[field.key])"
                target="_blank"
                rel="noopener noreferrer"
                >{{ field.label }} ↗</a
              >
            </div>
            <div class="tracker-card__actions">
              <label>
                <span class="sr-only"
                  >Etapa de {{ item.values?.[primaryField] }}</span
                >
                <select
                  :value="item.status"
                  :aria-label="`Atualizar etapa de ${item.values?.[primaryField] || 'item'}`"
                  @change="changeStatus(item, $event.target.value)"
                >
                  <option
                    v-for="target in stages"
                    :key="target"
                    :value="target"
                  >
                    {{ target }}
                  </option>
                </select>
              </label>
              <button
                class="tool-icon"
                :aria-label="`Editar ${item.values?.[primaryField] || 'item'}`"
                @click="startEdit(item)"
              >
                ✎
              </button>
              <button
                class="tool-icon"
                :aria-label="`Excluir ${item.values?.[primaryField] || 'item'}`"
                @click="remove(item)"
              >
                ×
              </button>
            </div>
            <div
              v-if="pendingDelete === item.id"
              class="tool-inline-warning"
              role="alert"
            >
              Excluir este registro?<button @click="remove(item)">
                Excluir</button
              ><button @click="pendingDelete = null">Cancelar</button>
            </div>
          </article>
          <p
            v-if="!items.some((item) => item.status === stage)"
            class="tool-empty compact"
          >
            Nada aqui por enquanto.
          </p>
        </div>
      </section>
    </div>
    <div v-else class="tool-empty">
      <span>◎</span>
      <p>
        {{ componentConfig.empty || "Adicione o primeiro item deste Flow." }}
      </p>
      <button class="outline" @click="startAdd">Adicionar primeiro item</button>
    </div>
  </ToolLayout>
</template>
