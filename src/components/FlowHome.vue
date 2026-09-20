<script setup>
import { computed, ref } from "vue";
import {
  buildFlowExperience,
  findExperienceSource,
} from "../flow/experience.js";
import { reviewStatus } from "../flow/runtime.js";

const props = defineProps({
  flow: { type: Object, required: true },
  update: { type: Object, default: null },
  experience: { type: Object, default: null },
});
const emit = defineEmits([
  "review",
  "metric",
  "action",
  "opportunity",
  "opportunity-status",
  "opportunity-update",
]);
const experience = computed(
  () => props.experience || buildFlowExperience(props.flow),
);
const review = computed(() => reviewStatus(props.flow));
const openedAction = ref(null);
const opportunityFormOpen = ref(false);
const editingOpportunity = ref(null);
const opportunityForm = ref({
  company: "",
  role: "",
  status: "Encontrada",
  nextAction: "",
  nextActionAt: "",
});
const stages = computed(() => experience.value?.progress?.stages || []);
const opportunityStages = computed(
  () =>
    props.flow.components?.find((component) => component.type === "tracker")
      ?.config?.stages || [],
);

function metricText(metric) {
  if (metric.target !== null && metric.target !== undefined)
    return `${metric.value} / ${metric.target}`;
  return `${metric.value}`;
}
function stageState(stage) {
  const current = stages.value.findIndex((item) => item.status === "current");
  const index = stages.value.indexOf(stage);
  if (current < 0) return stage.status;
  if (index < current) return "completed";
  if (index === current) return "current";
  return "upcoming";
}
function operate(action, operation) {
  if (operation.type === "open") openedAction.value = action;
  else openedAction.value = null;
  emit("action", action, operation);
}
function actionFor(sourceId) {
  return experience.value.actions.find(
    (action) => action.sourceId === sourceId,
  );
}
function startOpportunity(item = null) {
  editingOpportunity.value = item?.id || null;
  opportunityForm.value = item
    ? {
        company: item.sourceItem?.values?.company || item.title,
        role: item.sourceItem?.values?.role || item.subtitle,
        status: item.status,
        nextAction: item.nextAction,
        nextActionAt: item.dueAt || "",
      }
    : {
        company: "",
        role: "",
        status: "Encontrada",
        nextAction: "",
        nextActionAt: "",
      };
  opportunityFormOpen.value = true;
}
function submitOpportunity() {
  emit(
    editingOpportunity.value ? "opportunity-update" : "opportunity",
    editingOpportunity.value
      ? { id: editingOpportunity.value, ...opportunityForm.value }
      : { ...opportunityForm.value },
  );
  opportunityFormOpen.value = false;
  editingOpportunity.value = null;
}
</script>

