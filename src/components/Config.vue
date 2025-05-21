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
          class="rounded-lg p-2 flex flex-col items-center border-2 border-solid transition"
          :style="{
            borderColor: currentTheme === theme.value ? 'var(--accent)' : theme.border,
            background: theme.preview,
            color: currentTheme === theme.value ? 'var(--accent)' : '#fff',
            touchAction: 'manipulation'
          }"
          @click="setTheme(theme.value)"
          :id="`config-theme-btn-${theme.value}`"
          tabindex="0"
        >
          <span class="font-bold text-xs mb-1 flex items-center gap-1" :id="`config-theme-label-${theme.value}`">
            {{ theme.label }}
            <font-awesome-icon
              v-if="currentTheme === theme.value"
              icon="fa-solid fa-check"
              class="text-green-300 ml-1"
              :id="`config-theme-check-${theme.value}`"
            />
          </span>
        </button>
      </div>
      <div class="mt-2 text-xs text-gray-400 text-center" id="config-theme-info">
        O tema escolhido será aplicado em todo o ambiente e salvo para as próximas visitas.
      </div>
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
              <b>Widgets modulares:</b> To-Do, Notas rápidas, Pomodoro, Timer, Snippets, Checklist de Deploy, Lembrete de água, Player de música, Gerador de dados fake e Busca inteligente.
            </li>
            <li>
              <b>Personalização:</b> Escolha entre <span class="font-bold text-pink-300">10+ temas</span> e deixe o ambiente com a sua cara.
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
              github.com/Lucas19Alves/dev-room
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
            <li><b>Timer:</b> Cronômetro simples para medir tempo de atividades. Continua mesmo se a janela for fechada.</li>
            <li><b>To-Do List:</b> Lista de tarefas com salvamento automático. Marque, edite ou exclua tarefas.</li>
            <li><b>Notas Rápidas:</b> Bloco para anotações rápidas, ideias ou lembretes. Fixe ou desafixe notas.</li>
            <li><b>Snippets de Código:</b> Salve e consulte trechos de código úteis.</li>
            <li><b>Checklist de Deploy:</b> Lista de verificação para garantir um deploy seguro. Personalize seus itens.</li>
            <li><b>Pomodoro:</b> Técnica de produtividade baseada em ciclos de foco e pausa.</li>
            <li><b>Lembrete de Água:</b> Defina intervalos para ser lembrado de beber água.</li>
            <li><b>Busca:</b> Pesquise rapidamente entre suas notas, tarefas e códigos.</li>
            <li><b>Temas:</b> Personalize as cores e o visual do Dev Room.</li>
            <li><b>Player de Música:</b> Ouça músicas para relaxar ou focar durante o trabalho.</li>
            <li><b>Gerador de Dados:</b> Gere dados fake para testes de desenvolvimento.</li>
          </ul>
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
              github.com/Lucas19Alves/dev-room
            </a>
          </div>
        </div>
      </div>
    </section>
  </div>
</template>

<script setup>
import { ref, watch } from 'vue'

const props = defineProps({
  setTheme: Function,
  currentTheme: String,
  nome: String,
  setNome: Function
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
  {
    label: 'Padrão',
    value: 'theme-default',
    preview: 'linear-gradient(135deg, #1e293b 60%, #2563eb 100%)',
    border: '#2563eb'
  },
  {
    label: 'Dark',
    value: 'theme-dark',
    preview: 'linear-gradient(135deg, #111827 60%, #374151 100%)',
    border: '#374151'
  },
  {
    label: 'Solarized',
    value: 'theme-solarized',
    preview: 'linear-gradient(135deg, #002b36 60%, #b58900 100%)',
    border: '#b58900'
  },
  {
    label: 'Dracula',
    value: 'theme-dracula',
    preview: 'linear-gradient(135deg, #282a36 60%, #bd93f9 100%)',
    border: '#bd93f9'
  },
  {
    label: 'Gruvbox',
    value: 'theme-gruvbox',
    preview: 'linear-gradient(135deg, #282828 60%, #fabd2f 100%)',
    border: '#fabd2f'
  },
  {
    label: 'Nord',
    value: 'theme-nord',
    preview: 'linear-gradient(135deg, #2e3440 60%, #88c0d0 100%)',
    border: '#88c0d0'
  },
  {
    label: 'Monokai',
    value: 'theme-monokai',
    preview: 'linear-gradient(135deg, #272822 60%, #f92672 100%)',
    border: '#f92672'
  },
  {
    label: 'One Dark',
    value: 'theme-onedark',
    preview: 'linear-gradient(135deg, #282c34 60%, #61afef 100%)',
    border: '#61afef'
  },
  {
    label: 'Night Owl',
    value: 'theme-nightowl',
    preview: 'linear-gradient(135deg, #011627 60%, #82aaff 100%)',
    border: '#82aaff'
  },
  {
    label: 'Palenight',
    value: 'theme-palenight',
    preview: 'linear-gradient(135deg, #292d3e 60%, #c792ea 100%)',
    border: '#c792ea'
  }
]

function setTheme(theme) {
  if (props.setTheme) props.setTheme(theme)
}

const docTabs = ['Visão Geral', 'Funcionalidades', 'Sobre & Contato']
const docTab = ref('Visão Geral')

const allData = getDevRoomData()
const nome = ref(allData.nome || '')
const tema = ref(allData.tema || 'theme-default')

watch(nome, (val) => {
  const data = getDevRoomData()
  data.nome = val
  setDevRoomData(data)
})
watch(tema, (val) => {
  const data = getDevRoomData()
  data.tema = val
  setDevRoomData(data)
})
</script>