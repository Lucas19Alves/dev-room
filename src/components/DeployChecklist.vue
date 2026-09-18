<script setup>
import { computed, ref } from "vue";
import { useFlowComponentStorage } from "../composables/useFlowComponentStorage";
const props = defineProps({
  storageKey: { type: String, default: "deploy" },
  componentConfig: { type: Object, default: () => ({}) },
  flow: { type: Object, default: null },
});
const { state: checklist } = useFlowComponentStorage(
  props.storageKey,
  [],
  250,
  "deploy",
);
const newItem = ref(""),
  filter = ref("all"),
  notice = ref("");
const filteredItems = computed(() =>
  checklist.value.filter(
    (i) =>
      filter.value === "all" || (filter.value === "done" ? i.done : !i.done),
  ),
);
const doneCount = computed(() => checklist.value.filter((i) => i.done).length);
const progress = computed(() =>
  checklist.value.length
    ? Math.round((doneCount.value / checklist.value.length) * 100)
    : 0,
);
function add() {
  if (!newItem.value.trim()) return;
  checklist.value.push({
    id: crypto.randomUUID(),
    text: newItem.value.trim(),
    done: false,
  });
  newItem.value = "";
}
function addDefaults() {
  const defaults = [
    "Testes automatizados passaram",
    "Variáveis de ambiente revisadas",
    "Build de produção validado",
    "Backup realizado",
    "Documentação atualizada",
  ];
  const existing = new Set(checklist.value.map((i) => i.text));
  checklist.value.push(
    ...defaults
      .filter((t) => !existing.has(t))
      .map((text) => ({ id: crypto.randomUUID(), text, done: false })),
  );
}
function exportList() {
  const url = URL.createObjectURL(
    new Blob([JSON.stringify(checklist.value, null, 2)], {
      type: "application/json",
    }),
  );
  const a = document.createElement("a");
  a.href = url;
  a.download = "deploy-checklist.json";
  a.click();
  setTimeout(() => URL.revokeObjectURL(url), 1000);
}
async function importList(event) {
  const file = event.target.files[0];
  if (!file) return;
  try {
    if (file.size > 1000000) throw new Error("O arquivo deve ter até 1 MB.");
    const parsed = JSON.parse(await file.text());
    if (
      !Array.isArray(parsed) ||
      !parsed.every((i) => typeof i.text === "string" && i.text.trim())
    )
      throw new Error("Selecione um checklist JSON válido.");
    checklist.value.push(
      ...parsed.map((i) => ({
        id: crypto.randomUUID(),
        text: i.text,
        done: !!i.done,
      })),
    );
    notice.value = "Itens importados e adicionados à sua lista.";
  } catch (e) {
    notice.value = e.message;
  }
  event.target.value = "";
}
</script>
<template>
  <div class="tool-body" id="deploy-main">
    <div class="tool-toolbar">
      <p class="tool-caption">
        {{ doneCount }} de {{ checklist.length }} verificações concluídas
      </p>
      <span class="tool-badge">{{ progress }}%</span>
    </div>
    <div class="tool-progress"><i :style="{ width: progress + '%' }"></i></div>
    <form class="inline-form" @submit.prevent="add">
      <input
        v-model="newItem"
        placeholder="O que revisar antes de publicar?"
        aria-label="Nova verificação de deploy"
      /><button aria-label="Adicionar verificação">＋</button>
    </form>
    <div class="tool-tabs">
      <button
        v-for="item in [
          { id: 'all', text: 'Todos' },
          { id: 'open', text: 'Pendentes' },
          { id: 'done', text: 'Concluídos' },
        ]"
        :key="item.id"
        :class="{ active: filter === item.id }"
        @click="filter = item.id"
      >
        {{ item.text }}
      </button>
    </div>
    <div v-for="item in filteredItems" :key="item.id" class="task-row">
      <input
        v-model="item.done"
        type="checkbox"
        :aria-label="item.text"
      /><input
        v-model="item.text"
        :class="{ done: item.done }"
        aria-label="Texto da verificação"
      /><button
        aria-label="Excluir verificação"
        @click="checklist = checklist.filter((i) => i.id !== item.id)"
      >
        ×
      </button>
    </div>
    <div v-if="!filteredItems.length" class="tool-empty">
      <span>☑</span>
      <p>
        {{
          checklist.length
            ? "Nenhuma verificação neste filtro."
            : "Prepare uma entrega tranquila."
        }}
      </p>
      <button v-if="!checklist.length" class="text-button" @click="addDefaults">
        Usar checklist sugerido →
      </button>
    </div>
    <div class="tool-footer">
      <button
        class="text-button"
        @click="checklist.forEach((i) => (i.done = false))"
      >
        Desmarcar todos
      </button>
      <div class="button-group">
        <button
          class="outline"
          :disabled="!checklist.length"
          @click="exportList"
        >
          ↓ Exportar</button
        ><label class="outline file-control"
          >↑ Importar<input
            type="file"
            accept="application/json,.json"
            aria-label="Importar checklist"
            @change="importList"
        /></label>
      </div>
    </div>
    <p v-if="notice" class="tool-feedback" role="status">{{ notice }}</p>
  </div>
</template>
