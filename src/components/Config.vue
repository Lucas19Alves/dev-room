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
            <b>CentralOS</b> é seu ambiente digital para produtividade, organização e foco, feito especialmente para devs!
          </div>
          <ul class="list-disc ml-5 mt-2 space-y-1" id="config-doc-intro-list">
            <li>
              <b>Widgets modulares:</b> To-Do, Notas rápidas, Pomodoro, Timer, Snippets, Checklist de Deploy, Lembrete de água, Player de música, Gerador de dados fake e Busca inteligente.
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
            <a href="https://github.com/Lucas19Alves/CentralOS" target="_blank" class="hover:underline text-pink-200 flex items-center gap-2 text-sm font-mono" id="config-doc-about-project-github">
              <font-awesome-icon icon="fa-brands fa-github" />
              Repositório do CentralOS
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
            <li><b>Code Playground:</b> Experimente HTML, CSS e JavaScript em um ambiente isolado.</li>
            <li><b>Checklist de Deploy:</b> Lista de verificação para garantir um deploy seguro. Personalize seus itens.</li>
            <li><b>Pomodoro:</b> Técnica de produtividade baseada em ciclos de foco e pausa.</li>
            <li><b>Lembrete de Água:</b> Defina intervalos para ser lembrado de beber água.</li>
            <li><b>Busca:</b> Pesquise rapidamente entre suas notas, tarefas e códigos.</li>
            <li><b>Temas:</b> Personalize as cores e o visual do CentralOS.</li>
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
            <a href="https://github.com/Lucas19Alves/CentralOS" target="_blank" class="hover:underline text-pink-200 flex items-center gap-2 text-sm font-mono" id="config-doc-about-project-github">
              <font-awesome-icon icon="fa-brands fa-github" />
              Repositório do CentralOS
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
