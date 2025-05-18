<template>
  <div class="flex flex-col items-center justify-center mx-auto p-6 min-w-[320px] max-w-[400px] w-full sm:items-start sm:justify-start">
    <h2 class="text-xl font-bold mb-4 text-blue-300">Temas</h2>
    <div class="grid grid-cols-2 gap-4 w-full">
      <button
        v-for="theme in themes"
        :key="theme.value"
        @click="setTheme(theme.value)"
        :class="[
          'rounded-lg p-4 flex flex-col items-center border-2 transition',
          currentTheme === theme.value
            ? 'border-blue-400 ring-2 ring-blue-300'
            : 'border-gray-700 hover:border-blue-400'
        ]"
      >
        <div
          class="w-10 h-10 rounded-full mb-2 border-2"
          :style="{ background: theme.preview, borderColor: theme.border }"
        ></div>
        <span class="text-sm font-semibold">{{ theme.label }}</span>
      </button>
    </div>
    <div class="mt-6 text-xs text-gray-400 text-center">
      O tema escolhido será aplicado em todo o ambiente e salvo para as próximas visitas.
    </div>
  </div>
</template>

<script setup>
import { ref, onMounted } from 'vue'

const THEME_KEY = 'dev-room-theme'
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

const currentTheme = ref('theme-default')

function setTheme(theme) {
  currentTheme.value = theme
  document.documentElement.className = theme
  localStorage.setItem(THEME_KEY, theme)
}

onMounted(() => {
  const saved = localStorage.getItem(THEME_KEY)
  if (saved) {
    currentTheme.value = saved
    document.documentElement.className = saved
  } else {
    setTheme('theme-default')
  }
})
</script>