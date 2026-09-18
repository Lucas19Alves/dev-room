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
const section = (label) =>
  props.experience.sections.secondary.find((item) => item.label === label) || {
    label,
    title: label,
    items: [],
  };
const plan = computed(() => section("PLANO"));
const practice = computed(() => section("PRÁTICA"));
const reviewSection = computed(() => section("REVISAR"));
const lanes = computed(() => [plan.value, practice.value, reviewSection.value]);
const progress = computed(() => props.experience.sections.progress);
</script>

<template>
  <main class="specialized-experience study-experience">
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
          <span class="eyebrow">HOJE</span>
          <h3>O que merece estudo agora</h3>
        </div>
        <span class="specialized-experience__count"
          >{{ experience.sections.primary.items.length }} próximos
          movimentos</span
        >
      </div>
      <ExperienceActionList
        :actions="experience.actions"
        empty-title="Você está em dia."
        @action="(action, operation) => emit('action', action, operation)"
      />
    </section>

    <div class="study-experience__lanes">
      <section
        v-for="lane in lanes"
        :key="lane.label"
        class="specialized-experience__section study-experience__lane"
      >
        <div class="specialized-experience__heading">
          <div>
            <span class="eyebrow">{{ lane.label }}</span>
            <h3>{{ lane.title }}</h3>
          </div>
        </div>
        <ExperienceItems :items="lane.items" :cards="true" />
      </section>
    </div>

    <section v-if="progress" class="specialized-experience__section">
      <div class="specialized-experience__heading">
        <div>
          <span class="eyebrow">EVOLUÇÃO</span>
          <h3>Indicadores significativos</h3>
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
.study-experience__lanes {
  display: grid;
  grid-template-columns: repeat(3, minmax(0, 1fr));
  gap: 1rem;
}
.study-experience__lane {
  min-width: 0;
}
@media (max-width: 900px) {
  .study-experience__lanes {
    grid-template-columns: 1fr;
  }
}
</style>
