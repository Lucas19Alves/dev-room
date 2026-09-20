<script setup>
import { computed, reactive, ref } from "vue";
import { onboardingDefaults } from "../flow/setup.js";
import {
  DEVICON_STACK_CATALOG,
  projectOutcomeOptions,
} from "../flow/projectFlow.js";

const props = defineProps({
  definition: { type: Object, required: true },
  components: { type: Array, required: true },
  defaultDisplayName: { type: String, default: "" },
});
const emit = defineEmits(["complete", "cancel"]);

const current = ref(0);
const flowName = ref(props.definition.name);
const displayName = ref(props.defaultDisplayName);
const selected = ref(
  (props.definition.components || []).map((item) =>
    typeof item === "string" ? item : item.type,
  ),
);
const baseAnswers = onboardingDefaults(props.definition);
const stackQuery = ref("");
const answers = reactive(
  Object.fromEntries(
    Object.entries(baseAnswers).map(([key, value]) => [
      key,
      Array.isArray(value) ? value.join("\n") : value,
    ]),
  ),
);

const steps = computed(() => [
  ...(props.definition.onboarding?.hideNameStep
    ? []
    : [
        {
          id: "purpose",
          title:
            props.definition.id === "blank"
              ? "Dê um nome ao que você quer realizar."
              : "Comece por um nome que faça sentido para você.",
          description: props.definition.onboarding?.intro,
          kind: "purpose",
        },
      ]),
  ...(props.definition.onboarding?.steps || []),
  ...(props.definition.onboarding?.allowComponentSelection === false
    ? []
    : [
        {
          id: "components",
          title: "O que ajuda você a continuar?",
          description:
            "O Flow já vem preparado. Você pode ajustar os componentes agora ou depois.",
          kind: "components",
        },
      ]),
  {
    id: "ready",
    title: "Seu ponto de partida está pronto.",
    description:
      "As respostas abaixo vão preparar metas, etapas e primeiros passos. Tudo pode evoluir com você.",
    kind: "ready",
  },
]);
const step = computed(() => steps.value[current.value]);

function valuesFor(field) {
  if (!["list", "multi", "autocomplete-multi"].includes(field.type))
    return answers[field.key];
  return String(answers[field.key] || "")
    .split(/[\n,;]+/)
    .map((item) => item.trim())
    .filter(Boolean)
    .slice(0, field.maxItems || Infinity);
}

function visibleField(field) {
  return (
    !field.visibleWhen ||
    answers[field.visibleWhen.key] === field.visibleWhen.value
  );
}

function optionsFor(field) {
  if (field.optionsFrom === "projectOutcomeOptions") {
    const selectedTypes = String(answers.projectType || "")
      .split("\n")
      .filter(Boolean);
    return projectOutcomeOptions(answers.projectObjective, selectedTypes);
  }
  return field.options || [];
}

const stackSuggestions = computed(() => {
  const query = stackQuery.value.trim().toLocaleLowerCase("pt-BR");
  if (!query)
    return DEVICON_STACK_CATALOG.filter(
      ({ name }) =>
        !valuesFor({ key: "stack", type: "autocomplete-multi" }).includes(name),
    )
      .slice(0, 12)
      .map(({ name }) => name);
  return DEVICON_STACK_CATALOG.filter(
    ({ name }) =>
      name.toLocaleLowerCase("pt-BR").includes(query) &&
      !valuesFor({ key: "stack", type: "autocomplete-multi" }).includes(name),
  )
    .slice(0, 12)
    .map(({ name }) => name);
});

function addStackValue(value) {
  const clean = String(value || "").trim();
  if (!clean) return;
  const values = valuesFor({ key: "stack", type: "autocomplete-multi" });
  if (
    !values.some(
      (item) =>
        item.toLocaleLowerCase("pt-BR") === clean.toLocaleLowerCase("pt-BR"),
    )
  )
    answers.stack = [...values, clean].join("\n");
  stackQuery.value = "";
}

function removeStackValue(value) {
  answers.stack = valuesFor({ key: "stack", type: "autocomplete-multi" })
    .filter((item) => item !== value)
    .join("\n");
}

