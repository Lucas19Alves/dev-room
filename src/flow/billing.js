import { reactive } from "vue";
import { supabase } from "./supabase.js";
import {
  FREE_ENTITLEMENTS,
  normalizeEntitlements,
  mayActivate,
} from "./entitlements.js";
import { deleteAccountData } from "./database.js";

export const billingState = reactive({
  ready: false,
  loading: false,
  available: false,
  error: "",
  subscription: null,
  entitlements: { ...FREE_ENTITLEMENTS },
});
let requestGeneration = 0;

export function resetBilling() {
  requestGeneration++;
  Object.assign(billingState, {
    ready: false,
    loading: false,
    available: false,
    error: "",
    subscription: null,
    entitlements: { ...FREE_ENTITLEMENTS },
  });
}
const e2eHasPro = () =>
  import.meta.env.VITE_E2E_MODE === "true" &&
  typeof localStorage !== "undefined" &&
  localStorage.getItem("noma-e2e-plan") === "pro";
export const can = (feature) =>
  billingState.entitlements[feature] === true ||
  (feature === "unlimitedFlows" && e2eHasPro());
export const activeFlowLimit = () => billingState.entitlements.activeFlowLimit;
export const mayActivateFlow = (flows, flowId) =>
  mayActivate(flows, billingState.entitlements, flowId);

export async function refreshEntitlements() {
  const request = ++requestGeneration;
  if (import.meta.env.VITE_E2E_MODE === "true") {
    billingState.entitlements = normalizeEntitlements(
      localStorage.getItem("noma-e2e-plan") === "pro"
        ? { plan: "pro" }
        : { plan: "free" },
    );
    billingState.available = true;
    billingState.ready = true;
    billingState.loading = false;
    billingState.error = "";
    return;
  }
  if (!supabase) {
    billingState.ready = true;
    return;
  }
  billingState.loading = true;
  try {
    const { data, error } = await supabase.rpc("get_my_entitlements");
    if (error) throw error;
    if (request !== requestGeneration) return;
    billingState.entitlements = normalizeEntitlements(data);
    billingState.subscription = data.subscription || null;
    billingState.available = true;
    billingState.error = "";
  } catch {
    if (request === requestGeneration)
      billingState.error =
        "Não foi possível atualizar seu plano agora. Tente novamente quando estiver conectado.";
  } finally {
    if (request === requestGeneration) {
      billingState.ready = true;
      billingState.loading = false;
    }
  }
}

async function billingRedirect(action, interval = "month") {
  if (!supabase || !navigator.onLine)
    throw new Error("Conecte-se para gerenciar sua assinatura.");
  const { data, error } = await supabase.functions.invoke("billing", {
    body: { action, interval, requestId: crypto.randomUUID() },
  });
  if (error || !data?.url)
    throw new Error(
      "Não foi possível abrir o pagamento. Tente novamente em instantes.",
    );
  const url = new URL(data.url);
  const allowed =
    action === "checkout" && data.action !== "portal"
      ? "checkout.stripe.com"
      : "billing.stripe.com";
  if (url.protocol !== "https:" || url.hostname !== allowed)
    throw new Error("O endereço de pagamento não pôde ser confirmado.");
  window.location.assign(url.href);
}
export const startCheckout = (interval = "month") =>
  billingRedirect("checkout", interval);
export const openBillingPortal = () => billingRedirect("portal");

export async function deleteAccount() {
  if (!supabase || !navigator.onLine)
    throw new Error("Conecte-se para excluir sua conta.");
  const session = await supabase.auth.getSession();
  const userId = session.data.session?.user.id;
  const { data, error } = await supabase.functions.invoke("account-delete", {
    body: { confirmation: "EXCLUIR MINHA CONTA" },
  });
  if (error || data?.deleted !== true)
    throw new Error(
      "Não foi possível concluir a exclusão. Sua conta permanece disponível para uma nova tentativa.",
    );
  await supabase.auth.signOut({ scope: "local" });
  if (userId) await deleteAccountData(`user:${userId}`);
  resetBilling();
}