<template>
  <section class="flow-experience" aria-labelledby="flow-context-title">
    <header class="flow-experience__context">
      <div>
        <span class="eyebrow">{{ experience.context.eyebrow }}</span>
        <h2 id="flow-context-title">{{ experience.context.title }}</h2>
        <p>{{ experience.context.subtitle }}</p>
        <div v-if="experience.context.facts.length" class="flow-facts">
          <span v-for="fact in experience.context.facts" :key="fact">{{
            fact
          }}</span>
        </div>
      </div>
      <div class="flow-experience__review">
        <span :class="{ due: review.due }">{{
          review.due
            ? "Revisão disponível"
            : `Revisão em ${review.days} dia${review.days === 1 ? "" : "s"}`
        }}</span>
        <small v-if="flow.review?.history?.length"
          >{{
            flow.review.history.filter((item) => item.status === "completed")
              .length
          }}
          revisão concluída</small
        >
        <button class="outline" @click="emit('review')">
          {{ review.due ? "Revisar este Flow" : "Revisar agora" }}
        </button>
      </div>
    </header>

    <div v-if="update" class="definition-update" role="status">
      <div>
        <strong>Há uma versão mais nova deste ponto de partida.</strong>
        <p>
          Seu Flow continua na versão {{ update.currentVersion }} e nenhum
          conteúdo será alterado automaticamente.
        </p>
      </div>
      <span>v{{ update.availableVersion }}</span>
    </div>

    <section
      class="experience-section experience-now"
      aria-labelledby="now-title"
    >
      <div class="experience-section__heading">
        <div>
          <span class="eyebrow">AGORA</span>
          <h3 id="now-title">O que importa neste momento</h3>
        </div>
        <span class="experience-count"
          >{{ experience.actions.length }} ações</span
        >
      </div>
      <div v-if="experience.actions.length" class="action-list">
        <article
          v-for="action in experience.actions.slice(0, 5)"
          :key="action.id"
          class="action-card"
          :class="`action-card--${action.priority}`"
        >
          <button
            class="action-card__open"
            @click="
              operate(
                action,
                action.actions.find((item) => item.type === 'open'),
              )
            "
          >
            <strong>{{ action.title }}</strong
            ><small>{{ action.description }}</small>
          </button>
          <div class="action-card__meta">
            <span v-if="action.dueAt">{{ action.dueAt }}</span
            ><span>{{ action.type.replaceAll("_", " ") }}</span>
          </div>
          <div class="action-card__buttons">
            <button
              v-for="operation in action.actions.filter(
                (item) => item.type !== 'open',
              )"
              :key="operation.id"
              :class="operation.type === 'complete' ? 'dark-button' : 'outline'"
              @click="operate(action, operation)"
            >
              {{ operation.label }}
            </button>
          </div>
        </article>
      </div>
      <div v-else class="experience-empty">
        <strong>Você está em dia.</strong>
        <p>
          Quando algo pedir atenção, aparecerá aqui com contexto e uma ação
          possível.
        </p>
      </div>
    </section>

    <article v-if="openedAction" class="action-detail" aria-live="polite">
      <div>
        <span class="eyebrow">AÇÃO ABERTA</span>
        <h3>{{ openedAction.title }}</h3>
        <p>{{ openedAction.description }}</p>
      </div>
      <div
        v-if="openedAction.source === 'tracker'"
        class="action-detail__source"
      >
        <strong>{{
          findExperienceSource(flow, "tracker", openedAction.sourceId)?.item
            ?.values?.company || "Oportunidade"
        }}</strong
        ><span>{{
          findExperienceSource(flow, "tracker", openedAction.sourceId)?.item
            ?.status
        }}</span>
      </div>
      <div class="action-card__buttons">
        <button
          v-for="operation in openedAction.actions.filter(
            (item) => item.type !== 'open',
          )"
          :key="operation.id"
          :class="operation.type === 'complete' ? 'dark-button' : 'outline'"
          @click="operate(openedAction, operation)"
        >
          {{ operation.label }}
        </button>
      </div>
    </article>

    <section
      class="experience-section experience-week"
      aria-labelledby="week-title"
    >
      <div class="experience-section__heading">
        <div>
          <span class="eyebrow">SUA SEMANA</span>
          <h3 id="week-title">Sinais reais de avanço</h3>
        </div>
      </div>
      <div class="experience-metrics">
        <article v-for="metric in experience.week.metrics" :key="metric.id">
          <small>{{ metric.label }}</small
          ><strong
            >{{ metricText(metric) }} <em>{{ metric.unit }}</em></strong
          >
          <div v-if="metric.target" class="metric-bar">
            <i
              :style="{
                width: `${Math.min(100, (metric.value / metric.target) * 100)}%`,
              }"
            ></i>
          </div>
        </article>
        <div v-if="!experience.week.metrics.length" class="experience-empty">
          <p>Ainda estamos reunindo os primeiros sinais deste Flow.</p>
        </div>
      </div>
    </section>

    <section
      v-if="experience.id === 'job' || experience.opportunities.length"
      class="experience-section"
      aria-labelledby="opportunities-title"
    >
      <div class="experience-section__heading">
        <div>
          <span class="eyebrow">OPORTUNIDADES</span>
          <h3 id="opportunities-title">Pipeline contextual da busca</h3>
        </div>
        <div class="section-actions">
          <span class="experience-count"
            >{{ experience.opportunities.length }} acompanhadas</span
          ><button
            v-if="experience.id === 'job'"
            class="dark-button"
            @click="startOpportunity()"
          >
            Registrar oportunidade
          </button>
        </div>
      </div>
      <form
        v-if="opportunityFormOpen"
        class="opportunity-form"
        @submit.prevent="submitOpportunity"
      >
        <label class="tool-field"
          >Empresa<input v-model="opportunityForm.company" required /></label
        ><label class="tool-field"
          >Cargo<input v-model="opportunityForm.role" required /></label
        ><label class="tool-field"
          >Etapa<select v-model="opportunityForm.status">
            <option
              v-for="stage in flow.stages"
              :key="stage.id"
              :value="stage.title"
            >
              {{ stage.title }}
            </option>
          </select></label
        ><label class="tool-field"
          >Próxima ação<input
            v-model="opportunityForm.nextAction"
            placeholder="Ex.: Fazer follow-up" /></label
        ><label class="tool-field"
          >Data da próxima ação<input
            v-model="opportunityForm.nextActionAt"
            type="date"
        /></label>
        <div class="action-card__buttons">
          <button
            type="button"
            class="outline"
            @click="opportunityFormOpen = false"
          >
            Cancelar</button
          ><button class="dark-button">
            {{
              editingOpportunity
                ? "Salvar oportunidade"
                : "Adicionar oportunidade"
            }}
          </button>
        </div>
      </form>
      <div v-if="experience.opportunities.length" class="opportunity-list">
        <article
          v-for="opportunity in experience.opportunities"
          :key="opportunity.id"
          class="opportunity-card"
        >
          <div class="opportunity-card__main">
            <strong>{{ opportunity.title }}</strong
            ><span>{{ opportunity.subtitle }}</span
            ><small
              >{{ opportunity.status
              }}<template v-if="opportunity.staleLabel">
                · {{ opportunity.staleLabel }}</template
              ></small
            ><select
              :value="opportunity.status"
              :aria-label="`Atualizar etapa de ${opportunity.title}`"
              @change="
                emit(
                  'opportunity-status',
                  opportunity.sourceId,
                  $event.target.value,
                )
              "
            >
              <option
                v-for="stage in opportunityStages"
                :key="stage"
                :value="stage"
              >
                {{ stage }}
              </option>
            </select>
          </div>
          <div class="opportunity-card__next">
            <span v-if="opportunity.nextAction">{{
              opportunity.nextAction
            }}</span
            ><small v-if="opportunity.dueLabel">{{
              opportunity.dueLabel
            }}</small
            ><button class="text-button" @click="startOpportunity(opportunity)">
              {{
                opportunity.nextAction
                  ? "Editar próximo passo"
                  : "Planejar follow-up"
              }}
            </button>
          </div>
          <div class="opportunity-card__actions">
            <button
              v-if="actionFor(opportunity.sourceId)"
              class="outline"
              @click="
                operate(
                  actionFor(opportunity.sourceId),
                  actionFor(opportunity.sourceId).actions.find(
                    (item) => item.type === 'open',
                  ),
                )
              "
            >
              Abrir</button
            ><a
              v-if="opportunity.url"
              class="outline"
              :href="opportunity.url"
              target="_blank"
              rel="noopener noreferrer"
              >Ver vaga ↗</a
            >
          </div>
        </article>
      </div>
      <div v-else class="experience-empty">
        <p>
          Registre a primeira oportunidade para começar a acompanhar sua busca.
        </p>
      </div>
    </section>

    <section
      v-if="experience.commitments.length"
      class="experience-section"
      aria-labelledby="commitments-title"
    >
      <div class="experience-section__heading">
        <div>
          <span class="eyebrow">PRÓXIMOS COMPROMISSOS</span>
          <h3 id="commitments-title">O que tem data ou pede retorno</h3>
        </div>
      </div>
      <div class="commitment-list">
        <button
          v-for="action in experience.commitments"
          :key="action.id"
          @click="
            operate(
              action,
              action.actions.find((item) => item.type === 'open'),
            )
          "
        >
          <span>{{ action.title }}</span
          ><small>{{ action.dueAt }}</small>
        </button>
      </div>
    </section>

    <section
      v-if="
        experience.preparation.resources.length ||
        experience.preparation.notes.length ||
        experience.preparation.tasks.length
      "
      class="experience-section"
      aria-labelledby="preparation-title"
    >
      <div class="experience-section__heading">
        <div>
          <span class="eyebrow">PREPARAÇÃO</span>
          <h3 id="preparation-title">Materiais para o próximo movimento</h3>
        </div>
      </div>
      <div class="preparation-grid">
        <div v-if="experience.preparation.resources.length">
          <strong>Recursos</strong
          ><a
            v-for="resource in experience.preparation.resources"
            :key="resource.id"
            :href="resource.url"
            target="_blank"
            rel="noopener noreferrer"
            >{{ resource.title }} ↗</a
          >
        </div>
        <div v-if="experience.preparation.notes.length">
          <strong>Anotações</strong
          ><span v-for="note in experience.preparation.notes" :key="note.id">{{
            note.title
          }}</span>
        </div>
        <div v-if="experience.preparation.tasks.length">
          <strong>Passos de apoio</strong
          ><span v-for="task in experience.preparation.tasks" :key="task.id">{{
            task.text
          }}</span>
        </div>
      </div>
    </section>

    <section class="experience-section" aria-labelledby="progress-title">
      <div class="experience-section__heading">
        <div>
          <span class="eyebrow">PROGRESSO</span>
          <h3 id="progress-title">O que mudou de verdade</h3>
        </div>
      </div>
      <div class="progress-grid">
        <article v-for="goal in experience.progress.goals" :key="goal.id">
          <strong>{{ goal.title }}</strong
          ><span v-if="goal.current !== null && goal.current !== undefined"
            >{{ goal.current
            }}<template v-if="goal.target"> / {{ goal.target }}</template>
            {{ goal.unit }}</span
          ><small>{{
            goal.status === "completed" ? "Concluída" : "Em andamento"
          }}</small>
        </article>
        <div v-if="experience.progress.value !== null" class="progress-total">
          <small>PROGRESSO DOS MARCOS</small
          ><strong>{{ experience.progress.value }}<em>%</em></strong>
        </div>
      </div>
    </section>

    <section
      v-if="experience.history.length"
      class="experience-section experience-history"
      aria-labelledby="history-title"
    >
      <div class="experience-section__heading">
        <div>
          <span class="eyebrow">HISTÓRICO RECENTE</span>
          <h3 id="history-title">O que mudou no Flow</h3>
        </div>
      </div>
      <ol>
        <li v-for="entry in experience.history" :key="entry.id">
          <span>{{ entry.title }}</span
          ><small
            >{{ entry.detail }} ·
            {{ new Date(entry.at).toLocaleDateString("pt-BR") }}</small
          >
        </li>
      </ol>
    </section>
  </section>
