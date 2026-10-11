<template>
  <!-- Container principal do player -->
  <div class="flex flex-col items-center justify-center w-full h-full p-4 min-w-[220px] min-h-[220px]"
    id="musicplayer-main">
    <!-- Título -->
    <h2 class="text-xl font-bold mb-4 text-green-300" id="musicplayer-title">Lo-Fi Player</h2>

    <!-- Informações da faixa atual -->
    <div class="w-full mb-2 text-center" id="musicplayer-track-info">
      <span class="font-semibold text-green-200" id="musicplayer-track-title">{{ currentTrack?.title || 'Nenhuma música'
      }}</span>
      <div class="text-xs text-gray-400" id="musicplayer-track-artist">{{ currentTrack?.artist || '' }}</div>
    </div>

    <!-- Elemento de áudio -->
    <audio ref="audio" :src="currentTrack?.src" @ended="onEnded" @timeupdate="onTimeUpdate"
      @loadedmetadata="onLoadedMetadata" @play="playing = true" @pause="playing = false" :autoplay="autoplay" id="musicplayer-audio"></audio>

    <!-- Barra de progresso -->
    <div class="w-full flex flex-col items-center mb-2" id="musicplayer-progress">
      <input type="range" min="0" :max="duration" step="0.1" v-model="currentTime" @input="seek"
        class="w-full accent-green-400" id="musicplayer-progress-bar" />
      <div class="flex justify-between w-full text-xs text-gray-400 mt-1" id="musicplayer-time-info">
        <span id="musicplayer-current-time">{{ formatTime(currentTime) }}</span>
        <span id="musicplayer-duration">{{ formatTime(duration) }}</span>
      </div>
    </div>

    <!-- Controle de volume -->
    <div class="flex items-center gap-2 w-full mb-2" id="musicplayer-volume">
      <font-awesome-icon icon="fa-solid fa-volume-low" class="text-green-400" />
      <input type="range" min="0" max="1" step="0.01" v-model.number="volume" @input="setVolume"
        class="flex-1 accent-green-400" id="musicplayer-volume-bar" />
      <font-awesome-icon icon="fa-solid fa-volume-high" class="text-green-400" />
    </div>

    <!-- Botões de controle do player -->
    <div class="flex gap-4 items-center justify-center mt-2" id="musicplayer-controls">
      <button @click="prev" title="Anterior" class="text-green-400 hover:text-green-200 text-xl"
        id="musicplayer-prev-btn">
        <font-awesome-icon icon="fa-solid fa-backward-step" />
      </button>
      <button @click="toggleShuffle" :class="shuffle ? 'text-yellow-400' : 'text-gray-400'" title="Aleatório"
        id="musicplayer-shuffle-btn">
        <font-awesome-icon icon="fa-solid fa-shuffle" />
      </button>
      <button @click="togglePlay"
        class="bg-green-500 hover:bg-green-600 text-white rounded-full w-12 h-12 flex items-center justify-center text-2xl shadow"
        id="musicplayer-play-btn">
        <font-awesome-icon :icon="playing ? 'fa-solid fa-pause' : 'fa-solid fa-play'" />
      </button>
      <button @click="toggleRepeat" :class="repeat ? 'text-yellow-400' : 'text-gray-400'" title="Repetir"
        id="musicplayer-repeat-btn">
        <font-awesome-icon icon="fa-solid fa-repeat" />
      </button>
      <button @click="next" title="Próxima" class="text-green-400 hover:text-green-200 text-xl"
        id="musicplayer-next-btn">
        <font-awesome-icon icon="fa-solid fa-forward-step" />
      </button>
    </div>

    <!-- Botão para adicionar música -->
    <div class="w-full flex justify-left">
      <label title="Adicionar músicas" for="file-input"
        class="bg-green-600 hover:bg-green-400 text-white px-2 py-1 rounded-full cursor-pointer text-md flex items-top gap-0.5">
        <font-awesome-icon icon="fa-solid fa-music" />
        <font-awesome-icon class="text-xs" icon="fa-solid fa-plus" />
      </label>
      <input id="file-input" type="file" accept="audio/*" multiple @change="handleFileUpload"
        class="hidden" />
    </div>

    <!-- Lista de faixas (playlist) -->
    <div class="mt-4 w-full flex-1 flex flex-col" id="musicplayer-playlist">
      <div class="flex justify-between items-center mb-1">
        <div class="text-xs text-gray-400" id="musicplayer-playlist-label">Playlist</div>
        <button v-if="uploadedTracks.length > 0" @click="clearUploadedTracks"
          class="text-xs text-green-800/50 hover:text-green-300" title="Remover músicas adicionadas">
          Limpar adicionadas
        </button>
      </div>
      <ul class="max-h-[120px] overflow-y-auto flex-1" id="musicplayer-playlist-list">
        <li v-for="(track, idx) in fullPlaylist" :key="track.id || track.src" @click="selectTrack(idx)" :class="[
          'cursor-pointer px-2 py-1 rounded transition flex items-center gap-2 text-sm',
          idx === currentIndex ? 'bg-green-900/60 text-green-200 font-semibold' : 'hover:bg-green-800/40'
        ]" :id="`musicplayer-track-${idx}`">
          <font-awesome-icon v-if="idx === currentIndex" icon="fa-solid fa-volume-high" class="text-xs" />
          <div class="flex-1 min-w-0">
            <div class="truncate">{{ track.title }}</div>
            <div class="text-xs text-gray-400 truncate">{{ track.artist }}</div>
          </div>
          <button v-if="track.isUploaded" @click.stop="removeUploadedTrack(track.id)"
            class="text-red-400 hover:text-red-300 text-xs ml-2" title="Remover música">
            <font-awesome-icon icon="fa-solid fa-xmark" />
          </button>
        </li>
      </ul>
    </div>
  </div>
