<script setup>
import { computed, ref } from "vue";
import { useFlowComponentStorage } from "../composables/useFlowComponentStorage.js";
import ToolLayout from "./ui/ToolLayout.vue";

const props = defineProps({
  flow: { type: Object, required: true },
  componentConfig: { type: Object, default: () => ({}) },
  storageKey: { type: String, default: "notes" },
});
const legacy =
  props.flow.componentData?.[props.storageKey] ??
  props.flow.componentData?.notes;
const initial =
  Array.isArray(legacy?.items) && legacy.items.length
    ? legacy
    : {
        items: [
          {
            id: crypto.randomUUID(),
            title: "Nota",
            content: legacy?.text || "",
            pinned: false,
            createdAt: Date.now(),
            updatedAt: Date.now(),
          },
        ],
      };
const { state: notes, save } = useFlowComponentStorage(
  props.storageKey,
  initial,
  300,
  "notes",
);
if (!Array.isArray(notes.value.items) || !notes.value.items.length) {
  const now = Date.now();
  notes.value = {
    items: [
      {
        id: crypto.randomUUID(),
        title: "Nota",
        content: notes.value.text || "",
        pinned: false,
        createdAt: now,
        updatedAt: now,
      },
    ],
  };
  save();
}
const selectedId = ref(notes.value.items?.[0]?.id || null);
const search = ref("");
const preview = ref(false);
const items = computed(() =>
  (notes.value.items || [])
    .slice()
    .sort(
      (a, b) =>
        Number(b.pinned) - Number(a.pinned) || b.updatedAt - a.updatedAt,
    ),
);
const filtered = computed(() => {
  const q = search.value.toLowerCase();
  return items.value.filter(
    (n) => !q || `${n.title} ${n.content}`.toLowerCase().includes(q),
  );
});
const selected = computed(
  () => items.value.find((n) => n.id === selectedId.value) || null,
);
const escape = (value) =>
  String(value || "").replace(
    /[&<>"']/g,
    (char) =>
      ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" })[
        char
      ],
  );
