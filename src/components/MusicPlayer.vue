<script setup>
import { computed, nextTick, onMounted, onUnmounted, ref, watch } from "vue";
import { useFlowComponentStorage } from "../composables/useFlowComponentStorage";
import ToolLayout from "./ui/ToolLayout.vue";

const playlist = [
  [
    "Cruising",
    "Aisake, Dosi",
    "/musics/Aisake, Dosi - Cruising [NCS Release].mp3",
  ],
  ["apart", "Sumu", "/musics/sumu - apart [NCS Release].mp3"],
  [
    "Rainy Lofi City",
    "Kaveesha Senanayake",
    "/musics/rainy-lofi-city-lofi-music-332746.mp3",
  ],
  [
    "Coffee Lofi",
    "Kaveesha Senanayake",
    "/musics/coffee-lofi-chill-lofi-music-332738.mp3",
  ],
  [
    "Spring Lofi Vibes",
    "Kaveesha Senanayake",
    "/musics/spring-lofi-vibes-lofi-music-340019.mp3",
  ],
  [
    "Sakura Lofi",
    "Kaveesha Senanayake",
    "/musics/sakura-lofi-ambient-lofi-music-340018.mp3",
  ],
].map(([title, artist, src], index) => ({
  id: `default-${index}`,
  title,
  artist,
  src,
}));
const { state: settings } = useFlowComponentStorage("music", {
  currentIndex: 0,
  volume: 0.7,
  shuffle: false,
  repeat: false,
});
const uploaded = ref([]);
const tracks = computed(() => [...playlist, ...uploaded.value]);
const current = computed(
  () =>
    tracks.value[
      Math.min(settings.value.currentIndex, tracks.value.length - 1)
    ],
);
const audio = ref(null);
const playing = ref(false);
const duration = ref(0);
const currentTime = ref(0);
const notice = ref("");
const format = (seconds) =>
  `${String(Math.floor((Number(seconds) || 0) / 60)).padStart(2, "0")}:${String(Math.floor((Number(seconds) || 0) % 60)).padStart(2, "0")}`;
async function play() {
  try {
    await audio.value?.play();
    playing.value = true;
    notice.value = "";
  } catch {
    notice.value =
      "O navegador bloqueou a reprodução automática. Tente novamente.";
  }
}
function pause() {
  audio.value?.pause();
  playing.value = false;
}
function toggle() {
  playing.value ? pause() : play();
}
function select(index, shouldPlay = true) {
  settings.value.currentIndex = index;
  currentTime.value = 0;
  nextTick(() => shouldPlay && play());
}
function next() {
  const length = tracks.value.length;
  if (!length) return;
  const index =
    settings.value.shuffle && length > 1
      ? (settings.value.currentIndex +
          1 +
          Math.floor(Math.random() * (length - 1))) %
        length
      : (settings.value.currentIndex + 1) % length;
  select(index, playing.value || true);
}
function previous() {
  if (audio.value?.currentTime > 3) {
    audio.value.currentTime = 0;
    return;
  }
  select(
    (settings.value.currentIndex - 1 + tracks.value.length) %
      tracks.value.length,
    true,
  );
}
function ended() {
  if (settings.value.repeat) {
    audio.value.currentTime = 0;
    play();
  } else next();
}
function addFiles(event) {
  for (const file of event.target.files || []) {
    if (!file.type.startsWith("audio/")) continue;
    const src = URL.createObjectURL(file);
    uploaded.value.push({
      id: crypto.randomUUID(),
      title: file.name.replace(/\.[^.]+$/, ""),
      artist: "Arquivo deste dispositivo",
      src,
      uploaded: true,
    });
  }
  event.target.value = "";
}
function remove(track) {
  URL.revokeObjectURL(track.src);
  uploaded.value = uploaded.value.filter((item) => item.id !== track.id);
  if (settings.value.currentIndex >= tracks.value.length)
    settings.value.currentIndex = 0;
}
function seek() {
  if (audio.value) audio.value.currentTime = Number(currentTime.value);
}
function setVolume() {
  if (audio.value) audio.value.volume = Number(settings.value.volume);
}
const externalPause = () => pause();
onMounted(async () => {
  await nextTick();
  setVolume();
  window.addEventListener("noma-music-pause", externalPause);
});
onUnmounted(() => {
  window.removeEventListener("noma-music-pause", externalPause);
  uploaded.value.forEach((track) => URL.revokeObjectURL(track.src));
});
watch(() => settings.value.volume, setVolume);
</script>
<template>
  <ToolLayout caption="Uma trilha para entrar no ritmo." id="musicplayer-main">
    <div class="music-current">
      <div class="music-cover">♫</div>
      <div>
        <small>TOCANDO AGORA</small
        ><strong>{{ current?.title || "Nenhuma faixa" }}</strong
        ><span>{{ current?.artist }}</span>
      </div>
    </div>
    <audio
      ref="audio"
      :src="current?.src"
      @ended="ended"
      @timeupdate="currentTime = $event.target.currentTime"
      @loadedmetadata="duration = $event.target.duration"
      @error="notice = 'Não foi possível carregar esta faixa.'"
    ></audio>
    <label class="music-progress"
      ><span class="sr-only">Posição da faixa</span
      ><input
        v-model.number="currentTime"
        type="range"
        min="0"
        :max="duration || 0"
        step="0.1"
        @input="seek"
      /><small>{{ format(currentTime) }}</small
      ><small>{{ format(duration) }}</small></label
    >
    <div class="music-controls">
      <button
        :class="{ active: settings.shuffle }"
        :aria-pressed="settings.shuffle"
        aria-label="Alternar modo aleatório"
        @click="settings.shuffle = !settings.shuffle"
      >
        ⌘</button
      ><button aria-label="Faixa anterior" @click="previous">◀</button
      ><button
        class="music-play"
        :aria-label="playing ? 'Pausar' : 'Reproduzir'"
        @click="toggle"
      >
        {{ playing ? "Ⅱ" : "▶" }}</button
      ><button aria-label="Próxima faixa" @click="next">▶</button
      ><button
        :class="{ active: settings.repeat }"
        :aria-pressed="settings.repeat"
        aria-label="Alternar repetição"
        @click="settings.repeat = !settings.repeat"
      >
        ↻
      </button>
    </div>
    <label class="music-volume"
      ><span>Volume</span
      ><input
        v-model.number="settings.volume"
        type="range"
        min="0"
        max="1"
        step="0.01"
        aria-label="Volume"
    /></label>
    <div class="music-playlist">
      <div class="tool-toolbar">
        <strong class="tool-section-label">Playlist</strong
        ><label class="outline file-control"
          >＋ Adicionar áudio<input
            type="file"
            accept="audio/*"
            multiple
            aria-label="Adicionar músicas"
            @change="addFiles"
        /></label>
      </div>
      <button
        v-for="(track, index) in tracks"
        :key="track.id"
        class="music-track"
        :class="{ selected: index === settings.currentIndex }"
        @click="select(index)"
      >
        <span>{{ index === settings.currentIndex && playing ? "♪" : "♫" }}</span
        ><span
          ><strong>{{ track.title }}</strong
          ><small>{{ track.artist }}</small></span
        ><span
          v-if="track.uploaded"
          class="tool-icon"
          role="button"
          tabindex="0"
          :aria-label="`Remover ${track.title}`"
          @click.stop="remove(track)"
          @keydown.enter.stop="remove(track)"
          >×</span
        >
      </button>
    </div>
    <p v-if="notice" class="tool-feedback" role="status">{{ notice }}</p>
  </ToolLayout>
</template>
