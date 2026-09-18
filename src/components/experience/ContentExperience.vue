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
const inProduction = computed(() => section("EM PRODUÇÃO"));
const nextPublication = computed(() => section("PRÓXIMA PUBLICAÇÃO"));
const pipeline = computed(() => section("PIPELINE"));
const references = computed(() => section("REFERÊNCIAS"));
const published = computed(() => section("PUBLICADOS"));
const progress = computed(() => props.experience.sections.progress);
</script>

<template>
  <main class="specialized-experience content-experience">
    <header class="specialized-experience__hero">
      <div>
        <span class="eyebrow">{{ experience.sections.hero.eyebrow }}</span>
        <h2>{{ experience.sections.hero.title }}</h2>
        <p>
          {{ flow.properties?.channel || flow.identity.name }} ·
          {{ flow.properties?.contentGoal || flow.objective }}
        </p>
      </div>
      <div class="specialized-experience__review">
        <span :class="{ due: review.due }">{{
          review.due
            ? "Revisão editorial disponível"
            : `Revisão em ${review.days} dias`
        }}</span
        ><button class="outline" @click="emit('review')">
          Revisar pipeline
        </button>
      </div>
    </header>
    <section
      class="specialized-experience__section specialized-experience__section--accent"
    >
      <div class="specialized-experience__heading">
        <div>
          <span class="eyebrow">IDEIAS</span>
          <h3>O que pode virar conteúdo</h3>
        </div>
      </div>
      <ExperienceActionList
        :actions="experience.actions"
        empty-title="Capture uma ideia antes que ela se perca."
        @action="(action, operation) => emit('action', action, operation)"
      />
    </section>
    <section
      class="content-experience__pipeline specialized-experience__section"
    >
      <article>
        <span class="eyebrow">EM PRODUÇÃO</span>
        <h3>{{ inProduction.title }}</h3>
        <ExperienceItems :items="inProduction.items" :cards="true" />
      </article>
      <article>
        <span class="eyebrow">PRÓXIMA PUBLICAÇÃO</span>
        <h3>{{ nextPublication.title }}</h3>
        <ExperienceItems :items="nextPublication.items" />
      </article>
    </section>
    <section class="specialized-experience__section">
      <div class="specialized-experience__heading">
        <div>
          <span class="eyebrow">PIPELINE</span>
          <h3>Da ideia ao público</h3>
        </div>
      </div>
      <ExperienceItems :items="pipeline.items" :cards="true" />
    </section>
    <section
      class="content-experience__library specialized-experience__section"
    >
      <article>
        <span class="eyebrow">REFERÊNCIAS</span>
        <h3>{{ references.title }}</h3>
        <ExperienceItems :items="references.items" />
      </article>
      <article>
        <span class="eyebrow">PUBLICADOS</span>
        <h3>{{ published.title }}</h3>
        <ExperienceItems :items="published.items" />
      </article>
    </section>
    <section v-if="progress" class="specialized-experience__section">
      <div class="specialized-experience__heading">
        <div>
          <span class="eyebrow">EVOLUÇÃO</span>
          <h3>Ritmo editorial</h3>
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
.content-experience__pipeline,
.content-experience__library {
  display: grid;
  grid-template-columns: repeat(2, minmax(0, 1fr));
  gap: 1.2rem;
}
.content-experience__pipeline article,
.content-experience__library article {
  min-width: 0;
}
.content-experience__pipeline h3,
.content-experience__library h3 {
  margin: 0.3rem 0 0.8rem;
}
@media (max-width: 760px) {
  .content-experience__pipeline,
  .content-experience__library {
    grid-template-columns: 1fr;
  }
}
</style>
