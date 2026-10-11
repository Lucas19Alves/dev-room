<template>
  <div class="ai-chat" id="chatgptapi-main">
    <!-- Provedor e modelo -->
    <div class="ai-toolbar">
      <select v-model="settings.provider" class="ai-field ai-provider" aria-label="Provedor" id="ai-provider">
        <option v-for="(item, id) in providers" :key="id" :value="id">{{ item.label }}</option>
      </select>
      <div class="ai-model">
        <input v-model.trim="model" :list="`ai-models-${settings.provider}`" class="ai-field" placeholder="Modelo" aria-label="Modelo" id="ai-model" spellcheck="false" />
        <datalist :id="`ai-models-${settings.provider}`">
          <option v-for="item in modelOptions" :key="item" :value="item" />
        </datalist>
        <button type="button" class="ai-icon-btn" :disabled="loadingModels || (!apiKey && !provider.optionalKey)" @click="refreshModels" title="Buscar modelos disponíveis para sua chave" aria-label="Buscar modelos">
          <font-awesome-icon icon="fa-solid fa-repeat" :spin="loadingModels" />
        </button>
      </div>
      <button type="button" class="ai-icon-btn" :class="{ active: showSettings || needsSetup }" @click="showSettings = !showSettings" title="Configurações" aria-label="Configurações" id="ai-settings-toggle">
        <font-awesome-icon icon="fa-solid fa-gear" />
      </button>
    </div>

    <!-- Configurações -->
    <div v-if="showSettings || needsSetup" class="ai-settings" id="chatgptapi-config">
      <label class="ai-label" for="chatgptapi-key">
        <font-awesome-icon icon="fa-solid fa-key" /> Chave de API · {{ provider.label }}
        <span v-if="provider.optionalKey" class="ai-muted">(opcional)</span>
      </label>
      <input v-model.trim="apiKey" type="password" class="ai-field" :placeholder="`Cole sua chave ${provider.label}`" id="chatgptapi-key" autocomplete="off" spellcheck="false" />
      <template v-if="provider.editableUrl">
        <label class="ai-label" for="ai-base-url">URL base</label>
        <input v-model.trim="baseUrl" class="ai-field" :placeholder="provider.baseUrl || 'https://seu-servidor/v1'" id="ai-base-url" spellcheck="false" />
      </template>
      <label class="ai-label" for="ai-system">Instruções do assistente</label>
      <textarea v-model="settings.system" rows="2" class="ai-field" placeholder="Ex.: Responda em português, de forma objetiva, com exemplos de código." id="ai-system"></textarea>
      <p class="ai-muted ai-hint">
        <font-awesome-icon icon="fa-solid fa-circle-info" />
        A chave fica só neste navegador e é enviada apenas ao provedor escolhido.
        <a v-if="provider.keyUrl" :href="provider.keyUrl" target="_blank" rel="noopener">Obter chave</a>
        <span v-if="provider.help"> {{ provider.help }}</span>
      </p>
    </div>

    <!-- Conversa -->
    <div ref="scroller" class="ai-messages" id="chatgptapi-messages" aria-live="polite">
      <div v-if="!messages.length" class="ai-empty">
        <font-awesome-icon icon="fa-solid fa-robot" class="ai-empty-icon" />
        <p>{{ needsSetup ? 'Configure uma chave para começar.' : `Converse com ${model || 'a IA'}.` }}</p>
        <div v-if="!needsSetup" class="ai-suggestions">
          <button v-for="item in suggestions" :key="item" type="button" @click="useSuggestion(item)">{{ item }}</button>
        </div>
      </div>
      <div v-for="(msg, idx) in messages" :key="idx" class="ai-msg" :class="msg.role">
        <div class="ai-bubble">
          <template v-for="(part, p) in splitContent(msg.content)" :key="p">
            <div v-if="part.code !== undefined" class="ai-code">
              <div class="ai-code-head">
                <span>{{ part.lang || 'código' }}</span>
                <button type="button" @click="copy(part.code, `${idx}-${p}`)">{{ copied === `${idx}-${p}` ? 'Copiado!' : 'Copiar' }}</button>
              </div>
              <pre><code>{{ part.code }}</code></pre>
            </div>
            <div v-else class="ai-text">{{ part.text }}</div>
          </template>
          <span v-if="loading && idx === messages.length - 1 && msg.role === 'assistant'" class="ai-caret" aria-hidden="true"></span>
        </div>
        <div v-if="msg.role === 'assistant' && msg.content && !(loading && idx === messages.length - 1)" class="ai-meta">
          <span>{{ msg.model }}</span>
          <button type="button" @click="copy(msg.content, idx)">{{ copied === idx ? 'Copiado!' : 'Copiar' }}</button>
        </div>
        <div v-if="msg.notice" class="ai-notice">{{ msg.notice }}</div>
      </div>
      <div v-if="error" class="ai-error" role="alert">{{ error }}</div>
    </div>

    <!-- Envio -->
    <form @submit.prevent="sendMessage" class="ai-composer" id="chatgptapi-form">
      <textarea
        ref="input"
        v-model="userInput"
        rows="1"
        class="ai-field"
        :placeholder="needsSetup ? 'Configure a chave acima' : 'Pergunte algo… (Enter envia, Shift+Enter quebra linha)'"
        id="chatgptapi-input"
        :disabled="needsSetup"
        @keydown.enter.exact.prevent="sendMessage"
        @input="autosize"
      ></textarea>
      <button v-if="loading" type="button" class="ai-send stop" @click="stop" title="Parar" id="chatgptapi-stop-btn">
        <font-awesome-icon icon="fa-solid fa-pause" />
      </button>
      <button v-else type="submit" class="ai-send" :disabled="!userInput.trim() || needsSetup || !model" title="Enviar" id="chatgptapi-send-btn">
        <font-awesome-icon icon="fa-solid fa-paper-plane" />
      </button>
      <button type="button" class="ai-icon-btn" @click="clearMessages" :disabled="loading || !messages.length" title="Nova conversa" id="chatgptapi-clear-btn">
        <font-awesome-icon icon="fa-solid fa-trash" />
      </button>
    </form>
  </div>
