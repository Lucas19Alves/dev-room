<script setup>
import { reactive } from "vue";

const props = defineProps({
  flow: { type: Object, required: true },
});
const emit = defineEmits(["complete", "postpone", "skip"]);
const answers = reactive(
  Object.fromEntries(
    (props.flow.review?.prompts || []).map((_, index) => [index, ""]),
  ),
);

function complete() {
  emit(
    "complete",
    (props.flow.review?.prompts || []).map((prompt, index) => ({
      prompt,
      answer: answers[index]?.trim() || "",
    })),
  );
}
</script>

<template>
  <div class="flow-review">
    <span class="eyebrow">UM MOMENTO PARA OLHAR O CAMINHO</span>
    <h2 id="modal-title">Revisar “{{ flow.identity.name }}”</h2>
    <p>
      Não precisa ser uma avaliação. Registre o que ajuda você a escolher o
      próximo passo.
    </p>
    <div class="review-questions">
      <label
        v-for="(prompt, index) in flow.review?.prompts"
        :key="prompt"
        class="tool-field"
        :for="`review-${index}`"
      >
        {{ prompt }}
        <textarea
          :id="`review-${index}`"
          v-model="answers[index]"
          rows="3"
          placeholder="Escreva o que fizer sentido…"
        ></textarea>
      </label>
    </div>
    <div class="review-actions">
      <button class="text-button" @click="emit('skip')">
        Ignorar esta vez
      </button>
      <button class="outline" @click="emit('postpone')">
        Adiar por 2 dias
      </button>
      <button class="dark-button" @click="complete">Concluir revisão</button>
    </div>
  </div>
</template>
