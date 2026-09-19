<script setup>
import { ref, computed } from "vue";
import {
  billingState,
  can,
  activeFlowLimit,
  startCheckout,
  openBillingPortal,
  refreshEntitlements,
  deleteAccount,
} from "../flow/billing.js";
import { activeFlows } from "../flow/entitlements.js";
import ThemeToggle from "./ui/ThemeToggle.vue";
const props = defineProps({ account: Object, user: Object, status: String });
const emit = defineEmits(["export", "sync", "logout", "import", "flows"]);
const busy = ref(false),
  error = ref(""),
  deleting = ref(false),
  confirmation = ref(""),
  interval = ref("year");
const activeCount = computed(() => activeFlows(props.account.flows).length);
async function run(action) {
  busy.value = true;
  error.value = "";
  try {
    await action();
  } catch (e) {
    error.value = e.message || "Não foi possível concluir. Tente novamente.";
  } finally {
    busy.value = false;
  }
}
async function removeAccount() {
  if (confirmation.value !== "EXCLUIR") return;
  await run(deleteAccount);
}
</script>
<template>
  <section class="account-panel">
    <p class="eyebrow">Seu espaço, com você</p>
    <h2 id="modal-title">Sua conta</h2>
    <p>{{ user?.email || account.name }}</p>
    <p v-if="error" class="auth-error" role="alert">{{ error }}</p>
    <section class="account-plan">
      <div>
        <h3>Noma {{ can("unlimitedFlows") ? "Pro" : "Free" }}</h3>
        <p>
          {{ activeCount }} Flows ativos{{
            activeFlowLimit() === null
              ? " · sem limite"
              : ` de ${activeFlowLimit()}`
          }}
        </p>
      </div>
      <span class="plan-badge">{{
        can("unlimitedFlows")
          ? "Mais espaço para continuar"
          : "O essencial, de verdade"
      }}</span>
    </section>
    <div
      v-if="activeFlowLimit() !== null && activeCount > activeFlowLimit()"
      class="account-notice"
    >
      <strong>Escolha os Flows que você quer manter ativos.</strong>
      <p>
        Seu plano permite {{ activeFlowLimit() }} Flows ativos. Arquive os
        demais para liberar espaço. Seus dados e seu histórico continuam
        guardados.
      </p>
      <button class="outline" @click="emit('flows')">
        Organizar meus Flows
      </button>
    </div>
    <template v-if="!can('unlimitedFlows')"
      ><h3>Continue com Noma Pro</h3>
      <p>
        Flows ativos ilimitados, histórico completo e exportações para analisar
        seu caminho. O Free já inclui criação de Flows, ações contextuais e
        sincronização.
      </p>
      <fieldset class="plan-interval">
        <legend>Escolha como pagar</legend>
        <label
          ><input
            v-model="interval"
            type="radio"
            value="month"
            name="billing-interval"
          /><span>Mensal<strong>R$ 19 / mês</strong></span></label
        ><label
          ><input
            v-model="interval"
            type="radio"
            value="year"
            name="billing-interval"
          /><span
            >Anual<strong>R$ 190 / ano</strong
            ><small>Dois meses grátis · equivale a R$ 15,83/mês</small></span
          ></label
        >
      </fieldset>
      <button
        class="dark-button"
        :disabled="busy"
        @click="run(() => startCheckout(interval))"
      >
        {{
          busy ? "Abrindo pagamento…" : "Continuar para o pagamento seguro ↗"
        }}
      </button>
      <p class="hint">
        Renovação automática. Você pode cancelar a renovação pela sua conta.
      </p></template
    >
    <template v-else
      ><p v-if="billingState.subscription?.cancelAtPeriodEnd">
        Sua assinatura termina em
        {{
          new Date(
            billingState.subscription.currentPeriodEnd,
          ).toLocaleDateString("pt-BR")
        }}. Seus Flows permanecerão guardados.
      </p>
      <button class="outline" :disabled="busy" @click="run(openBillingPortal)">
        Gerenciar assinatura
      </button></template
    >
    <button
      class="text-button"
      :disabled="billingState.loading"
      @click="run(refreshEntitlements)"
    >
      Atualizar meu plano
    </button>
    <hr />
    <section class="account-theme">
      <div>
        <h3>Aparência</h3>
        <p>Escolha o tema de exibição do Noma para este dispositivo.</p>
      </div>
      <ThemeToggle variant="segmented" />
    </section>
    <hr />
    <h3>Seus dados</h3>
    <p role="status">{{ status }}</p>
    <div class="account-actions">
      <button class="outline" @click="emit('sync')">Sincronizar agora</button
      ><button class="outline" @click="emit('export')">
        Exportar meus dados</button
      ><button class="text-button" @click="emit('import')">
        Importar meus Flows deste dispositivo
      </button>
    </div>
    <p>
      <a href="/privacy" target="_blank" rel="noopener">Privacidade</a> ·
      <a href="/terms" target="_blank" rel="noopener">Termos de Uso</a> ·
      <a href="mailto:appnamanga@gmail.com">Fale com a gente</a>
    </p>
    <button class="outline" :disabled="busy" @click="emit('logout')">
      Sair da conta
    </button>
    <details
      class="account-danger"
      :open="deleting"
      @toggle="deleting = $event.target.open"
    >
      <summary>Excluir minha conta</summary>
      <p>
        A exclusão remove seus Flows, dados de conta e templates publicados. A
        assinatura será cancelada. Dados fiscais que precisem ser retidos por
        lei permanecem com o processador de pagamentos. Exporte uma cópia antes
        de continuar.
      </p>
      <p>
        Outros dispositivos podem manter cópias offline: remova também os dados
        do navegador nesses dispositivos.
      </p>
      <label class="tool-field"
        >Digite EXCLUIR para confirmar<input
          v-model="confirmation"
          autocomplete="off" /></label
      ><button
        class="danger"
        :disabled="confirmation !== 'EXCLUIR' || busy"
        @click="removeAccount"
      >
        Excluir conta e dados
      </button>
    </details>
  </section>
