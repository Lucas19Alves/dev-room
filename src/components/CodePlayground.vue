<template>
  <div class="tool" style="--app-accent-rgb: 255, 149, 0" id="code-playground">
    <div class="tool-head">
      <div>
        <h2 class="tool-title">Code Playground</h2>
        <p class="tool-sub">HTML, CSS e JavaScript em um ambiente isolado, com console.</p>
      </div>
      <div class="tool-row">
        <label class="tool-row auto"><input type="checkbox" v-model="playground.autoRun" /> Auto</label>
        <button type="button" class="btn btn-sm" @click="resetCode" title="Restaurar exemplo"><font-awesome-icon icon="fa-solid fa-rotate-left" /></button>
        <button type="button" class="btn btn-primary btn-sm" @click="run" title="Executar (Ctrl+Enter)"><font-awesome-icon icon="fa-solid fa-play" /> Executar</button>
      </div>
    </div>

    <div class="editors" @keydown.ctrl.enter.prevent="run" @keydown.meta.enter.prevent="run">
      <div class="seg tabs" role="tablist">
        <button v-for="tab in tabs" :key="tab.id" type="button" :class="{ on: activeTab === tab.id }" @click="activeTab = tab.id">{{ tab.label }}</button>
      </div>
      <label v-for="tab in tabs" :key="tab.id" class="editor" :class="{ active: activeTab === tab.id }">
        <span class="tool-label">{{ tab.label }}</span>
        <textarea v-model="playground[tab.id]" class="code-area" spellcheck="false" @keydown.tab.prevent="insertTab($event, tab.id)"></textarea>
      </label>
    </div>

    <div class="output">
      <iframe ref="frame" :srcdoc="output" sandbox="allow-scripts allow-modals" class="preview" title="Resultado do playground"></iframe>
      <div class="console">
        <div class="console-head">
          <span class="tool-label">Console</span>
          <span v-if="errorCount" class="chip bad">{{ errorCount }} erro{{ errorCount === 1 ? '' : 's' }}</span>
          <button type="button" class="btn btn-sm" @click="logs = []" :disabled="!logs.length">Limpar</button>
        </div>
        <ol class="tool-mono logs">
          <li v-for="(log, i) in logs" :key="i" :class="log.level">{{ log.text }}</li>
          <li v-if="!logs.length" class="tool-muted">Saídas de console.log aparecem aqui.</li>
        </ol>
      </div>
    </div>
  </div>
</template>

<script setup>
import { computed, onMounted, onUnmounted, ref, watch } from 'vue'
import { useAppStorage } from '../composables/useAppStorage'

const example = {
  html: '<main>\n  <h1>Olá, Dev Room!</h1>\n  <button id="hello">Clique aqui</button>\n</main>',
  css: 'body { font-family: system-ui; padding: 2rem; }\nh1 { color: #0a84ff; }',
  js: "document.querySelector('#hello').onclick = () => {\n  console.log('Funcionou!', { hora: new Date().toLocaleTimeString() })\n}"
}
const { state: playground } = useAppStorage('codePlayground', { ...example, autoRun: true })
const tabs = [{ id: 'html', label: 'HTML' }, { id: 'css', label: 'CSS' }, { id: 'js', label: 'JavaScript' }]
const activeTab = ref('html')
const output = ref('')
const logs = ref([])
const frame = ref(null)
const errorCount = computed(() => logs.value.filter(l => l.level === 'error').length)
const runId = ref(0)

// Captura console e erros do iframe via postMessage, identificando a execução.
const bridge = id => `<script>(function(){
  var send = function(level, args){ try { parent.postMessage({ __devroom: ${id}, level: level, text: Array.prototype.map.call(args, function(a){
    if (a instanceof Error) return a.name + ': ' + a.message;
    if (typeof a === 'object') { try { return JSON.stringify(a) } catch (e) { return String(a) } }
    return String(a) }).join(' ') }, '*') } catch (e) {} };
  ['log','info','warn','error','debug'].forEach(function(level){ var orig = console[level]; console[level] = function(){ send(level, arguments); orig.apply(console, arguments) } });
  window.addEventListener('error', function(e){ send('error', [e.message + (e.lineno ? ' (linha ' + e.lineno + ')' : '')]) });
  window.addEventListener('unhandledrejection', function(e){ send('error', ['Promise rejeitada: ' + (e.reason && e.reason.message || e.reason)]) });
})()<\/script>`