</template>

<script setup>
import { ref, computed, watch, onMounted, onUnmounted, nextTick } from 'vue'

const defaultPlaylist = [
  {
    title: 'Cruising',
    artist: 'Aisake, Dosi',
    src: 'musics/Aisake, Dosi - Cruising [NCS Release].mp3',
    isUploaded: false
  },
  {
    title: 'apart',
    artist: 'Sumu',
    src: 'musics/sumu - apart [NCS Release].mp3',
    isUploaded: false
  },
  {
    title: 'Rainy Lofi City',
    artist: 'Kaveesha Senanayake',
    src: 'musics/rainy-lofi-city-lofi-music-332746.mp3',
    isUploaded: false
  },
  {
    title: 'Coffee Lofi',
    artist: 'Kaveesha Senanayake',
    src: 'musics/coffee-lofi-chill-lofi-music-332738.mp3',
    isUploaded: false
  },
  {
    title: 'Spring Lofi Vibes',
    artist: 'Kaveesha Senanayake',
    src: 'musics/spring-lofi-vibes-lofi-music-340019.mp3',
    isUploaded: false
  },
  {
    title: 'Sakura Lofi',
    artist: 'Kaveesha Senanayake',
    src: 'musics/sakura-lofi-ambient-lofi-music-340018.mp3',
    isUploaded: false
  }
]

const uploadedTracks = ref([])
const fullPlaylist = computed(() => [...defaultPlaylist, ...uploadedTracks.value])
const currentIndex = ref(0)
const currentTrack = computed(() => fullPlaylist.value[currentIndex.value])
const audio = ref(null)
const playing = ref(false)
const repeat = ref(false)
const shuffle = ref(false)
const duration = ref(0)
const currentTime = ref(0)
const autoplay = ref(false)
const volume = ref(0.7)
const wasPlayingBeforePause = ref(false)

// Função para lidar com upload de arquivos
async function handleFileUpload(event) {
  const files = Array.from(event.target.files)

  for (const file of files) {
    if (file.type.startsWith('audio/')) {
      const existingTrack = uploadedTracks.value.find(track => track.fileName === file.name)
      if (existingTrack) {
        continue 
      }
      const fileURL = URL.createObjectURL(file)
      const fileName = file.name.replace(/\.[^/.]+$/, "")
      let title = fileName
      let artist = 'Artista Desconhecido'
      if (fileName.includes(' - ')) {
        const parts = fileName.split(' - ')
        artist = parts[0].trim()
        title = parts[1].trim()
      }
      const newTrack = {
        id: Date.now() + Math.random(),
        title: title,
        artist: artist,
        src: fileURL,
        fileName: file.name,
        isUploaded: true
      }
      uploadedTracks.value.push(newTrack)
    }
  }
  event.target.value = ''
}

// Função para remover uma música adicionada.
function removeUploadedTrack(trackId) {
  const trackIndex = uploadedTracks.value.findIndex(track => track.id === trackId)
  if (trackIndex !== -1) {
    const track = uploadedTracks.value[trackIndex]
    if (track.src && track.src.startsWith('blob:')) {
      URL.revokeObjectURL(track.src)
    }
    uploadedTracks.value.splice(trackIndex, 1)
    const fullPlaylistIndex = defaultPlaylist.length + trackIndex
    if (currentIndex.value === fullPlaylistIndex) {
      if (fullPlaylist.value.length > 0) {
        currentIndex.value = Math.min(currentIndex.value, fullPlaylist.value.length - 1)
        autoplay.value = playing.value
      }
    } else if (currentIndex.value > fullPlaylistIndex) {
      currentIndex.value--
    }
  }
}

// Função para limpar todas as músicas adicinadas
function clearUploadedTracks() {
  uploadedTracks.value.forEach(track => {
    if (track.src && track.src.startsWith('blob:')) {
      URL.revokeObjectURL(track.src)
    }
  })

  uploadedTracks.value = []

  if (currentIndex.value >= defaultPlaylist.length) {
    currentIndex.value = 0
    autoplay.value = playing.value
  }
}

function play() {
  if (audio.value && currentTrack.value?.src) {
    audio.value.play().catch(() => { playing.value = false })
  }
}

