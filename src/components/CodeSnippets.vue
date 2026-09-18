<script setup>
import { computed, ref } from "vue";
import hljs from "highlight.js/lib/core";
import javascript from "highlight.js/lib/languages/javascript";
import python from "highlight.js/lib/languages/python";
import bash from "highlight.js/lib/languages/bash";
import json from "highlight.js/lib/languages/json";
import xml from "highlight.js/lib/languages/xml";
import css from "highlight.js/lib/languages/css";
import sql from "highlight.js/lib/languages/sql";
import markdown from "highlight.js/lib/languages/markdown";
import "highlight.js/styles/github.css";
import { useFlowComponentStorage } from "../composables/useFlowComponentStorage";
import ToolLayout from "./ui/ToolLayout.vue";
import NModal from "./ui/NModal.vue";

const languageLoaders = {
  javascript,
  python,
  bash,
  json,
  html: xml,
  css,
  sql,
  markdown,
};
Object.entries(languageLoaders).forEach(([name, language]) =>
  hljs.registerLanguage(name, language),
);
const languages = Object.keys(languageLoaders);
const props = defineProps({
  storageKey: { type: String, default: "snippets" },
  componentConfig: { type: Object, default: () => ({}) },
  flow: { type: Object, default: null },
});
const { state: snippets } = useFlowComponentStorage(
  props.storageKey,
  [],
  250,
  "snippets",
);
const form = ref({ title: "", language: "javascript", code: "" });
const search = ref("");
const editing = ref(null);
const notice = ref("");
const filtered = computed(() => {
  const query = search.value.trim().toLowerCase();
  return snippets.value.filter(
    (snippet) =>
      !query ||
      `${snippet.title} ${snippet.language} ${snippet.code}`
        .toLowerCase()
        .includes(query),
  );
});
function add() {
  if (!form.value.title.trim() || !form.value.code.trim()) return;
  snippets.value.unshift({
    id: crypto.randomUUID(),
    title: form.value.title.trim(),
    language: form.value.language,
    code: form.value.code,
  });
  form.value = { title: "", language: "javascript", code: "" };
}
function highlight(snippet) {
  return hljs.highlight(snippet.code, {
    language: snippet.language,
    ignoreIllegals: true,
  }).value;
}
async function copy(code) {
  await navigator.clipboard.writeText(code);
  notice.value = "Código copiado.";
  setTimeout(() => (notice.value = ""), 1600);
}
function openEdit(snippet) {
  editing.value = JSON.parse(JSON.stringify(snippet));
}
function saveEdit() {
  const index = snippets.value.findIndex(
    (item) => item.id === editing.value.id,
  );
  if (index >= 0) snippets.value[index] = editing.value;
  editing.value = null;
}
</script>
<template>
  <ToolLayout
    :caption="`${snippets.length} trecho${snippets.length === 1 ? '' : 's'} salvo${snippets.length === 1 ? '' : 's'} neste Flow.`"
    id="codesnippets-main"
  >
    <form class="snippet-form" @submit.prevent="add">
      <input
        v-model="form.title"
        placeholder="Título do snippet"
        aria-label="Título do snippet"
        maxlength="80"
        required
      /><select v-model="form.language" aria-label="Linguagem">
        <option v-for="language in languages" :key="language">
          {{ language }}
        </option></select
      ><textarea
        v-model="form.code"
        placeholder="Cole ou digite seu código…"
        aria-label="Código do snippet"
        rows="4"
        spellcheck="false"
        required
      ></textarea
      ><button class="dark-button">＋ Adicionar snippet</button>
    </form>
    <label class="snippet-search"
      ><span class="sr-only">Buscar snippets</span
      ><input
        v-model="search"
        type="search"
        placeholder="Buscar por título, linguagem ou código…"
        aria-label="Buscar snippets"
    /></label>
    <div v-if="filtered.length" class="snippet-list">
      <article
        v-for="snippet in filtered"
        :key="snippet.id"
        class="snippet-card"
      >
        <header>
          <div>
            <strong>{{ snippet.title }}</strong
            ><span>{{ snippet.language }}</span>
          </div>
          <div>
            <button
              class="tool-icon"
              :aria-label="`Copiar ${snippet.title}`"
              @click="copy(snippet.code)"
            >
              □</button
            ><button
              class="tool-icon"
              :aria-label="`Editar ${snippet.title}`"
              @click="openEdit(snippet)"
            >
              ✎</button
            ><button
              class="tool-icon"
              :aria-label="`Excluir ${snippet.title}`"
              @click="
                snippets = snippets.filter((item) => item.id !== snippet.id)
              "
            >
              ×
            </button>
          </div>
        </header>
        <pre><code v-html="highlight(snippet)"></code></pre>
      </article>
    </div>
    <div v-else class="tool-empty">
      <span>⌘</span>
      <p>
        {{
          snippets.length
            ? "Nenhum snippet corresponde à busca."
            : "Salve aqui o código que você quer reutilizar."
        }}
      </p>
    </div>
    <p v-if="notice" class="tool-feedback" role="status">{{ notice }}</p>
    <NModal
      v-if="editing"
      labelledby="snippet-edit-title"
      @close="editing = null"
      ><h2 id="snippet-edit-title">Editar snippet</h2>
      <div class="snippet-edit">
        <label class="tool-field"
          >Título<input v-model="editing.title" maxlength="80" /></label
        ><label class="tool-field"
          >Linguagem<select v-model="editing.language">
            <option v-for="language in languages" :key="language">
              {{ language }}
            </option>
          </select></label
        ><label class="tool-field"
          >Código<textarea
            v-model="editing.code"
            rows="10"
            spellcheck="false"
          ></textarea>
        </label>
        <div class="button-group">
          <button class="outline" @click="editing = null">Cancelar</button
          ><button class="dark-button" @click="saveEdit">
            Salvar alterações
          </button>
        </div>
      </div></NModal
    >
  </ToolLayout>
</template>
