<script setup>
import {
  computed,
  onMounted,
  onUnmounted,
  ref,
  watch,
  defineAsyncComponent,
} from "vue";
import LandingPage from "./components/LandingPage.vue";
import AuthPage from "./components/AuthPage.vue";
import BrandLogo from "./components/ui/BrandLogo.vue";
import ProductState from "./components/ui/ProductState.vue";
import NButton from "./components/ui/NButton.vue";
import { initialize, store } from "./flow/store";
const Workspace = defineAsyncComponent(() => import("./Workspace.vue"));
const path = ref(location.pathname),
  booting = ref(true);
const callbackError = ref(
  new URLSearchParams(location.hash.slice(1)).get("error_description") ||
    new URLSearchParams(location.search).get("error_description") ||
    "",
);
const authMode = computed(() =>
  path.value === "/signup"
    ? "signup"
    : path.value === "/forgot-password"
      ? "forgot"
      : path.value === "/reset-password"
        ? "reset"
        : "login",
);
const privateRoute = computed(() => path.value === "/app");
function navigate(to, replace = false) {
  history[replace ? "replaceState" : "pushState"]({}, "", to);
  path.value = location.pathname;
  window.scrollTo(0, 0);
}
function onPop() {
  path.value = location.pathname;
}
function enter(templateId) {
  if (templateId) sessionStorage.setItem("noma-intended-template", templateId);
  navigate(store.user ? "/app" : "/signup");
}
watch(
  () => store.recovery,
  (recovery) => {
    if (recovery) navigate("/reset-password", true);
  },
);
watch(
  () => [store.user?.id, store.ready, booting.value],
  () => {
    if (booting.value || !store.ready) return;
    if (
      store.user &&
      ["/login", "/signup", "/auth/callback"].includes(path.value) &&
      !store.recovery
    )
      navigate("/app", true);
    if (!store.user && privateRoute.value) navigate("/login", true);
  },
);
onMounted(async () => {
  const flow = new URLSearchParams(location.search).get("flow");
  if (flow) sessionStorage.setItem("noma-intended-flow", flow);
  window.addEventListener("popstate", onPop);
  await initialize();
  booting.value = false;
  if (store.recovery) navigate("/reset-password", true);
});
onUnmounted(() => window.removeEventListener("popstate", onPop));
</script>
<template>
  <LandingPage
    v-if="path === '/'"
    :signed-in="!!store.user"
    @enter="enter"
    @login="navigate(store.user ? '/app' : '/login')"
  />
  <div
    v-else-if="booting || (privateRoute && !store.ready)"
    class="auth-loading"
  >
    <BrandLogo compact /><ProductState
      :kind="store.error ? 'error' : 'loading'"
      :title="
        store.error
          ? 'Não foi possível abrir seu espaço'
          : 'Preparando seu espaço…'
      "
      :description="store.error"
      compact
      ><NButton v-if="store.error" variant="secondary" @click="initialize"
        >Tentar novamente</NButton
      ></ProductState
    >
  </div>
  <Workspace
    v-else-if="privateRoute && store.user && store.ready && !store.recovery"
    :key="store.user.id"
  />
  <AuthPage
    v-else
    :mode="authMode"
    :callback-error="callbackError"
    @navigate="navigate"
  />
</template>
