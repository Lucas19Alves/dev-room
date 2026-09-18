<script setup>
import { computed } from "vue";
import { reviewStatus } from "../../flow/runtime.js";
import ExperienceActionList from "./ExperienceActionList.vue";
import ExperienceItems from "./ExperienceItems.vue";
import "./experience.css";

const props = defineProps({
  flow: { type: Object, required: true },
  update: { type: Object, default: null },
  experience: { type: Object, required: true },
});
const emit = defineEmits(["review", "action"]);
const review = computed(() => reviewStatus(props.flow));
const section = (label) =>
  props.experience.sections.secondary.find((item) => item.label === label) || {
    label,
    title: label,
    items: [],
  };
const priorities = computed(() => section("3 PRIORIDADES DA SEMANA"));
const nextDays = computed(() => section("PRÓXIMOS DIAS"));
const inbox = computed(() => section("INBOX"));
const protectedTime = computed(() => section("TEMPO PROTEGIDO"));
</script>

<template>
  <main class="specialized-experience week-experience">
    <header class="specialized-experience__hero">
      <div>
        <span class="eyebrow">{{ experience.sections.hero.eyebrow }}</span>
        <h2>{{ experience.sections.hero.title }}</h2>
        <p>{{ flow.context?.summary || flow.objective }}</p>
      </div>
      <div class="specialized-experience__review">
        <span :class="{ due: review.due }">{{
          review.due
            ? "Hora de revisar a semana"
            : `Revisão em ${review.days} dias`
        }}</span
        ><button class="outline" @click="emit('review')">Revisar semana</button>
      </div>
    </header>

    <section
      class="specialized-experience__section specialized-experience__section--accent week-experience__today"
    >
      <div class="specialized-experience__heading">
        <div>
          <span class="eyebrow">HOJE</span>
          <h3>Uma coisa que cabe agora</h3>
        </div>
      </div>
      <ExperienceActionList
        :actions="experience.actions"
        empty-title="Hoje está aberto."
        @action="(action, operation) => emit('action', action, operation)"
      />
    </section>
    <section
      class="specialized-experience__section week-experience__priorities"
    >
      <div class="specialized-experience__heading">
        <div>
          <span class="eyebrow">3 PRIORIDADES DA SEMANA</span>
          <h3>O que merece caber</h3>
        </div>
        <span class="specialized-experience__count">até três</span>
      </div>
      <ExperienceItems :items="priorities.items" :cards="true" />
    </section>
    <section class="specialized-experience__section week-experience__next">
      <div>
        <span class="eyebrow">PRÓXIMOS DIAS</span>
        <h3>Compromissos já visíveis</h3>
      </div>
      <ExperienceItems :items="nextDays.items" />
    </section>
    <div class="week-experience__lower">
      <section class="specialized-experience__section">
        <span class="eyebrow">INBOX</span>
        <h3>O que ainda precisa de um lugar</h3>
        <ExperienceItems :items="inbox.items" />
      </section>
      <section class="specialized-experience__section">
        <span class="eyebrow">TEMPO PROTEGIDO</span>
        <h3>Espaço para você</h3>
        <ExperienceItems :items="protectedTime.items" :cards="true" />
      </section>
    </div>
    <section class="specialized-experience__section week-experience__review">
      <div class="specialized-experience__heading">
        <div>
          <span class="eyebrow">REVISÃO SEMANAL</span>
          <h3>Feche a semana com clareza</h3>
        </div>
        <button class="dark-button" @click="emit('review')">
          Abrir revisão
        </button>
      </div>
    </section>
    <div v-if="update" class="specialized-empty" role="status">
      Há uma versão mais nova deste ponto de partida (v{{
        update.availableVersion
      }}).
    </div>
  </main>
</template>

<style scoped>
.week-experience__lower {
  display: grid;
  grid-template-columns: repeat(2, minmax(0, 1fr));
  gap: 1.2rem;
}
.week-experience__lower > section {
  min-width: 0;
  padding-inline: 1rem;
  border: 1px solid var(--noma-border);
  border-radius: 15px;
}
.week-experience__lower h3,
.week-experience__next h3 {
  margin: 0.3rem 0 0.8rem;
}
@media (max-width: 760px) {
  .week-experience__lower {
    grid-template-columns: 1fr;
  }
}
</style>
