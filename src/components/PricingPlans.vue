<script setup>
import { computed, ref } from "vue";

const props = defineProps({
  mode: { type: String, default: "public" },
  signedIn: Boolean,
  proActive: Boolean,
  billingAvailable: Boolean,
  subscription: Object,
});
const emit = defineEmits(["login", "enter", "subscribe", "manage"]);
const interval = ref("year");
const annual = computed(() => interval.value === "year");
const renewalDate = computed(() => {
  const date = props.subscription?.currentPeriodEnd;
  return date
    ? new Date(date).toLocaleDateString("pt-BR", {
        day: "2-digit",
        month: "long",
        year: "numeric",
      })
    : "";
});
const freeFeatures = [
  "Até 3 Flows ativos ao mesmo tempo",
  "Experiências preparadas para cada objetivo",
  "Dados locais e uso offline",
  "Sincronização na nuvem com sua conta",
  "Histórico recente de progresso",
];
const proFeatures = [
  "Flows ativos ilimitados",
  "Histórico completo da sua jornada",
  "Calendário e regras avançadas",
  "Exportações para guardar e analisar seus dados",
];
const proComingSoonFeatures = [
  "Flows exclusivos",
  "Relatórios personalizados de progresso",
];
</script>

<template>
  <div
    class="pricing-plans"
    :class="[`pricing-plans-${mode}`, { 'pricing-plans-active': proActive }]"
  >
    <section v-if="mode === 'app' && proActive" class="plan-active-card">
      <div class="plan-active-mark" aria-hidden="true">✓</div>
      <div class="plan-active-copy">
        <span class="plan-kicker">SEU PLANO</span>
        <h2 id="modal-title">Noma Pro ativo</h2>
        <p v-if="subscription?.cancelAtPeriodEnd && renewalDate">
          Seu acesso Pro segue ativo até {{ renewalDate }}.
        </p>
        <p v-else-if="renewalDate">
          Sua assinatura está ativa. Próxima renovação em {{ renewalDate }}.
        </p>
        <p v-else>
          Sua assinatura está ativa e todos os recursos Pro estão liberados.
        </p>
      </div>
      <button class="outline" @click="emit('manage')">
        Gerenciar assinatura
      </button>
      <ul class="plan-active-features">
        <li v-for="feature in proFeatures" :key="feature">
          <span aria-hidden="true">✓</span>{{ feature }}
        </li>
      </ul>
    </section>

    <template v-else>
      <div
        v-if="mode === 'app' && !billingAvailable"
        class="plan-check-notice"
        role="status"
      >
        <span aria-hidden="true">i</span>
        <p>
          Não foi possível confirmar seu plano agora. Confira sua conexão e
          tente novamente antes de iniciar outra assinatura.
        </p>
      </div>

      <div class="plan-cards">
        <article class="plan-card plan-card-free">
          <div class="plan-card-heading">
            <span class="plan-kicker">PARA COMEÇAR</span>
            <h2>Noma Free</h2>
            <p>Um bom espaço para cada passo importante.</p>
          </div>
          <p class="plan-price">
            <strong>R$ 0</strong><span>para sempre</span>
          </p>
          <ul>
            <li v-for="feature in freeFeatures" :key="feature">
              <span aria-hidden="true">✓</span>{{ feature }}
            </li>
          </ul>
          <button
            v-if="mode === 'public'"
            class="outline plan-card-action"
            @click="signedIn ? emit('enter') : emit('login')"
          >
            {{ signedIn ? "Abrir meu espaço" : "Entrar para começar" }}
          </button>
          <span
            v-else-if="billingAvailable && !proActive"
            class="plan-current-label"
          >
            Seu plano atual
          </span>
        </article>

        <article
          class="plan-card plan-card-pro"
          :class="annual ? 'plan-card-pro-annual' : 'plan-card-pro-monthly'"
        >
          <div class="plan-pro-billing">
            <span class="plan-pro-billing-label">ESCOLHA SEU PERÍODO</span>
            <div
              class="plan-interval"
              role="group"
              aria-label="Período de cobrança do Noma Pro"
            >
              <button
                type="button"
                :class="{ selected: interval === 'month' }"
                :aria-pressed="interval === 'month'"
                @click="interval = 'month'"
              >
                Mensal
              </button>
              <button
                type="button"
                :class="{ selected: interval === 'year' }"
                :aria-pressed="interval === 'year'"
                @click="interval = 'year'"
              >
                Anual <span>2 meses grátis</span>
              </button>
            </div>
          </div>
          <div class="plan-pro-ribbon">
            {{
              annual
                ? "MELHOR CUSTO · ECONOMIZE R$ 38"
                : "FLEXIBILIDADE · PAGAMENTO MENSAL"
            }}
          </div>
          <div class="plan-card-heading">
            <span class="plan-kicker">PARA CONTINUAR</span>
            <h2>Noma Pro</h2>
            <p>Mais espaço, contexto e histórico para sua jornada.</p>
          </div>
          <div class="plan-price">
            <strong>{{ annual ? "R$ 190" : "R$ 19" }}</strong>
            <span>{{ annual ? "/ ano" : "/ mês" }}</span>
          </div>
          <p v-if="annual" class="plan-price-note">
            Equivale a R$ 15,83 por mês.
            <span>Economize R$ 38 no anual.</span>
          </p>
          <p v-else class="plan-price-note">
            R$ 190 por ano · dois meses grátis no anual.
          </p>
          <ul>
            <li v-for="feature in proFeatures" :key="feature">
              <span aria-hidden="true">✓</span>{{ feature }}
            </li>
            <li v-for="feature in proComingSoonFeatures" :key="feature">
              <span aria-hidden="true">✓</span>{{ feature }}
            </li>
          </ul>
          <button
            v-if="mode === 'public'"
            class="dark-button plan-card-action"
            @click="signedIn ? emit('enter') : emit('login')"
          >
            {{
              signedIn ? "Entrar para continuar" : "Entrar para conhecer o Pro"
            }}
            <span aria-hidden="true">↗</span>
          </button>
          <button
            v-else
            class="dark-button plan-card-action"
            @click="emit('subscribe', interval)"
          >
            Assinar Noma Pro <span aria-hidden="true">↗</span>
          </button>
        </article>
      </div>
    </template>
  </div>
