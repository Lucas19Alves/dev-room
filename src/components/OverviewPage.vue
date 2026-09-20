<script setup>
import { computed, ref } from "vue";
import {
  todayGroups,
  eventHistory,
  calendarEntries,
  dayKey,
  dayOffset,
  displayDate,
} from "../flow/overview.js";
import ExperienceActionList from "./experience/ExperienceActionList.vue";
const props = defineProps({
  view: String,
  flows: { type: Array, default: () => [] },
  now: Number,
  fullHistory: Boolean,
});
const emit = defineEmits(["open", "action", "discover", "plans"]);
const period = ref("week"),
  flowFilter = ref(""),
  calendarView = ref("week"),
  anchor = ref(dayKey());
const today = computed(() => todayGroups(props.flows, props.now));
const history = computed(() =>
  eventHistory(props.flows).filter((event) => {
    if (flowFilter.value && event.flowId !== flowFilter.value) return false;
    const after =
      period.value === "week"
        ? dayOffset(-7, props.now)
        : period.value === "month" || !props.fullHistory
          ? dayOffset(-30, props.now)
          : "";
    return !after || dayKey(event.timestamp) >= after;
  }),
);
const calendar = computed(() =>
  calendarEntries(props.flows, props.now).filter((entry) => {
    const key = dayKey(entry.date),
      start = anchor.value;
    if (flowFilter.value && entry.flowId !== flowFilter.value) return false;
    return calendarView.value === "today"
      ? key === start
      : calendarView.value === "month"
        ? key.slice(0, 7) === start.slice(0, 7)
        : key >= start &&
          key < dayOffset(7, new Date(`${start}T12:00:00`).getTime());
  }),
);
function moveCalendar(amount) {
  anchor.value = dayOffset(
    amount *
      (calendarView.value === "today"
        ? 1
        : calendarView.value === "week"
          ? 7
          : 30),
    new Date(`${anchor.value}T12:00:00`).getTime(),
  );
}
function open(id) {
  emit(
    "open",
    props.flows.find((flow) => flow.id === id),
  );
}
</script>
<template>
  <section class="overview-page">
    <header class="page-heading">
      <div>
        <p class="eyebrow">
          {{
            view === "today" ? displayDate(now) : "Seu caminho, com contexto"
          }}
        </p>
        <h1>
          {{
            view === "today"
              ? "O que merece sua atenção?"
              : view === "history"
                ? "O que mudou no seu caminho."
                : "Espaço para o que vem pela frente."
          }}
        </h1>
        <p>
          {{
            view === "today"
              ? "Os próximos movimentos dos seus Flows, juntos."
              : view === "history"
                ? "Candidaturas, estudos, decisões e pequenas conquistas."
                : "Prazos e compromissos dos seus Flows. As datas continuam no lugar de origem."
          }}
        </p>
      </div>
      <button
        v-if="!flows.length"
        class="dark-button"
        @click="emit('discover')"
      >
        Encontrar meu primeiro Flow ↗
      </button>
    </header>
    <template v-if="view === 'today'">
      <section
        v-for="group in today.filter(
          (group) => group.id === 'now' || group.actions.length,
        )"
        :key="group.id"
        class="overview-section"
        :class="{ 'overview-now': group.id === 'now' }"
      >
        <h2>{{ group.title }}</h2>
        <p class="section-intro">{{ group.description }}</p>
        <div
          v-for="action in group.actions"
          :key="`${action.flowId}:${action.id}`"
          class="overview-action"
        >
          <button class="flow-reference" @click="open(action.flowId)">
            <i :class="action.color"></i>{{ action.flowName }} ↗</button
          ><ExperienceActionList
            :actions="[action]"
            @action="(action, operation) => emit('action', action, operation)"
          />
        </div>
        <div v-if="!group.actions.length" class="overview-empty">
          <h3>
            {{
              flows.length
                ? "Nada urgente por aqui."
                : "Um objetivo é um bom começo."
            }}
          </h3>
          <p>
            {{
              flows.length
                ? "Retome um Flow para avançar no seu ritmo ou explore um novo objetivo."
                : "Escolha um ponto de partida ou crie algo do seu jeito."
            }}
          </p>
          <button
            class="outline"
            @click="
              flows.length
                ? open(flows.find((f) => !f.archivedAt)?.id)
                : emit('discover')
            "
          >
            {{ flows.length ? "Retomar um Flow" : "Descobrir Flows" }} ↗
          </button>
        </div>
      </section>
    </template>
    <template v-else-if="view === 'history'">
      <div class="overview-filters">
        <label
          >Período<select v-model="period">
            <option value="week">Esta semana</option>
            <option value="month">Este mês</option>
            <option v-if="fullHistory" value="all">Toda a jornada</option>
          </select></label
        ><label
          >Flow<select v-model="flowFilter">
            <option value="">Todos os Flows</option>
            <option v-for="flow in flows" :key="flow.id" :value="flow.id">
              {{ flow.identity.name }}
            </option>
          </select></label
        >
      </div>
      <ol v-if="history.length" class="event-timeline">
        <li v-for="event in history" :key="event.id">
          <span class="timeline-dot" :class="event.color"></span>
          <div>
            <time>{{ displayDate(event.timestamp, true) }}</time>
            <h3>{{ event.title }}</h3>
            <p v-if="event.detail">{{ event.detail }}</p>
            <button class="flow-reference" @click="open(event.flowId)">
              {{ event.flowName }} ↗
            </button>
          </div>
        </li>
      </ol>
      <div v-else class="overview-empty">
        <h2>Cada ação deixa uma história.</h2>
        <p>
          Conclua um próximo passo, registre uma prática ou revise um Flow para
          ver o caminho que você percorreu.
        </p>
        <button class="outline" @click="emit('discover')">
          Encontrar um objetivo ↗
        </button>
      </div>
      <p v-if="!fullHistory" class="subtle">
        Você está vendo os últimos 30 dias. Todo o histórico permanece guardado.
        <button class="text-button" @click="emit('plans')">
          Conhecer o Pro
        </button>
      </p>
    </template>
    <template v-else>
      <div class="overview-filters">
        <label
          >Visualização<select v-model="calendarView">
            <option value="today">Dia</option>
            <option value="week">Semana</option>
            <option value="month">Mês</option>
          </select></label
        ><label>A partir de<input v-model="anchor" type="date" /></label
        ><label
          >Flow<select v-model="flowFilter">
            <option value="">Todos os Flows</option>
            <option v-for="flow in flows" :key="flow.id" :value="flow.id">
              {{ flow.identity.name }}
            </option>
          </select></label
        >
      </div>
      <div class="calendar-navigation">
        <button
          class="outline"
          aria-label="Período anterior"
          @click="moveCalendar(-1)"
        >
          ←</button
        ><button class="outline" @click="anchor = dayKey(now)">Hoje</button
        ><button
          class="outline"
          aria-label="Próximo período"
          @click="moveCalendar(1)"
        >
          →
        </button>
      </div>
      <ol class="calendar-agenda">
        <li v-for="entry in calendar" :key="entry.id">
          <time>{{ displayDate(entry.date) }}</time>
          <div>
            <small>{{ entry.kind }}</small>
            <h3>{{ entry.title }}</h3>
            <button class="flow-reference" @click="open(entry.flowId)">
              {{ entry.flowName }} ↗
            </button>
          </div>
          <button
            class="outline"
            @click="
              entry.action
                ? emit('action', entry.action, { type: 'open' })
                : open(entry.flowId)
            "
          >
            Abrir
          </button>
        </li>
      </ol>
      <div v-if="!calendar.length" class="overview-empty">
        <h2>Um pouco de espaço neste período.</h2>
        <p>
          Quando você adicionar um prazo ou agendar um próximo passo em um Flow,
          ele aparecerá aqui.
        </p>
      </div>
    </template>
  </section>