</template>

<script setup>
import { ref, reactive, computed, watch, nextTick, onMounted } from 'vue'
import { providers, streamChat, listModels } from '../utils/aiProviders'

const SETTINGS_KEY = 'dev-room-ai'
const CHAT_KEY = 'dev-room-ai-chat'

function readJSON(key, fallback) {
  try { return JSON.parse(localStorage.getItem(key)) ?? fallback } catch { return fallback }
}

// Configurações locais (chaves nunca vão para o backup do GitHub).
const saved = readJSON(SETTINGS_KEY, {})
const settings = reactive({
  provider: providers[saved.provider] ? saved.provider : 'openai',
  keys: saved.keys || {},
  models: saved.models || {},
  baseUrls: saved.baseUrls || {},
  fetchedModels: saved.fetchedModels || {},
  system: saved.system || ''
})
const legacyKey = localStorage.getItem('chatgpt_api_key')
if (legacyKey && !settings.keys.openai) settings.keys.openai = legacyKey
localStorage.removeItem('chatgpt_api_key')
watch(settings, value => localStorage.setItem(SETTINGS_KEY, JSON.stringify(value)), { deep: true, immediate: true })

const provider = computed(() => providers[settings.provider])
const apiKey = computed({
  get: () => settings.keys[settings.provider] || '',
  set: value => { settings.keys[settings.provider] = value }
})
const model = computed({
  get: () => settings.models[settings.provider] ?? provider.value.models[0] ?? '',
  set: value => { settings.models[settings.provider] = value }
})
const baseUrl = computed({
  get: () => settings.baseUrls[settings.provider] || '',
  set: value => { settings.baseUrls[settings.provider] = value }
})
const modelOptions = computed(() => [...new Set([...provider.value.models, ...(settings.fetchedModels[settings.provider] || [])])])
const needsSetup = computed(() => (!apiKey.value && !provider.value.optionalKey) || (provider.value.editableUrl && !provider.value.baseUrl && !baseUrl.value))

const messages = ref(readJSON(CHAT_KEY, []).filter(m => m && typeof m.content === 'string'))
watch(messages, value => {
  try { localStorage.setItem(CHAT_KEY, JSON.stringify(value.slice(-60))) } catch {}
}, { deep: true })

const userInput = ref('')
const loading = ref(false)
const loadingModels = ref(false)
const error = ref('')
const showSettings = ref(false)
const copied = ref(null)
const scroller = ref(null)
const input = ref(null)
let controller = null

const suggestions = [
  'Explique este erro e como corrigi-lo:',
  'Escreva testes para a função:',
  'Revise este código e sugira melhorias:',
  'Gere uma regex que valide'
]

function useSuggestion(text) {
  userInput.value = `${text} `
  nextTick(() => { input.value?.focus(); autosize() })
}

function autosize() {
  const el = input.value
  if (!el) return
  el.style.height = 'auto'
  el.style.height = `${Math.min(el.scrollHeight, 160)}px`
}

