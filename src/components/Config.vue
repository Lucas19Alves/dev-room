<template>
  <!-- Container principal das configurações -->
  <div class="flex flex-col gap-6 w-full max-w-md mx-auto mb-24" id="config-main">
    <!-- Seção: Usuário -->
    <section class="rounded-lg p-4 flex flex-col gap-2" :style="{ borderColor: 'var(--accent)' }" id="config-user-section">
      <h2 class="text-lg font-bold mb-2" :style="{ color: 'var(--text-main)' }" id="config-user-title">
        <font-awesome-icon icon="fa-solid fa-user-gear" class="mr-2" />
        Perfil
      </h2>
      <label class="text-xs text-gray-400 mb-1" id="config-user-label">Seu nome</label>
      <div class="flex gap-2 items-center" id="config-user-input-group">
        <input
          v-model="nomeLocal"
          class="bg-gray-900 border border-gray-700 rounded px-3 py-2 text-sm text-gray-100 flex-1"
          placeholder="Digite seu nome"
          @keyup.enter="salvarNome"
          id="config-user-input"
        />
        <button
          class="bg-blue-600 hover:bg-blue-700 text-white px-3 py-2 rounded transition text-xs font-bold"
          @click="salvarNome"
          id="config-user-save-btn"
        >
          Salvar
        </button>
      </div>
      <span v-if="nomeSalvo" class="text-green-400 text-xs mt-1" id="config-user-saved-msg">Nome atualizado!</span>
    </section>

    <!-- Seção: Tema -->
    <section class="rounded-lg p-4 flex flex-col gap-2" id="config-theme-section">
      <h2 class="text-lg font-bold mb-2" :style="{ color: 'var(--text-main)' }" id="config-theme-title">
        <font-awesome-icon icon="fa-solid fa-palette" class="mr-2" />
        Tema
      </h2>
      <div class="grid grid-cols-2 gap-3" id="config-theme-list">
        <button
          v-for="theme in themes"
          :key="theme.value"
          type="button"
          class="rounded-xl p-3 flex flex-col items-stretch border border-solid transition"
          :style="{
            borderColor: currentTheme === theme.value ? 'var(--accent)' : theme.border,
            background: theme.preview,
            color: theme.text,
            boxShadow: currentTheme === theme.value ? '0 0 0 3px var(--accent-soft)' : 'none',
            touchAction: 'manipulation'
          }"
          @click="setTheme(theme.value)"
          :id="`config-theme-btn-${theme.value}`"
          tabindex="0"
        >
          <span class="font-bold text-xs mb-3 flex items-center justify-between gap-2" :id="`config-theme-label-${theme.value}`">
            <span>{{ theme.label }}</span>
            <span class="px-2 py-0.5 rounded-full text-[10px] font-semibold" :style="{ background: theme.chip, color: theme.text }">
              {{ theme.mode }}
            </span>
            <font-awesome-icon
              v-if="currentTheme === theme.value"
              icon="fa-solid fa-check"
              class="ml-auto"
              :style="{ color: theme.accent }"
              :id="`config-theme-check-${theme.value}`"
            />
          </span>
          <span class="flex items-center gap-1.5 rounded-lg px-2 py-2" :style="{ background: theme.surface }" aria-hidden="true">
            <span class="w-2 h-2 rounded-full bg-red-400"></span>
            <span class="w-2 h-2 rounded-full bg-yellow-400"></span>
            <span class="w-2 h-2 rounded-full bg-green-400"></span>
            <span class="ml-1 h-1.5 flex-1 rounded-full" :style="{ background: theme.accent }"></span>
          </span>
        </button>
      </div>
      <div class="mt-2 text-xs text-gray-400 text-center" id="config-theme-info">
        O tema escolhido será aplicado em todo o ambiente e salvo para as próximas visitas.
      </div>
    </section>

    <!-- Seção: Papel de Parede -->
    <section class="rounded-lg p-4 flex flex-col gap-2" id="config-wallpaper-section">
      <h2 class="text-lg font-bold mb-2" :style="{ color: 'var(--text-main)' }" id="config-wallpaper-title">
        <font-awesome-icon icon="fa-solid fa-image" class="mr-2" />
        Papel de Parede
      </h2>
      <Wallpaper :setWallpaper="setWallpaper" />
    </section>

    <!-- Seção: Dados -->
    <section class="rounded-lg p-4 flex flex-col gap-2" id="config-data-section">
      <h2 class="text-lg font-bold mb-2" :style="{ color: 'var(--text-main)' }">
        <font-awesome-icon icon="fa-solid fa-database" class="mr-2" />
        Seus dados
      </h2>
      <p class="text-xs text-gray-400">Baixe uma cópia de tarefas, notas, snippets, quadros e configurações, ou restaure a partir de um arquivo. Chaves de API não são incluídas.</p>
      <div class="flex gap-2 flex-wrap">
        <button type="button" class="bg-blue-600 hover:bg-blue-700 text-white px-3 py-2 rounded text-xs font-bold" @click="exportData" id="config-export-btn">
          <font-awesome-icon icon="fa-solid fa-download" /> Exportar backup
        </button>
        <label class="bg-gray-700 hover:bg-gray-800 px-3 py-2 rounded text-xs font-bold cursor-pointer" id="config-import-btn">
          <font-awesome-icon icon="fa-solid fa-upload" /> Importar backup
          <input type="file" accept=".json,application/json" class="hidden" @change="importData" />
        </label>
      </div>
      <span v-if="dataMessage" class="text-xs" :class="dataError ? 'text-red-400' : 'text-green-400'">{{ dataMessage }}</span>
    </section>

    <!-- Seção: Documentação -->
    <section class="rounded-lg p-4 flex flex-col gap-2" id="config-doc-section">
      <h2 class="text-lg font-bold mb-2 flex items-center gap-2" :style="{ color: 'var(--text-main)' }" id="config-doc-title">
        <font-awesome-icon icon="fa-solid fa-book" class="mr-2" />
        Documentação & Comunidade
      </h2>
      <div class="flex gap-2 mb-3" id="config-doc-tabs">
        <button
          v-for="tab in docTabs"
          :key="tab"
          @click="docTab = tab"
          class="px-3 py-1 rounded-t font-semibold transition text-xs"
          :class="docTab === tab
            ? 'bg-pink-600 text-white'
            : 'bg-gray-800 text-pink-200 hover:bg-gray-700'"
          :id="`config-doc-tab-btn-${tab}`"
        >
          {{ tab }}
        </button>
      </div>
      <div class="bg-gray-900 rounded-b p-3 text-sm min-h-[140px]" id="config-doc-content">
        <!-- Conteúdo da documentação por aba -->
        <div v-if="docTab === 'Visão Geral'" id="config-doc-intro">
          <div class="mb-3">
            <font-awesome-icon icon="fa-solid fa-lightbulb" class="text-yellow-400 mr-2" />
            <b>Dev Room</b> é seu ambiente digital para produtividade, organização e foco, feito especialmente para devs!
          </div>
          <ul class="list-disc ml-5 mt-2 space-y-1" id="config-doc-intro-list">
            <li>
              <b>{{ toolCount }} ferramentas:</b> produtividade (tarefas, Kanban, notas, Pomodoro, timer) e utilitários de dev (JSON, Regex, Diff, codificador, cores, timestamps, playground e assistente de IA).
            </li>
            <li>
              <b>Personalização:</b> Escolha entre <span class="font-bold text-pink-300">10 temas translúcidos</span>, com opções claras e escuras.
            </li>
            <li>
              <b>Experiência fluida:</b> No desktop, organize as janelas livremente. No mobile, navegue pelo menu lateral.
            </li>
            <li>
              <b>Salvamento automático:</b> Suas tarefas, notas e configurações ficam salvas no navegador.
            </li>
            <li>
              <b>Open Source:</b> O projeto é aberto! Veja, contribua ou adapte para seu time.
            </li>
          </ul>
          <div class="mt-4 p-3 rounded bg-gray-800 border border-pink-500 flex flex-col gap-2 items-center text-center">
            <span class="font-bold text-pink-300 text-base">🌟 Contribua ou acompanhe o projeto no GitHub:</span>
            <a href="https://github.com/Lucas19Alves/dev-room" target="_blank" class="hover:underline text-pink-200 flex items-center gap-2 text-sm font-mono" id="config-doc-about-project-github">
              <font-awesome-icon icon="fa-brands fa-github" />
              Repositório do Dev Room
            </a>
            <span class="text-xs text-gray-400">Pull requests, issues e sugestões são bem-vindos!</span>
          </div>
        </div>
        <div v-else-if="docTab === 'Funcionalidades'" id="config-doc-windows">
          <div class="mb-2">
            <font-awesome-icon icon="fa-solid fa-cubes" class="text-blue-400 mr-2" />
            <b>Ferramentas disponíveis:</b>
          </div>
          <ul class="list-disc ml-5 space-y-1" id="config-doc-windows-list">
            <li v-for="tool in toolDocs" :key="tool.label"><b>{{ tool.label }}:</b> {{ tool.text }}</li>
          </ul>
          <p class="mt-3 text-xs text-gray-400">Dica: <b>Ctrl+K</b> abre qualquer ferramenta; o alfinete fixa ou remove da dock.</p>
        </div>
        <div v-else-if="docTab === 'Sobre & Contato'" id="config-doc-about">
          <div class="mb-3 flex flex-col gap-2 items-center">
            <font-awesome-icon icon="fa-solid fa-user-astronaut" class="text-3xl text-pink-400" />
            <span class="font-bold text-lg">Sobre o autor</span>
            <span class="text-base text-pink-200">Lucas Alves</span>
            <span class="text-xs text-gray-400 text-center">Desenvolvedor apaixonado por criar soluções que facilitam a vida de outros devs. Gosto de experimentar novas tecnologias, compartilhar conhecimento e construir ambientes produtivos e agradáveis para todos.</span>
          </div>
          <div class="mt-2 flex flex-col gap-2 items-center text-center">
            <span class="font-bold text-pink-300">🌐 Me encontre:</span>
            <a href="https://github.com/Lucas19Alves" target="_blank" class="hover:underline text-pink-200 flex items-center gap-2 text-sm font-mono" id="config-doc-about-github">
              <font-awesome-icon icon="fa-brands fa-github" />
              github.com/Lucas19Alves
            </a>
            <a href="https://portifolio-2-0.vercel.app/" target="_blank" class="hover:underline text-pink-200 flex items-center gap-2 text-sm font-mono" id="config-doc-about-portfolio">
              <font-awesome-icon icon="fa-solid fa-globe" />
              portifolio-2-0.vercel.app
            </a>
          </div>
          <div class="mt-4 p-3 rounded bg-gray-800 border border-pink-500 flex flex-col gap-2 items-center text-center">
            <span class="font-bold text-pink-300 text-base">⭐ Projeto Open Source</span>
            <span class="text-xs text-gray-400">Acesse, contribua ou compartilhe:</span>
            <a href="https://github.com/Lucas19Alves/dev-room" target="_blank" class="hover:underline text-pink-200 flex items-center gap-2 text-sm font-mono" id="config-doc-about-project-github">
              <font-awesome-icon icon="fa-brands fa-github" />
              Repositório do Dev Room
            </a>
          </div>
        </div>
      </div>
    </section>
  </div>