</template>
<style scoped>
.overview-page {
  max-width: 1080px;
  margin: auto;
}
.overview-section {
  padding: 28px 0;
  border-top: 1px solid var(--noma-border);
  margin-top: 28px;
}
.overview-section h2 {
  font-size: 24px;
}
.section-intro {
  color: var(--noma-ink-soft);
  margin: 8px 0 22px;
}
.overview-now {
  border-top: 0;
}
.overview-action {
  margin: 18px 0;
}
.flow-reference {
  display: inline-flex;
  align-items: center;
  gap: 8px;
  text-align: left;
  color: var(--noma-brand);
  font-size: 14px;
  min-height: 40px;
  padding: 6px 0;
}
.flow-reference i,
.timeline-dot {
  width: 10px;
  height: 10px;
  border-radius: 50%;
  background: var(--noma-brand-soft);
}
.overview-empty {
  padding: 32px 0;
  max-width: 600px;
}
.overview-empty p {
  color: var(--noma-ink-soft);
  line-height: 1.7;
  margin: 12px 0 20px;
}
.overview-filters {
  display: flex;
  gap: 16px;
  flex-wrap: wrap;
  margin: 28px 0 16px;
}
.overview-filters label {
  display: grid;
  gap: 8px;
  font-size: 14px;
  flex: 1;
  min-width: 150px;
}
.event-timeline,
.calendar-agenda {
  list-style: none;
  padding: 0;
  margin: 28px 0;
}
.event-timeline li {
  display: flex;
  gap: 22px;
  position: relative;
  padding: 0 0 28px;
}
.event-timeline li:before {
  content: "";
  position: absolute;
  top: 16px;
  bottom: 0;
  left: 4px;
  width: 1px;
  background: var(--noma-border);
}
.timeline-dot {
  margin-top: 8px;
  flex-shrink: 0;
  background: var(--noma-success);
}
.event-timeline time {
  font-size: 13px;
  color: var(--noma-ink-soft);
}
.event-timeline h3 {
  margin: 7px 0;
  font-size: 18px;
}
.event-timeline p {
  color: var(--noma-ink-soft);
}
.calendar-navigation {
  display: flex;
  gap: 8px;
}
.calendar-agenda li {
  display: grid;
  grid-template-columns: 85px 1fr auto;
  gap: 20px;
  align-items: start;
  padding: 24px 0;
  border-bottom: 1px solid var(--noma-border);
}
.calendar-agenda small {
  color: var(--noma-ink-soft);
}
.calendar-agenda h3 {
  font-size: 18px;
  margin: 6px 0;
}
.calendar-agenda time {
  font-weight: 650;
  font-size: 16px;
}
@media (max-width: 650px) {
  .calendar-agenda li {
    grid-template-columns: 65px 1fr;
    gap: 12px;
  }
  .calendar-agenda li > .outline {
    grid-column: 2;
    justify-self: start;
  }
  .overview-filters {
    gap: 10px;
  }
  .overview-section {
    padding: 20px 0;
  }
  .page-heading h1 {
    font-size: 30px;
  }
}
</style>