</template>

<style scoped>
.pricing-plans {
  display: grid;
  gap: 18px;
  color: var(--noma-ink);
}
.plan-cards {
  display: grid;
  grid-template-columns: repeat(2, minmax(0, 1fr));
  gap: 18px;
  align-items: stretch;
}
.plan-card {
  position: relative;
  display: flex;
  min-width: 0;
  flex-direction: column;
  padding: 24px;
  border: 1px solid var(--noma-border);
  border-radius: 18px;
  background: var(--noma-surface);
  box-shadow: var(--noma-shadow-sm);
  transition:
    transform 220ms ease,
    box-shadow 220ms ease,
    border-color 220ms ease;
}
.plan-card:hover {
  transform: translateY(-3px);
  box-shadow: var(--noma-shadow-lg);
}
.plan-card-pro {
  overflow: hidden;
  border-color: var(--noma-brand);
  background:
    radial-gradient(
      ellipse at top right,
      var(--noma-brand-soft),
      transparent 52%
    ),
    var(--noma-surface);
  box-shadow: 0 14px 36px rgb(41 74 56 / 10%);
}
.plan-card-pro-monthly {
  background: var(--noma-surface);
}
.plan-card-pro-annual {
  background:
    radial-gradient(
      ellipse at top right,
      var(--noma-brand-soft),
      transparent 56%
    ),
    var(--noma-surface);
}
.plan-pro-billing {
  display: grid;
  gap: 7px;
  margin-bottom: 14px;
}
.plan-pro-billing-label {
  color: var(--noma-ink-muted);
  font-size: 9px;
  font-weight: 700;
  letter-spacing: 0.1em;
}
.plan-pro-ribbon {
  align-self: flex-start;
  margin-bottom: 11px;
  padding: 6px 9px;
  border: 1px solid var(--noma-brand);
  border-radius: 7px;
  background: var(--noma-brand-soft);
  color: var(--noma-brand);
  font-size: 8px;
  font-weight: 700;
  letter-spacing: 0.07em;
}
.plan-kicker {
  color: var(--noma-brand);
  font-size: 9px;
  font-weight: 700;
  letter-spacing: 0.12em;
}
.plan-card-heading h2 {
  margin: 8px 0 5px;
  font-size: 21px;
  letter-spacing: -0.025em;
}
.plan-card-heading p {
  margin: 0;
  color: var(--noma-ink-soft);
  font-size: 11px;
  line-height: 1.5;
}
.plan-price {
  display: flex;
  align-items: baseline;
  gap: 7px;
  margin: 22px 0 3px;
  color: var(--noma-ink-soft);
  font-size: 12px;
}
.plan-price strong {
  color: var(--noma-ink);
  font-size: 29px;
  letter-spacing: -0.04em;
}
.plan-price-note {
  min-height: 17px;
  margin: 0;
  color: var(--noma-ink-muted);
  font-size: 10px;
}
.plan-price-note span {
  display: block;
  margin-top: 3px;
}
.plan-card ul,
.plan-active-features {
  display: grid;
  gap: 12px;
  margin: 20px 0 24px;
  padding: 0;
  list-style: none;
}
.plan-card li,
.plan-active-features li {
  display: flex;
  align-items: flex-start;
  gap: 9px;
  color: var(--noma-ink-soft);
  font-size: 11px;
  line-height: 1.45;
}
.plan-card li span,
.plan-active-features li span {
  flex: 0 0 auto;
  color: var(--noma-brand);
  font-weight: 700;
}
.plan-card-action {
  width: 100%;
  min-height: 44px;
  margin-top: auto;
  white-space: normal;
  text-align: center;
}
.plan-current-label {
  margin-top: auto;
  padding-top: 13px;
  border-top: 1px solid var(--noma-border);
  color: var(--noma-ink-muted);
  font-size: 11px;
}
.plan-interval {
  display: grid;
  width: 100%;
  grid-template-columns: repeat(2, minmax(0, 1fr));
  gap: 4px;
  padding: 4px;
  border: 1px solid var(--noma-border-strong);
  border-radius: 11px;
  background: var(--noma-surface-soft);
}
.plan-card-pro .plan-interval {
  align-self: stretch;
}
.plan-card-pro .plan-price {
  margin-top: 15px;
}
.plan-interval button {
  display: flex;
  min-height: 40px;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  gap: 2px;
  padding: 6px 9px;
  border: 1px solid transparent;
  border-radius: 8px;
  color: var(--noma-ink-soft);
  font-size: 12px;
  font-weight: 650;
  transition:
    color 180ms ease,
    background-color 180ms ease,
    border-color 180ms ease,
    box-shadow 180ms ease;
}
.plan-interval button.selected {
  border-color: var(--noma-brand);
  background: var(--noma-brand);
  color: var(--noma-brand-contrast);
  box-shadow: var(--noma-shadow-sm);
}
.plan-interval button span {
  color: var(--noma-brand);
  font-size: 9px;
  font-weight: 650;
}
.plan-interval button.selected span {
  color: inherit;
}
.plan-check-notice {
  display: flex;
  align-items: flex-start;
  gap: 10px;
  padding: 12px 14px;
  border: 1px solid var(--noma-warning);
  border-radius: 11px;
  background: var(--noma-warning-soft);
  color: var(--noma-warning);
}
.plan-check-notice > span {
  display: grid;
  width: 18px;
  height: 18px;
  flex: 0 0 18px;
  place-items: center;
  border: 1px solid currentColor;
  border-radius: 50%;
  font-size: 11px;
  font-weight: 700;
}
.plan-check-notice p {
  margin: 0;
  font-size: 11px;
  line-height: 1.5;
}
.plan-active-card {
  display: grid;
  grid-template-columns: auto 1fr auto;
  align-items: center;
  gap: 15px;
  padding: 22px;
  border: 1px solid var(--noma-brand);
  border-radius: 17px;
  background:
    radial-gradient(
      ellipse at top right,
      var(--noma-brand-soft),
      transparent 55%
    ),
    var(--noma-surface);
}
.plan-active-mark {
  display: grid;
  width: 42px;
  height: 42px;
  place-items: center;
  border-radius: 50%;
  background: var(--noma-brand);
  color: var(--noma-brand-contrast);
  font-size: 20px;
  font-weight: 700;
}
.plan-active-copy .plan-kicker {
  display: block;
  margin-bottom: 5px;
}
.plan-active-copy h2 {
  margin: 0 0 5px;
  font-size: 20px;
}
.plan-active-copy p {
  margin: 0;
  color: var(--noma-ink-soft);
  font-size: 11px;
  line-height: 1.5;
}
.plan-active-features {
  grid-column: 1 / -1;
  grid-template-columns: repeat(2, minmax(0, 1fr));
  margin: 7px 0 0;
  padding-top: 17px;
  border-top: 1px solid var(--noma-border);
}
.pricing-plans-public .plan-card {
  min-height: 100%;
}
@media (max-width: 620px) {
  .plan-cards {
    grid-template-columns: 1fr;
  }
  .plan-card {
    padding: 21px;
  }
  .plan-interval {
    align-self: stretch;
  }
  .plan-card-pro .plan-interval {
    width: 100%;
  }
  .plan-interval button {
    flex: 1;
    justify-content: center;
    flex-wrap: wrap;
  }
  .plan-active-card {
    grid-template-columns: auto 1fr;
    padding: 18px;
  }
  .plan-active-card > .outline {
    grid-column: 1 / -1;
    width: 100%;
  }
  .plan-active-features {
    grid-template-columns: 1fr;
  }
}
</style>
