<script setup>
import { computed, ref } from "vue";
import PricingPlans from "./PricingPlans.vue";
import {
  billingState,
  can,
  refreshEntitlements,
  startCheckout,
  openBillingPortal,
} from "../flow/billing.js";

defineProps({ user: Object, requiredFlow: { type: String, default: "" } });
const busy = ref(false);
const error = ref("");
const proActive = computed(
  () => billingState.available && can("unlimitedFlows"),
);

async function run(action) {
  busy.value = true;
  error.value = "";
  try {
    await action();
  } catch (cause) {
    error.value =
      cause.message || "Não foi possível concluir agora. Tente novamente.";
  } finally {
    busy.value = false;
  }
}
</script>

<template>
  <section class="plan-panel">
    <header v-if="!proActive" class="plan-panel-heading">
      <p class="eyebrow">MAIS ESPAÇO PARA O QUE VEM</p>
      <h2 id="modal-title">Escolha seu plano</h2>
      <p v-if="requiredFlow">
        {{ requiredFlow }} faz parte dos Flows Noma Pro. Assine para criar e
        usar este espaço.
      </p>
      <p v-else>Compare os recursos e escolha o que acompanha o seu momento.</p>
    </header>
    <PricingPlans
      mode="app"
      :signed-in="!!user"
      :pro-active="proActive"
      :billing-available="billingState.available"
      :subscription="billingState.subscription"
      @subscribe="(interval) => run(() => startCheckout(interval))"
      @manage="run(openBillingPortal)"
    />
    <p v-if="error" class="plan-panel-error" role="alert">{{ error }}</p>
    <button
      v-if="!billingState.available"
      class="text-button plan-refresh"
      :disabled="busy || billingState.loading"
      @click="run(refreshEntitlements)"
    >
      {{ billingState.loading ? "Verificando…" : "Tentar verificar meu plano" }}
    </button>
    <p class="plan-panel-footnote">
      Seus dados e Flows continuam seus. Você pode rever seu plano a qualquer
      momento.
    </p>
  </section>
</template>

<style scoped>
.plan-panel {
  display: grid;
  gap: 17px;
  color: var(--noma-ink);
}
.plan-panel-heading {
  padding-right: 35px;
}
.plan-panel-heading .eyebrow {
  margin: 0 0 7px;
  color: var(--noma-brand);
  font-size: 9px;
  font-weight: 700;
  letter-spacing: 0.11em;
}
.plan-panel-heading h2 {
  margin: 0 0 6px;
  font-size: 25px;
  letter-spacing: -0.03em;
}
.plan-panel-heading > p:last-child,
.plan-panel-footnote {
  margin: 0;
  color: var(--noma-ink-soft);
  font-size: 11px;
  line-height: 1.55;
}
.plan-panel-error {
  margin: 0;
  color: var(--noma-danger);
  font-size: 12px;
}
.plan-refresh {
  justify-self: start;
  padding: 2px 0;
}
.plan-panel-footnote {
  padding-top: 13px;
  border-top: 1px solid var(--noma-border);
  text-align: center;
}
</style>
