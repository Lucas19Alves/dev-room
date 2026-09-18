<script setup>
import { ref, computed, onMounted, onUnmounted } from "vue";
import { useFlowComponentStorage } from "../composables/useFlowComponentStorage";
import { playSound, notify } from "../utils/notify";
import {
  formatClock,
  pauseCountdown,
  remainingSeconds,
  startCountdown,
} from "../flow/time.js";
const props = defineProps({
  storageKey: { type: String, default: "timer" },
  componentConfig: { type: Object, default: () => ({}) },
  flow: { type: Object, default: null },
});
const { state: timer } = useFlowComponentStorage(
  props.storageKey,
  {
    inputMinutes: 5,
    inputSeconds: 0,
    totalSeconds: 300,
    elapsed: 0,
    running: false,
    endTimestamp: null,
  },
  250,
  "timer",
);
const now = ref(Date.now()),
  message = ref("");
const remaining = computed(() => remainingSeconds(timer.value, now.value));
const format = computed(() => formatClock(remaining.value));
function configure() {
  timer.value.totalSeconds =
    Math.max(0, Math.min(999, Number(timer.value.inputMinutes) || 0)) * 60 +
    Math.max(0, Math.min(59, Number(timer.value.inputSeconds) || 0));
  timer.value.elapsed = 0;
  timer.value.running = false;
  timer.value.endTimestamp = null;
  message.value = "";
}
function toggle() {
  now.value = Date.now();
  if (timer.value.running) pauseCountdown(timer.value, now.value);
  else startCountdown(timer.value, now.value);
}
let tick;
onMounted(() => {
  tick = setInterval(() => {
    now.value = Date.now();
    if (timer.value.running && remaining.value === 0) {
      timer.value.running = false;
      timer.value.elapsed = timer.value.totalSeconds;
      message.value = "Tempo concluído. Um passo a mais na sua jornada.";
      playSound("/sounds/notify.mp3");
      notify("Tempo concluído!");
    }
  }, 250);
});
onUnmounted(() => clearInterval(tick));
</script>
<template>
  <div class="tool-body timer-tool" id="timer-main">
    <p class="tool-caption">Reserve um tempo para o que importa.</p>
    <div class="tool-timer-display" id="timer-display">{{ format }}</div>
    <form class="tool-row timer-settings" @submit.prevent="configure">
      <label class="tool-field"
        >Minutos<input
          v-model.number="timer.inputMinutes"
          type="number"
          min="0"
          max="999"
          aria-label="Minutos do temporizador" /></label
      ><span>:</span
      ><label class="tool-field"
        >Segundos<input
          v-model.number="timer.inputSeconds"
          type="number"
          min="0"
          max="59"
          aria-label="Segundos do temporizador" /></label
      ><button class="outline">Definir</button>
    </form>
    <div class="tool-centered-actions">
      <button
        class="dark-button"
        :disabled="!timer.totalSeconds"
        @click="toggle"
      >
        {{ timer.running ? "Ⅱ Pausar" : "▶ Iniciar temporizador" }}</button
      ><button
        class="outline"
        @click="
          timer.running = false;
          timer.elapsed = 0;
          message = '';
        "
      >
        Reiniciar
      </button>
    </div>
    <p v-if="message" class="tool-feedback" role="status">{{ message }}</p>
    <p v-else class="tool-hint">
      O tempo continua mesmo se você trocar de Flow.
    </p>
  </div>
</template>
