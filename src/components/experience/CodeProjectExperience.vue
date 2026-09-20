<script setup>
import { computed, reactive, ref, watch, nextTick, onBeforeUnmount } from "vue";
import {
  acknowledgeProjectPathReview,
  addProjectCapture,
  addProjectFeature,
  addProjectStage,
  ensureProjectWorkspace,
  FEATURE_AREAS,
  finishProject,
  PROJECT_OBJECTIVES,
  PROJECT_SIZE_SESSIONS,
  PROJECT_TYPES,
  projectCompletionSummary,
  projectInsights,
  projectNextStep,
  projectOutcomeOptions,
  projectResumeContext,
  projectStatusLabel,
  recordProjectDecision,
  recordProjectStepActivity,
  rescheduleProjectTarget,
  rescheduleProjectStep,
  setProjectStepState,
  STACK_CATALOG,
  updateProjectContext,
} from "../../flow/projectFlow.js";
import "./experience.css";

const props = defineProps({
  flow: { type: Object, required: true },
  update: { type: Object, default: null },
  experience: { type: Object, default: null },
  session: { type: Object, default: null },
  seconds: { type: Number, default: 0 },
});
const emit = defineEmits(["change", "review", "session", "delete"]);
const project = computed(() => ensureProjectWorkspace(props.flow));
const stats = computed(() => projectInsights(props.flow));
const resume = computed(() => projectResumeContext(props.flow));
const completion = computed(() => projectCompletionSummary(props.flow));
const ordered = computed(() =>
  [...project.value.steps].sort((a, b) => a.order - b.order),
);
const focusStep = computed(
  () =>
    ordered.value.find((step) => step.isFocus) ||
    ordered.value.find((step) => step.status === "active"),
);
const nextStep = computed(() => {
  const focusIndex = ordered.value.findIndex(
    (step) => step.id === focusStep.value?.id,
  );
  return projectNextStep(project.value, focusStep.value?.order ?? focusIndex);
});
const blockers = computed(() =>
  ordered.value.filter((step) => step.status === "blocked"),
);
const decisions = computed(() =>
  ordered.value.filter((step) => step.status === "decision"),
);
const actionStep = computed(() => resume.value.resumeStep || focusStep.value);
const recentCaptures = computed(() =>
  [...(project.value.captures || [])].reverse().slice(0, 3),
);
const expandedId = ref("");
const panel = ref("");
const dialogDirty = ref(false);
const activeTab = ref("now");
const workspaceTab = ref("execution");
const stepFilter = ref("all");
const dialog = ref(null);
const selectedStep = computed(() =>
  ordered.value.find((step) => step.id === expandedId.value),
);
const visibleSteps = computed(() =>
  ordered.value.filter(
    (step) =>
      stepFilter.value === "all" ||
      (stepFilter.value === "pending"
        ? !["completed", "dismissed"].includes(step.status)
        : step.status === stepFilter.value),
  ),
);
const tabs = [
  { id: "now", label: "Agora" },
  { id: "plan", label: "Plano" },
  { id: "growth", label: "Progresso" },
];
const workspaceTabs = [
  { id: "execution", label: "Fazer" },
  { id: "context", label: "Anotações" },
  { id: "settings", label: "Opções" },
];
let previousFocus;
let previousOverflow;
const dialogOpen = computed(() => Boolean(panel.value || selectedStep.value));
watch(dialogOpen, async (open) => {
  if (open) {
    previousFocus = document.activeElement;
    previousOverflow = document.body.style.overflow;
    await nextTick();
    if (!dialogOpen.value || !dialog.value) return;
    dialog.value.showModal();
    document.body.style.overflow = "hidden";
  } else {
    dialog.value?.close();
    document.body.style.overflow = previousOverflow ?? "";
    await nextTick();
    if (previousFocus?.isConnected) previousFocus.focus();
  }
});
watch(expandedId, async () => {
  workspaceTab.value = "execution";
  checklistDraft.value = "";
  Object.assign(linkDraft, { title: "", url: "" });
  Object.assign(snippetDraft, { title: "", language: "javascript", code: "" });
  if (expandedId.value) {
    await nextTick();
    dialog.value?.querySelector("#project-dialog-title")?.focus();
  }
});
watch(
  () => props.flow.id,
  () => {
    closeDialog();
    activeTab.value = "now";
    stepFilter.value = "all";
  },
);
onBeforeUnmount(() => {
  if (dialogOpen.value) document.body.style.overflow = previousOverflow ?? "";
});
function closeDialog() {
  if (dialog.value?.contains(document.activeElement))
    document.activeElement.blur();
  if (dialogDirty.value) saveDialogChange();
  expandedId.value = "";
  panel.value = "";
  stateDraft.stepId = "";
}

function saveDialogChange() {
  dialogDirty.value = false;
  if (selectedStep.value)
    recordProjectStepActivity(props.flow, selectedStep.value.id);
  changed();
}
function trapDialogFocus(event) {
  const elements = [
    ...dialog.value.querySelectorAll(
      "button, a[href], input, select, textarea, summary, [tabindex]",
    ),
  ].filter(
    (element) =>
      !element.disabled &&
      element.tabIndex >= 0 &&
      element.getClientRects().length,
  );
  const first = elements[0];
  const last = elements.at(-1);
  if (event.shiftKey && document.activeElement === first) {
    event.preventDefault();
    last?.focus();
  } else if (!event.shiftKey && document.activeElement === last) {
    event.preventDefault();
    first?.focus();
  }
}
function tabKey(event, items, current) {
  const index = items.findIndex((item) => item.id === current);
  const target =
    event.key === "Home"
      ? 0
      : event.key === "End"
        ? items.length - 1
        : event.key === "ArrowRight"
          ? (index + 1) % items.length
          : event.key === "ArrowLeft"
            ? (index + items.length - 1) % items.length
            : null;
  if (target === null) return;
  event.preventDefault();
  event.currentTarget.parentElement
    .querySelectorAll('[role="tab"]')
    [target].click();
  event.currentTarget.parentElement
    .querySelectorAll('[role="tab"]')
    [target].focus();
}
const linkDraft = reactive({ title: "", url: "" });
const checklistDraft = ref("");
const snippetDraft = reactive({ title: "", language: "javascript", code: "" });
const customDate = reactive({});
const stateDraft = reactive({ stepId: "", status: "" });
const quickAction = ref("");
const quickFeedback = ref("");
const quickReason = ref("");
const quickDecision = ref("");
const quickCapture = reactive({ kind: "step", text: "" });
const contextStackDraft = ref("");
const contextForm = reactive({
  objective: "",
  description: "",
  projectTypes: [],
  stack: [],
  intendedOutcome: "",
  targetWindow: "Sem prazo",
  targetDate: "",
});
const contextOutcomes = computed(() =>
  projectOutcomeOptions(contextForm.objective, contextForm.projectTypes),
);
const stageForm = reactive({
  name: "",
  type: "implementation",
  dueAt: "",
  dueWindow: "Sem data",
  specificDate: "",
  tools: [],
  status: "planned",
  dependencies: [],
  size: "Média",
  objective: "",
  blockedReason: "",
  decisionRequired: "",
});
const featureForm = reactive({
  name: "",
  area: "Interface",
  tools: [],
  dueAt: "",
  dueWindow: "Sem data",
  specificDate: "",
  size: "Média",
  status: "planned",
  dependencies: [],
  completionCriteria: "",
  blockedReason: "",
  decisionRequired: "",
});

const stateLabels = {
  planned: "Planejada",
  active: "Em foco",
  blocked: "Bloqueada",
  decision: "Decisão pendente",
  completed: "Concluída",
  dismissed: "Dispensada",
};
const stageTypes = [
  "planning",
  "implementation",
  "validation",
  "integration",
  "release",
  "deployment",
  "stability",
  "monitoring",
  "decision",
];
const typeLabels = {
  planning: "Planejamento",
  implementation: "Implementação",
  validation: "Validação",
  integration: "Integração",
  release: "Release",
  deployment: "Deploy",
  stability: "Estabilidade",
  monitoring: "Monitoramento",
  decision: "Decisão",
};
const dateLabel = (date) => {
  if (!date) return "Sem data";
  const value = new Date(`${date}T12:00:00`);
  return Number.isNaN(value.getTime())
    ? "Data inválida"
    : new Intl.DateTimeFormat("pt-BR", {
        day: "2-digit",
        month: "short",
        year: "numeric",
      }).format(value);
};
const stepIsOverdue = (step) =>
  step.dueAt &&
  new Date(`${step.dueAt}T23:59:59`).getTime() < Date.now() &&
  !["completed", "dismissed"].includes(step.status);
const stepSessions = (step) =>
  (props.flow.sessions || []).filter((session) => session.stageId === step.id);
const activeSessionFor = (step) =>
  props.session?.flowId === props.flow.id && props.session?.stageId === step.id;
const statusText = (step) => projectStatusLabel(step);

function changed() {
  props.flow.updatedAt = Date.now();
  emit("change");
}

function openContextPanel() {
  Object.assign(contextForm, {
    objective: project.value.objective,
    description: project.value.description,
    projectTypes: [...project.value.projectTypes],
    stack: [...project.value.stack],
    intendedOutcome: project.value.intendedOutcome,
    targetWindow: project.value.targetWindow || "Sem prazo",
    targetDate: project.value.targetAt || "",
  });
  contextStackDraft.value = "";
  panel.value = "context";
}

function toggleContextValue(key, value) {
  contextForm[key] = contextForm[key].includes(value)
    ? contextForm[key].filter((item) => item !== value)
    : [...contextForm[key], value];
}

function addContextStack() {
  const value = contextStackDraft.value.trim();
  if (!value || contextForm.stack.includes(value)) return;
  contextForm.stack = [...contextForm.stack, value];
  contextStackDraft.value = "";
}

function submitContext() {
  updateProjectContext(props.flow, contextForm);
  panel.value = "";
  changed();
}

function reviewChangedPath(reviewed) {
  acknowledgeProjectPathReview(props.flow, reviewed);
  if (reviewed) activeTab.value = "plan";
  changed();
}