</template>

<style scoped>
.flow-experience {
  display: grid;
  gap: 1.25rem;
}
.flow-experience__context {
  display: flex;
  justify-content: space-between;
  gap: 2rem;
  padding: 1.5rem 0 1.25rem;
  border-bottom: 1px solid var(--noma-border);
}
.flow-experience__context h2 {
  font-size: clamp(1.75rem, 4vw, 2.8rem);
  margin: 0.35rem 0;
}
.flow-experience__context p {
  max-width: 42rem;
  color: var(--noma-ink-soft);
  margin: 0;
}
.flow-experience__review {
  display: grid;
  align-content: start;
  justify-items: end;
  gap: 0.4rem;
  min-width: 11rem;
}
.flow-experience__review span {
  color: var(--noma-ink-soft);
}
.flow-experience__review span.due {
  color: var(--noma-danger);
  font-weight: 700;
}
.flow-facts {
  display: flex;
  gap: 0.5rem;
  flex-wrap: wrap;
  margin-top: 1rem;
}
.flow-facts span,
.experience-count {
  font-size: 0.75rem;
  color: var(--noma-ink-soft);
  background: var(--noma-surface-soft);
  border-radius: 999px;
  padding: 0.35rem 0.6rem;
}
.experience-section {
  padding: 1.25rem 0;
  border-bottom: 1px solid var(--noma-border);
}
.experience-section__heading {
  display: flex;
  justify-content: space-between;
  align-items: end;
  gap: 1rem;
  margin-bottom: 1rem;
}
.experience-section h3 {
  margin: 0.3rem 0 0;
  font-size: 1.25rem;
}
.section-actions {
  display: flex;
  align-items: center;
  gap: 0.6rem;
  flex-wrap: wrap;
  justify-content: flex-end;
}
.opportunity-form {
  display: grid;
  grid-template-columns: repeat(2, minmax(0, 1fr));
  gap: 0.7rem;
  padding: 1rem;
  margin-bottom: 1rem;
  background: var(--noma-surface-soft);
  border-radius: 14px;
}
.opportunity-form .action-card__buttons {
  grid-column: 1/-1;
}
.action-list {
  display: grid;
  gap: 0.65rem;
}
.action-card {
  display: grid;
  grid-template-columns: minmax(0, 1fr) auto;
  gap: 0.7rem;
  align-items: center;
  border: 1px solid var(--noma-border);
  border-radius: 14px;
  padding: 0.85rem 1rem;
  background: var(--noma-surface);
}
.action-card--high {
  border-left: 4px solid var(--noma-warning);
}
.action-card__open {
  display: grid;
  gap: 0.3rem;
  text-align: left;
  border: 0;
  background: none;
  padding: 0;
}
.action-card__open strong {
  font-size: 1rem;
}
.action-card__open small {
  color: var(--noma-ink-soft);
}
.action-card__meta {
  display: flex;
  gap: 0.5rem;
  align-items: center;
  color: var(--noma-ink-muted);
  font-size: 0.75rem;
}
.action-card__meta span + span {
  text-transform: capitalize;
}
.action-card__buttons {
  display: flex;
  gap: 0.4rem;
  flex-wrap: wrap;
  justify-content: flex-end;
}
.action-card__buttons button {
  min-height: 32px;
}
.experience-empty {
  padding: 1.25rem;
  border-radius: 14px;
  background: var(--noma-surface-soft);
  color: var(--noma-ink-soft);
}
.action-detail {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 1rem;
  padding: 1rem 1.2rem;
  border-radius: 14px;
  background: var(--noma-brand-soft);
  border: 1px solid var(--noma-border);
}
.action-detail h3 {
  margin: 0.3rem 0;
}
.action-detail p {
  margin: 0;
  color: var(--noma-ink-soft);
}
.action-detail__source {
  display: grid;
  gap: 0.2rem;
}
.action-detail__source span {
  color: var(--noma-ink-soft);
}
.experience-metrics {
  display: grid;
  grid-template-columns: repeat(3, minmax(0, 1fr));
  gap: 0.7rem;
}
.experience-metrics article,
.progress-grid article,
.progress-total {
  display: grid;
  gap: 0.35rem;
  padding: 1rem;
  border-radius: 12px;
  background: var(--noma-surface-soft);
}
.experience-metrics small,
.progress-grid small {
  color: var(--noma-ink-muted);
  text-transform: uppercase;
  font-size: 0.7rem;
  letter-spacing: 0.08em;
}
.experience-metrics strong {
  font-size: 1.35rem;
}
.experience-metrics em,
.progress-total em {
  font-size: 0.8rem;
  font-style: normal;
  color: var(--noma-ink-soft);
}
.metric-bar {
  height: 4px;
  background: var(--noma-border);
  border-radius: 9px;
  overflow: hidden;
}
.metric-bar i {
  display: block;
  height: 100%;
  background: var(--noma-brand);
}
.opportunity-list {
  display: grid;
  border-top: 1px solid var(--noma-border);
}
.opportunity-card {
  display: grid;
  grid-template-columns: 1fr 1fr auto;
  gap: 1rem;
  align-items: center;
  padding: 0.85rem 0;
  border-bottom: 1px solid var(--noma-border);
}
.opportunity-card__main,
.opportunity-card__next {
  display: grid;
  gap: 0.25rem;
}
.opportunity-card__main span,
.opportunity-card__main small,
.opportunity-card__next small {
  color: var(--noma-ink-soft);
  font-size: 0.8rem;
}
.commitment-list {
  display: grid;
  gap: 0.45rem;
}
.commitment-list button {
  display: flex;
  justify-content: space-between;
  gap: 1rem;
  border: 0;
  border-bottom: 1px solid var(--noma-border);
  background: none;
  padding: 0.65rem 0;
  text-align: left;
}
.commitment-list small {
  color: var(--noma-ink-soft);
}
.preparation-grid {
  display: grid;
  grid-template-columns: repeat(3, 1fr);
  gap: 1rem;
}
.preparation-grid > div {
  display: grid;
  align-content: start;
  gap: 0.45rem;
}
.preparation-grid strong {
  font-size: 0.8rem;
  text-transform: uppercase;
  letter-spacing: 0.08em;
}
.preparation-grid span,
.preparation-grid a {
  color: var(--noma-ink-soft);
  font-size: 0.9rem;
}
.progress-grid {
  display: grid;
  grid-template-columns: repeat(3, 1fr);
  gap: 0.7rem;
}
.progress-total {
  align-content: center;
}
.progress-total strong {
  font-size: 1.5rem;
}
.experience-history ol {
  display: grid;
  gap: 0.5rem;
  margin: 0;
  padding: 0;
  list-style: none;
}
.experience-history li {
  display: flex;
  justify-content: space-between;
  gap: 1rem;
  padding: 0.6rem 0;
  border-bottom: 1px solid var(--noma-border);
}
.experience-history small {
  color: var(--noma-ink-soft);
}
@media (max-width: 760px) {
  .flow-experience__context {
    display: grid;
  }
  .flow-experience__review {
    justify-items: start;
  }
  .action-card,
  .action-detail,
  .opportunity-card {
    grid-template-columns: 1fr;
  }
  .action-card__buttons,
  .action-detail .action-card__buttons {
    justify-content: flex-start;
  }
  .experience-metrics,
  .preparation-grid,
  .progress-grid {
    grid-template-columns: 1fr;
  }
  .opportunity-form {
    grid-template-columns: 1fr;
  }
  .opportunity-form .action-card__buttons {
    grid-column: auto;
  }
  .experience-history li {
    display: grid;
    gap: 0.2rem;
  }
}
</style>
