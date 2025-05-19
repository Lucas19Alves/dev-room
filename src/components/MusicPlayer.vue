<template>
  <div class="flex flex-col items-center justify-center w-full h-auto p-2 sm:p-4 min-w-[220px] min-h-[320px] max-w-lg mx-auto">
    <div class="w-full mb-2 text-center min-h-[40px]">
      <span class="font-semibold text-green-200 block truncate">{{ currentTrack.title }}</span>
      <div class="text-xs text-gray-400 truncate">{{ currentTrack.artist }}</div>
    </div>
    <div v-if="currentTrack.youtubeId" class="w-full mb-0">
      <iframe
        :src="`https://www.youtube.com/embed/${currentTrack.youtubeId}?autoplay=1&controls=1`"
        frameborder="0"
        allow="autoplay; encrypted-media"
        allowfullscreen
        class="w-full h-48 sm:h-56 rounded"
      ></iframe>
    </div>
    <!-- Botões de navegação -->
    <div class="flex gap-4 justify-center mt-2 mb-2">
      <button
        @click="prevTrack"
        :disabled="playlist.length <= 1"
        class="bg-green-800 hover:bg-green-700 text-white px-3 py-1 rounded disabled:opacity-50"
      >
        ◀ Anterior
      </button>
      <button
        @click="nextTrack"
        :disabled="playlist.length <= 1"
        class="bg-green-800 hover:bg-green-700 text-white px-3 py-1 rounded disabled:opacity-50"
      >
        Próxima ▶
      </button>
    </div>
    <form @submit.prevent="addTrack" class="flex gap-2 mb-2 w-full flex-col sm:flex-row">
      <input
        v-model="newUrl"
        type="url"
        placeholder="Cole o link do YouTube aqui"
        class="flex-1 px-2 py-1 rounded bg-green-950 text-green-100 border border-green-700"
        required
      />
      <button type="submit" class="bg-green-700 hover:bg-green-600 text-white px-3 py-1 rounded w-full sm:w-auto">Adicionar</button>
    </form>
    <div class="mt-4 w-full flex-1 flex flex-col">
      <div class="text-xs text-gray-400 mb-1">Playlist YouTube</div>
      <ul class="max-h-[180px] overflow-y-auto flex-1">
        <li
          v-for="(track, idx) in playlist"
          :key="track.youtubeId"
          @click="selectTrack(idx)"
          :class="[
            'cursor-pointer px-2 py-1 rounded transition flex items-center gap-2',
            idx === currentIndex ? 'bg-green-900/60 text-green-200 font-semibold' : 'hover:bg-green-800/40'
          ]"
        >
          <font-awesome-icon v-if="idx === currentIndex" icon="fa-brands fa-youtube" class="text-red-500" />
          <span class="truncate">{{ track.title }}</span>
        </li>
      </ul>
    </div>
  </div>
</template>

<script setup>
import { ref, computed } from 'vue'

function extractYoutubeId(url) {
  // Suporta links do tipo: https://www.youtube.com/watch?v=ID ou https://youtu.be/ID
  const regExp = /(?:youtube\.com.*(?:\?|&)v=|youtu\.be\/)([a-zA-Z0-9_-]{11})/
  const match = url.match(regExp)
  return match ? match[1] : ''
}

async function fetchYoutubeTitle(youtubeId) {
  // Utiliza o endpoint oEmbed do YouTube para obter o título do vídeo
  try {
    const res = await fetch(`https://www.youtube.com/oembed?url=https://www.youtube.com/watch?v=${youtubeId}&format=json`)
    if (!res.ok) throw new Error('Erro ao buscar título')
    const data = await res.json()
    return data.title
  } catch {
    return 'Vídeo do YouTube'
  }
}

const playlist = ref([
  {
    title: 'Lofi hip hop radio - beats to relax/study to',
    artist: '',
    youtubeId: 'jfKfPfyJRdk'
  }
])

const currentIndex = ref(0)
const currentTrack = computed(() => playlist.value[currentIndex.value] || {})

const newUrl = ref('')

async function addTrack() {
  const id = extractYoutubeId(newUrl.value)
  if (!id) return
  const title = await fetchYoutubeTitle(id)
  playlist.value.push({
    title,
    artist: '',
    youtubeId: id
  })
  newUrl.value = ''
}

function selectTrack(idx) {
  currentIndex.value = idx
}

function nextTrack() {
  if (playlist.value.length === 0) return
  currentIndex.value = (currentIndex.value + 1) % playlist.value.length
}

function prevTrack() {
  if (playlist.value.length === 0) return
  currentIndex.value =
    (currentIndex.value - 1 + playlist.value.length) % playlist.value.length
}
</script>
