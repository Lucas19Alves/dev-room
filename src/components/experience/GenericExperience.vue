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
const emit = defineEmits(["review", "metric", "action"]);
const review = computed(() => reviewStatus(props.flow));
const plan = computed(
  () =>
    props.experience.sections.secondary[0] || {
      label: "PLANO",
      title: "O que vem depois",
      items: [],
    },
);
const context = computed(
  () =>
    props.experience.sections.secondary[1] || {
      label: "CONTEXTO",
      title: "O que ajuda a continuar",
      items: [],
    },
);
const progress = computed(() => props.experience.sections.progress);
</script>

<template>
  <main class="specialized-experience generic-experience">
    <header class="specialized-experience__hero">
      <div>
        <span class="eyebrow">{{ experience.sections.hero.eyebrow }}</span>
        <h2>{{ experience.sections.hero.title }}</h2>
        <p>{{ flow.context?.summary || flow.objective }}</p>
      </div>
      <div class="specialized-experience__review">
        <span :class="{ due: review.due }">{{
          review.due ? "Revisão disponível" : `Revisão em ${review.days} dias`
        }}</span>
        <button class="outline" @click="emit('review')">Revisar Flow</button>
      </div>
    </header>
    <section
      class="specialized-experience__section specialized-experience__section--accent"
    >
      <div class="specialized-experience__heading">
        <div>
          <span class="eyebrow">AGORA</span>
          <h3>Escolha o próximo passo</h3>
        </div>
      </div>
      <ExperienceActionList
        :actions="experience.actions"
        empty-title="Nada pede atenção agora."
        @action="(action, operation) => emit('action', action, operation)"
      />
    </section>
    <section class="generic-experience__split specialized-experience__section">
      <article>
        <span class="eyebrow">PLANO</span>
        <h3>{{ plan.title }}</h3>
        <ExperienceItems :items="plan.items" />
      </article>
      <article>
        <span class="eyebrow">CONTEXTO</span>
        <h3>{{ context.title }}</h3>
        <ExperienceItems :items="context.items" />
      </article>
    </section>
    <section v-if="progress" class="specialized-experience__section">
      <div class="specialized-experience__heading">
        <div>
          <span class="eyebrow">PROGRESSO</span>
          <h3>O que mudou</h3>
        </div>
      </div>
      <div class="experience-metric-strip">
        <article
          v-for="metric in progress.items"
          :key="metric.id"
          class="experience-metric"
        >
          <small>{{ metric.label }}</small
          ><strong
            >{{ metric.value }} <em>{{ metric.unit }}</em></strong
          >
        </article>
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
.generic-experience__split {
  display: grid;
  grid-template-columns: repeat(2, minmax(0, 1fr));
  gap: 1.2rem;
}
.generic-experience__split article {
  min-width: 0;
  padding: 1rem;
  border: 1px solid var(--noma-border);
  border-radius: 15px;
}
.generic-experience__split h3 {
  margin: 0.3rem 0 0.8rem;
}
@media (max-width: 760px) {
  .generic-experience__split {
    grid-template-columns: 1fr;
  }
}
</style>