function scrollToEnd() {
  nextTick(() => { if (scroller.value) scroller.value.scrollTop = scroller.value.scrollHeight })
}

// Separa blocos ```código``` do texto para exibição e cópia.
function splitContent(content) {
  const parts = []
  const regex = /```([\w+#.-]*)\n?([\s\S]*?)(```|$)/g
  let last = 0
  let match
  while ((match = regex.exec(content))) {
    if (match.index > last) parts.push({ text: content.slice(last, match.index).trim() })
    parts.push({ lang: match[1], code: match[2].replace(/\n$/, '') })
    last = regex.lastIndex
    if (!match[0]) break
  }
  if (last < content.length) parts.push({ text: content.slice(last).trim() })
  return parts.filter(part => part.code !== undefined || part.text)
}

async function copy(text, id) {
  try {
    await navigator.clipboard.writeText(text)
    copied.value = id
    setTimeout(() => { if (copied.value === id) copied.value = null }, 1500)
  } catch { error.value = 'Não foi possível copiar.' }
}

async function refreshModels() {
  loadingModels.value = true
  error.value = ''
  try {
    const ids = await listModels(settings.provider, { apiKey: apiKey.value, baseUrl: baseUrl.value })
    settings.fetchedModels[settings.provider] = ids.slice(0, 300)
    if (!ids.length) error.value = 'Nenhum modelo retornado pelo provedor.'
  } catch (e) {
    error.value = e.message || 'Não foi possível listar os modelos.'
  } finally {
    loadingModels.value = false
  }
}

async function sendMessage() {
  const text = userInput.value.trim()
  if (!text || loading.value || needsSetup.value || !model.value) return
  error.value = ''
  userInput.value = ''
  nextTick(autosize)
  messages.value.push({ role: 'user', content: text })
  const history = messages.value
    .filter(m => m.content)
    .slice(-30)
    .map(m => ({ role: m.role, content: m.content }))
  messages.value.push({ role: 'assistant', content: '', model: model.value })
  const reply = messages.value[messages.value.length - 1]
  loading.value = true
  controller = new AbortController()
  scrollToEnd()
  try {
    const result = await streamChat(settings.provider, {
      apiKey: apiKey.value,
      baseUrl: baseUrl.value,
      model: model.value,
      system: settings.system.trim(),
      messages: history,
      signal: controller.signal,
      onText: chunk => { reply.content += chunk; scrollToEnd() }
    })
    if (result?.notice) reply.notice = result.notice
  } catch (e) {
    if (e.name === 'AbortError') reply.notice = 'Resposta interrompida.'
    else if (e instanceof TypeError) error.value = 'Falha de conexão. Verifique a rede, a URL ou se o provedor permite acesso pelo navegador.'
    else error.value = e.message || 'Erro ao obter resposta da IA.'
  } finally {
    if (!reply.content && !reply.notice) messages.value.splice(messages.value.indexOf(reply), 1)
    loading.value = false
    controller = null
    scrollToEnd()
  }
}

function stop() {
  controller?.abort()
}

function clearMessages() {
  messages.value = []
  error.value = ''
}

watch(() => settings.provider, () => { error.value = '' })
onMounted(() => { scrollToEnd(); if (needsSetup.value) showSettings.value = true })
</script>

