<script setup>
import { computed, ref } from "vue";
import {
  billingState,
  can,
  activeFlowLimit,
  deleteAccount,
} from "../flow/billing.js";
import { activeFlows } from "../flow/entitlements.js";
import ThemeToggle from "./ui/ThemeToggle.vue";

const props = defineProps({ account: Object, user: Object, status: String });
const emit = defineEmits(["export", "sync", "logout", "import", "flows"]);
const busy = ref(false);
const error = ref("");
const deleting = ref(false);
const confirmation = ref("");
const avatarFailed = ref(false);
const activeCount = computed(() => activeFlows(props.account.flows).length);
const accountName = computed(
  () =>
    props.user?.user_metadata?.full_name ||
    props.user?.user_metadata?.name ||
    props.account.name ||
    props.user?.email?.split("@")[0] ||
    "Meu espaço",
);
const avatarUrl = computed(() => {
  if (avatarFailed.value) return "";
  const metadata = props.user?.user_metadata || {};
  const identity = props.user?.identities?.find(
    (entry) => entry.identity_data,
  )?.identity_data;
  const candidate =
    metadata.avatar_url ||
    metadata.picture ||
    identity?.avatar_url ||
    identity?.picture;
  if (!candidate) return "";
  try {
    const url = new URL(candidate);
    return url.protocol === "https:" ? url.href : "";
  } catch {
    return "";
  }
});
const accountInitial = computed(() =>
  accountName.value.trim().charAt(0).toLocaleUpperCase("pt-BR"),
);
const planName = computed(() => {
  if (!props.user) return "Neste dispositivo";
  if (!billingState.available) return "Plano não verificado";
  return can("unlimitedFlows") ? "Noma Pro" : "Noma Free";
});
const planDescription = computed(() => {
  if (!props.user) return "Seus dados ficam salvos neste navegador.";
  if (!billingState.available)
    return "Conecte-se para confirmar os dados do seu plano.";
  return activeFlowLimit() === null
    ? `${activeCount.value} Flows ativos · sem limite`
    : `${activeCount.value} de ${activeFlowLimit()} Flows ativos`;
});

