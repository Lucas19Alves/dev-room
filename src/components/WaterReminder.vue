<script setup>
import { ref, computed, onMounted, onUnmounted } from "vue";
import { useFlowComponentStorage } from "../composables/useFlowComponentStorage";
import { playSound, notify } from "../utils/notify";
const { state: water } = useFlowComponentStorage("water", {
  config: { interval: 60, amount: 200 },
  history: [],
  next: null,
  running: false,
});
const now = ref(Date.now());
const today = computed(() =>
  water.value.history.filter(
    (i) =>
      new Date(i.time).toLocaleDateString() ===
      new Date(now.value).toLocaleDateString(),
  ),
);
const liters = computed(() =>
  (today.value.reduce((n, i) => n + i.amount, 0) / 1000).toFixed(1),
);
const remaining = computed(() => {
  const sec = Math.max(
    0,
    Math.ceil(((water.value.next || now.value) - now.value) / 1000),
  );
  return `${String(Math.floor(sec / 60)).padStart(2, "0")}:${String(sec % 60).padStart(2, "0")}`;
});
function normalize() {
  water.value.config.interval = Math.max(
    5,
    Math.min(180, Number(water.value.config.interval) || 60),
  );
  water.value.config.amount = Math.max(
    50,
    Math.min(1000, Number(water.value.config.amount) || 200),
  );
}
function schedule() {
  normalize();
  water.value.next = Date.now() + water.value.config.interval * 60000;
}
function toggle() {
  water.value.running = !water.value.running;
  if (water.value.running) schedule();
  else water.value.next = null;
}
function drink() {
  normalize();
  water.value.history.push({
    id: crypto.randomUUID(),
    time: new Date().toISOString(),
    amount: water.value.config.amount,
  });
  if (water.value.running) schedule();
}
let tick;
onMounted(() => {
  tick = setInterval(() => {
    now.value = Date.now();
    if (water.value.running && water.value.next <= now.value) {
      playSound("/sounds/notify.mp3");
      notify("Uma pausa para se hidratar");
      schedule();
    }
  }, 1000);
});
onUnmounted(() => clearInterval(tick));
</script>
<template>
  <div class="tool-body" id="water-reminder-main">
    <p class="tool-caption">Cuide de você enquanto cuida dos seus objetivos.</p>
    <div class="water-summary">
      <div class="water-symbol">♧</div>
      <div>
        <strong>{{ liters }} <small>L</small></strong
        ><span>registrados hoje neste Flow</span>
      </div>
    </div>
    <div class="tool-row">
      <label class="tool-field"
        >Porção (ml)<input
          v-model.number="water.config.amount"
          type="number"
          min="50"
          max="1000"
          step="50"
          @change="normalize" /></label
      ><label class="tool-field"
        >Lembrar a cada (min)<input
          v-model.number="water.config.interval"
          type="number"
          min="5"
          max="180"
          @change="
            normalize();
            water.running && schedule();
          "
      /></label>
    </div>
    <div class="tool-centered-actions">
      <button class="dark-button" @click="drink">
        ＋ Bebi {{ water.config.amount }} ml</button
      ><button class="outline" @click="toggle">
        {{ water.running ? "Pausar lembretes" : "Ativar lembretes" }}
      </button>
    </div>
    <p class="tool-hint">
      {{
        water.running
          ? `Próximo lembrete em ${remaining}`
          : "Lembretes pausados. Você pode registrar água a qualquer momento."
      }}
    </p>
    <div class="tool-divider"></div>
    <div class="tool-toolbar">
      <strong class="tool-section-label">Hoje</strong
      ><span class="tool-caption">{{ today.length }} registros</span>
    </div>
    <div
      v-for="(entry, index) in today"
      :key="entry.id || entry.time"
      class="tool-list-row"
    >
      <span>♧ &nbsp; {{ entry.amount }} ml</span
      ><small>{{
        new Date(entry.time).toLocaleTimeString("pt-BR", {
          hour: "2-digit",
          minute: "2-digit",
        })
      }}</small
      ><button
        class="tool-icon"
        aria-label="Remover registro de água"
        @click="water.history = water.history.filter((i) => i !== entry)"
      >
        ×
      </button>
    </div>
    <p v-if="!today.length" class="tool-empty compact">
      Seu primeiro copo pode ser agora.
    </p>
  </div>
</template>
