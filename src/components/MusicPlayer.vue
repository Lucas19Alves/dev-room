<template>
  <!-- Container principal do player -->
  <div class="flex flex-col items-center justify-center w-full h-full p-4 min-w-[220px] min-h-[220px]" id="musicplayer-main">
    <!-- Título -->
    <h2 class="text-xl font-bold mb-4 text-green-300" id="musicplayer-title">Lo-Fi Player</h2>
    <!-- Informações da faixa atual -->
    <div class="w-full mb-2 text-center" id="musicplayer-track-info">
      <span class="font-semibold text-green-200" id="musicplayer-track-title">{{ currentTrack.title }}</span>
      <div class="text-xs text-gray-400" id="musicplayer-track-artist">{{ currentTrack.artist }}</div>
    </div>
    <!-- Elemento de áudio -->
    <audio
      ref="audio"
      :src="currentTrack.src"
      @ended="onEnded"
      @timeupdate="onTimeUpdate"
      @loadedmetadata="onLoadedMetadata"
      :autoplay="autoplay"
      id="musicplayer-audio"
    ></audio>
    <!-- Barra de progresso -->
    <div class="w-full flex flex-col items-center mb-2" id="musicplayer-progress">
      <input
        type="range"
        min="0"
        :max="duration"
        step="0.1"
        v-model="currentTime"
        @input="seek"
        class="w-full accent-green-400"
        id="musicplayer-progress-bar"
      />
      <div class="flex justify-between w-full text-xs text-gray-400 mt-1" id="musicplayer-time-info">
        <span id="musicplayer-current-time">{{ formatTime(currentTime) }}</span>
        <span id="musicplayer-duration">{{ formatTime(duration) }}</span>
      </div>
    </div>
    <!-- Controle de volume -->
    <div class="flex items-center gap-2 w-full mb-2" id="musicplayer-volume">
      <font-awesome-icon icon="fa-solid fa-volume-low" class="text-green-400" />
      <input
        type="range"
        min="0"
        max="1"
        step="0.01"
        v-model.number="volume"
        @input="setVolume"
        class="flex-1 accent-green-400"
        id="musicplayer-volume-bar"
      />
      <font-awesome-icon icon="fa-solid fa-volume-high" class="text-green-400" />
    </div>
    <!-- Botões de controle do player -->
    <div class="flex gap-4 items-center justify-center mt-2" id="musicplayer-controls">
      <button @click="prev" title="Anterior" class="text-green-400 hover:text-green-200 text-xl" id="musicplayer-prev-btn">
        <font-awesome-icon icon="fa-solid fa-backward-step" />
      </button>
      <button @click="toggleShuffle" :class="shuffle ? 'text-yellow-400' : 'text-gray-400'" title="Aleatório" id="musicplayer-shuffle-btn">
        <font-awesome-icon icon="fa-solid fa-shuffle" />
      </button>
      <button @click="togglePlay" class="bg-green-500 hover:bg-green-600 text-white rounded-full w-12 h-12 flex items-center justify-center text-2xl shadow" id="musicplayer-play-btn">
        <font-awesome-icon :icon="playing ? 'fa-solid fa-pause' : 'fa-solid fa-play'" />
      </button>
      <button @click="toggleRepeat" :class="repeat ? 'text-yellow-400' : 'text-gray-400'" title="Repetir" id="musicplayer-repeat-btn">
        <font-awesome-icon icon="fa-solid fa-repeat" />
      </button>
      <button @click="next" title="Próxima" class="text-green-400 hover:text-green-200 text-xl" id="musicplayer-next-btn">
        <font-awesome-icon icon="fa-solid fa-forward-step" />
      </button>
    </div>
    <!-- Lista de faixas (playlist) -->
    <div class="mt-4 w-full flex-1 flex flex-col" id="musicplayer-playlist">
      <div class="text-xs text-gray-400 mb-1" id="musicplayer-playlist-label">Playlist Lo-Fi</div>
      <ul class="max-h-[120px] overflow-y-auto flex-1" id="musicplayer-playlist-list">
        <li
          v-for="(track, idx) in playlist"
          :key="track.src"
          @click="selectTrack(idx)"
          :class="[
            'cursor-pointer px-2 py-1 rounded transition flex items-center gap-2',
            idx === currentIndex ? 'bg-green-900/60 text-green-200 font-semibold' : 'hover:bg-green-800/40'
          ]"
          :id="`musicplayer-track-${idx}`"
        >
          <font-awesome-icon v-if="idx === currentIndex" icon="fa-solid fa-volume-high" />
          {{ track.title }} <span class="text-xs text-gray-400">- {{ track.artist }}</span>
        </li>
      </ul>
    </div>
  </div>