async function run(action) {
  busy.value = true;
  error.value = "";
  try {
    await action();
  } catch (cause) {
    error.value =
      cause.message || "Não foi possível concluir. Tente novamente.";
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
    <header class="settings-heading">
      <p class="eyebrow">PREFERÊNCIAS DO SEU ESPAÇO</p>
      <h2 id="modal-title">Configurações</h2>
      <p>Conta, aparência e dados do Noma em um só lugar.</p>
    </header>

    <section
      class="settings-section settings-account"
      aria-labelledby="account-title"
    >
      <div class="settings-section-heading">
        <div>
          <h3 id="account-title">Conta e plano</h3>
          <p>Seus dados de acesso e o plano atual.</p>
        </div>
      </div>
      <div class="account-identity">
        <img
          v-if="avatarUrl"
          class="account-avatar"
          :src="avatarUrl"
          alt=""
          referrerpolicy="no-referrer"
          @error="avatarFailed = true"
        />
        <span
          v-else
          class="account-avatar account-avatar-fallback"
          aria-hidden="true"
        >
          {{ accountInitial }}
        </span>
        <div class="account-identity-copy">
          <strong>{{ accountName }}</strong>
          <span>{{ user?.email || "Conta local neste dispositivo" }}</span>
        </div>
        <span class="plan-badge" :class="{ 'plan-badge-local': !user }">{{
          planName
        }}</span>
      </div>
      <div class="account-plan-detail">
        <span
          class="plan-status-dot"
          :class="{ 'plan-status-local': !user }"
        ></span>
        <span>{{ planDescription }}</span>
      </div>
      <div
        v-if="
          billingState.available &&
          activeFlowLimit() !== null &&
          activeCount > activeFlowLimit()
        "
        class="account-notice"
      >
        <div>
          <strong>Você tem mais Flows ativos que o limite do plano.</strong>
          <p>
            Arquive os que não está usando. Seus dados e histórico continuam
            guardados.
          </p>
        </div>
        <button class="outline" @click="emit('flows')">Organizar Flows</button>
      </div>
    </section>

    <p v-if="error" class="auth-error" role="alert">{{ error }}</p>

    <section class="settings-section" aria-labelledby="appearance-title">
      <div class="settings-section-heading">
        <div>
          <h3 id="appearance-title">Aparência</h3>
          <p>Por padrão, acompanha as configurações do seu dispositivo.</p>
        </div>
      </div>
      <ThemeToggle variant="segmented" />
    </section>

    <section class="settings-section" aria-labelledby="data-title">
      <div class="settings-section-heading">
        <div>
          <h3 id="data-title">Dados e sincronização</h3>
          <p>Seus Flows permanecem seus. Exporte uma cópia quando quiser.</p>
        </div>
        <span class="data-status" role="status">{{ status }}</span>
      </div>
      <div class="settings-data-actions">
        <button class="outline" :disabled="busy || !user" @click="emit('sync')">
          Sincronizar agora
        </button>
        <button class="outline" :disabled="busy" @click="emit('export')">
          Exportar meus dados
        </button>
        <button
          v-if="user"
          class="text-button"
          :disabled="busy"
          @click="emit('import')"
        >
          Importar dados deste dispositivo
        </button>
      </div>
      <p class="settings-privacy-links">
        <a href="/privacy" target="_blank" rel="noopener">Privacidade</a>
        <span aria-hidden="true">·</span>
        <a href="/terms" target="_blank" rel="noopener">Termos de uso</a>
        <span aria-hidden="true">·</span>
        <a href="mailto:appnamanga@gmail.com">Suporte</a>
      </p>
    </section>

    <section
      class="settings-section settings-session"
      aria-labelledby="session-title"
    >
      <div class="settings-section-heading">
        <div>
          <h3 id="session-title">Sessão</h3>
          <p>
            {{
              user
                ? "Encerre sua sessão neste dispositivo."
                : "Conecte uma conta para sincronizar seus dados."
            }}
          </p>
        </div>
        <button
          v-if="user"
          class="outline"
          :disabled="busy"
          @click="emit('logout')"
        >
          Sair da conta
        </button>
      </div>
    </section>

    <details
      v-if="user"
      class="settings-danger"
      :open="deleting"
      @toggle="deleting = $event.target.open"
    >
      <summary>Excluir conta e dados</summary>
      <div class="settings-danger-content">
        <p>
          A exclusão remove sua conta, Flows e modelos publicados. Assinaturas
          ativas serão canceladas. Informações que precisem ser retidas por lei
          podem permanecer com o processador de pagamentos.
        </p>
        <p>
          Outros dispositivos podem manter cópias offline. Exporte seus dados
          antes de continuar e remova também as cópias locais desses
          dispositivos.
        </p>
        <label class="tool-field">
          Digite EXCLUIR para confirmar
          <input v-model="confirmation" autocomplete="off" />
        </label>
        <button
          class="danger"
          :disabled="confirmation !== 'EXCLUIR' || busy"
          @click="removeAccount"
        >
          {{ busy ? "Excluindo…" : "Excluir conta permanentemente" }}
        </button>
      </div>
    </details>
  </section>
</template>

<style scoped>
.account-panel {
  display: grid;
  gap: 0;
  color: var(--noma-ink);
}
.settings-heading {
  padding: 0 38px 24px 0;
}
.settings-heading .eyebrow {
  margin: 0 0 8px;
  color: var(--noma-brand);
  font-size: 10px;
  font-weight: 650;
  letter-spacing: 0.1em;
}
.settings-heading h2 {
  margin: 0 0 6px;
  font-size: 27px;
  letter-spacing: -0.035em;
}
.account-panel p {
  margin: 0;
  color: var(--noma-ink-soft);
  font-size: 13px;
  line-height: 1.55;
}
.settings-heading > p:last-child {
  font-size: 14px;
}
.settings-section {
  display: grid;
  gap: 16px;
  padding: 22px 0;
  border-top: 1px solid var(--noma-border);
}
.settings-section-heading {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 16px;
}
.settings-section-heading h3 {
  margin: 0 0 5px;
  font-size: 15px;
  font-weight: 650;
}
.settings-section-heading p {
  font-size: 12px;
}
.account-identity {
  display: flex;
  align-items: center;
  gap: 14px;
  min-width: 0;
}
.account-avatar {
  width: 52px;
  height: 52px;
  flex: 0 0 52px;
  border-radius: 50%;
  object-fit: cover;
  background: var(--noma-surface-soft);
}
.account-avatar-fallback {
  display: grid;
  place-items: center;
  color: var(--noma-brand);
  font-size: 20px;
  font-weight: 650;
}
.account-identity-copy {
  display: grid;
  gap: 4px;
  min-width: 0;
  margin-right: auto;
}
.account-identity-copy strong,
.account-identity-copy span {
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}
.account-identity-copy strong {
  font-size: 14px;
  font-weight: 650;
}
.account-identity-copy span {
  color: var(--noma-ink-soft);
  font-size: 12px;
}
.plan-badge {
  flex: 0 0 auto;
  padding: 6px 10px;
  border: 1px solid var(--noma-brand);
  border-radius: 999px;
  background: var(--noma-brand-soft);
  color: var(--noma-brand);
  font-size: 11px;
  font-weight: 650;
}
.plan-badge-local {
  border-color: var(--noma-border);
  background: var(--noma-surface-soft);
  color: var(--noma-ink-soft);
}
.account-plan-detail {
  display: flex;
  align-items: center;
  gap: 8px;
  color: var(--noma-ink-soft);
  font-size: 12px;
}
.plan-status-dot {
  width: 7px;
  height: 7px;
  flex: 0 0 7px;
  border-radius: 50%;
  background: var(--noma-success);
}
.plan-status-local {
  background: var(--noma-ink-muted);
}
.account-notice {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 16px;
  padding: 14px;
  border: 1px solid var(--noma-border);
  border-radius: 12px;
  background: var(--noma-surface-soft);
}
.account-notice strong {
  display: block;
  margin-bottom: 4px;
  font-size: 12px;
}
.account-notice p {
  font-size: 11px;
}
.settings-section :deep(.theme-segmented) {
  width: fit-content;
  max-width: 100%;
}
.settings-section :deep(.theme-segmented button) {
  min-height: 40px;
}
.data-status {
  flex: 0 0 auto;
  color: var(--noma-ink-muted);
  font-size: 11px;
}
.settings-data-actions {
  display: flex;
  flex-wrap: wrap;
  align-items: center;
  gap: 9px;
}
.settings-privacy-links {
  display: flex;
  flex-wrap: wrap;
  gap: 8px;
  font-size: 11px !important;
}
.settings-privacy-links a {
  color: var(--noma-ink-soft);
  text-decoration: underline;
  text-decoration-color: var(--noma-border-strong);
  text-underline-offset: 3px;
}
.settings-session {
  padding-bottom: 22px;
}
.settings-danger {
  border-top: 1px solid var(--noma-border);
  padding-top: 18px;
}
.settings-danger summary {
  min-height: 40px;
  color: var(--noma-danger);
  font-size: 13px;
  font-weight: 600;
  cursor: pointer;
}
.settings-danger-content {
  display: grid;
  gap: 14px;
  padding: 10px 0 2px;
}
.settings-danger-content p {
  font-size: 12px;
}
.settings-danger-content .tool-field {
  margin: 0;
}
.settings-danger-content .danger {
  justify-self: start;
}
@media (max-width: 540px) {
  .settings-heading h2 {
    font-size: 24px;
  }
  .settings-section-heading {
    align-items: flex-start;
  }
  .account-identity {
    flex-wrap: wrap;
  }
  .plan-badge {
    margin-left: 66px;
  }
  .account-notice {
    align-items: flex-start;
    flex-direction: column;
  }
  .settings-data-actions > button {
    width: 100%;
    justify-content: center;
  }
  .settings-section :deep(.theme-segmented) {
    width: 100%;
  }
  .settings-section :deep(.theme-segmented button) {
    flex: 1;
    justify-content: center;
    padding-inline: 8px;
  }
}
</style>