function run() {
  runId.value++
  logs.value = []
  const safe = text => String(text || '').replace(/<\/script/gi, '<\\/script')
  output.value = `<!doctype html><html><head><meta charset="utf-8">${bridge(runId.value)}<style>${playground.value.css || ''}</style></head><body>${playground.value.html || ''}<script>${safe(playground.value.js)}<\/script></body></html>`
}

function onMessage(event) {
  if (event.source !== frame.value?.contentWindow || event.data?.__devroom !== runId.value) return
  logs.value.push({ level: event.data.level, text: event.data.text })
  if (logs.value.length > 300) logs.value.splice(0, logs.value.length - 300)
}

function insertTab(event, field) {
  const el = event.target
  const { selectionStart: start, selectionEnd: end } = el
  playground.value[field] = `${playground.value[field].slice(0, start)}  ${playground.value[field].slice(end)}`
  requestAnimationFrame(() => { el.selectionStart = el.selectionEnd = start + 2 })
}

function resetCode() {
  if (!confirm('Restaurar o código de exemplo? O código atual será perdido.')) return
  Object.assign(playground.value, example)
  run()
}

let autoTimer = 0
watch(() => [playground.value.html, playground.value.css, playground.value.js], () => {
  if (!playground.value.autoRun) return
  clearTimeout(autoTimer)
  autoTimer = setTimeout(run, 700)
})

onMounted(() => {
  window.addEventListener('message', onMessage)
  run()
})
onUnmounted(() => {
  clearTimeout(autoTimer)
  window.removeEventListener('message', onMessage)
})
</script>

<style scoped>
.auto { font-size: 12.5px; gap: 5px; cursor: pointer; }
.editors { display: grid; grid-template-columns: repeat(3, minmax(0, 1fr)); gap: 8px; min-height: 180px; flex: 1; }
.tabs { display: none; }
.editor { display: flex; flex-direction: column; min-width: 0; min-height: 0; }
.editor textarea { flex: 1; resize: none; min-height: 150px; }
.output { display: grid; grid-template-columns: minmax(0, 2fr) minmax(0, 1fr); gap: 8px; flex: 1; min-height: 200px; }
.preview { width: 100%; height: 100%; min-height: 200px; border: 1px solid var(--glass-border); border-radius: 12px; background: #fff; }
.console { display: flex; flex-direction: column; border: 1px solid var(--glass-border); border-radius: 12px; background: #0d1117; color: #e6edf3; min-height: 0; overflow: hidden; }
.console-head { display: flex; align-items: center; gap: 6px; padding: 6px 8px; border-bottom: 1px solid rgba(255, 255, 255, .08); }
.console-head .tool-label { margin: 0 auto 0 0; color: #8b949e; }
.logs { flex: 1; overflow: auto; padding: 6px 8px; font-size: 12px; display: flex; flex-direction: column; gap: 2px; }
.logs li { white-space: pre-wrap; overflow-wrap: anywhere; border-bottom: 1px solid rgba(255, 255, 255, .04); padding-bottom: 2px; }
.logs .warn { color: #ffbd2e; }
.logs .error { color: #ff7b72; }
.logs .tool-muted { color: #8b949e; }
@container app-window (max-width: 700px) {
  .tabs { display: inline-flex; grid-column: 1 / -1; justify-self: start; align-self: start; }
  .editors { grid-template-columns: 1fr; }
  .editor { display: none; }
  .editor.active { display: flex; }
  .output { grid-template-columns: 1fr; }
}
@media (max-width: 768px) {
  .tabs { display: inline-flex; justify-self: start; align-self: start; }
  .editors { grid-template-columns: 1fr; }
  .editor { display: none; }
  .editor.active { display: flex; }
  .output { grid-template-columns: 1fr; }
}
</style>
