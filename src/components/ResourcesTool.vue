<script setup>
import { computed, ref } from "vue";
import { useFlowComponentStorage } from "../composables/useFlowComponentStorage.js";
import ToolLayout from "./ui/ToolLayout.vue";

const props = defineProps({
  flow: { type: Object, required: true },
  componentConfig: { type: Object, default: () => ({}) },
  storageKey: { type: String, default: "links" },
});
const { state, save } = useFlowComponentStorage(
  props.storageKey,
  { items: [] },
  220,
  "links",
);
const form = ref({
  title: "",
  url: "",
  description: "",
  category: "",
  tags: "",
});
const query = ref("");
const category = ref("");
const favorites = ref(false);
const error = ref("");
const items = computed(() => state.value.items || []);
const visible = computed(() => {
  const q = query.value.toLowerCase();
  return items.value.filter(
    (item) =>
      (!q ||
        `${item.title} ${item.description} ${(item.tags || []).join(" ")}`
          .toLowerCase()
          .includes(q)) &&
      (!category.value || item.category === category.value) &&
      (!favorites.value || item.favorite),
  );
});
function safeUrl(value) {
  try {
    const url = new URL(value);
    return ["http:", "https:"].includes(url.protocol) ? url.href : null;
  } catch {
    return null;
  }
}
function hostname(value) {
  try {
    return new URL(value).hostname.replace(/^www\./, "");
  } catch {
    return "";
  }
}
function favicon(value) {
  try {
    return `${new URL(value).origin}/favicon.ico`;
  } catch {
    return "";
  }
}
function add() {
  const url = safeUrl(form.value.url);
  if (!url) {
    error.value = "Informe uma URL válida com http:// ou https://.";
    return;
  }
  const now = Date.now();
  state.value.items.unshift({
    id: crypto.randomUUID(),
    title: form.value.title.trim() || hostname(url),
    url,
    description: form.value.description.trim(),
    category: form.value.category,
    tags: form.value.tags
      .split(",")
      .map((t) => t.trim())
      .filter(Boolean),
    favorite: false,
    addedAt: now,
  });
  form.value = { title: "", url: "", description: "", category: "", tags: "" };
  error.value = "";
  save();
}
function remove(item) {
  state.value.items = items.value.filter(
    (candidate) => candidate.id !== item.id,
  );
  save();
}
</script>
<template>
  <ToolLayout
    :caption="`${items.length} recurso${items.length === 1 ? '' : 's'} salvo${items.length === 1 ? '' : 's'} neste Flow.`"
    ><template #actions
      ><label
        ><span class="sr-only">Buscar recursos</span
        ><input
          v-model="query"
          type="search"
          placeholder="Buscar recursos" /></label
    ></template>
    <form class="resource-form" @submit.prevent="add">
      <label class="tool-field"
        >Título<input
          v-model="form.title"
          placeholder="Nome da referência" /></label
      ><label class="tool-field"
        >URL<input
          v-model="form.url"
          type="url"
          placeholder="https://…"
          required /></label
      ><label class="tool-field resource-wide"
        >Descrição<textarea
          v-model="form.description"
          rows="2"
        ></textarea></label
      ><label class="tool-field"
        >Categoria<select v-model="form.category">
          <option value="">Sem categoria</option>
          <option
            v-for="option in componentConfig.categories || []"
            :key="option"
          >
            {{ option }}
          </option>
        </select></label
      ><label class="tool-field"
        >Tags<input v-model="form.tags" placeholder="leitura, vídeo"
      /></label>
      <p v-if="error" class="tool-feedback tool-feedback--error" role="alert">
        {{ error }}
      </p>
      <button class="dark-button">Adicionar recurso</button>
    </form>
    <div class="resource-filters">
      <select v-model="category" aria-label="Filtrar por categoria">
        <option value="">Todas as categorias</option>
        <option
          v-for="option in componentConfig.categories || []"
          :key="option"
        >
          {{ option }}
        </option></select
      ><label
        ><input v-model="favorites" type="checkbox" /> Somente favoritos</label
      >
    </div>
    <div v-if="visible.length" class="resource-list">
      <article v-for="item in visible" :key="item.id">
        <img
          :src="favicon(item.url)"
          alt=""
          @error="$event.target.style.visibility = 'hidden'"
        />
        <div>
          <a :href="safeUrl(item.url)" target="_blank" rel="noopener noreferrer"
            >{{ item.title }} ↗</a
          ><small
            >{{ hostname(item.url)
            }}<template v-if="item.category">
              · {{ item.category }}</template
            ></small
          >
          <p v-if="item.description">{{ item.description }}</p>
          <span v-for="tag in item.tags" :key="tag">#{{ tag }}</span>
        </div>
        <button
          class="tool-icon"
          :aria-label="`${item.favorite ? 'Desfavoritar' : 'Favoritar'} ${item.title}`"
          @click="
            item.favorite = !item.favorite;
            save();
          "
        >
          {{ item.favorite ? "★" : "☆" }}</button
        ><button
          class="tool-icon"
          :aria-label="`Excluir ${item.title}`"
          @click="remove(item)"
        >
          ×
        </button>
      </article>
    </div>
    <div v-else class="tool-empty">
      <span>↗</span>
      <p>
        {{
          query
            ? "Nenhum recurso corresponde à busca."
            : "Materiais, referências e atalhos. Tudo à mão."
        }}
      </p>
    </div></ToolLayout
  >
</template>
<style scoped>
.resource-form {
  display: grid;
  grid-template-columns: repeat(2, minmax(0, 1fr));
  gap: 0.7rem;
  padding: 1rem;
  background: var(--noma-surface-soft);
  border-radius: 14px;
}
.resource-wide {
  grid-column: 1/-1;
}
.resource-filters {
  display: flex;
  gap: 1rem;
  align-items: center;
  margin: 1rem 0;
  flex-wrap: wrap;
}
.resource-list {
  display: grid;
  gap: 0.6rem;
}
.resource-list article {
  display: flex;
  align-items: flex-start;
  gap: 0.7rem;
  border: 1px solid var(--noma-border);
  border-radius: 12px;
  padding: 0.8rem;
}
.resource-list img {
  width: 24px;
  height: 24px;
}
.resource-list article > div {
  display: grid;
  flex: 1;
  min-width: 0;
}
.resource-list a {
  font-weight: 700;
}
.resource-list small {
  color: var(--noma-ink-muted);
}
.resource-list p {
  margin: 0.35rem 0;
}
.resource-list span {
  font-size: 0.72rem;
  color: var(--noma-ink-muted);
  margin-right: 0.35rem;
}
@media (max-width: 650px) {
  .resource-form {
    grid-template-columns: 1fr;
  }
  .resource-wide {
    grid-column: auto;
  }
}
</style>