function startQuickAction(action) {
  quickAction.value = quickAction.value === action ? "" : action;
  quickFeedback.value = "";
  quickReason.value = "";
  quickDecision.value = "";
}

function completeNow() {
  if (!actionStep.value) return;
  changeState(actionStep.value, "completed");
  quickFeedback.value = "Passo concluído. O próximo já está pronto.";
  quickAction.value = "";
}

function unblockNow() {
  if (!actionStep.value) return;
  changeState(actionStep.value, "active");
  quickFeedback.value = "Passo desbloqueado.";
  quickAction.value = "";
}

function blockNow() {
  if (!actionStep.value || !quickReason.value.trim()) return;
  actionStep.value.blockedReason = quickReason.value.trim();
  changeState(actionStep.value, "blocked");
  quickFeedback.value = "Impedimento registrado.";
  quickAction.value = "";
}

function decideNow() {
  if (!actionStep.value || !quickDecision.value.trim()) return;
  recordProjectDecision(props.flow, {
    text: quickDecision.value,
    stepId: actionStep.value.id,
    title: actionStep.value.title,
  });
  if (actionStep.value.status === "decision")
    setProjectStepState(props.flow, actionStep.value.id, "active");
  quickFeedback.value = "Decisão registrada.";
  quickAction.value = "";
  quickDecision.value = "";
  changed();
}

function replanNow(choice) {
  if (!actionStep.value) return;
  if (!replan(actionStep.value, choice)) return;
  quickFeedback.value = "Data atualizada sem alterar seu progresso.";
  quickAction.value = "";
}

function captureNow() {
  try {
    addProjectCapture(props.flow, quickCapture);
    quickFeedback.value = "Registro guardado no contexto atual.";
    quickCapture.text = "";
    changed();
  } catch (error) {
    window.alert(error.message);
  }
}

function finishNow(action) {
  try {
    finishProject(props.flow, action);
    changed();
  } catch (error) {
    window.alert(error.message);
  }
}

function saveProjectName() {
  const name =
    String(props.flow.identity.name || "").trim() || "Projeto sem nome";
  props.flow.identity.name = name;
  project.value.projectName = name;
  const decision = project.value.steps.find(
    (step) =>
      step.source === "onboarding" &&
      step.title === "Definir o nome do projeto",
  );
  if (decision && name !== "Projeto sem nome" && decision.status === "decision")
    setProjectStepState(props.flow, decision.id, "completed");
  changed();
}

function openPanel(value) {
  panel.value = panel.value === value ? "" : value;
  if (value === "stage")
    Object.assign(stageForm, {
      name: "",
      type: "implementation",
      dueAt: "",
      dueWindow: "Sem data",
      specificDate: "",
      tools: [...project.value.stack],
      status: "planned",
      dependencies: [],
      size: "Média",
      objective: "",
      blockedReason: "",
      decisionRequired: "",
    });
  if (value === "feature")
    Object.assign(featureForm, {
      name: "",
      area: "Interface",
      tools: [...project.value.stack],
      dueAt: "",
      dueWindow: "Sem data",
      specificDate: "",
      size: "Média",
      status: "planned",
      dependencies: [],
      completionCriteria: "",
      blockedReason: "",
      decisionRequired: "",
    });
}

function toggleTool(form, tool) {
  form.tools = form.tools.includes(tool)
    ? form.tools.filter((item) => item !== tool)
    : [...form.tools, tool];
}

function setStepSize(step) {
  step.size = PROJECT_SIZE_SESSIONS[step.sizeLabel] || step.size;
  changed();
}

function submitStage() {
  try {
    const step = addProjectStage(props.flow, stageForm);
    expandedId.value = step.id;
    panel.value = "";
    changed();
  } catch (error) {
    window.alert(error.message);
  }
}

function submitFeature() {
  try {
    const feature = addProjectFeature(props.flow, featureForm);
    const step = project.value.steps.find(
      (item) => item.featureId === feature.id,
    );
    expandedId.value = step?.id || "";
    panel.value = "";
    changed();
  } catch (error) {
    window.alert(error.message);
  }
}

function changeState(step, state) {
  const details = {};
  if (state === "blocked") {
    if (!step.blockedReason?.trim()) {
      stateDraft.stepId = step.id;
      stateDraft.status = state;
      return;
    }
    details.blockedReason = step.blockedReason.trim();
  }
  if (state === "decision") {
    if (!step.decisionRequired?.trim()) {
      stateDraft.stepId = step.id;
      stateDraft.status = state;
      return;
    }
    details.decisionRequired = step.decisionRequired.trim();
  }
  try {
    setProjectStepState(props.flow, step.id, state, details);
    changed();
  } catch (error) {
    window.alert(error.message);
  }
}

function confirmDraftState(step) {
  try {
    setProjectStepState(props.flow, step.id, stateDraft.status, {
      blockedReason: step.blockedReason,
      decisionRequired: step.decisionRequired,
    });
    stateDraft.stepId = "";
    stateDraft.status = "";
    changed();
  } catch (error) {
    window.alert(error.message);
  }
}

function addChecklist(step) {
  const text = checklistDraft.value.trim();
  if (!text) return;
  step.checklist ||= [];
  step.checklist.push({ id: crypto.randomUUID(), text, done: false });
  checklistDraft.value = "";
  recordProjectStepActivity(props.flow, step.id, "project_checklist_updated");
  changed();
}

function updateFeatureFromChecklist(step) {
  const feature = project.value.features.find(
    (item) => item.id === step.featureId,
  );
  if (!feature) {
    recordProjectStepActivity(props.flow, step.id, "project_checklist_updated");
    changed();
    return;
  }
  const checkpointIds = new Set(
    (feature.checkpoints || []).map((item) => item.id),
  );
  feature.checkpoints = (step.checklist || [])
    .filter((item) => checkpointIds.has(item.id))
    .map((item) => ({
      id: item.id,
      title: item.text,
      status: item.done ? "completed" : "planned",
    }));
  if (step.checklist?.length && step.checklist.every((item) => item.done))
    setProjectStepState(props.flow, step.id, "completed");
  else feature.status = step.status;
  recordProjectStepActivity(props.flow, step.id, "project_checklist_updated");
  changed();
}

function addLink(step) {
  try {
    const url = new URL(linkDraft.url);
    if (!["http:", "https:"].includes(url.protocol)) throw new Error();
    step.links ||= [];
    step.links.push({
      id: crypto.randomUUID(),
      title: linkDraft.title.trim() || url.hostname,
      url: url.href,
    });
    Object.assign(linkDraft, { title: "", url: "" });
    recordProjectStepActivity(props.flow, step.id, "project_link_added");
    changed();
  } catch {
    window.alert("Insira um link válido começando com http:// ou https://.");
  }
}

function addSnippet(step) {
  if (!snippetDraft.code.trim()) return;
  step.snippets ||= [];
  step.snippets.push({
    id: crypto.randomUUID(),
    title: snippetDraft.title.trim() || "Trecho",
    language: snippetDraft.language,
    code: snippetDraft.code,
  });
  Object.assign(snippetDraft, { title: "", language: "javascript", code: "" });
  recordProjectStepActivity(props.flow, step.id, "project_code_saved");
  changed();
}

function replan(step, choice) {
  try {
    rescheduleProjectStep(props.flow, step.id, choice, customDate[step.id]);
    changed();
    return true;
  } catch (error) {
    window.alert(error.message);
    return false;
  }
}

function replanTarget(choice) {
  try {
    rescheduleProjectTarget(props.flow, choice, customDate.targetAt);
    changed();
  } catch (error) {
    window.alert(error.message);
  }
}

function beginSession(step) {
  if (activeSessionFor(step)) closeDialog();
  recordProjectStepActivity(props.flow, step.id, "project_focus_toggled");
  emit("session", step.id);
}
</script>