</template>

<script setup>
import { ref, watch } from 'vue'
import { getDevRoomData, setDevRoomData } from '../utils/storage'
import { tools } from '../utils/tools'
import Wallpaper from './Wallpaper.vue'

const props = defineProps({
  setTheme: Function,
  currentTheme: String,
  nome: String,
  setNome: Function,
  setWallpaper: Function
})

const nomeLocal = ref(props.nome)
const nomeSalvo = ref(false)

function salvarNome() {
  if (nomeLocal.value && nomeLocal.value.trim() !== '') {
    props.setNome(nomeLocal.value.trim())
    nomeSalvo.value = true
    setTimeout(() => (nomeSalvo.value = false), 1500)
  }
}

watch(() => props.nome, (novo) => {
  nomeLocal.value = novo
})

const themes = [
  { label: 'Azul', mode: 'Claro', value: 'theme-default', preview: 'linear-gradient(135deg, #f8fbff, #dceaff)', surface: 'rgba(255,255,255,.72)', chip: 'rgba(10,132,255,.12)', text: '#172033', accent: '#0a84ff', border: 'rgba(10,132,255,.28)' },
  { label: 'Grafite', mode: 'Escuro', value: 'theme-dark', preview: 'linear-gradient(135deg, #343844, #15171d)', surface: 'rgba(255,255,255,.1)', chip: 'rgba(255,255,255,.1)', text: '#f5f7fb', accent: '#0a84ff', border: 'rgba(255,255,255,.14)' },
  { label: 'Champagne', mode: 'Claro', value: 'theme-solarized', preview: 'linear-gradient(135deg, #fffdf7, #f4dfb8)', surface: 'rgba(255,255,255,.7)', chip: 'rgba(201,135,18,.13)', text: '#352b1d', accent: '#c98712', border: 'rgba(201,135,18,.28)' },
  { label: 'Ameixa', mode: 'Escuro', value: 'theme-dracula', preview: 'linear-gradient(135deg, #54375e, #1b1422)', surface: 'rgba(255,255,255,.1)', chip: 'rgba(255,111,181,.16)', text: '#fff7fd', accent: '#ff6fb5', border: 'rgba(255,111,181,.28)' },
  { label: 'Âmbar', mode: 'Claro', value: 'theme-gruvbox', preview: 'linear-gradient(135deg, #fffaf2, #edd2a9)', surface: 'rgba(255,255,255,.7)', chip: 'rgba(229,138,22,.13)', text: '#34291f', accent: '#e58a16', border: 'rgba(229,138,22,.28)' },
  { label: 'Gelo', mode: 'Claro', value: 'theme-nord', preview: 'linear-gradient(135deg, #f7feff, #d5edf5)', surface: 'rgba(255,255,255,.72)', chip: 'rgba(22,138,173,.12)', text: '#1d2d37', accent: '#168aad', border: 'rgba(22,138,173,.28)' },
  { label: 'Cereja', mode: 'Escuro', value: 'theme-monokai', preview: 'linear-gradient(135deg, #512c38, #1a1115)', surface: 'rgba(255,255,255,.1)', chip: 'rgba(255,55,95,.16)', text: '#fff7fa', accent: '#ff375f', border: 'rgba(255,55,95,.3)' },
  { label: 'Oceano', mode: 'Escuro', value: 'theme-onedark', preview: 'linear-gradient(135deg, #1e526d, #0b151d)', surface: 'rgba(255,255,255,.1)', chip: 'rgba(50,173,230,.16)', text: '#f4fbff', accent: '#32ade6', border: 'rgba(50,173,230,.3)' },
  { label: 'Meia-noite', mode: 'Escuro', value: 'theme-nightowl', preview: 'linear-gradient(135deg, #273d78, #090d1f)', surface: 'rgba(255,255,255,.1)', chip: 'rgba(94,139,255,.16)', text: '#f5f7ff', accent: '#5e8bff', border: 'rgba(94,139,255,.3)' },
  { label: 'Lavanda', mode: 'Claro', value: 'theme-palenight', preview: 'linear-gradient(135deg, #fffaff, #e7d5f5)', surface: 'rgba(255,255,255,.72)', chip: 'rgba(175,82,222,.12)', text: '#30233b', accent: '#af52de', border: 'rgba(175,82,222,.28)' }
]