</template>
<style scoped>
.account-panel {
  display: grid;
  gap: 12px;
}
.account-panel p {
  margin: 0;
  color: var(--noma-ink-soft);
  font-size: 14px;
  line-height: 1.6;
}
.account-panel h3 {
  font-size: 19px;
}
.account-plan {
  display: flex;
  gap: 18px;
  align-items: center;
  padding: 20px 0;
  border-block: 1px solid var(--noma-border);
}
.plan-badge {
  color: var(--noma-brand);
  font-size: 13px;
  line-height: 1.5;
}
.plan-interval {
  border: 0;
  padding: 0;
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 12px;
}
.plan-interval legend {
  font-size: 14px;
  margin: 8px 0;
}
.plan-interval label {
  flex-direction: row;
  align-items: start;
  border: 1px solid var(--noma-border);
  padding: 14px;
  border-radius: 12px;
  margin: 0;
  font-size: 14px;
}
.plan-interval input {
  width: 18px;
  min-height: 18px;
  flex-shrink: 0;
}
.plan-interval span,
.plan-interval strong {
  display: block;
}
.plan-interval strong {
  margin: 7px 0;
  font-size: 16px;
}
.plan-interval small {
  font-size: 12px;
}
.account-actions {
  display: flex;
  gap: 8px;
  flex-wrap: wrap;
}
.account-theme {
  display: flex;
  justify-content: space-between;
  align-items: center;
  gap: 16px;
  flex-wrap: wrap;
  padding: 8px 0;
}
.account-danger {
  border-top: 1px solid var(--noma-border);
  margin-top: 12px;
  padding-top: 18px;
}
.account-danger summary {
  cursor: pointer;
  color: var(--noma-danger);
  min-height: 44px;
}
.account-notice {
  background: var(--noma-surface-soft);
  padding: 16px;
  border-radius: 12px;
}
.account-panel a {
  text-decoration: underline;
  text-underline-offset: 3px;
}
@media (max-width: 480px) {
  .plan-interval {
    grid-template-columns: 1fr;
  }
  .account-plan {
    flex-direction: column;
    align-items: start;
  }
}
</style>