<template>
  <div class="specialized-experience code-project">
    <div v-if="update" class="code-project__update" role="status">
      Há uma versão atualizada deste Flow (v{{ update.availableVersion }}). Tudo
      o que você já fez continua aqui.
    </div>
    <header class="code-project__header">
      <div class="code-project__title">
        <span class="eyebrow">SEU PROJETO</span>
        <input
          v-model="flow.identity.name"
          aria-label="Nome do projeto"
          maxlength="100"
          @change="saveProjectName"
        />
        <p>
          {{
            project.description || project.intendedOutcome || project.objective
          }}
        </p>
        <div class="code-project__tags">
          <span>{{ project.objective }}</span>
          <span v-for="type in project.projectTypes" :key="type">{{
            type
          }}</span>
          <span v-if="project.stack.length">{{
            project.stack.join(" · ")
          }}</span>
        </div>
      </div>
      <div class="code-project__header-meta">
        <button class="outline" @click="openContextPanel">
          Editar contexto
        </button>
        <details class="code-project__project-details">
          <summary>Detalhes do projeto</summary>
          <span>{{
            project.startAt
              ? `Início ${dateLabel(project.startAt)}`
              : "Início sem data"
          }}</span>
          <span>{{
            project.targetAt
              ? `Prazo atual: ${dateLabel(project.targetAt)}`
              : "Sem prazo definido"
          }}</span>
          <button
            class="text-button"
            aria-label="Excluir Flow"
            @click="emit('delete')"
          >
            Excluir projeto
          </button>
        </details>
        <a
          v-if="project.repositoryUrl"
          :href="project.repositoryUrl"
          target="_blank"
          rel="noreferrer"
          >Abrir repositório ↗</a
        >
      </div>
    </header>
    <div class="code-project__progress-strip">
      <span>{{ stats.completed }} de {{ stats.total }} passos concluídos</span
      ><progress
        aria-label="Progresso do projeto"
        :value="stats.completed"
        :max="stats.total || 1"
      ></progress
      ><strong>Fase atual: {{ project.derivedStage }}</strong>
    </div>

    <nav
      class="code-project__tabs"
      role="tablist"
      aria-label="Áreas do projeto"
    >
      <button
        v-for="tab in tabs"
        :key="tab.id"
        :id="'project-tab-' + tab.id"
        role="tab"
        :aria-selected="activeTab === tab.id"
        :aria-controls="'project-panel-' + tab.id"
        :tabindex="activeTab === tab.id ? 0 : -1"
        @click="activeTab = tab.id"
        @keydown="tabKey($event, tabs, activeTab)"
      >
        {{ tab.label }}<span v-if="tab.id === 'plan'">{{ stats.total }}</span>
      </button>
    </nav>
    <div
      v-show="activeTab === 'now'"
      id="project-panel-now"
      role="tabpanel"
      aria-labelledby="project-tab-now"
      class="code-project__tab-content"
    >
      <section
        v-if="project.pathReview?.pending && !completion.ready"
        class="code-project__path-review"
        role="status"
      >
        <div>
          <strong>Seu caminho mudou.</strong>
          <span>Deseja revisar os próximos passos?</span>
        </div>
        <div class="code-project__actions">
          <button class="outline" @click="reviewChangedPath(true)">
            Revisar passos
          </button>
          <button class="text-button" @click="reviewChangedPath(false)">
            Agora não
          </button>
        </div>
      </section>

      <section v-if="completion.ready" class="code-project__finish">
        <span class="eyebrow">{{
          project.lifecycle === "closed"
            ? "PROJETO ENCERRADO"
            : "TRABALHO PRINCIPAL CONCLUÍDO"
        }}</span>
        <h2>
          {{
            project.lifecycle === "closed"
              ? "Esta versão foi encerrada."
              : "Você chegou ao resultado desta versão."
          }}
        </h2>
        <p>
          {{ completion.completedSteps.length }} passos concluídos ·
          {{ completion.deliveries.length }} entregas ·
          {{ completion.sessions }} períodos de foco ·
          {{ completion.minutes }} min
        </p>
        <div class="code-project__finish-list">
          <strong>O que foi concluído</strong>
          <span
            v-for="item in completion.completedSteps.slice(0, 6)"
            :key="item.id"
          >
            {{ item.title }}
          </span>
        </div>
        <div
          v-if="completion.deliveries.length"
          class="code-project__finish-list"
        >
          <strong>Principais entregas</strong>
          <span v-for="item in completion.deliveries" :key="item.id">
            {{ item.name }}
          </span>
        </div>
        <div
          v-if="completion.decisions.length"
          class="code-project__finish-list"
        >
          <strong>Decisões tomadas</strong>
          <span v-for="item in completion.decisions" :key="item.id">
            {{ item.text }}
          </span>
        </div>
        <div
          v-if="completion.optionalPending.length"
          class="code-project__finish-list"
        >
          <strong>Pendências opcionais</strong>
          <span v-for="item in completion.optionalPending" :key="item">
            {{ item }}
          </span>
        </div>
        <div class="code-project__actions">
          <button
            v-if="project.lifecycle !== 'closed'"
            class="dark-button"
            @click="finishNow('close')"
          >
            Encerrar
          </button>
          <button class="outline" @click="finishNow('evolve')">
            Continuar evoluindo
          </button>
          <button class="outline" @click="finishNow('new-version')">
            Iniciar nova versão
          </button>
        </div>
      </section>

      <section v-else class="code-project__now">
        <div class="code-project__section-title">
          <div>
            <span class="eyebrow">RETOME DE ONDE PAROU</span>
            <p v-if="resume.lastWorkedStep" class="code-project__last-worked">
              Último passo trabalhado: {{ resume.lastWorkedStep.title }}
            </p>
            <h2>{{ actionStep?.title || "Escolha seu próximo passo" }}</h2>
          </div>
          <span
            v-if="actionStep"
            class="code-project__status"
            :class="`is-${actionStep.status}`"
            >{{ statusText(actionStep) }}</span
          >
        </div>
        <p v-if="actionStep">{{ actionStep.objective }}</p>
        <p v-else>Escolha um passo no plano para continuar construindo.</p>
        <div v-if="actionStep" class="code-project__resume-signals">
          <span>{{ resume.pendingChecklist.length }} ações pendentes</span>
          <span v-if="blockers.length">{{ blockers.length }} impedimentos</span>
          <span v-if="decisions.length">{{ decisions.length }} decisões</span>
          <span v-if="stats.overdue">{{ stats.overdue }} datas para rever</span>
        </div>
        <button
          v-if="!actionStep"
          class="dark-button"
          @click="activeTab = 'plan'"
        >
          Abrir meu plano →
        </button>
        <div v-if="actionStep" class="code-project__actions">
          <button class="dark-button" @click="expandedId = actionStep.id">
            Continuar daqui →
          </button>
          <button class="outline" @click="completeNow">Concluir</button>
          <button
            v-if="actionStep.status === 'blocked'"
            class="outline"
            @click="unblockNow"
          >
            Desbloquear
          </button>
          <button v-else class="outline" @click="startQuickAction('block')">
            Bloquear
          </button>
          <button class="outline" @click="startQuickAction('decision')">
            Registrar decisão
          </button>
          <button class="outline" @click="startQuickAction('replan')">
            Replanejar
          </button>
          <button
            v-if="!activeSessionFor(actionStep)"
            class="outline"
            @click="beginSession(actionStep)"
          >
            Iniciar foco · {{ project.sessionDuration }}
          </button>
          <button v-else class="outline" @click="beginSession(actionStep)">
            Encerrar foco · {{ Math.floor(seconds / 60) }} min
          </button>
        </div>
        <p
          v-if="quickFeedback"
          class="code-project__quick-feedback"
          role="status"
        >
          {{ quickFeedback }}
        </p>
        <form
          v-if="quickAction === 'block'"
          class="code-project__quick-form"
          @submit.prevent="blockNow"
        >
          <label
            >O que está impedindo este passo?<input
              v-model="quickReason"
              required
              maxlength="180"
          /></label>
          <button class="dark-button" type="submit">Salvar impedimento</button>
        </form>
        <form
          v-if="quickAction === 'decision'"
          class="code-project__quick-form"
          @submit.prevent="decideNow"
        >
          <label
            >Qual decisão foi tomada?<input
              v-model="quickDecision"
              required
              maxlength="240"
          /></label>
          <button class="dark-button" type="submit">Registrar</button>
        </form>
        <div v-if="quickAction === 'replan'" class="code-project__quick-form">
          <span>Quando quer retomar este passo?</span>
          <div class="code-project__actions">
            <button class="outline" @click="replanNow('esta-semana')">
              Esta semana
            </button>
            <button class="outline" @click="replanNow('proxima-semana')">
              Próxima semana
            </button>
            <label
              >Data<input v-model="customDate[actionStep.id]" type="date"
            /></label>
            <button class="outline" @click="replanNow('data')">Aplicar</button>
            <button class="text-button" @click="replanNow('remover')">
              Sem data
            </button>
          </div>
        </div>
      </section>

      <section
        v-if="!completion.ready && nextStep && nextStep.id !== actionStep?.id"
        class="code-project__next"
      >
        <div>
          <span class="eyebrow">DEPOIS DISSO</span>
          <h3>{{ nextStep.title }}</h3>
          <p>{{ nextStep.objective }}</p>
        </div>
        <button class="outline" @click="expandedId = nextStep.id">
          Ver próximo passo
        </button>
      </section>

      <section v-if="!completion.ready" class="code-project__capture">
        <div>
          <span class="eyebrow">GUARDAR SEM PARAR</span>
          <h3>Anote e volte ao trabalho.</h3>
        </div>
        <form @submit.prevent="captureNow">
          <div class="code-project__capture-kinds">
            <button
              v-for="kind in [
                { id: 'step', label: 'Passo' },
                { id: 'bug', label: 'Bug' },
                { id: 'idea', label: 'Ideia' },
              ]"
              :key="kind.id"
              type="button"
              :aria-pressed="quickCapture.kind === kind.id"
              @click="quickCapture.kind = kind.id"
            >
              {{ kind.label }}
            </button>
          </div>
          <input
            v-model="quickCapture.text"
            :aria-label="`Nova captura: ${quickCapture.kind}`"
            placeholder="O que você quer guardar?"
            maxlength="160"
            required
          />
          <button class="dark-button" type="submit">Guardar</button>
        </form>
        <div v-if="recentCaptures.length" class="code-project__capture-list">
          <span v-for="item in recentCaptures" :key="item.id">
            <small>{{
              item.kind === "bug"
                ? "Bug"
                : item.kind === "idea"
                  ? "Ideia"
                  : "Passo"
            }}</small>
            {{ item.text }}
          </span>
        </div>
      </section>
    </div>
    <div
      v-show="activeTab === 'plan'"
      id="project-panel-plan"
      role="tabpanel"
      aria-labelledby="project-tab-plan"
      class="code-project__tab-content"
    >
      <section class="code-project__roadmap">
        <div class="code-project__plan-surface">
          <div class="code-project__plan-heading">
            <div>
              <span class="eyebrow">PASSO A PASSO</span>
              <h2>O caminho até a entrega</h2>
              <p>Veja o que já foi feito e escolha o próximo passo.</p>
            </div>
            <div class="code-project__actions">
              <button class="outline" @click="openPanel('stage')">
                + Novo passo</button
              ><button class="dark-button" @click="openPanel('feature')">
                + Nova funcionalidade
              </button>
            </div>
          </div>
          <div class="code-project__filters" aria-label="Filtrar passos">
            <button
              v-for="filter in [
                { id: 'all', label: 'Todas' },
                { id: 'pending', label: 'A fazer' },
                { id: 'completed', label: 'Concluídas' },
                { id: 'blocked', label: 'Bloqueadas' },
              ]"
              :key="filter.id"
              :aria-pressed="stepFilter === filter.id"
              @click="stepFilter = filter.id"
            >
              {{ filter.label }}
            </button>
          </div>
          <div class="code-project__roadmap-list">
            <article
              v-for="step in visibleSteps"
              :key="step.id"
              class="code-project__step"
              :class="{
                'is-focus': step.isFocus,
                'is-expanded': expandedId === step.id,
              }"
            >
              <button
                class="code-project__step-trigger"
                aria-haspopup="dialog"
                @click="expandedId = step.id"
              >
                <span class="code-project__step-order">{{
                  String(step.order + 1).padStart(2, "0")
                }}</span>
                <span class="code-project__step-copy"
                  ><strong>{{ step.title }}</strong
                  ><small
                    >{{ typeLabels[step.type] || step.type }} ·
                    {{ statusText(step)
                    }}<template v-if="step.isFocus">
                      · Foco atual</template
                    ></small
                  ></span
                >
                <span
                  class="code-project__step-date"
                  :class="{ overdue: stepIsOverdue(step) }"
                  >{{ step.dueAt ? dateLabel(step.dueAt) : "Sem data" }}</span
                >
                <span aria-hidden="true">{{
                  expandedId === step.id ? "−" : "+"
                }}</span>
              </button>
            </article>
            <p v-if="!visibleSteps.length" class="code-project__empty">
              Não há passos neste filtro. Escolha outro filtro ou adicione um
              novo passo.
            </p>
          </div>
        </div>
      </section>

      <section
        v-if="stats.overdueSteps.length || stats.targetOverdue"
        class="code-project__signal code-project__signal--date"
      >
        <div>
          <span class="eyebrow">DATAS PARA REVER</span>
          <h3>Alguma data já passou</h3>
          <p>
            Escolha uma nova data quando estiver pronto. Seu progresso não muda.
          </p>
        </div>
        <button
          v-for="step in stats.overdueSteps"
          :key="step.id"
          class="outline"
          @click="expandedId = step.id"
        >
          {{ step.title }} · {{ dateLabel(step.dueAt) }}
        </button>
        <div v-if="stats.targetOverdue" class="code-project__target-replan">
          <strong
            >O prazo do projeto passou ·
            {{ dateLabel(project.targetAt) }}</strong
          >
          <button class="outline" @click="replanTarget('esta-semana')">
            Esta semana
          </button>
          <button class="outline" @click="replanTarget('proxima-semana')">
            Próxima semana
          </button>
          <label
            >Data específica<input
              v-model="customDate.targetAt"
              type="date"
            /><button class="outline" @click="replanTarget('data')">
              Aplicar data
            </button></label
          >
          <button class="text-button" @click="replanTarget('remover')">
            Remover prazo
          </button>
        </div>
      </section>
      <section class="code-project__signals">
        <article class="code-project__signal code-project__signal--blocker">
          <span class="eyebrow">O QUE ESTÁ IMPEDINDO</span>
          <h3>
            {{ blockers.length }}
            {{ blockers.length === 1 ? "impedimento" : "impedimentos" }}
          </h3>
          <p v-if="!blockers.length">
            Nada está impedindo o projeto de avançar.
          </p>
          <button
            v-for="step in blockers"
            :key="step.id"
            class="outline"
            @click="expandedId = step.id"
          >
            {{ step.title }} · {{ step.blockedReason }}
          </button>
        </article>
        <article class="code-project__signal">
          <span class="eyebrow">DECISÕES</span>
          <h3>{{ decisions.length }} pendentes</h3>
          <p v-if="!decisions.length">Nenhuma escolha pendente agora.</p>
          <button
            v-for="step in decisions"
            :key="step.id"
            class="outline"
            @click="expandedId = step.id"
          >
            {{ step.title }} · {{ step.decisionRequired }}
          </button>
        </article>
      </section>
    </div>
    <div
      v-show="activeTab === 'growth'"
      id="project-panel-growth"
      role="tabpanel"
      aria-labelledby="project-tab-growth"
      class="code-project__tab-content"
    >
      <section class="code-project__growth-hero">
        <div class="code-project__growth-count">
          <strong>{{ stats.completed }}</strong>
          <span>passos concluídos</span>
        </div>
        <div>
          <span class="eyebrow">CADA PASSO CONTA</span>
          <h2>
            {{
              stats.completed
                ? "Veja o que você já construiu"
                : "Seu progresso começa no próximo passo"
            }}
          </h2>
          <p>
            Fase atual: {{ project.derivedStage }}. Você concluiu
            {{ stats.completed }} de {{ stats.total }} passos. Avance no seu
            ritmo.
          </p>
        </div>
      </section>
      <section class="code-project__overview">
        <div class="code-project__section-title">
          <div>
            <span class="eyebrow">RESUMO</span>
            <h2>Como o projeto está avançando</h2>
          </div>
        </div>
        <div class="code-project__metrics">
          <article>
            <small>PASSOS</small><strong>{{ stats.total }}</strong
            ><span
              >{{ stats.completed }} concluídas ·
              {{ stats.active }} ativas</span
            >
          </article>
          <article>
            <small>IMPEDIMENTOS</small><strong>{{ stats.blocked }}</strong
            ><span>{{ stats.decisions }} decisões pendentes</span>
          </article>
          <article>
            <small>RITMO</small><strong>{{ stats.pacePerWeek ?? "—" }}</strong
            ><span>{{
              stats.pacePerWeek === null
                ? "Mais dados em breve"
                : "passos por semana"
            }}</span>
          </article>
          <article>
            <small>SESSÕES · TEMPO</small
            ><strong>{{ stats.sessions }} · {{ stats.minutes }} min</strong
            ><span
              >{{ stats.featuresCompleted }}/{{
                stats.features
              }}
              funcionalidades concluídas</span
            >
          </article>
        </div>
      </section>

      <section class="code-project__reports">
        <span class="eyebrow">PREVISÃO</span>
        <h2>Quanto falta para terminar?</h2>
        <p>
          Você concluiu {{ stats.completed }} de {{ stats.total }} passos. Há
          {{ stats.blocked }} impedimentos, {{ stats.decisions }} decisões
          pendentes e {{ stats.overdue }} datas para rever.
        </p>
        <p v-if="stats.estimateAt !== null">
          Pelo seu ritmo até aqui, faltam cerca de
          {{ stats.remainingSessions }} períodos de foco. A previsão é terminar
          em
          {{
            dateLabel(new Date(stats.estimateAt).toISOString().slice(0, 10))
          }}.
        </p>
        <p v-else-if="stats.remainingSessions !== null">
          Faltam cerca de {{ stats.remainingSessions }} períodos de foco. Com
          mais passos concluídos, o Noma poderá sugerir uma data.
        </p>
        <p v-else>
          Informe quanto trabalho cada passo deve levar para o Noma calcular
          quanto ainda falta. A data só aparece quando houver dados suficientes.
        </p>
        <button class="outline" @click="emit('review')">
          Fazer uma revisão
        </button>
      </section>

      <section class="code-project__completed">
        <h3>Entregas realizadas</h3>
        <p v-if="!stats.completed" class="subtle">
          Quando você concluir um passo, ele aparecerá aqui. Usar o tempo de
          foco é opcional.
        </p>
        <button
          v-for="step in ordered.filter((item) => item.status === 'completed')"
          :key="step.id"
          @click="expandedId = step.id"
        >
          <span aria-hidden="true">✓</span><strong>{{ step.title }}</strong
          ><span>Ver entrega ↗</span>
        </button>
      </section>
    </div>
    <dialog
      ref="dialog"
      class="code-project__dialog"
      :aria-labelledby="
        panel ? 'code-project-form-title' : 'project-dialog-title'
      "
      @cancel.prevent="closeDialog"
      @click="$event.target === dialog && closeDialog()"
      @keydown.esc.stop
      @keydown.tab="trapDialogFocus"
    >
      <div class="code-project__dialog-inner">
        <button
          class="code-project__dialog-close icon-button"
          aria-label="Fechar etapa ou formulário"
          @click="closeDialog"
        >
          ×
        </button>
        <div
          v-for="step in selectedStep ? [selectedStep] : []"
          :key="step.id"
          class="code-project__step-workspace"
        >
          <div class="code-project__workspace-heading">
            <div>
              <span class="eyebrow">UM PASSO DE CADA VEZ</span>
              <h2 id="project-dialog-title" tabindex="-1">{{ step.title }}</h2>
              <p>{{ step.objective }}</p>
            </div>
            <span class="code-project__status" :class="`is-${step.status}`">{{
              statusText(step)
            }}</span>
          </div>
          <div
            v-if="step.status === 'blocked'"
            class="code-project__required-context"
          >
            <strong>O que está bloqueando</strong>
            <p>{{ step.blockedReason }}</p>
          </div>
          <div
            v-if="step.status === 'decision'"
            class="code-project__required-context"
          >
            <strong>Decisão necessária</strong>
            <p>{{ step.decisionRequired }}</p>
          </div>
          <div
            v-if="step.dependencies?.length"
            class="code-project__dependencies"
          >
            <strong>Dependências</strong
            ><span v-for="id in step.dependencies" :key="id"
              >{{
                ordered.find((item) => item.id === id)?.title ||
                "Etapa removida"
              }}
              ·
              {{
                stateLabels[ordered.find((item) => item.id === id)?.status] ||
                "Planejada"
              }}</span
            ><small
              >Este passo não será sugerido até os anteriores terminarem.</small
            >
          </div>
          <nav
            class="code-project__tabs code-project__tabs--workspace"
            role="tablist"
            aria-label="Áreas deste passo"
          >
            <button
              v-for="tab in workspaceTabs"
              :key="tab.id"
              :id="'step-tab-' + tab.id"
              role="tab"
              :aria-selected="workspaceTab === tab.id"
              :aria-controls="'step-panel-' + tab.id"
              :tabindex="workspaceTab === tab.id ? 0 : -1"
              @click="workspaceTab = tab.id"
              @keydown="tabKey($event, workspaceTabs, workspaceTab)"
            >
              {{ tab.label }}
            </button>
          </nav>

          <div
            v-show="workspaceTab === 'execution'"
            id="step-panel-execution"
            role="tabpanel"
            aria-labelledby="step-tab-execution"
            class="code-project__workspace-grid"
          >
            <section class="code-project__subsection">
              <h4>Passo a passo</h4>
              <div
                v-if="step.checklist?.length"
                class="code-project__progress-strip"
              >
                <span
                  >{{ step.checklist.filter((item) => item.done).length }} de
                  {{ step.checklist.length }} feitos</span
                >
                <progress
                  aria-label="Progresso da etapa"
                  :value="step.checklist.filter((item) => item.done).length"
                  :max="step.checklist.length"
                ></progress>
              </div>
              <ul v-if="step.checklist?.length">
                <li v-for="item in step.checklist" :key="item.id">
                  <label
                    ><input
                      v-model="item.done"
                      type="checkbox"
                      @change="updateFeatureFromChecklist(step)"
                    /><span :class="{ done: item.done }">{{
                      item.text
                    }}</span></label
                  >
                </li>
              </ul>
              <p v-else class="subtle">
                Divida este passo em ações pequenas e fáceis de concluir.
              </p>
              <form
                class="code-project__inline-form"
                @submit.prevent="addChecklist(step)"
              >
                <input
                  v-model="checklistDraft"
                  aria-label="Nova ação"
                  placeholder="Qual é a próxima ação?"
                /><button class="outline" type="submit">Adicionar</button>
              </form>
            </section>
            <section class="code-project__subsection">
              <h4>Tempo de foco</h4>
              <button class="outline" @click="beginSession(step)">
                {{
                  activeSessionFor(step)
                    ? `Encerrar sessão · ${Math.floor(seconds / 60)} min`
                    : `Iniciar sessão · ${project.sessionDuration}`
                }}
              </button>
              <p>
                {{ stepSessions(step).length }} períodos de foco feitos neste
                passo
              </p>
            </section>
            <div class="code-project__execution-actions">
              <button
                class="dark-button"
                :disabled="step.status === 'completed'"
                @click="changeState(step, 'completed')"
              >
                {{
                  step.status === "completed"
                    ? "Passo concluído"
                    : "Concluir este passo"
                }}</button
              ><button
                v-if="
                  !step.isFocus &&
                  !['completed', 'dismissed'].includes(step.status)
                "
                class="outline"
                @click="changeState(step, 'active')"
              >
                Fazer agora</button
              ><span class="subtle"
                >Seu progresso é salvo automaticamente.</span
              >
            </div>
          </div>
          <div
            v-show="workspaceTab === 'context'"
            id="step-panel-context"
            role="tabpanel"
            aria-labelledby="step-tab-context"
            class="code-project__workspace-grid"
          >
            <section class="code-project__subsection">
              <h4>Notas</h4>
              <textarea
                v-model="step.notes"
                aria-label="Notas da etapa"
                rows="4"
                placeholder="Guarde aqui ideias, detalhes e decisões"
                @input="dialogDirty = true"
                @change="saveDialogChange"
              ></textarea>
            </section>
            <section class="code-project__subsection">
              <h4>Links relacionados</h4>
              <a
                v-for="link in step.links"
                :key="link.id || link.url"
                :href="link.url"
                target="_blank"
                rel="noreferrer"
                >{{ link.title || link.url }} ↗</a
              >
              <form
                class="code-project__link-form"
                @submit.prevent="addLink(step)"
              >
                <input
                  v-model="linkDraft.title"
                  aria-label="Nome do link"
                  placeholder="Nome"
                /><input
                  v-model="linkDraft.url"
                  aria-label="URL relacionada"
                  type="url"
                  placeholder="https://"
                  required
                /><button class="outline" type="submit">Salvar link</button>
              </form>
            </section>
            <details class="code-project__resource">
              <summary>
                Código e testes <span>Trechos de código e rascunhos</span>
              </summary>
              <section class="code-project__subsection">
                <h4>Trechos de código e área de testes</h4>
                <input
                  v-model="snippetDraft.title"
                  aria-label="Nome do trecho de código"
                  placeholder="Nome do trecho"
                /><select
                  v-model="snippetDraft.language"
                  aria-label="Linguagem do trecho de código"
                >
                  <option>javascript</option>
                  <option>typescript</option>
                  <option>python</option>
                  <option>html</option>
                  <option>css</option>
                  <option>json</option></select
                ><textarea
                  v-model="snippetDraft.code"
                  rows="3"
                  placeholder="Trecho de código contextual"
                ></textarea
                ><button class="outline" @click="addSnippet(step)">
                  Guardar trecho
                </button>
                <pre
                  v-for="snippet in step.snippets"
                  :key="snippet.id"
                ><code>{{ snippet.code }}</code></pre>
                <label
                  >Área livre para testar código<textarea
                    v-model="step.scratchpad"
                    rows="4"
                    placeholder="Teste uma ideia para este passo"
                    @input="dialogDirty = true"
                    @change="saveDialogChange"
                  ></textarea>
                </label>
              </section>
            </details>
            <section
              v-if="['release', 'deployment', 'monitoring'].includes(step.type)"
              class="code-project__subsection"
            >
              <h4>Publicação</h4>
              <label
                >URL publicada<input
                  v-model="step.deployUrl"
                  type="url"
                  placeholder="https://"
                  @change="changed"
              /></label>
              <p>Cole aqui o endereço da versão publicada.</p>
            </section>
          </div>
          <div
            v-show="workspaceTab === 'settings'"
            id="step-panel-settings"
            role="tabpanel"
            aria-labelledby="step-tab-settings"
            class="code-project__workspace-grid"
          >
            <section class="code-project__subsection">
              <h4>Data e tamanho</h4>
              <label
                >Data flexível<input
                  v-model="step.dueAt"
                  type="date"
                  @change="changed" /></label
              ><label
                >Tamanho do passo<select
                  v-model="step.sizeLabel"
                  @change="setStepSize(step)"
                >
                  <option
                    v-for="(_, label) in PROJECT_SIZE_SESSIONS"
                    :key="label"
                  >
                    {{ label }}
                  </option>
                </select></label
              ><span
                v-if="stepIsOverdue(step)"
                class="code-project__overdue-note"
                >A data passou. Seu progresso permanece igual; você pode
                replanejar.</span
              >
            </section>
            <section class="code-project__subsection">
              <h4>Tecnologias usadas</h4>
              <div class="code-project__tags">
                <span v-for="tool in step.tools" :key="tool">{{ tool }}</span>
              </div>
              <p class="subtle">Tecnologias escolhidas para este passo.</p>
            </section>
            <div class="code-project__state-actions">
              <strong>Como está este passo?</strong
              ><button
                v-for="(label, state) in stateLabels"
                :key="state"
                class="outline"
                :aria-pressed="step.status === state"
                :disabled="step.status === state"
                @click="changeState(step, state)"
              >
                {{ label }}
              </button>
            </div>
            <form
              v-if="stateDraft.stepId === step.id"
              class="code-project__state-reason"
              @submit.prevent="confirmDraftState(step)"
            >
              <label v-if="stateDraft.status === 'blocked'"
                >O que está impedindo este passo?<textarea
                  v-model="step.blockedReason"
                  required
                  rows="2"
                ></textarea></label
              ><label v-else
                >Qual decisão precisa ser tomada?<textarea
                  v-model="step.decisionRequired"
                  required
                  rows="2"
                ></textarea></label
              ><button class="dark-button" type="submit">Salvar</button
              ><button
                class="text-button"
                type="button"
                @click="
                  stateDraft.stepId = '';
                  stateDraft.status = '';
                "
              >
                Cancelar
              </button>
            </form>
            <div v-if="stepIsOverdue(step)" class="code-project__replan">
              <strong>Replanejar data</strong
              ><button class="outline" @click="replan(step, 'esta-semana')">
                Esta semana</button
              ><button class="outline" @click="replan(step, 'proxima-semana')">
                Próxima semana</button
              ><label
                >Data específica<input
                  v-model="customDate[step.id]"
                  type="date"
                /><button class="outline" @click="replan(step, 'data')">
                  Aplicar data
                </button></label
              ><button class="text-button" @click="replan(step, 'remover')">
                Remover data
              </button>
            </div>
          </div>
        </div>
        <section
          v-if="panel"
          class="code-project__form-panel"
          aria-labelledby="code-project-form-title"
        >
          <div class="code-project__section-title">
            <div>
              <span class="eyebrow">{{
                panel === "context"
                  ? "AJUSTAR SEM RECOMEÇAR"
                  : "ADICIONAR AO PLANO"
              }}</span>
              <h2 id="code-project-form-title">
                {{
                  panel === "context"
                    ? "Contexto do projeto"
                    : panel === "stage"
                      ? "Novo passo"
                      : "Nova funcionalidade"
                }}
              </h2>
            </div>
          </div>
          <form
            v-if="panel === 'context'"
            class="code-project__form"
            @submit.prevent="submitContext"
          >
            <label
              >O que você quer realizar?<select v-model="contextForm.objective">
                <option v-for="item in PROJECT_OBJECTIVES" :key="item">
                  {{ item }}
                </option>
              </select></label
            ><label
              >Objetivo em suas palavras · opcional<textarea
                v-model="contextForm.description"
                rows="2"
                placeholder="O que este projeto precisa entregar?"
              ></textarea>
            </label>
            <fieldset class="code-project__quick-options">
              <legend>Tipo de projeto</legend>
              <button
                v-for="type in PROJECT_TYPES"
                :key="type"
                type="button"
                :aria-pressed="contextForm.projectTypes.includes(type)"
                @click="toggleContextValue('projectTypes', type)"
              >
                {{ type }}
              </button>
            </fieldset>
            <fieldset>
              <legend>Tecnologias</legend>
              <div class="code-project__context-stack">
                <button
                  v-for="technology in contextForm.stack"
                  :key="technology"
                  type="button"
                  class="outline"
                  :aria-label="`Remover ${technology}`"
                  @click="toggleContextValue('stack', technology)"
                >
                  {{ technology }} ×
                </button>
              </div>
              <div class="code-project__inline-form">
                <input
                  v-model="contextStackDraft"
                  list="code-project-stack-options"
                  placeholder="Adicionar tecnologia"
                  @keydown.enter.prevent="addContextStack"
                />
                <datalist id="code-project-stack-options">
                  <option
                    v-for="item in STACK_CATALOG"
                    :key="item"
                    :value="item"
                  />
                </datalist>
                <button class="outline" type="button" @click="addContextStack">
                  Adicionar
                </button>
              </div>
            </fieldset>
            <label
              >Quando esta versão estará pronta?<input
                v-model="contextForm.intendedOutcome"
                list="code-project-outcome-options"
              />
              <datalist id="code-project-outcome-options">
                <option
                  v-for="item in contextOutcomes"
                  :key="item"
                  :value="item"
                />
              </datalist>
            </label>
            <label
              >Janela geral<select v-model="contextForm.targetWindow">
                <option>Sem prazo</option>
                <option>Esta semana</option>
                <option>Próxima semana</option>
                <option>7 dias</option>
                <option>2 semanas</option>
                <option>1 mês</option>
                <option>3 meses</option>
                <option>Data específica</option>
              </select></label
            ><label v-if="contextForm.targetWindow === 'Data específica'"
              >Data<input v-model="contextForm.targetDate" type="date" required
            /></label>
            <p class="subtle">
              Seus passos atuais serão preservados. Se o caminho precisar de
              revisão, o Noma apenas avisará.
            </p>
            <footer>
              <button class="outline" type="button" @click="panel = ''">
                Cancelar</button
              ><button class="dark-button" type="submit">
                Salvar contexto
              </button>
            </footer>
          </form>
          <form
            v-else-if="panel === 'stage'"
            class="code-project__form"
            @submit.prevent="submitStage"
          >
            <label
              >Nome do passo<input
                v-model="stageForm.name"
                required
                maxlength="120" /></label
            ><label
              >Que tipo de trabalho é?<select v-model="stageForm.type">
                <option v-for="type in stageTypes" :key="type" :value="type">
                  {{ typeLabels[type] }}
                </option>
              </select></label
            ><label
              >Quando pretende fazer?<select v-model="stageForm.dueWindow">
                <option>Sem data</option>
                <option>Esta semana</option>
                <option>Próxima semana</option>
                <option>Data específica</option>
              </select></label
            ><label v-if="stageForm.dueWindow === 'Data específica'"
              >Data<input
                v-model="stageForm.specificDate"
                type="date"
                required /></label
            ><label
              >Como este passo começa?<select v-model="stageForm.status">
                <option
                  v-for="(label, state) in stateLabels"
                  :key="state"
                  :value="state"
                >
                  {{ label }}
                </option>
              </select></label
            ><label
              >Precisa de outro passo antes?<select
                v-model="stageForm.dependencies"
                multiple
              >
                <option v-for="step in ordered" :key="step.id" :value="step.id">
                  {{ step.title }}
                </option></select
              ><small
                >Opcional. O Noma só recomendará este passo quando os anteriores
                terminarem.</small
              ></label
            ><label
              >Tamanho<select v-model="stageForm.size">
                <option
                  v-for="(_, label) in PROJECT_SIZE_SESSIONS"
                  :key="label"
                >
                  {{ label }}
                </option>
              </select></label
            ><label
              >O que precisa estar pronto ao terminar?<textarea
                v-model="stageForm.objective"
                rows="2"
              ></textarea>
            </label>
            <fieldset>
              <legend>Tecnologias deste passo</legend>
              <p v-if="!project.stack.length" class="subtle">
                Nenhuma tecnologia foi informada para este projeto.
              </p>
              <button
                v-for="tool in STACK_CATALOG.filter((item) =>
                  project.stack.includes(item),
                )"
                :key="tool"
                type="button"
                class="outline"
                :aria-pressed="stageForm.tools.includes(tool)"
                @click="toggleTool(stageForm, tool)"
              >
                {{ tool }}</button
              ><button
                v-for="tool in project.stack.filter(
                  (item) => !STACK_CATALOG.includes(item),
                )"
                :key="tool"
                type="button"
                class="outline"
                :aria-pressed="stageForm.tools.includes(tool)"
                @click="toggleTool(stageForm, tool)"
              >
                {{ tool }}
              </button>
            </fieldset>
            <label v-if="stageForm.status === 'blocked'"
              >Motivo do bloqueio<textarea
                v-model="stageForm.blockedReason"
                required
                rows="2"
              ></textarea></label
            ><label v-if="stageForm.status === 'decision'"
              >Decisão necessária<textarea
                v-model="stageForm.decisionRequired"
                required
                rows="2"
              ></textarea>
            </label>
            <footer>
              <button class="outline" type="button" @click="panel = ''">
                Cancelar</button
              ><button class="dark-button" type="submit">
                Adicionar passo
              </button>
            </footer>
          </form>
          <form
            v-else
            class="code-project__form"
            @submit.prevent="submitFeature"
          >
            <label
              >Nome da funcionalidade<input
                v-model="featureForm.name"
                required
                maxlength="120"
            /></label>
            <fieldset class="code-project__quick-options">
              <legend>Parte do projeto</legend>
              <button
                v-for="area in FEATURE_AREAS"
                :key="area"
                type="button"
                :aria-pressed="featureForm.area === area"
                @click="featureForm.area = area"
              >
                {{ area }}
              </button>
            </fieldset>
            ><label
              >Quando pretende fazer?<select v-model="featureForm.dueWindow">
                <option>Sem data</option>
                <option>Esta semana</option>
                <option>Próxima semana</option>
                <option>Data específica</option>
              </select></label
            ><label v-if="featureForm.dueWindow === 'Data específica'"
              >Data<input
                v-model="featureForm.specificDate"
                type="date"
                required /></label
            ><label
              >Tamanho<select v-model="featureForm.size">
                <option
                  v-for="(_, label) in PROJECT_SIZE_SESSIONS"
                  :key="label"
                >
                  {{ label }}
                </option>
              </select></label
            ><label
              >Como esta funcionalidade começa?<select
                v-model="featureForm.status"
              >
                <option
                  v-for="(label, state) in stateLabels"
                  :key="state"
                  :value="state"
                >
                  {{ label }}
                </option>
              </select></label
            ><label
              >Precisa de outro passo antes?<select
                v-model="featureForm.dependencies"
                multiple
              >
                <option v-for="step in ordered" :key="step.id" :value="step.id">
                  {{ step.title }}
                </option>
              </select></label
            ><label
              >Como você saberá que está pronta? · opcional<textarea
                v-model="featureForm.completionCriteria"
                rows="2"
              ></textarea>
            </label>
            <fieldset>
              <legend>Tecnologias desta funcionalidade</legend>
              <p v-if="!project.stack.length" class="subtle">
                Nenhuma tecnologia foi informada para este projeto.
              </p>
              <button
                v-for="tool in STACK_CATALOG.filter((item) =>
                  project.stack.includes(item),
                )"
                :key="tool"
                type="button"
                class="outline"
                :aria-pressed="featureForm.tools.includes(tool)"
                @click="toggleTool(featureForm, tool)"
              >
                {{ tool }}</button
              ><button
                v-for="tool in project.stack.filter(
                  (item) => !STACK_CATALOG.includes(item),
                )"
                :key="tool"
                type="button"
                class="outline"
                :aria-pressed="featureForm.tools.includes(tool)"
                @click="toggleTool(featureForm, tool)"
              >
                {{ tool }}
              </button>
            </fieldset>
            <label v-if="featureForm.status === 'blocked'"
              >Motivo do bloqueio<textarea
                v-model="featureForm.blockedReason"
                required
                rows="2"
              ></textarea></label
            ><label v-if="featureForm.status === 'decision'"
              >Decisão necessária<textarea
                v-model="featureForm.decisionRequired"
                required
                rows="2"
              ></textarea>
            </label>
            <p class="subtle">
              O Noma criará quatro ações: planejar, construir, testar e
              integrar.
            </p>
            <footer>
              <button class="outline" type="button" @click="panel = ''">
                Cancelar</button
              ><button class="dark-button" type="submit">
                Adicionar funcionalidade
              </button>
            </footer>
          </form>
        </section>
      </div>
    </dialog>
  </div>
