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
const deadlines = computed(() => section("PRÓXIMOS PRAZOS"));
const subjects = computed(() => section("DISCIPLINAS"));
const assignments = computed(() => section("TRABALHOS"));
const exams = computed(() => section("PROVAS"));
const readings = computed(() => section("LEITURAS"));
const materials = computed(() => section("MATERIAIS"));
const progress = computed(() => props.experience.sections.progress);
</script>

<template>
  <main class="specialized-experience college-experience">
    <header class="specialized-experience__hero">
      <div>
        <span class="eyebrow">{{ experience.sections.hero.eyebrow }}</span>
        <h2>{{ experience.sections.hero.title }}</h2>
        <p>
          {{ flow.properties?.course || "Faculdade" }} ·
          {{ flow.properties?.semester || "Semestre atual" }}
        </p>
      </div>
      <div class="specialized-experience__review">
        <span :class="{ due: review.due }">{{
          review.due
            ? "Revisão acadêmica disponível"
            : `Revisão em ${review.days} dias`
        }}</span
        ><button class="outline" @click="emit('review')">
          Revisar semestre
        </button>
      </div>
    </header>

    <section
      class="specialized-experience__section specialized-experience__section--accent college-experience__today"
    >
      <div class="specialized-experience__heading">
        <div>
          <span class="eyebrow">HOJE</span>
          <h3>A urgência com contexto</h3>
        </div>
      </div>
      <ExperienceActionList
        :actions="experience.actions"
        empty-title="Nenhum prazo pede atenção hoje."
        @action="(action, operation) => emit('action', action, operation)"
      />
    </section>

    <section
      class="specialized-experience__section college-experience__deadlines"
    >
      <div class="specialized-experience__heading">
        <div>
          <span class="eyebrow">PRÓXIMOS PRAZOS</span>
          <h3>{{ deadlines.title }}</h3>
        </div>
      </div>
      <ExperienceItems :items="deadlines.items" />
    </section>
    <section
      class="specialized-experience__section college-experience__subjects"
    >
      <div>
        <span class="eyebrow">DISCIPLINAS</span>
        <h3>{{ subjects.title }}</h3>
      </div>
      <ExperienceItems :items="subjects.items" :cards="true" />
    </section>

    <section
      class="specialized-experience__section college-experience__categories"
    >
      <article>
        <span class="eyebrow">TRABALHOS</span>
        <h3>{{ assignments.title }}</h3>
        <ExperienceItems :items="assignments.items" />
      </article>
      <article>
        <span class="eyebrow">PROVAS</span>
        <h3>{{ exams.title }}</h3>
        <ExperienceItems :items="exams.items" />
      </article>
      <article>
        <span class="eyebrow">LEITURAS</span>
        <h3>{{ readings.title }}</h3>
        <ExperienceItems :items="readings.items" />
      </article>
      <article>
        <span class="eyebrow">MATERIAIS</span>
        <h3>{{ materials.title }}</h3>
        <ExperienceItems :items="materials.items" />
      </article>
    </section>

    <section v-if="progress" class="specialized-experience__section">
      <div class="specialized-experience__heading">
        <div>
          <span class="eyebrow">PROGRESSO</span>
          <h3>Ritmo do semestre</h3>
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
.college-experience__categories {
  display: grid;
  grid-template-columns: repeat(2, minmax(0, 1fr));
  gap: 1.2rem;
}
.college-experience__categories article {
  min-width: 0;
  padding: 1rem;
  border: 1px solid var(--noma-border);
  border-radius: 15px;
}
.college-experience__categories h3,
.college-experience__subjects h3 {
  margin: 0.3rem 0 0.8rem;
}
@media (max-width: 760px) {
  .college-experience__categories {
    grid-template-columns: 1fr;
  }
}
</style>
