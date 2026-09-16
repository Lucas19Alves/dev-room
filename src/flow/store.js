import { reactive, nextTick } from "vue";
import { readAccount, writeAccount } from "./database";
import { emptyAccount, makeFlow, templates, clone } from "./catalog";
import { supabase } from "./supabase";
export const store = reactive({
  ready: false,
  account: emptyAccount(),
  user: null,
  status: "Carregando…",
  error: "",
  conflict: false,
  pending: 0,
  remoteVersion: 0, recovery: new URLSearchParams(location.hash.slice(1)).get("type") === "recovery",
});
let accountKey = "guest",
  revision = 0,
  dirty = false,
  generation = 0,
  syncTimer,
  syncing = false,
  queue = Promise.resolve();
const envelope = () => ({ account: clone(store.account), revision, dirty });
function persist() {
  const key = accountKey,
    value = envelope();
  store.pending++;
  queue = queue.catch(() => {}).then(() => writeAccount(key, value));
  return queue
    .catch((error) => {
      store.error =
        "Não foi possível salvar neste dispositivo: " + error.message;
      throw error;
    })
    .finally(() => store.pending--);
}
export function changed() {
  dirty = true;
  generation++;
  store.status = "Salvando neste dispositivo…";
  const savedGeneration = generation;
  persist()
    .then(() => {
      if (savedGeneration === generation)
        store.status = store.user
          ? "Alterações pendentes"
          : "Salvo neste dispositivo";
    })
    .catch(() => {
      store.status = "Falha ao salvar";
    });
  clearTimeout(syncTimer);
  if (store.user) syncTimer = setTimeout(syncNow, 1200);
}
export async function syncNow() {
  if (!supabase || !store.user || syncing || store.conflict) return;
  syncing = true;
  const key = accountKey,
    version = generation;
  store.status = "Sincronizando…";
  try {
    if (dirty) {
      const { data, error } = await supabase.rpc("save_flow_account", {
        payload: clone(store.account),
        expected_revision: revision,
      });
      if (error) {
        if (error.message.includes("revision_conflict")) store.conflict = true;
        throw error;
      }
      if (key !== accountKey) return;
      revision = data;
      if (version === generation) dirty = false;
    } else {
      const { data, error } = await supabase
        .from("flow_accounts")
        .select("payload,revision")
        .eq("user_id", store.user.id)
        .maybeSingle();
      if (error) throw error;
      if (key !== accountKey) return;
      if (
        data &&
        !dirty &&
        version === generation &&
        data.revision !== revision
      ) {
        store.account = data.payload;
        revision = data.revision;
        store.remoteVersion++;
      }
    }
    await persist();
    store.status = dirty ? "Alterações pendentes" : "Sincronizado";
    store.error = "";
  } catch (error) {
    store.status = store.conflict
      ? "Conflito de sincronização"
      : "Salvo localmente · nuvem pendente";
    store.error = store.conflict
      ? "Outro dispositivo alterou seus Flows. Exporte uma cópia local antes de carregar a versão da nuvem."
      : "Sincronização indisponível. Suas alterações serão reenviadas ao reconectar. " +
        error.message;
  } finally {
    syncing = false;
  }
}
export async function loadCloudVersion() {
  if (!supabase || !store.user) return;
  const { data, error } = await supabase
    .from("flow_accounts")
    .select("payload,revision")
    .eq("user_id", store.user.id)
    .single();
  if (error) throw error;
  store.account = data.payload;
  revision = data.revision;
  dirty = false;
  store.conflict = false;
  store.remoteVersion++;
  await persist();
  store.error = "";
  store.status = "Sincronizado";
}
async function loadUser(user) {
  store.ready = false;
  await nextTick();
  clearTimeout(syncTimer);
  // Do not switch the authenticated cache while an old user's request is in flight.
  while (syncing) await new Promise((resolve) => setTimeout(resolve, 20));
  await queue.catch(() => {});
  store.ready = false;
  store.user = user;
  accountKey = user ? `user:${user.id}` : "guest";
  store.account = emptyAccount();
  const saved = await readAccount(accountKey);
  store.account = saved?.account || emptyAccount(); if (!store.account.name && user) store.account.name = user.user_metadata?.display_name || "";
  revision = saved?.revision || 0;
  dirty = saved?.dirty || false;
  store.conflict = false;
  store.error = "";
  generation++;
  if (!saved && !user) {
    const legacy = localStorage.getItem("dev-room-data");
    if (legacy) {
      try {
        const old = JSON.parse(legacy);
        const flow = makeFlow(templates[0], "Meu espaço anterior");
        flow.category = "Personalizado";
        flow.data = {
          ...flow.data,
          ...old,
          notesText: (old.notes || []).map((n) => n.text).join("\n\n"),
        };
        store.account.flows.push(flow);
        store.account.name =
          old.nome || localStorage.getItem("dev-room-nome") || "";
        dirty = true;
      } catch {
        store.error =
          "Os dados antigos não puderam ser importados. A cópia original foi preservada.";
      }
    }
    await persist();
  }
  if (user) await syncNow();
  store.status = user ? store.status : "Salvo neste dispositivo";
  store.ready = true;
}
export async function initialize() {
  try {
    if (navigator.locks && !store.ready && !window.__centralosLock) {
      const acquired = await new Promise((resolve) =>
        navigator.locks.request(
          "centralos-writer",
          { ifAvailable: true },
          (lock) => {
            if (!lock) {
              resolve(false);
              return;
            }
            window.__centralosLock = true;
            resolve(true);
            return new Promise(() => {});
          },
        ),
      );
      if (!acquired)
        throw new Error(
          "O CentralOS já está aberto em outra aba. Feche a outra aba e tente novamente para proteger suas alterações.",
        );
    }
    const session = supabase
      ? await supabase.auth.getSession()
      : { data: { session: null } };
    if (session.error) throw session.error;
    await loadUser(session.data.session?.user || null);
    supabase?.auth.onAuthStateChange((event, session) => { if (event === "PASSWORD_RECOVERY") store.recovery = true;
      if (
        ["SIGNED_IN", "SIGNED_OUT", "PASSWORD_RECOVERY"].includes(event) &&
        (session?.user?.id || null) !== (store.user?.id || null)
      ) {
        // Leave the auth callback before making further Supabase calls.
        setTimeout(
          () =>
            loadUser(session?.user || null).catch((error) => {
              store.error = error.message;
              store.ready = false;
            }),
          0,
        );
      }
    });
    window.addEventListener("online", syncNow);
    window.addEventListener("beforeunload", (event) => {
      if (store.pending) {
        event.preventDefault();
        event.returnValue = "";
      }
    });
    setInterval(syncNow, 30000);
  } catch (error) {
    store.error = "Falha ao abrir os dados: " + error.message;
    store.status = "Armazenamento indisponível";
  }
}
export async function importGuest() {
  const guest = await readAccount("guest");
  if (!guest?.account?.flows?.length)
    throw new Error("Nenhum Flow local para importar.");
  const existing = new Set(store.account.flows.map((f) => f.id));
  store.account.flows.push(
    ...guest.account.flows.filter((f) => !existing.has(f.id)),
  );
  changed();
}
export function exportBackup() {
  const blob = new Blob([JSON.stringify(store.account, null, 2)], {
    type: "application/json",
  });
  const url = URL.createObjectURL(blob),
    a = document.createElement("a");
  a.href = url;
  a.download = "centralos-backup.json";
  a.click();
  setTimeout(() => URL.revokeObjectURL(url), 1000);
}