const rendered = computed(() => {
  let code = false;
  return escape(selected.value?.content)
    .split("\n")
    .map((line) => {
      if (line.startsWith("```")) {
        code = !code;
        return code ? "<pre><code>" : "</code></pre>";
      }
      if (code) return `${line}\n`;
      if (line.startsWith("### ")) return `<h3>${line.slice(4)}</h3>`;
      if (line.startsWith("## ")) return `<h2>${line.slice(3)}</h2>`;
      if (line.startsWith("# ")) return `<h1>${line.slice(2)}</h1>`;
      if (/^[-*] /.test(line)) return `<li>${line.slice(2)}</li>`;
      const linked = line.replace(
        /\[([^\]]+)\]\((https?:\/\/[^\s)]+)\)/g,
        '<a href="$2" target="_blank" rel="noopener noreferrer">$1</a>',
      );
      return `<p>${linked || "<br>"}</p>`;
    })
    .join("");
});
function add(template = null) {
  const now = Date.now();
  const note = {
    id: crypto.randomUUID(),
    title: template?.title || "Nova nota",
    content: template?.content || "",
    pinned: false,
    createdAt: now,
    updatedAt: now,
  };
  notes.value.items ||= [];
  notes.value.items.unshift(note);
  selectedId.value = note.id;
  save();
}
function touch() {
  if (selected.value) selected.value.updatedAt = Date.now();
}
function remove(note) {
  notes.value.items = notes.value.items.filter((n) => n.id !== note.id);
  if (selectedId.value === note.id)
    selectedId.value = notes.value.items[0]?.id || null;
  save();
}
</script>
<template>
  <ToolLayout
    :caption="`${items.length} nota${items.length === 1 ? '' : 's'} neste Flow.`"
  >
    <template #actions
      ><button class="dark-button" @click="add()">
        ＋ Nova nota
      </button></template
    >
    <div class="notes-shell">
      <aside class="notes-list">
        <input
          v-model="search"
          type="search"
          aria-label="Buscar notas"
          placeholder="Buscar notas"
        /><button
          v-for="note in filtered"
          :key="note.id"
          :class="{ active: selectedId === note.id }"
          @click="selectedId = note.id"
        >
          <span
            >{{ note.pinned ? "★ " : "" }}{{ note.title || "Sem título" }}</span
          ><small>{{
            new Date(note.updatedAt).toLocaleDateString("pt-BR")
          }}</small>
        </button>
        <p v-if="!filtered.length" class="subtle">Nenhuma nota encontrada.</p>
      </aside>
      <section v-if="selected" class="note-editor">
        <div class="note-actions">
          <button
            class="outline"
            @click="
              selected.pinned = !selected.pinned;
              touch();
              save();
            "
          >
            {{ selected.pinned ? "Desafixar" : "Fixar" }}</button
          ><button class="outline" @click="preview = !preview">
            {{ preview ? "Editar" : "Visualizar" }}</button
          ><button
            class="tool-icon"
            :aria-label="`Excluir ${selected.title}`"
            @click="remove(selected)"
          >
            ×
          </button>
        </div>
        <input
          v-model="selected.title"
            class="note-title"
            aria-label="Título da nota"
            @input="touch(); save()"
        />
        <div v-if="preview" class="markdown-preview" v-html="rendered"></div>
        <textarea
          v-else
          v-model="selected.content"
          class="notes-area"
            aria-label="Notas deste Flow"
            placeholder="Use # para títulos, - para listas e ``` para código."
            @input="touch(); save()"
        ></textarea
        ><small class="subtle"
          >Salvo automaticamente · atualizado
          {{ new Date(selected.updatedAt).toLocaleString("pt-BR") }}</small
        >
      </section>
      <div v-else class="tool-empty">
        <span>▤</span>
        <p>Registre uma decisão, ideia ou aprendizado.</p>
        <button class="outline" @click="add(componentConfig.templates?.[0])">
          Criar primeira nota
        </button>
      </div>
    </div>
    <div v-if="componentConfig.templates?.length" class="note-templates">
      <span class="tool-section-label">MODELOS DO FLOW</span
      ><button
        v-for="template in componentConfig.templates"
        :key="template.title"
        class="outline"
        @click="add(template)"
      >
        {{ template.title }}
      </button>
    </div>
  </ToolLayout>
</template>
<style scoped>
.notes-shell {
  display: grid;
  grid-template-columns: 14rem 1fr;
  gap: 1rem;
  min-height: 22rem;
}
.notes-list {
  display: flex;
  flex-direction: column;
  gap: 0.4rem;
}
.notes-list > button {
  text-align: left;
  border: 1px solid transparent;
  background: transparent;
  border-radius: 10px;
  padding: 0.65rem;
  display: grid;
}
.notes-list > button.active {
  border-color: var(--noma-border);
  background: var(--noma-surface-soft);
}
.notes-list small {
  color: var(--noma-ink-muted);
}
.note-editor {
  display: flex;
  flex-direction: column;
  gap: 0.65rem;
  min-width: 0;
}
.note-actions {
  display: flex;
  justify-content: flex-end;
  gap: 0.4rem;
}
.note-title {
  font-size: 1.25rem;
  font-weight: 700;
  border: 0;
  border-bottom: 1px solid var(--noma-border);
  padding: 0.6rem 0;
}
.notes-area {
  min-height: 16rem;
}
.markdown-preview {
  min-height: 16rem;
  padding: 0.6rem;
  overflow: auto;
}
.note-templates {
  display: flex;
  gap: 0.5rem;
  flex-wrap: wrap;
  margin-top: 1rem;
  align-items: center;
}
@media (max-width: 700px) {
  .notes-shell {
    grid-template-columns: 1fr;
  }
  .notes-list {
    max-height: 10rem;
    overflow: auto;
  }
}
</style>
