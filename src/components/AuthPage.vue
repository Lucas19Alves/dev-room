<script setup>
import { computed, ref, watch } from "vue";
import { supabase } from "../flow/supabase";
import { store } from "../flow/store";
import BrandLogo from "./ui/BrandLogo.vue";
import NButton from "./ui/NButton.vue";
import NField from "./ui/NField.vue";
const props = defineProps({
  mode: { type: String, default: "login" },
  callbackError: { type: String, default: "" },
});
const emit = defineEmits(["navigate"]);
const email = ref(""),
  password = ref(""),
  name = ref(""),
  showPassword = ref(false),
  busy = ref(false),
  error = ref(""),
  success = ref(""),
  sent = ref(false);
const title = computed(
  () =>
    ({
      login: "Bom te ver por aqui.",
      signup: "Seu próximo passo começa aqui.",
      forgot: "Vamos recuperar seu acesso.",
      reset: "Uma nova senha. Seu mesmo espaço.",
    })[props.mode],
);
watch(
  () => props.mode,
  () => {
    error.value = "";
    success.value = "";
    sent.value = false;
    password.value = "";
  },
);
const errors = {
  invalid_credentials:
    "E-mail ou senha incorretos. Confira os dados e tente novamente.",
  email_not_confirmed:
    "Confirme seu e-mail antes de entrar. Procure a mensagem de confirmação na sua caixa de entrada.",
  over_email_send_rate_limit:
    "Aguarde alguns minutos antes de solicitar outro e-mail.",
  weak_password: "Use uma senha mais forte, com pelo menos 8 caracteres.",
  user_already_exists:
    "Este e-mail já possui uma conta. Entre ou recupere sua senha.",
  email_address_not_authorized:
    "O serviço de e-mail ainda está sendo configurado. Tente novamente mais tarde.",
  otp_expired: "Este link expirou. Solicite um novo para continuar.",
};
async function submit(kind = props.mode) {
  if (!supabase || busy.value) return;
  busy.value = true;
  error.value = "";
  success.value = "";
  try {
    let response;
    const redirect = location.origin + "/auth/callback";
    if (kind === "signup")
      response = await supabase.auth.signUp({
        email: email.value.trim(),
        password: password.value,
        options: {
          emailRedirectTo: redirect,
          data: { display_name: name.value.trim() },
        },
      });
    else if (kind === "login")
      response = await supabase.auth.signInWithPassword({
        email: email.value.trim(),
        password: password.value,
      });
    else if (kind === "forgot")
      response = await supabase.auth.resetPasswordForEmail(email.value.trim(), {
        redirectTo: location.origin + "/reset-password",
      });
    else if (kind === "reset") {
      if (!store.user)
        throw new Error(
          "Abra o link enviado ao seu e-mail para definir uma nova senha.",
        );
      response = await supabase.auth.updateUser({ password: password.value });
    } else if (kind === "resend")
      response = await supabase.auth.resend({
        type: "signup",
        email: email.value.trim(),
        options: { emailRedirectTo: redirect },
      });
    else
      response = await supabase.auth.signInWithOtp({
        email: email.value.trim(),
        options: { emailRedirectTo: redirect, shouldCreateUser: false },
      });
    if (response.error) throw response.error;
    if (kind === "login" || (kind === "signup" && response.data?.session)) {
      password.value = "";
      emit("navigate", "/app");
    } else if (kind === "reset") {
      password.value = "";
      store.recovery = false;
      emit("navigate", "/app");
    } else {
      sent.value = true;
      success.value =
        kind === "signup" || kind === "resend"
          ? "Confira seu e-mail e confirme sua conta para começar."
          : "Se houver uma conta com este e-mail, você receberá um link para continuar.";
    }
  } catch (e) {
    error.value =
      errors[e.code] ||
      (e.message?.includes("fetch") || e.name === "TimeoutError"
        ? "Não foi possível conectar. Confira sua conexão e tente novamente."
        : "Não foi possível concluir. " + e.message);
  } finally {
    busy.value = false;
  }
}
</script>
<template>
  <div class="auth-layout">
    <section class="auth-story">
      <a
        href="/"
        class="brand"
        aria-label="Noma — início"
        @click.prevent="emit('navigate', '/')"
        ><BrandLogo
      /></a>
      <div class="auth-story-copy">
        <span class="eyebrow">SEU OBJETIVO. SEU FLOW.</span>
        <h1>Menos abas.<br />Mais contexto<br />para <em>realizar.</em></h1>
        <p>
          Um lugar para reunir contexto, ferramentas e progresso em torno do que
          você quer fazer.
        </p>
        <div class="auth-note">
          <span>▤ &nbsp; UM LEMBRETE PARA HOJE</span>
          <p>
            Você não precisa fazer tudo.<br />Só precisa começar pelo que
            importa.
          </p>
          <small>Seu próximo Flow está te esperando. ✳</small>
        </div>
      </div>
      <small class="auth-story-footer">Um próximo passo, todos os dias.</small>
    </section>
    <section class="auth-form-side">
      <button class="auth-back" @click="emit('navigate', '/')">
        ← Voltar para o início
      </button>
      <div class="auth-form-wrap">
        <span class="eyebrow">{{
          mode === "signup"
            ? "CRIE SUA CONTA"
            : mode === "login"
              ? "ENTRE NO SEU ESPAÇO"
              : "ACESSO À CONTA"
        }}</span>
        <h2>{{ title }}</h2>
        <p class="auth-description">
          {{
            mode === "signup"
              ? "Primeiro, um espaço só seu. Depois, um Flow para cada objetivo."
              : mode === "login"
                ? "Seus Flows, suas ideias e seu próximo objetivo estão aqui."
                : mode === "forgot"
                  ? "Informe seu e-mail para receber um link de recuperação."
                  : "Escolha uma senha com pelo menos 8 caracteres."
          }}
        </p>
        <div v-if="!supabase" class="auth-notice">
          Estamos preparando o acesso ao Noma. Volte em breve para criar sua
          conta.
        </div>
        <p v-if="callbackError || error" class="auth-error" role="alert">
          {{
            error || "Não foi possível validar o link. Solicite um novo acesso."
          }}
        </p>
        <p v-if="store.error && !store.ready" class="auth-error" role="alert">
          {{ store.error }}
        </p>
        <div v-if="success" class="auth-success" role="status">
          <span>✓</span><strong>{{ success }}</strong>
          <p>
            Verifique também a pasta de spam. Você pode fechar esta tela
            enquanto espera.
          </p>
          <button
            v-if="mode === 'signup'"
            class="text-button"
            @click="emit('navigate', '/login')"
          >
            Ir para o login →
          </button>
        </div>
        <form v-if="!sent" class="auth-form" @submit.prevent="submit()">
          <NField
            v-if="mode === 'signup'"
            label="Como podemos te chamar?"
            input-id="auth-name"
            ><input
              id="auth-name"
              v-model="name"
              autocomplete="given-name"
              required
              maxlength="60"
              placeholder="Seu nome"
          /></NField>
          <NField
            v-if="mode !== 'reset'"
            label="Seu e-mail"
            input-id="auth-email"
            ><input
              id="auth-email"
              v-model="email"
              type="email"
              autocomplete="email"
              required
              placeholder="voce@exemplo.com"
          /></NField>
          <NField
            v-if="mode !== 'forgot'"
            :label="mode === 'reset' ? 'Nova senha' : 'Sua senha'"
            input-id="auth-password"
            ><div class="password-field">
              <input
                id="auth-password"
                v-model="password"
                :type="showPassword ? 'text' : 'password'"
                :autocomplete="
                  mode === 'login' ? 'current-password' : 'new-password'
                "
                :minlength="mode === 'login' ? 1 : 8"
                required
                placeholder="Pelo menos 8 caracteres"
              /><button
                type="button"
                :aria-label="showPassword ? 'Ocultar senha' : 'Mostrar senha'"
                @click="showPassword = !showPassword"
              >
                {{ showPassword ? "Ocultar" : "Mostrar" }}
              </button>
            </div></NField
          >
          <button
            v-if="mode === 'login'"
            type="button"
            class="forgot-link"
            @click="emit('navigate', '/forgot-password')"
          >
            Esqueci minha senha
          </button>
          <NButton
            type="submit"
            class="auth-submit"
            :busy="busy"
            :disabled="!supabase || (mode === 'reset' && !store.user)"
            >{{
              {
                login: "Entrar no meu espaço",
                signup: "Criar minha conta",
                forgot: "Enviar link de recuperação",
                reset: "Salvar nova senha",
              }[mode]
            }}
            <span v-if="!busy">↗</span></NButton
          >
          <template v-if="mode === 'login'"
            ><div class="auth-divider"><span>ou entre sem senha</span></div>
            <button
              type="button"
              class="outline auth-submit"
              :disabled="busy || !supabase || !email.includes('@')"
              @click="submit('magic')"
            >
              Receber um link por e-mail
            </button></template
          >
        </form>
        <button
          v-if="mode === 'login' && error && email"
          class="text-button"
          :disabled="busy"
          @click="submit('resend')"
        >
          Reenviar confirmação de e-mail
        </button>
        <p class="auth-switch">
          {{
            mode === "signup"
              ? "Já tem uma conta?"
              : mode === "login"
                ? "Ainda não tem uma conta?"
                : "Lembrou sua senha?"
          }}
          <button
            @click="emit('navigate', mode === 'login' ? '/signup' : '/login')"
          >
            {{ mode === "login" ? "Criar minha conta" : "Entrar" }} →
          </button>
        </p>
        <div class="auth-private">
          ♧ &nbsp; Seu conteúdo é privado. Você escolhe o que compartilhar.
        </div>
      </div>
      <small class="auth-bottom">Feito para o seu próximo passo.</small>
    </section>
  </div>
</template>
