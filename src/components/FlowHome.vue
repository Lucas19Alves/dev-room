<script setup>
import { computed } from "vue";
import { getFlowHome, reviewStatus } from "../flow/runtime.js";

const props = defineProps({
  flow: { type: Object, required: true },
  update: { type: Object, default: null },
});
defineEmits(["review"]);

const home = computed(() => getFlowHome(props.flow));
const review = computed(() => reviewStatus(props.flow));
const stages = computed(() => props.flow.stages || []);
const currentStage = computed(
  () => stages.value.find((stage) => stage.status === "current")?.title,
);

function metricText(metric) {
  if (metric.target !== null && metric.target !== undefined)
    return `${metric.value} / ${metric.target}`;
  return `${metric.value}`;
}
</script>

<template>
  <section class="flow-home" aria-labelledby="flow-context-title">
    <div class="flow-home__intro">
      <div>
        <span class="eyebrow">{{ home.eyebrow }}</span>
        <h2 id="flow-context-title">{{ home.title }}</h2>
        <p>{{ flow.context?.summary || flow.description }}</p>
        <div v-if="home.facts.length" class="flow-facts">
          <span v-for="fact in home.facts" :key="fact">{{ fact }}</span>
        </div>
      </div>
      <div class="flow-home__review">
        <span :class="{ due: review.due }">
          {{ review.due ? "Revisão disponível" : `Revisão em ${review.days} dia${review.days === 1 ? '' : 's'}` }}
        </span>
        <button class="outline" @click="$emit('review')">
          {{ review.due ? "Revisar este Flow" : "Revisar agora" }}
        </button>
      </div>
    </div>

    <div v-if="update" class="definition-update" role="status">
      <div>
        <strong>Há uma versão mais nova deste ponto de partida.</strong>
        <p>Seu Flow continua na versão {{ update.currentVersion }} e nenhum conteúdo será alterado automaticamente.</p>
      </div>
      <span>v{{ update.availableVersion }}</span>
    </div>

    <div class="flow-home__grid">
      <div class="flow-home__next">
        <div class="flow-home__section-title">
          <span>PRÓXIMAS AÇÕES</span>
          <small v-if="currentStage">Agora: {{ currentStage }}</small>
        </div>
        <ol>
          <li v-for="action in home.nextActions" :key="action">{{ action }}</li>
        </ol>
      </div>
      <div class="flow-home__metrics">
        <div
          v-for="indicator in home.indicators"
          :key="indicator.id"
          class="flow-indicator"
        >
          <small>{{ indicator.label }}</small>
          <strong>{{ metricText(indicator) }} <em>{{ indicator.unit }}</em></strong>
          <div v-if="indicator.target" class="metric-bar" aria-hidden="true">
            <i :style="{ width: `${Math.min(100, (indicator.value / indicator.target) * 100)}%` }"></i>
          </div>
        </div>
        <div v-if="flow.progress?.value !== null" class="flow-indicator flow-indicator--progress">
          <small>PROGRESSO DOS MARCOS</small>
          <strong>{{ flow.progress.value }}<em>%</em></strong>
          <div class="metric-bar" aria-hidden="true"><i :style="{ width: `${flow.progress.value}%` }"></i></div>
        </div>
      </div>
    </div>

    <div v-if="stages.length" class="flow-stages" aria-label="Etapas do Flow">
      <div
        v-for="stage in stages"
        :key="stage.id"
        :class="[`flow-stage--${stage.status}`]"
      >
        <i></i><span>{{ stage.title }}</span>
      </div>
    </div>
  </section>
</template>
