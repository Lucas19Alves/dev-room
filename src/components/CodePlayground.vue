<template>
  <div class="h-full w-full min-w-0 p-3 grid grid-cols-1 grid-rows-[auto_minmax(0,1fr)_minmax(0,1fr)] gap-3" id="code-playground">
    <div class="flex items-center justify-between gap-3">
      <div>
        <h2 class="text-xl font-bold text-orange-400">Code Playground</h2>
        <p class="text-xs text-gray-400">Teste HTML, CSS e JavaScript localmente.</p>
      </div>
      <button @click="run" class="bg-orange-500 hover:bg-orange-600 text-white px-4 py-2 font-bold"><font-awesome-icon icon="fa-solid fa-play" /> Executar</button>
    </div>

    <div class="grid grid-cols-3 gap-2 min-h-0 w-full min-w-0">
      <label class="flex flex-col min-w-0 text-xs font-semibold">HTML<textarea v-model="playground.html" class="flex-1 mt-1 font-mono text-xs resize-none"></textarea></label>
      <label class="flex flex-col min-w-0 text-xs font-semibold">CSS<textarea v-model="playground.css" class="flex-1 mt-1 font-mono text-xs resize-none"></textarea></label>
      <label class="flex flex-col min-w-0 text-xs font-semibold">JavaScript<textarea v-model="playground.js" class="flex-1 mt-1 font-mono text-xs resize-none"></textarea></label>
    </div>

    <div class="w-full min-w-0 rounded-xl overflow-hidden border border-gray-700 bg-white min-h-0">
      <iframe :srcdoc="output" sandbox="allow-scripts" class="w-full h-full border-0" title="Resultado do playground"></iframe>
    </div>
  </div>
</template>

<script setup>
import { ref } from 'vue'
import { useAppStorage } from '../composables/useAppStorage'

const { state: playground } = useAppStorage('codePlayground', {
  html: '<main>\n  <h1>Olá, CentralOS!</h1>\n  <button id="hello">Clique aqui</button>\n</main>',
  css: 'body { font-family: system-ui; padding: 2rem; }\nh1 { color: #0a84ff; }',
  js: "document.querySelector('#hello').onclick = () => alert('Funcionou!')"
})
const output = ref('')

function run() {
  const safeScript = playground.value.js.replace(/<\/script/gi, '<\\/script')
  output.value = `<!doctype html><html><head><style>${playground.value.css}</style></head><body>${playground.value.html}<script>${safeScript}<\/script></body></html>`
}

run()
</script>