function setTheme(theme) {
  if (props.setTheme) props.setTheme(theme)
}

const docTabs = ['Visão Geral', 'Funcionalidades', 'Sobre & Contato']
const docTab = ref('Visão Geral')

const toolCount = tools.length
const toolDocs = [
  { label: 'Timer', text: 'Contagem regressiva com atalhos e cronômetro com voltas. Continua contando com a janela fechada.' },
  { label: 'To-Do List', text: 'Tarefas com prioridade, filtros, edição e progresso.' },
  { label: 'Kanban', text: 'Quadro com colunas e cards arrastáveis, etiquetas coloridas e filtro.' },
  { label: 'Notas Rápidas', text: 'Notas coloridas que podem ser fixadas na área de trabalho.' },
  { label: 'Snippets', text: 'Trechos de código com destaque de sintaxe em 16 linguagens, busca e cópia.' },
  { label: 'Code Playground', text: 'HTML, CSS e JavaScript isolados, com console e execução automática.' },
  { label: 'JSON', text: 'Valida, formata, minifica, ordena chaves e gera tipos TypeScript.' },
  { label: 'Codificador', text: 'Base64, URL, HTML, leitura de JWT e hashes SHA.' },
  { label: 'Regex', text: 'Teste expressões com destaque, grupos e substituição.' },
  { label: 'Diff', text: 'Compara dois textos linha a linha.' },
  { label: 'Cores', text: 'Converte HEX, RGB e HSL, gera tons e mede contraste WCAG.' },
  { label: 'Timestamp', text: 'Converte Unix e datas e mostra fusos horários.' },
  { label: 'GitHub', text: 'Issues, PRs e commits dos seus repositórios.' },
  { label: 'Checklist de Deploy', text: 'Modelos prontos, reordenação, progresso e exportação.' },
  { label: 'Pomodoro', text: 'Foco, pausas curtas e longas, contagem diária e início automático.' },
  { label: 'Assistente IA', text: 'Converse com modelos da OpenAI, Anthropic, Google e outros usando sua chave.' },
  { label: 'Busca', text: 'Procura nos seus dados e abre pesquisas no Google, MDN, Stack Overflow e mais.' },
  { label: 'Lembrete de Água', text: 'Meta diária, registros rápidos e histórico da semana.' },
  { label: 'Gerador de Dados', text: 'Pessoas, CPF, CNPJ, UUID, senhas e mais, em lote, JSON ou CSV.' },
  { label: 'Player de Música', text: 'Lo-fi para focar, com suas próprias músicas e teclas de mídia.' },
  { label: 'Conversor de moedas', text: 'Cotações atualizadas entre dezenas de moedas.' }
]