function pause() {
  audio.value?.pause()
}

function togglePlay() {
  if (playing.value) {
    pause()
  } else {
    play()
  }
}

function prev() {
  if (audio.value && audio.value.currentTime > 2) {
    audio.value.currentTime = 0
    currentTime.value = 0
    return
  }
  if (shuffle.value) {
    playRandom()
    return
  }
  currentIndex.value = (currentIndex.value - 1 + fullPlaylist.value.length) % fullPlaylist.value.length
  autoplay.value = true
}

function next() {
  if (shuffle.value) {
    playRandom()
    return
  }
  if (currentIndex.value === fullPlaylist.value.length - 1) {
    if (repeat.value) {
      currentIndex.value = 0
      autoplay.value = true
    } else {
      pause()
    }
  } else {
    currentIndex.value = (currentIndex.value + 1) % fullPlaylist.value.length
    autoplay.value = true
  }
}

function playRandom() {
  let nextIdx
  do {
    nextIdx = Math.floor(Math.random() * fullPlaylist.value.length)
  } while (nextIdx === currentIndex.value && fullPlaylist.value.length > 1)
  currentIndex.value = nextIdx
  autoplay.value = true
}

function toggleRepeat() {
  repeat.value = !repeat.value
}

function toggleShuffle() {
  shuffle.value = !shuffle.value
}

function selectTrack(idx) {
  currentIndex.value = idx
  autoplay.value = true
}

function onEnded() {
  if (repeat.value) {
    audio.value.currentTime = 0
    play()
  } else {
    next()
  }
}

function onTimeUpdate() {
  if (audio.value) {
    currentTime.value = audio.value.currentTime
  }
}

function onLoadedMetadata() {
  if (audio.value) {
    duration.value = audio.value.duration
  }
}

function seek() {
  if (audio.value) {
    audio.value.currentTime = currentTime.value
  }
}

function formatTime(sec) {
  if (!sec || isNaN(sec)) return "00:00"
  const m = Math.floor(sec / 60)
  const s = Math.floor(sec % 60)
  return `${m.toString().padStart(2, '0')}:${s.toString().padStart(2, '0')}`
}

function setVolume() {
  if (audio.value) {
    audio.value.volume = volume.value
  }
}

watch([currentIndex, autoplay], ([, auto]) => {
  if (auto) {
    setTimeout(() => {
      play()
      autoplay.value = false
    }, 100)
  }
})

watch(volume, () => setVolume())

// Preferências locais do player.
const PREFS_KEY = 'dev-room-music'
try {
  const prefs = JSON.parse(localStorage.getItem(PREFS_KEY)) || {}
  if (Number.isFinite(prefs.volume)) volume.value = prefs.volume
  repeat.value = Boolean(prefs.repeat)
  shuffle.value = Boolean(prefs.shuffle)
  if (Number.isInteger(prefs.index) && prefs.index < defaultPlaylist.length) currentIndex.value = prefs.index
} catch {}
watch([volume, repeat, shuffle, currentIndex], () => {
  try { localStorage.setItem(PREFS_KEY, JSON.stringify({ volume: volume.value, repeat: repeat.value, shuffle: shuffle.value, index: currentIndex.value < defaultPlaylist.length ? currentIndex.value : 0 })) } catch {}
})

// Teclas de mídia do sistema e controles na tela de bloqueio.
function updateMediaSession() {
  if (!('mediaSession' in navigator) || !currentTrack.value) return
  navigator.mediaSession.metadata = new MediaMetadata({ title: currentTrack.value.title, artist: currentTrack.value.artist, album: 'Dev Room', artwork: [{ src: '/icons/icon-512x512.png', sizes: '512x512', type: 'image/png' }] })
}
watch(currentTrack, updateMediaSession)

function onBreakPause() {
  wasPlayingBeforePause.value = playing.value
  pause()
}
function onBreakResume() {
  if (wasPlayingBeforePause.value) play()
}

onMounted(async () => {
  await nextTick()
  setVolume()
  updateMediaSession()
  if ('mediaSession' in navigator) {
    const handlers = { play, pause, previoustrack: prev, nexttrack: next }
    for (const [action, handler] of Object.entries(handlers)) {
      try { navigator.mediaSession.setActionHandler(action, handler) } catch {}
    }
  }
  window.addEventListener('devroom-music-pause', onBreakPause)
  window.addEventListener('devroom-music-resume', onBreakResume)
})

onUnmounted(() => {
  uploadedTracks.value.forEach(track => {
    if (track.src && track.src.startsWith('blob:')) {
      URL.revokeObjectURL(track.src)
    }
  })

  window.removeEventListener('devroom-music-pause', onBreakPause)
  window.removeEventListener('devroom-music-resume', onBreakResume)
  if ('mediaSession' in navigator) {
    for (const action of ['play', 'pause', 'previoustrack', 'nexttrack']) {
      try { navigator.mediaSession.setActionHandler(action, null) } catch {}
    }
  }
})
</script>