function toggleMulti(field, option) {
  const values = valuesFor(field);
  answers[field.key] = values.includes(option)
    ? values.filter((item) => item !== option).join("\n")
    : [...values, option].join("\n");
}

function selectedOption(field, option) {
  return valuesFor(field).includes(option);
}

function fieldValid(field) {
  if (!field.required) return true;
  const value = valuesFor(field);
  return Array.isArray(value) ? value.length > 0 : String(value || "").trim();
}

const canContinue = computed(() => {
  if (step.value.kind === "purpose") return flowName.value.trim().length > 0;
  if (step.value.kind === "components") return selected.value.length > 0;
  if (step.value.kind === "ready") return displayName.value.trim().length > 0;
  return (step.value.fields || []).filter(visibleField).every(fieldValid);
});

function toggleComponent(id) {
  selected.value = selected.value.includes(id)
    ? selected.value.filter((item) => item !== id)
    : [...selected.value, id];
}

function finish() {
  if (!canContinue.value) return;
  const normalized = {};
  for (const onboardingStep of props.definition.onboarding?.steps || []) {
    for (const field of onboardingStep.fields || []) {
      if (!visibleField(field)) continue;
      const value = valuesFor(field);
      normalized[field.key] = ["multi", "autocomplete-multi"].includes(
        field.type,
      )
        ? value
        : field.type === "number"
          ? Number(value)
          : field.type === "boolean"
            ? Boolean(value)
            : value;
    }
  }
  emit("complete", {
    name:
      props.definition.id === "code"
        ? normalized.projectName?.trim() || "Projeto sem nome"
        : flowName.value.trim(),
    displayName: displayName.value.trim(),
    answers: normalized,
    components: selected.value,
  });
}
</script>

