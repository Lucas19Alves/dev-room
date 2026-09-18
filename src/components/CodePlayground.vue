<script setup>
import { ref } from "vue";
import { useFlowComponentStorage } from "../composables/useFlowComponentStorage";
import ToolLayout from "./ui/ToolLayout.vue";

const props = defineProps({
  storageKey: { type: String, default: "playground" },
  componentConfig: { type: Object, default: () => ({}) },
  flow: { type: Object, default: null },
});
const { state: playground } = useFlowComponentStorage(
  props.storageKey,
  {
    html: '<main>\n  <h1>Olá, Noma!</h1>\n  <button id="hello">Clique aqui</button>\n</main>',
    css: "body { font-family: system-ui; padding: 2rem; }\nh1 { color: #294a38; }",
    js: "document.querySelector('#hello')?.addEventListener('click', () => alert('Funcionou!'))",
  },
  250,
  "playground",
);
const output = ref("");
const error = ref("");

function run() {
  try {
    const safeScript = playground.value.js.replace(/<\/script/gi, "<\\/script");
    output.value = `<!doctype html><html><head><meta charset="utf-8"><style>${playground.value.css}</style></head><body>${playground.value.html}<script>${safeScript}<\/script></body></html>`;
    error.value = "";
  } catch (reason) {
    error.value = reason.message;
  }
}
run();
</script>
<template>
  <ToolLayout
    caption="Teste HTML, CSS e JavaScript em um ambiente isolado."
    id="code-playground"
  >
    <template #actions
      ><button class="dark-button" @click="run">▶ Executar</button></template
    >
    <p v-if="error" class="tool-feedback tool-feedback--error" role="alert">
      {{ error }}
    </p>
    <div class="playground-editors">
      <label class="tool-field"
        >HTML<textarea
          v-model="playground.html"
          rows="9"
          spellcheck="false"
          aria-label="HTML"
        ></textarea>
      </label>
      <label class="tool-field"
        >CSS<textarea
          v-model="playground.css"
          rows="9"
          spellcheck="false"
          aria-label="CSS"
        ></textarea>
      </label>
      <label class="tool-field"
        >JavaScript<textarea
          v-model="playground.js"
          rows="9"
          spellcheck="false"
          aria-label="JavaScript"
        ></textarea>
      </label>
    </div>
    <div class="playground-preview">
      <span class="tool-section-label">Resultado</span
      ><iframe
        :srcdoc="output"
        sandbox="allow-scripts"
        title="Resultado do playground"
      ></iframe>
    </div>
  </ToolLayout>
</template>