// Backup manual em arquivo.
const dataMessage = ref('')
const dataError = ref(false)
const LOCAL_KEYS = ['dev-room-nome', 'dev-room-theme', 'dev-room-dock-order', 'dev-room-dock-hidden', 'dev-room-music']

function exportData() {
  const backup = { app: 'dev-room', version: 1, exportedAt: new Date().toISOString(), data: getDevRoomData(), local: {} }
  for (const key of LOCAL_KEYS) {
    const value = localStorage.getItem(key)
    if (value !== null) backup.local[key] = value
  }
  const blob = new Blob([JSON.stringify(backup, null, 2)], { type: 'application/json' })
  const url = URL.createObjectURL(blob)
  Object.assign(document.createElement('a'), { href: url, download: `dev-room-backup-${new Date().toISOString().slice(0, 10)}.json` }).click()
  URL.revokeObjectURL(url)
  dataError.value = false
  dataMessage.value = 'Backup baixado.'
}

async function importData(event) {
  const file = event.target.files[0]
  event.target.value = ''
  if (!file) return
  try {
    const backup = JSON.parse(await file.text())
    const data = backup?.app === 'dev-room' ? backup.data : backup
    if (!data || typeof data !== 'object' || Array.isArray(data)) throw new Error()
    if (!confirm('Restaurar este backup? Os dados atuais das ferramentas serão substituídos.')) return
    const { _clock, lastModified, ...content } = data
    setDevRoomData({ ...getDevRoomData(), ...content })
    for (const [key, value] of Object.entries(backup.local || {})) {
      if (LOCAL_KEYS.includes(key) && typeof value === 'string') localStorage.setItem(key, value)
    }
    dataError.value = false
    dataMessage.value = 'Backup restaurado. Recarregando…'
    setTimeout(() => window.location.reload(), 800)
  } catch {
    dataError.value = true
    dataMessage.value = 'Arquivo inválido. Use um backup exportado pelo Dev Room.'
  }
}
</script>