<style scoped>
.ai-chat button { min-height: 0 !important; padding: 0 !important; font-weight: 500 !important; letter-spacing: 0 !important; }
.ai-chat .ai-suggestions button { padding: 6px 10px !important; }
.ai-chat { display: flex; flex-direction: column; gap: 10px; height: 100%; min-height: 0; padding: 14px; color: var(--text-main); }
.ai-toolbar { display: flex; gap: 8px; align-items: center; }
.ai-provider { flex: 0 1 190px; min-width: 0; }
.ai-model { display: flex; gap: 6px; flex: 1; min-width: 0; }
.ai-model input { flex: 1; min-width: 0; }
.ai-field { width: 100%; padding: 8px 10px; border-radius: var(--radius-control, 10px); background: var(--input-bg); color: var(--text-main); border: 1px solid var(--glass-border); font-size: 13px; outline: none; transition: border-color .15s, box-shadow .15s; }
.ai-field:focus { border-color: var(--accent); box-shadow: 0 0 0 3px var(--accent-soft); }
textarea.ai-field { resize: none; line-height: 1.45; font-family: inherit; }
.ai-icon-btn { flex: none; width: 34px; height: 34px; display: grid; place-items: center; border-radius: var(--radius-control, 10px); border: 1px solid var(--glass-border); background: var(--bg-panel-secondary); color: var(--text-secondary); cursor: pointer; transition: color .15s, border-color .15s, background .15s; }
.ai-icon-btn:hover:not(:disabled), .ai-icon-btn.active { color: var(--accent); border-color: var(--accent); }
.ai-icon-btn:disabled { opacity: .45; cursor: not-allowed; }
.ai-settings { display: flex; flex-direction: column; gap: 6px; padding: 12px; border-radius: 14px; background: var(--bg-panel-secondary); border: 1px solid var(--glass-border); }
.ai-label { font-size: 12px; font-weight: 600; color: var(--text-secondary); display: flex; align-items: center; gap: 6px; margin-top: 2px; }
.ai-muted { color: var(--text-muted); font-weight: 400; }
.ai-hint { font-size: 11.5px; line-height: 1.5; margin-top: 2px; }
.ai-hint a { color: var(--accent); text-decoration: underline; }
.ai-messages { flex: 1; min-height: 0; overflow-y: auto; display: flex; flex-direction: column; gap: 14px; padding: 4px 2px; }
.ai-empty { margin: auto; text-align: center; color: var(--text-muted); font-size: 13px; display: flex; flex-direction: column; align-items: center; gap: 10px; }
.ai-empty-icon { font-size: 34px; color: var(--accent); }
.ai-suggestions { display: flex; flex-wrap: wrap; justify-content: center; gap: 6px; max-width: 460px; }
.ai-suggestions button { font-size: 12px; padding: 6px 10px; border-radius: 999px; border: 1px solid var(--glass-border); background: var(--bg-panel-secondary); color: var(--text-secondary); cursor: pointer; }
.ai-suggestions button:hover { border-color: var(--accent); color: var(--accent); }
.ai-msg { display: flex; flex-direction: column; gap: 4px; max-width: 92%; }
.ai-msg.user { align-self: flex-end; align-items: flex-end; }
.ai-msg.assistant { align-self: flex-start; }
.ai-bubble { padding: 10px 13px; border-radius: 16px; font-size: 13.5px; line-height: 1.55; display: flex; flex-direction: column; gap: 8px; overflow-wrap: anywhere; }
.user .ai-bubble { background: var(--accent); color: #fff; border-bottom-right-radius: 5px; }
.assistant .ai-bubble { background: var(--surface-strong); border: 1px solid var(--glass-border); border-bottom-left-radius: 5px; min-width: 48px; }
.ai-text { white-space: pre-wrap; }
.ai-code { border-radius: 10px; overflow: hidden; background: #0d1117; color: #e6edf3; border: 1px solid rgba(255,255,255,.08); }
.ai-code-head { display: flex; justify-content: space-between; align-items: center; padding: 4px 10px; font-size: 11px; color: #8b949e; background: rgba(255,255,255,.04); }
.ai-code-head button { color: #8b949e; cursor: pointer; }
.ai-code-head button:hover { color: #fff; }
.ai-code pre { margin: 0; padding: 10px; overflow-x: auto; font-size: 12.5px; line-height: 1.5; }
.ai-meta { display: flex; gap: 10px; font-size: 11px; color: var(--text-muted); padding-left: 4px; }
.ai-meta button { cursor: pointer; color: inherit; }
.ai-meta button:hover { color: var(--accent); }
.ai-notice { font-size: 11.5px; color: var(--text-muted); font-style: italic; padding-left: 4px; }
.ai-error { font-size: 12.5px; color: #ff5f57; background: rgba(255, 95, 87, .1); border: 1px solid rgba(255, 95, 87, .3); padding: 8px 12px; border-radius: 10px; }
.ai-caret { display: inline-block; width: 7px; height: 14px; background: var(--accent); border-radius: 2px; animation: ai-blink 1s steps(2) infinite; }
@keyframes ai-blink { 50% { opacity: 0; } }
.ai-composer { display: flex; gap: 8px; align-items: flex-end; }
.ai-composer textarea { flex: 1; max-height: 160px; }
.ai-send { flex: none; width: 38px; height: 38px; border-radius: 12px; background: var(--accent); color: #fff; display: grid; place-items: center; cursor: pointer; transition: opacity .15s, transform .15s; }
.ai-send:hover:not(:disabled) { transform: translateY(-1px); }
.ai-send:disabled { opacity: .4; cursor: not-allowed; }
.ai-send.stop { background: #ff5f57; }
@media (max-width: 480px) { .ai-toolbar { flex-wrap: wrap; } .ai-provider { flex: 1 1 100%; } }
</style>
