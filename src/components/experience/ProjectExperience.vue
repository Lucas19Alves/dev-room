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
const inProgress = computed(() => section("EM ANDAMENTO"));
const roadmap = computed(() => section("ROADMAP"));
const blockers = computed(() => section("BLOQUEIOS"));
const decisions = computed(() => section("DECISÕES"));
const release = computed(() => section("RELEASE"));
const history = computed(() => props.experience.sections.progress);
</script>

<template>
  <main class="specialized-experience project-experience">
    <header class="specialized-experience__hero">
      <div>
        <span class="eyebrow">{{ experience.sections.hero.eyebrow }}</span>
        <h2>{{ experience.sections.hero.title }}</h2>
        <p>{{ flow.properties?.projectGoal || flow.objective }}</p>
      </div>
      <div class="specialized-experience__review">
        <span :class="{ due: review.due }">{{
          review.due
            ? "Revisão do projeto disponível"
            : `Revisão em ${review.days} dias`
        }}</span
        ><button class="outline" @click="emit('review')">
          Revisar projeto
        </button>
      </div>
    </header>

    <section
      class="specialized-experience__section specialized-experience__section--accent"
    >
      <div class="specialized-experience__heading">
        <div>
          <span class="eyebrow">PRÓXIMO INCREMENTO</span>
          <h3>Escolha o próximo movimento</h3>
        </div>
      </div>
      <ExperienceActionList
        :actions="experience.actions"
        empty-title="Nenhum incremento aberto."
        @action="(action, operation) => emit('action', action, operation)"
      />
    </section>

    <section class="specialized-experience__section project-experience__work">
      <div class="project-experience__column">
        <div class="specialized-experience__heading">
          <div>
            <span class="eyebrow">EM ANDAMENTO</span>
            <h3>{{ inProgress.title }}</h3>
          </div>
        </div>
        <ExperienceItems :items="inProgress.items" />
      </div>
      <div class="project-experience__column">
        <div class="specialized-experience__heading">
          <div>
            <span class="eyebrow">ROADMAP</span>
            <h3>{{ roadmap.title }}</h3>
          </div>
        </div>
        <ExperienceItems :items="roadmap.items" />
      </div>
    </section>

    <section
      class="specialized-experience__section project-experience__signals"
    >
      <article class="project-signal project-signal--warning">
        <span class="eyebrow">BLOQUEIOS</span>
        <h3>{{ blockers.title }}</h3>
        <ExperienceItems :items="blockers.items" />
      </article>
      <article class="project-signal">
        <span class="eyebrow">DECISÕES</span>
        <h3>{{ decisions.title }}</h3>
        <ExperienceItems :items="decisions.items" />
      </article>
      <article class="project-signal">
        <span class="eyebrow">RELEASE</span>
        <h3>{{ release.title }}</h3>
        <ExperienceItems :items="release.items" />
      </article>
    </section>

    <section class="specialized-experience__section">
      <div class="specialized-experience__heading">
        <div>
          <span class="eyebrow">HISTÓRICO</span>
          <h3>O que mudou no projeto</h3>
        </div>
      </div>
      <ExperienceItems :items="history?.items || []" />
    </section>
    <div v-if="update" class="specialized-empty" role="status">
      Há uma versão mais nova deste ponto de partida (v{{
        update.availableVersion
      }}).
    </div>
  </main>
</template>

<style scoped>
.project-experience__work,
.project-experience__signals {
  display: grid;
  grid-template-columns: repeat(2, minmax(0, 1fr));
  gap: 1.2rem;
}
.project-experience__signals {
  grid-template-columns: repeat(3, minmax(0, 1fr));
}
.project-experience__column,
.project-signal {
  min-width: 0;
}
.project-signal {
  padding: 1rem;
  border: 1px solid var(--noma-border);
  border-radius: 15px;
  background: var(--noma-surface-soft);
}
.project-signal h3 {
  margin: 0.3rem 0 0.7rem;
}
.project-signal--warning {
  border-color: color-mix(in srgb, var(--noma-warning) 45%, var(--noma-border));
}
@media (max-width: 900px) {
  .project-experience__work,
  .project-experience__signals {
    grid-template-columns: 1fr;
  }
}
</style>
