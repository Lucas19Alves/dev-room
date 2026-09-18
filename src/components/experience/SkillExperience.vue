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
const trail = computed(() => section("TRILHA"));
const resources = computed(() => section("RECURSOS"));
const milestones = computed(() => section("MARCOS"));
const log = computed(() => section("REGISTRO DE PRÁTICA"));
const progress = computed(() => props.experience.sections.progress);
</script>

<template>
  <main class="specialized-experience skill-experience">
    <header class="specialized-experience__hero">
      <div>
        <span class="eyebrow">{{ experience.sections.hero.eyebrow }}</span>
        <h2>{{ experience.sections.hero.title }}</h2>
        <p>
          {{ flow.properties?.skillName || flow.identity.name }} ·
          {{ flow.properties?.desiredOutcome || flow.objective }}
        </p>
      </div>
      <div class="specialized-experience__review">
        <span :class="{ due: review.due }">{{
          review.due
            ? "Revisão da prática disponível"
            : `Revisão em ${review.days} dias`
        }}</span
        ><button class="outline" @click="emit('review')">
          Revisar prática
        </button>
      </div>
    </header>
    <section
      class="specialized-experience__section specialized-experience__section--accent"
    >
      <div class="specialized-experience__heading">
        <div>
          <span class="eyebrow">PRÓXIMA PRÁTICA</span>
          <h3>O passo que mantém o aprendizado vivo</h3>
        </div>
      </div>
      <ExperienceActionList
        :actions="experience.actions"
        empty-title="Escolha uma prática para começar."
        @action="(action, operation) => emit('action', action, operation)"
      />
    </section>
    <section class="skill-experience__path specialized-experience__section">
      <div class="skill-experience__trail">
        <span class="eyebrow">TRILHA</span>
        <h3>Fundamentos e exercícios</h3>
        <ExperienceItems :items="trail.items" />
      </div>
      <div class="skill-experience__resources">
        <span class="eyebrow">RECURSOS</span>
        <h3>Materiais para consultar</h3>
        <ExperienceItems :items="resources.items" />
      </div>
    </section>
    <section
      class="specialized-experience__section skill-experience__milestones"
    >
      <div>
        <span class="eyebrow">MARCOS</span>
        <h3>O que já está ficando natural</h3>
      </div>
      <ExperienceItems :items="milestones.items" :cards="true" />
    </section>
    <section class="specialized-experience__section">
      <div class="specialized-experience__heading">
        <div>
          <span class="eyebrow">REGISTRO DE PRÁTICA</span>
          <h3>Sessões e aprendizados</h3>
        </div>
      </div>
      <ExperienceItems :items="log.items" />
    </section>
    <section v-if="progress" class="specialized-experience__section">
      <div class="specialized-experience__heading">
        <div>
          <span class="eyebrow">EVOLUÇÃO</span>
          <h3>Ritmo da prática</h3>
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
.skill-experience__path {
  display: grid;
  grid-template-columns: minmax(0, 1.15fr) minmax(0, 0.85fr);
  gap: 1.4rem;
}
.skill-experience__path h3,
.skill-experience__milestones h3 {
  margin: 0.3rem 0 0.8rem;
}
@media (max-width: 760px) {
  .skill-experience__path {
    grid-template-columns: 1fr;
  }
}
</style>
