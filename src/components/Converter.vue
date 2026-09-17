<script setup>
import { computed, ref } from "vue";
import { useFlowComponentStorage } from "../composables/useFlowComponentStorage";
import ToolLayout from "./ui/ToolLayout.vue";

const currencies = ["BRL", "USD", "EUR", "GBP", "CAD", "AUD", "JPY", "CHF"];
const { state: converter } = useFlowComponentStorage("converter", {
  amount: 1,
  from: "USD",
  to: "BRL",
  result: null,
  convertedAt: null,
});
const status = ref("idle");
const message = ref("");
const formatted = computed(() =>
  converter.value.result === null
    ? "—"
    : new Intl.NumberFormat("pt-BR", { maximumFractionDigits: 4 }).format(
        converter.value.result,
      ),
);

async function convert() {
  const amount = Number(converter.value.amount);
  if (!Number.isFinite(amount) || amount < 0) return;
  if (converter.value.from === converter.value.to) {
    converter.value.result = amount;
    converter.value.convertedAt = new Date().toISOString();
    status.value = "success";
    return;
  }
  status.value = "loading";
  message.value = "";
  try {
    const response = await fetch(
      `https://api.frankfurter.app/latest?amount=${encodeURIComponent(amount)}&from=${converter.value.from}&to=${converter.value.to}`,
    );
    if (!response.ok) throw new Error("Serviço temporariamente indisponível.");
    const payload = await response.json();
    converter.value.result = payload.rates?.[converter.value.to] ?? null;
    converter.value.convertedAt = new Date().toISOString();
    status.value = "success";
  } catch {
    status.value = navigator.onLine ? "error" : "offline";
    message.value = navigator.onLine
      ? "Não foi possível obter a cotação. Tente novamente."
      : "A conversão precisa de conexão. O último resultado continua salvo neste Flow.";
  }
}
</script>
<template>
  <ToolLayout
    caption="Cotações de referência atualizadas no momento da conversão."
    id="currency-main"
  >
    <form class="converter-form" @submit.prevent="convert">
      <label class="tool-field"
        >Valor<input
          v-model.number="converter.amount"
          type="number"
          min="0"
          step="any"
          aria-label="Valor para converter"
      /></label>
      <label class="tool-field"
        >De<select v-model="converter.from" aria-label="Moeda de origem">
          <option v-for="currency in currencies" :key="currency">
            {{ currency }}
          </option>
        </select></label
      >
      <button
        type="button"
        class="converter-swap"
        aria-label="Trocar moedas"
        @click="[converter.from, converter.to] = [converter.to, converter.from]"
      >
        ⇄
      </button>
      <label class="tool-field"
        >Para<select v-model="converter.to" aria-label="Moeda de destino">
          <option v-for="currency in currencies" :key="currency">
            {{ currency }}
          </option>
        </select></label
      >
      <button class="dark-button" :disabled="status === 'loading'">
        {{ status === "loading" ? "Convertendo…" : "Converter" }}
      </button>
    </form>
    <div class="converter-result" aria-live="polite">
      <small>RESULTADO</small
      ><strong
        >{{ formatted }} <span>{{ converter.to }}</span></strong
      >
      <p v-if="converter.convertedAt">
        Última conversão:
        {{ new Date(converter.convertedAt).toLocaleString("pt-BR") }}
      </p>
    </div>
    <p
      v-if="message"
      class="tool-feedback"
      :class="{ 'tool-feedback--error': status === 'error' }"
      role="status"
    >
      {{ message }}
    </p>
  </ToolLayout>
</template>