</template>

<style scoped>
.code-project__project-details {
  font-size: 0.8rem;
}
.code-project__project-details summary {
  cursor: pointer;
  padding: 0.2rem 0;
}
.code-project__project-details > span {
  display: block;
  margin-top: 0.6rem;
}
.code-project__project-details > button {
  margin-top: 0.6rem;
  color: var(--noma-danger);
}
.code-project__tab-content {
  display: grid;
  gap: 1.25rem;
  min-width: 0;
}
.code-project__tabs {
  display: flex;
  gap: 0.35rem;
  border-bottom: 1px solid var(--noma-border);
}
.code-project__tabs button {
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 0.5rem;
  padding: 0.9rem 1.25rem;
  background: transparent;
  border: 0;
  border-bottom: 3px solid transparent;
  color: var(--noma-ink-soft);
  font: inherit;
  font-weight: 600;
  cursor: pointer;
}
.code-project__tabs button[aria-selected="true"] {
  border-bottom-color: var(--noma-brand);
  color: var(--noma-ink);
}
.code-project__tabs button span {
  font-size: 0.7rem;
  padding: 0.1rem 0.4rem;
  border-radius: 6px;
  background: var(--noma-surface-soft);
}
.code-project__progress-strip {
  display: flex;
  gap: 1rem;
  align-items: center;
  color: var(--noma-ink-soft);
  font-size: 0.8rem;
}
.code-project__progress-strip progress {
  flex: 1;
  min-width: 2rem;
  height: 6px;
  border: none;
  border-radius: 99px;
  accent-color: var(--noma-brand);
  overflow: hidden;
}
.code-project progress::-webkit-progress-bar {
  background: var(--noma-surface-soft);
}
.code-project progress::-webkit-progress-value {
  background: var(--noma-brand);
  border-radius: 99px;
}
.code-project__path-review,
.code-project__finish,
.code-project__capture {
  border: 1px solid var(--noma-border);
  border-radius: 18px;
  background: var(--noma-surface);
}
.code-project__path-review {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 1rem;
  padding: 1rem 1.1rem;
  border-color: color-mix(in srgb, var(--noma-brand) 42%, var(--noma-border));
  background: var(--noma-brand-soft);
}
.code-project__path-review div:first-child,
.code-project__finish-list {
  display: grid;
  gap: 0.25rem;
}
.code-project__path-review span,
.code-project__last-worked,
.code-project__finish p {
  color: var(--noma-ink-soft);
}
.code-project__last-worked {
  margin: 0.35rem 0 0;
  font-size: 0.82rem;
}
.code-project__resume-signals {
  display: flex;
  flex-wrap: wrap;
  gap: 0.45rem;
  margin: 0.8rem 0;
}
.code-project__resume-signals span {
  padding: 0.35rem 0.65rem;
  border-radius: 99px;
  background: var(--noma-surface-soft);
  color: var(--noma-ink-soft);
  font-size: 0.76rem;
}
.code-project__quick-form {
  display: grid;
  gap: 0.7rem;
  margin-top: 1rem;
  padding: 1rem;
  border-radius: 14px;
  background: var(--noma-surface-soft);
}
.code-project__quick-form label {
  display: grid;
  gap: 0.35rem;
  min-width: min(100%, 14rem);
}
.code-project__quick-feedback {
  margin: 0.7rem 0 0;
  color: var(--noma-brand);
  font-size: 0.82rem;
  font-weight: 650;
}
.code-project__finish {
  display: grid;
  gap: 1rem;
  padding: clamp(1.2rem, 3vw, 2rem);
}
.code-project__finish h2,
.code-project__finish p {
  margin: 0;
}
.code-project__finish-list {
  padding: 0.9rem 1rem;
  border-radius: 12px;
  background: var(--noma-surface-soft);
}
.code-project__finish-list span {
  font-size: 0.85rem;
}
.code-project__capture {
  display: grid;
  gap: 0.85rem;
  padding: 1rem 1.1rem;
}
.code-project__capture h3 {
  margin: 0.2rem 0 0;
}
.code-project__capture form {
  display: grid;
  grid-template-columns: auto minmax(12rem, 1fr) auto;
  gap: 0.65rem;
  align-items: center;
}
.code-project__capture-kinds,
.code-project__context-stack {
  display: flex;
  flex-wrap: wrap;
  gap: 0.35rem;
}
.code-project__capture-kinds button {
  padding: 0.45rem 0.7rem;
  border: 1px solid var(--noma-border);
  border-radius: 99px;
  background: transparent;
  color: var(--noma-ink-soft);
  cursor: pointer;
}
.code-project__capture-kinds button[aria-pressed="true"] {
  border-color: var(--noma-brand);
  background: var(--noma-brand-soft);
  color: var(--noma-ink);
}
.code-project__capture-list {
  display: grid;
  gap: 0.4rem;
}
.code-project__capture-list span {
  display: flex;
  gap: 0.6rem;
  align-items: baseline;
  color: var(--noma-ink-soft);
  font-size: 0.82rem;
}
.code-project__capture-list small {
  min-width: 2.5rem;
  color: var(--noma-brand);
  font-weight: 700;
}
.code-project__plan-heading {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 1rem;
}
.code-project__plan-heading h2 {
  margin: 0.3rem 0;
  font-size: 1.35rem;
}
.code-project__plan-heading p {
  color: var(--noma-ink-soft);
  margin: 0.4rem 0;
  font-size: 0.85rem;
}
.code-project__filters {
  display: flex;
  flex-wrap: wrap;
  gap: 0.4rem;
  margin: 1.3rem 0;
}
.code-project__filters button {
  border: 1px solid var(--noma-border);
  border-radius: 99px;
  background: var(--noma-surface);
  color: var(--noma-ink-soft);
  font: inherit;
  font-size: 0.8rem;
  padding: 0.45rem 0.85rem;
  cursor: pointer;
}
.code-project__filters button[aria-pressed="true"] {
  background: var(--noma-brand-soft);
  border-color: var(--noma-brand);
  color: var(--noma-ink);
}
.code-project__empty {
  padding: 2rem 1rem;
  color: var(--noma-ink-soft);
  text-align: center;
}
.code-project__growth-hero {
  display: flex;
  align-items: center;
  gap: 1.5rem;
  padding: 1.5rem 0;
}
.code-project__growth-hero h2 {
  margin: 0.4rem 0;
  font-size: clamp(1.3rem, 3vw, 1.8rem);
}
.code-project__growth-hero p {
  color: var(--noma-ink-soft);
}
.code-project__growth-count {
  display: grid;
  flex: 0 0 8rem;
  gap: 0.2rem;
  padding: 1rem;
  border-radius: 16px;
  background: var(--noma-surface-soft);
}
.code-project__growth-count strong {
  font-size: 2rem;
}
.code-project__growth-count span {
  color: var(--noma-ink-soft);
  font-size: 0.8rem;
}
.code-project__quick-options button[aria-pressed="true"] {
  border-color: var(--noma-brand);
  background: var(--noma-brand-soft);
  color: var(--noma-brand);
}
.code-project__completed {
  display: grid;
  gap: 0.5rem;
}
.code-project__completed button {
  display: flex;
  align-items: center;
  gap: 0.8rem;
  padding: 1rem;
  text-align: left;
  border: 1px solid var(--noma-border);
  border-radius: 12px;
  background: var(--noma-surface);
  color: var(--noma-ink);
  cursor: pointer;
}
.code-project__completed button strong {
  flex: 1;
}
.code-project__completed button span:last-child {
  color: var(--noma-ink-soft);
  font-size: 0.8rem;
}
.code-project__dialog {
  width: min(880px, calc(100vw - 2rem));
  max-height: calc(100dvh - 3rem);
  padding: 0;
  margin: auto;
  border: 1px solid var(--noma-border);
  border-radius: 24px;
  color: var(--noma-ink);
  background: var(--noma-surface);
  box-shadow: 0 24px 100px #0004;
  overscroll-behavior: contain;
}
.code-project__dialog::backdrop {
  background: #101d2c88;
  backdrop-filter: blur(5px);
}
.code-project__dialog-inner {
  position: relative;
  padding: 1.75rem;
}
.code-project__dialog-close {
  position: absolute;
  top: 0.8rem;
  right: 0.8rem;
  z-index: 1;
  font-size: 1.5rem;
}
.code-project__dialog .code-project__step-workspace {
  padding: 0;
  border: 0;
}
.code-project__dialog .code-project__workspace-heading {
  padding-right: 2rem;
}
.code-project__workspace-heading h2 {
  margin: 0.4rem 0;
  font-size: 1.5rem;
}
.code-project__dialog .code-project__form-panel {
  border: 0;
  padding: 0;
}
.code-project__dialog .code-project__subsection {
  background: transparent;
  padding: 1rem;
}
.code-project__dialog .code-project__workspace-grid {
  grid-template-columns: minmax(0, 1fr);
}
.code-project__execution-actions {
  display: flex;
  flex-wrap: wrap;
  align-items: center;
  gap: 0.65rem;
}
.code-project__execution-actions .subtle {
  font-size: 0.75rem;
}
.code-project__resource {
  border: 1px solid var(--noma-border);
  border-radius: 14px;
  overflow: hidden;
}
.code-project__resource summary {
  padding: 1rem;
  cursor: pointer;
  font-weight: 600;
}
.code-project__resource summary span {
  margin-left: 0.5rem;
  font-weight: 400;
  font-size: 0.8rem;
  color: var(--noma-ink-soft);
}
.code-project__resource .code-project__subsection {
  border: 0;
}
.code-project__dialog .code-project__state-reason {
  display: grid;
  gap: 0.5rem;
}
.code-project__dialog .code-project__state-reason textarea {
  display: block;
  width: 100%;
  background: var(--noma-surface-soft);
  color: var(--noma-ink);
  border: 1px solid var(--noma-border);
  border-radius: 8px;
  padding: 0.8rem;
}
.code-project :is(button, a, input, textarea, select, summary):focus-visible {
  outline: 2px solid var(--noma-brand);
  outline-offset: 3px;
}
@media (hover: hover) {
  .code-project__step-trigger:hover {
    background: var(--noma-surface-soft);
  }
  .code-project__tabs button:hover {
    background: var(--noma-surface-soft);
  }
}
@media (max-width: 760px) {
  .code-project .code-project__header-meta {
    display: flex;
    flex-wrap: wrap;
    align-items: start;
    gap: 0.8rem;
  }
  .code-project__tabs button {
    flex: 1;
    padding: 0.8rem 0.5rem;
  }
  .code-project__plan-heading {
    align-items: start;
    flex-direction: column;
  }
  .code-project__growth-hero {
    gap: 1rem;
    align-items: start;
  }
  .code-project__dialog {
    width: calc(100vw - 1rem);
    max-height: calc(100dvh - 1rem);
    border-radius: 18px;
  }
  .code-project__dialog-inner {
    padding: 1.1rem;
  }
  .code-project__progress-strip {
    gap: 0.5rem;
    font-size: 0.72rem;
  }
  .code-project__dialog .code-project__subsection {
    padding: 0.8rem;
  }
}
.code-project {
  gap: 1rem;
}
.code-project__update {
  padding: 0.7rem 0.9rem;
  border-radius: 10px;
  background: var(--noma-surface-soft);
  color: var(--noma-ink-soft);
}
.code-project__header,
.code-project__section-title,
.code-project__workspace-heading {
  display: flex;
  justify-content: space-between;
  align-items: flex-start;
  gap: 1rem;
}
.code-project__header {
  padding: 1.2rem 0 1.4rem;
  border-bottom: 1px solid var(--noma-border);
}
.code-project__title {
  min-width: 0;
}
.code-project__title input {
  display: block;
  width: min(100%, 42rem);
  margin-top: 0.3rem;
  padding: 0;
  border: 0;
  outline-offset: 4px;
  background: transparent;
  color: var(--noma-ink);
  font: inherit;
  font-size: clamp(1.8rem, 4vw, 3rem);
  font-weight: 750;
}
.code-project__title p,
.code-project__next p,
.code-project__workspace-heading p {
  margin: 0.4rem 0;
  color: var(--noma-ink-soft);
}
.code-project__header-meta {
  display: grid;
  gap: 0.6rem;
  justify-items: end;
  color: var(--noma-ink-soft);
  font-size: 0.86rem;
}
.code-project__tags {
  display: flex;
  flex-wrap: wrap;
  gap: 0.35rem;
  margin-top: 0.65rem;
}
.code-project__tags span {
  padding: 0.3rem 0.55rem;
  border-radius: 99px;
  background: var(--noma-surface-soft);
  color: var(--noma-ink-soft);
  font-size: 0.75rem;
}
.code-project__now,
.code-project__next,
.code-project__reports {
  padding: 1.1rem 1.2rem;
  border: 1px solid var(--noma-border);
  border-radius: 18px;
  background: var(--noma-surface);
}
.code-project__now {
  background: var(--noma-brand-soft);
}
.code-project__section-title h2 {
  margin: 0.25rem 0 0;
  font-size: 1.35rem;
}
.code-project__now > p {
  max-width: 52rem;
  color: var(--noma-ink-soft);
}
.code-project__actions,
.code-project__roadmap-actions,
.code-project__state-actions,
.code-project__replan {
  display: flex;
  flex-wrap: wrap;
  align-items: center;
  gap: 0.5rem;
}
.code-project__next {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 1rem;
}
.code-project__next h3 {
  margin: 0.25rem 0;
}
.code-project__step-copy small,
.code-project__step-date {
  color: var(--noma-ink-soft);
  font-size: 0.78rem;
}
.code-project__roadmap details {
  border: 1px solid var(--noma-border);
  border-radius: 18px;
  overflow: hidden;
  background: var(--noma-surface);
}
.code-project__roadmap summary {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 1.05rem 1.2rem;
  cursor: pointer;
  list-style: none;
}
.code-project__roadmap summary::-webkit-details-marker {
  display: none;
}
.code-project__roadmap summary > span:first-child {
  display: grid;
  gap: 0.2rem;
}
.code-project__roadmap summary strong {
  font-size: 1.15rem;
}
.code-project__roadmap summary small {
  color: var(--noma-ink-soft);
}
.code-project__summary-icon {
  font-size: 1.2rem;
}
.code-project__roadmap-list {
  padding: 0 1rem 1rem;
}
.code-project__step {
  border-top: 1px solid var(--noma-border);
}
.code-project__step.is-focus {
  border-left: 3px solid var(--noma-brand);
}
.code-project__step-trigger {
  display: grid;
  grid-template-columns: 2.5rem minmax(0, 1fr) minmax(5rem, auto) 1rem;
  gap: 0.75rem;
  align-items: center;
  width: 100%;
  padding: 0.9rem 0.65rem;
  border: 0;
  background: transparent;
  color: var(--noma-ink);
  text-align: left;
  cursor: pointer;
}
.code-project__step-order {
  color: var(--noma-ink-muted);
  font-variant-numeric: tabular-nums;
}
.code-project__step-copy {
  display: grid;
  gap: 0.25rem;
}
.code-project__step-date {
  text-align: right;
}
.code-project__step-date.overdue {
  color: var(--noma-danger);
  font-weight: 700;
}
.code-project__status {
  display: inline-flex;
  padding: 0.3rem 0.6rem;
  border-radius: 99px;
  background: var(--noma-surface-soft);
  color: var(--noma-ink-soft);
  font-size: 0.76rem;
  white-space: nowrap;
}
.code-project__status.is-active {
  background: var(--noma-brand-soft);
  color: var(--noma-brand-ink, var(--noma-ink));
}
.code-project__status.is-blocked {
  color: var(--noma-danger);
}
.code-project__status.is-decision {
  color: var(--noma-warning);
}
.code-project__status.is-completed {
  color: var(--noma-success);
}
.code-project__step-workspace {
  display: grid;
  gap: 1rem;
  padding: 0.8rem 1rem 1.1rem 3.8rem;
  border-top: 1px solid var(--noma-border);
}
.code-project__workspace-grid {
  display: grid;
  grid-template-columns: repeat(2, minmax(0, 1fr));
  gap: 0.75rem;
}
.code-project__subsection {
  display: grid;
  align-content: start;
  gap: 0.55rem;
  padding: 0.85rem;
  border: 1px solid var(--noma-border);
  border-radius: 14px;
  background: var(--noma-surface-soft);
  min-width: 0;
}
.code-project__subsection h4 {
  margin: 0;
}
.code-project__subsection label,
.code-project__form label {
  display: grid;
  gap: 0.35rem;
  color: var(--noma-ink-soft);
  font-size: 0.84rem;
}
.code-project__subsection input:not([type="checkbox"]),
.code-project__subsection textarea,
.code-project__subsection select,
.code-project__form input,
.code-project__form select,
.code-project__form textarea,
.code-project__inline-form input,
.code-project__link-form input {
  width: 100%;
  min-width: 0;
  padding: 0.65rem 0.7rem;
  border: 1px solid var(--noma-border);
  border-radius: 9px;
  background: var(--noma-surface);
  color: var(--noma-ink);
  font: inherit;
}
.code-project__subsection ul {
  display: grid;
  gap: 0.4rem;
  margin: 0;
  padding: 0;
  list-style: none;
}
.code-project__subsection li label {
  display: flex;
  align-items: center;
  gap: 0.55rem;
}
.code-project__subsection .done {
  text-decoration: line-through;
  color: var(--noma-ink-muted);
}
.code-project__inline-form,
.code-project__link-form {
  display: flex;
  flex-wrap: wrap;
  gap: 0.4rem;
}
.code-project__link-form input:nth-child(2) {
  flex: 1 1 12rem;
}
.code-project__subsection pre {
  max-height: 12rem;
  overflow: auto;
  padding: 0.7rem;
  border-radius: 8px;
  background: var(--noma-ink);
  color: var(--noma-surface);
}
.code-project__dependencies {
  display: flex;
  flex-wrap: wrap;
  gap: 0.45rem;
  align-items: center;
  font-size: 0.8rem;
}
.code-project__dependencies span {
  padding: 0.25rem 0.45rem;
  border-radius: 7px;
  background: var(--noma-surface-soft);
}
.code-project__dependencies small {
  width: 100%;
  color: var(--noma-ink-muted);
}
.code-project__required-context {
  padding: 0.65rem 0.8rem;
  border-left: 3px solid var(--noma-warning);
  background: var(--noma-surface-soft);
}
.code-project__required-context p {
  margin: 0.25rem 0 0;
  color: var(--noma-ink-soft);
}
.code-project__overdue-note {
  color: var(--noma-warning);
  font-size: 0.82rem;
}
.code-project__state-actions,
.code-project__replan {
  padding-top: 0.75rem;
  border-top: 1px solid var(--noma-border);
}
.code-project__replan label {
  display: flex;
  gap: 0.4rem;
  align-items: center;
  color: var(--noma-ink-soft);
}
.code-project__signals {
  display: grid;
  grid-template-columns: repeat(2, minmax(0, 1fr));
  gap: 0.75rem;
}
.code-project__signal {
  display: grid;
  justify-items: start;
  align-content: start;
  gap: 0.45rem;
  min-width: 0;
  padding: 1rem;
  border: 1px solid var(--noma-border);
  border-radius: 16px;
  background: var(--noma-surface);
}
.code-project__signal h3 {
  margin: 0;
}
.code-project__signal p {
  margin: 0;
  color: var(--noma-ink-soft);
}
.code-project__signal--blocker {
  border-color: color-mix(in srgb, var(--noma-danger) 35%, var(--noma-border));
}
.code-project__signal--date {
  display: flex;
  flex-wrap: wrap;
  align-items: center;
  justify-content: space-between;
}
.code-project__signal--date h3 {
  margin: 0.2rem 0;
}
.code-project__signal--date p {
  margin: 0;
  color: var(--noma-ink-soft);
}
.code-project__target-replan {
  display: flex;
  flex-wrap: wrap;
  align-items: center;
  gap: 0.5rem;
  width: 100%;
  padding-top: 0.65rem;
  border-top: 1px solid var(--noma-border);
}
.code-project__target-replan label {
  display: flex;
  flex-wrap: wrap;
  align-items: center;
  gap: 0.4rem;
  color: var(--noma-ink-soft);
}
.code-project__metrics {
  display: grid;
  grid-template-columns: repeat(4, minmax(0, 1fr));
  gap: 0.65rem;
  margin-top: 0.8rem;
}
.code-project__metrics article {
  display: grid;
  gap: 0.2rem;
  min-width: 0;
  padding: 0.85rem;
  border-radius: 13px;
  background: var(--noma-surface-soft);
}
.code-project__metrics small {
  color: var(--noma-ink-muted);
  font-size: 0.7rem;
}
.code-project__metrics strong {
  font-size: 1.25rem;
}
.code-project__metrics span {
  color: var(--noma-ink-soft);
  font-size: 0.78rem;
}
.code-project__reports h2 {
  margin: 0.3rem 0;
}
.code-project__reports p {
  color: var(--noma-ink-soft);
}
.code-project__form-panel {
  padding: 1.1rem;
  border: 1px solid var(--noma-border);
  border-radius: 16px;
  background: var(--noma-surface);
}
.code-project__form {
  display: grid;
  grid-template-columns: repeat(2, minmax(0, 1fr));
  gap: 0.75rem;
  margin-top: 0.8rem;
}
.code-project__form fieldset {
  display: flex;
  flex-wrap: wrap;
  gap: 0.4rem;
  grid-column: 1 / -1;
  max-height: 12rem;
  overflow: auto;
  padding: 0.6rem;
  border: 1px solid var(--noma-border);
  border-radius: 10px;
}
.code-project__form fieldset legend {
  color: var(--noma-ink-soft);
}
.code-project__form fieldset button[aria-pressed="true"] {
  border-color: var(--noma-brand);
  background: var(--noma-brand-soft);
}
.code-project__form footer {
  display: flex;
  justify-content: end;
  gap: 0.5rem;
  grid-column: 1 / -1;
}
.code-project__form > p {
  grid-column: 1 / -1;
}
@media (max-width: 760px) {
  .code-project__header,
  .code-project__next,
  .code-project__path-review {
    display: grid;
    align-items: start;
  }
  .code-project__header-meta {
    justify-items: start;
  }
  .code-project__workspace-grid,
  .code-project__signals,
  .code-project__metrics,
  .code-project__form,
  .code-project__capture form {
    grid-template-columns: 1fr;
  }
  .code-project__step-trigger {
    grid-template-columns: 2rem minmax(0, 1fr) 1rem;
  }
  .code-project__step-date {
    grid-column: 2;
    text-align: left;
  }
  .code-project__step-workspace {
    padding-left: 0.6rem;
  }
  .code-project__section-title,
  .code-project__workspace-heading {
    display: grid;
  }
  .code-project__form fieldset,
  .code-project__form footer,
  .code-project__form > p {
    grid-column: auto;
  }
  .code-project__replan label {
    flex-wrap: wrap;
  }
}
</style>