</template>

<script setup>
import { ref, computed, watch, onMounted, onUnmounted } from 'vue'

const playlist = [
  {
    title: 'Cruising',
    artist: 'Aisake, Dosi',
    src: 'musics/Aisake, Dosi - Cruising [NCS Release].mp3'
  },
  {
    title: 'apart',
    artist: 'Sumu',
    src: 'musics/sumu - apart [NCS Release].mp3'
  },
  {
    title: 'Rainy Lofi CIty',
    artist:'Kaveesha Senanayake',
    src: 'musics/rainy-lofi-city-lofi-music-332746.mp3'
  },
  {
    title: 'Coffee Lofi',
    artist: 'Kaveesha Senanayake',
    src: 'musics/coffee-lofi-chill-lofi-music-332738.mp3'
  },
  {
    title: 'Spring Lofi Vibes',
    artist: 'Kaveesha Senanayake',
    src: 'musics/spring-lofi-vibes-lofi-music-340019.mp3'
  },
  {
    title: 'Sakura Lofi',
    artist: 'Kaveesha Senanayake',
    src: 'musics/sakura-lofi-ambient-lofi-music-340018.mp3'
  }
]

const currentIndex = ref(0)
const currentTrack = computed(() => playlist[currentIndex.value])
const audio = ref(null)
const playing = ref(false)
const repeat = ref(false)
const shuffle = ref(false)
const duration = ref(0)
const currentTime = ref(0)
const autoplay = ref(false)
const volume = ref(0.7)

// Flag para saber se estava tocando antes do modo pausa global
const wasPlayingBeforePause = ref(false)

function play() {
  if (audio.value) {
    audio.value.play()
    playing.value = true
  }
}
function pause() {
  if (audio.value) {
    audio.value.pause()
    playing.value = false
  }
}
function togglePlay() {
  if (playing.value) {
    pause()
  } else {
    play()
  }
}
function prev() {
  if (audio.value.currentTime > 2) {
    audio.value.currentTime = 0
    currentTime.value = 0
    return
  }
  if (shuffle.value) {
    playRandom()
    return
  }
  currentIndex.value = (currentIndex.value - 1 + playlist.length) % playlist.length
  autoplay.value = true
}
function next() {
  if (shuffle.value) {
    playRandom()
    return
  }
  if (currentIndex.value === playlist.length - 1) {
    if (repeat.value) {
      currentIndex.value = 0
      autoplay.value = true
    } else {
      pause()
    }
  } else {
    currentIndex.value = (currentIndex.value + 1) % playlist.length
    autoplay.value = true
  }
}
function playRandom() {
  let nextIdx
  do {
    nextIdx = Math.floor(Math.random() * playlist.length)
  } while (nextIdx === currentIndex.value && playlist.length > 1)
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
onMounted(() => {
  pause()
  setVolume()
  window.addEventListener('devroom-music-pause', () => {
    // Salva se estava tocando antes do modo pausa
    wasPlayingBeforePause.value = playing.value
    pause()
  })
  window.addEventListener('devroom-music-resume', () => {
    // Só volta a tocar se estava tocando antes do modo pausa
    if (wasPlayingBeforePause.value) {
      play()
    }
  })
})

onUnmounted(() => {
  window.removeEventListener('devroom-music-pause', pause)
  window.removeEventListener('devroom-music-resume', play)
})
</script>