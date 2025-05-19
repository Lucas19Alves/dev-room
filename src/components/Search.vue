<template>
  <!-- Container principal da busca -->
  <div class="flex flex-col h-full w-full p-4" id="search-main">
    <!-- Formulário de busca -->
    <form @submit.prevent="searchBing" class="flex gap-2 mb-3" id="search-form">
      <input
        v-model="query"
        type="text"
        placeholder="Pesquisar no Bing..."
        class="flex-1 px-3 py-2 rounded bg-gray-800 text-gray-100 border border-gray-700 focus:outline-none"
        id="search-input"
      />
      <button
        type="submit"
        class="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded transition"
        id="search-btn"
      >
        Buscar
      </button>
    </form>
    <!-- Área de resultados -->
    <div class="flex-1 w-full overflow-hidden rounded border border-gray-700 flex" id="search-results">
      <!-- Iframe com resultados do Bing -->
      <iframe
        v-if="iframeUrl"
        :src="iframeUrl"
        class="w-full h-full flex-1"
        width="100%"
        height="100%"
        referrerpolicy="no-referrer"
        style="border:0;"
        id="search-iframe"
      ></iframe>
      <!-- Mensagem inicial -->
      <div v-else class="flex items-center justify-center w-full h-full text-gray-400" id="search-placeholder">
        Digite algo para pesquisar no Bing.
      </div>
    </div>
  </div>
</template>

<script setup>
// Importações e estados reativos principais
import { ref } from 'vue'

const query = ref('')
const iframeUrl = ref('')

// Realiza a busca no Bing ao submeter o formulário
function searchBing() {
  if (query.value.trim() !== '') {
    iframeUrl.value = `https://www.bing.com/search?q=${encodeURIComponent(query.value)}`
  }
}
</script>