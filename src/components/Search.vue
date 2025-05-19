<template>
  <div class="flex flex-col h-full w-full p-4">
    <form @submit.prevent="searchBing" class="flex gap-2 mb-3">
      <input
        v-model="query"
        type="text"
        placeholder="Pesquisar no Bing..."
        class="flex-1 px-3 py-2 rounded bg-gray-800 text-gray-100 border border-gray-700 focus:outline-none"
      />
      <button
        type="submit"
        class="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded transition"
      >
        Buscar
      </button>
    </form>
    <div class="flex-1 w-full overflow-hidden rounded border border-gray-700 flex">
      <iframe
        v-if="iframeUrl"
        :src="iframeUrl"
        class="w-full h-full flex-1"
        width="100%"
        height="100%"
        referrerpolicy="no-referrer"
        style="border:0;"
      ></iframe>
      <div v-else class="flex items-center justify-center w-full h-full text-gray-400">
        Digite algo para pesquisar no Bing.
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref } from 'vue'

const query = ref('')
const iframeUrl = ref('')

function searchBing() {
  if (query.value.trim() !== '') {
    iframeUrl.value = `https://www.bing.com/search?q=${encodeURIComponent(query.value)}`
  }
}
</script>