<template>
  <div class="flow-onboarding">
    <div class="eyebrow">
      SEU NOVO FLOW / {{ current + 1 }} DE {{ steps.length }}
    </div>
    <h2 id="modal-title">{{ step.title }}</h2>
    <p v-if="step.description" class="onboarding-description">
      {{ step.description }}
    </p>
    <div class="step-progress" aria-hidden="true">
      <i
        v-for="(_, index) in steps"
        :key="index"
        :class="{ filled: current >= index }"
      ></i>
    </div>

    <div v-if="step.kind === 'purpose'" class="onboarding-fields">
      <label class="tool-field" for="flow-name"
        >Nome do Flow<input
          id="flow-name"
          v-model="flowName"
          maxlength="100"
          placeholder="Ex.: Minha próxima oportunidade"
      /></label>
      <div class="onboarding-template-note">
        <span class="flow-icon" :class="definition.color">{{
          definition.icon
        }}</span>
        <div>
          <strong>{{ definition.name }}</strong>
          <p>{{ definition.objective }}</p>
        </div>
      </div>
    </div>

    <div v-else-if="step.fields" class="onboarding-fields">
      <div
        v-for="field in step.fields"
        :key="field.key"
        v-show="visibleField(field)"
        class="onboarding-field"
      >
        <label
          v-if="
            !['multi', 'boolean', 'autocomplete-multi'].includes(field.type)
          "
          class="tool-field"
          :for="`onboarding-${field.key}`"
          >{{ field.label }}<span v-if="!field.required"> · opcional</span>
          <textarea
            v-if="field.type === 'textarea' || field.type === 'list'"
            :id="`onboarding-${field.key}`"
            v-model="answers[field.key]"
            :placeholder="field.placeholder"
            rows="3"
          ></textarea>
          <select
            v-else-if="field.type === 'select'"
            :id="`onboarding-${field.key}`"
            v-model="answers[field.key]"
          >
            <option value="">Escolher depois</option>
            <option
              v-for="option in optionsFor(field)"
              :key="option"
              :value="option"
            >
              {{ option }}
            </option>
          </select>
          <input
            v-else
            :id="`onboarding-${field.key}`"
            v-model="answers[field.key]"
            :type="field.type"
            :min="field.min"
            :max="field.max"
            :placeholder="field.placeholder"
          />
          <small v-if="field.suffix">Em {{ field.suffix }}</small>
        </label>
        <div
          v-else-if="field.type === 'autocomplete-multi'"
          class="tool-field stack-picker"
        >
          <span>{{ field.label }} · opcional</span>
          <div class="stack-picker__input">
            <input
              v-model="stackQuery"
              :aria-label="field.label"
              :placeholder="field.placeholder"
              autocomplete="off"
              @keydown.enter.prevent="addStackValue(stackQuery)"
            />
            <button
              type="button"
              class="outline"
              @click="addStackValue(stackQuery)"
            >
              Adicionar
            </button>
          </div>
          <div
            v-if="stackSuggestions.length"
            class="stack-picker__suggestions"
            aria-label="Sugestões de stack"
          >
            <button
              v-for="option in stackSuggestions"
              :key="option"
              type="button"
              @click="addStackValue(option)"
            >
              {{ option }}
            </button>
          </div>
          <div
            v-if="valuesFor(field).length"
            class="stack-picker__selected"
            aria-label="Stack selecionada"
          >
            <button
              v-for="value in valuesFor(field)"
              :key="value"
              type="button"
              class="stack-chip"
              :aria-label="`Remover ${value}`"
              @click="removeStackValue(value)"
            >
              {{ value }} <span aria-hidden="true">×</span>
            </button>
          </div>
        </div>
        <fieldset v-else-if="field.type === 'multi'" class="onboarding-options">
          <legend>
            {{ field.label }}<span v-if="!field.required"> · opcional</span>
          </legend>
          <button
            v-for="option in field.options"
            :key="option"
            type="button"
            :aria-pressed="selectedOption(field, option)"
            :class="{ chosen: selectedOption(field, option) }"
            @click="toggleMulti(field, option)"
          >
            {{ option }}
          </button>
        </fieldset>
        <label v-else class="onboarding-toggle">
          <input v-model="answers[field.key]" type="checkbox" />
          <span>{{ field.label }}</span>
        </label>
      </div>
    </div>

    <div
      v-else-if="step.kind === 'components'"
      class="picker-grid onboarding-picker"
    >
      <button
        v-for="component in components"
        :key="component.id"
        type="button"
        :class="{ chosen: selected.includes(component.id) }"
        :aria-pressed="selected.includes(component.id)"
        @click="toggleComponent(component.id)"
      >
        <span>{{ component.icon }}</span
        ><strong>{{ component.name }}</strong>
        <small>{{
          selected.includes(component.id) ? "Selecionado ✓" : "Adicionar +"
        }}</small>
      </button>
    </div>

    <div v-else class="onboarding-ready">
      <div class="review-flow">
        <span class="flow-icon" :class="definition.color">{{
          definition.icon
        }}</span>
        <h3>
          {{
            definition.id === "code"
              ? answers.projectName || "Projeto sem nome"
              : flowName
          }}
        </h3>
        <p>
          {{
            definition.id === "code"
              ? answers.projectObjective || definition.category
              : `${definition.category} · ${selected.length} componentes`
          }}
        </p>
      </div>
      <label class="tool-field" for="display-name"
        >Como podemos te chamar?<input
          id="display-name"
          v-model="displayName"
          autocomplete="given-name"
          maxlength="60"
          placeholder="Seu nome"
      /></label>
      <p class="local-info">
        O Flow será salvo primeiro neste dispositivo e sincronizado com sua
        conta.
      </p>
    </div>

    <footer>
      <button
        v-if="current > 0"
        type="button"
        class="outline"
        @click="current--"
      >
        ← Voltar
      </button>
      <button
        v-if="step.optional && current < steps.length - 1"
        type="button"
        class="text-button"
        @click="current++"
      >
        Pular por agora
      </button>
      <button
        v-if="current < steps.length - 1"
        type="button"
        class="dark-button"
        :disabled="!canContinue"
        @click="current++"
      >
        Continuar →
      </button>
      <button
        v-else
        type="button"
        class="dark-button"
        :disabled="!canContinue"
        @click="finish"
      >
        Entrar no meu Flow ↗
      </button>
    </footer>
  </div>
</template>
