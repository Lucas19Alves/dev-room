import {
  computed,
  defineAsyncComponent,
  ref,
  onMounted,
  onUnmounted,
  watch,
  nextTick,
} from "vue";
import {
  components,
  templates,
  makeFlow,
  publicTemplate,
  safeUrl,
  clone,
} from "./catalog";
import {
  store,
  initialize,
  changed,
  syncNow,
  exportBackup,
  loadCloudVersion,
  importGuest,
} from "./store";
import { supabase } from "./supabase";
import { bindStorage } from "../utils/storage";
export function usePlatform() {
  const tools = {
    music: defineAsyncComponent(() => import("../components/MusicPlayer.vue")),
    kanban: defineAsyncComponent(() => import("../components/Kanban.vue")),
    snippets: defineAsyncComponent(
      () => import("../components/CodeSnippets.vue"),
    ),
    playground: defineAsyncComponent(
      () => import("../components/CodePlayground.vue"),
    ),
    converter: defineAsyncComponent(
      () => import("../components/Converter.vue"),
    ),
    water: defineAsyncComponent(
      () => import("../components/WaterReminder.vue"),
    ),
    deploy: defineAsyncComponent(
      () => import("../components/DeployChecklist.vue"),
    ),
    fake: defineAsyncComponent(
      () => import("../components/FakeDataGenerator.vue"),
    ),
    timer: defineAsyncComponent(() => import("../components/Timer.vue")),
  };
  const page = ref("explore"),
    filter = ref("Todos"),
    search = ref(""),
    activeId = ref(null),
    modal = ref(null),
    step = ref(1);
  const draft = ref(null),
    flowName = ref(""),
    displayName = ref(""),
    email = ref(""),
    message = ref(""),
    busy = ref(false),
    adding = ref(false),
    newTask = ref(""),
    linkTitle = ref(""),
    linkUrl = ref(""),
    now = ref(Date.now()),
    community = ref([]),
    summary = ref(null);
  const active = computed(() =>
    store.account.flows.find((f) => f.id === activeId.value),
  );
  function focusField(field, fallback) {
    return computed({
      get: () =>
        active.value?.data.focusState?.[field] ??
        (field === "left"
          ? (active.value?.data.focusMinutes || 25) * 60
          : fallback),
      set: (value) => {
        if (!active.value) return;
        active.value.data.focusState ||= {
          running: false,
          end: 0,
          left: (active.value.data.focusMinutes || 25) * 60,
          break: false,
        };
        active.value.data.focusState[field] = value;
        changed();
      },
    });
  }
  const focusRunning = focusField("running", false),
    focusEnd = focusField("end", 0),
    focusLeft = focusField("left", 1500),
    focusBreak = focusField("break", false);
  const categories = [
    "Todos",
    "Estudos",
    "Programação",
    "Organização",
    "Carreira",
    "Personalizado",
  ];
  const filtered = computed(() =>
    (page.value === "community" ? community.value : templates).filter(
      (t) =>
        (filter.value === "Todos" || t.category === filter.value) &&
        `${t.name} ${t.description}`
          .toLowerCase()
          .includes(search.value.toLowerCase()),
    ),
  );
  const sessions = computed(() =>
    store.account.flows
      .flatMap((f) =>
        f.sessions.map((s) => ({
          ...s,
          name: f.name,
          color: f.color,
          category: f.category,
        })),
      )
      .sort((a, b) => b.endedAt - a.endedAt),
  );
  const totalMinutes = computed(() =>
    Math.floor(sessions.value.reduce((sum, s) => sum + s.seconds, 0) / 60),
  );
  const completed = computed(
    () => active.value?.data.tasks?.filter((t) => t.done).length || 0,
  );
  const session = computed(() => store.account.activeSession);
  const seconds = computed(() =>
    session.value
      ? Math.floor(
          (session.value.elapsed || 0) +
            (session.value.running
              ? (now.value - session.value.startedAt) / 1000
              : 0),
        )
      : 0,
  );
  const clock = (value) =>
    `${String(Math.floor(Math.max(0, value) / 60)).padStart(2, "0")}:${String(Math.floor(Math.max(0, value) % 60)).padStart(2, "0")}`;
  const focusDisplay = computed(() =>
    clock(
      focusRunning.value
        ? Math.ceil((focusEnd.value - now.value) / 1000)
        : focusLeft.value,
    ),
  );
  const activity = computed(() =>
    Array.from({ length: 364 }, (_, i) => {
      const date = new Date();
      date.setHours(0, 0, 0, 0);
      date.setDate(date.getDate() - (363 - i));
      const key = date.toLocaleDateString("pt-BR");
      const minutes = sessions.value
        .filter((s) => new Date(s.endedAt).toLocaleDateString("pt-BR") === key)
        .reduce((n, s) => n + s.seconds / 60, 0);
      return {
        key,
        minutes,
        level: minutes === 0 ? 0 : minutes < 30 ? 1 : minutes < 90 ? 2 : 3,
      };
    }),
  );
  function notify(text) {
    message.value = text;
  }
  async function perform(fn) {
    busy.value = true;
    try {
      await fn();
    } catch (error) {
      notify(error.message);
    } finally {
      busy.value = false;
    }
  }
  function choose(template) {
    draft.value = clone(template);
    draft.value.components = draft.value.components.filter((id) =>
      components.some((c) => c.id === id),
    );
    flowName.value = template.name;
    displayName.value = store.account.name;
    step.value = 1;
    modal.value = "create";
  }
  function toggleComponent(id) {
    const index = draft.value.components.indexOf(id);
    index < 0
      ? draft.value.components.push(id)
      : draft.value.components.splice(index, 1);
  }
  async function createFlow() {
    if (
      !flowName.value.trim() ||
      !draft.value.components.length ||
      (!store.account.onboarded && !displayName.value.trim())
    )
      return;
    const flow = makeFlow(draft.value, flowName.value);
    store.account.flows.push(flow);
    store.account.name = displayName.value.trim() || store.account.name;
    store.account.onboarded = true;
    changed();
    modal.value = null;
    await openFlow(flow);
  }
  async function openFlow(flow) {
    if (!flow) return;
    adding.value = false;
    newTask.value = "";
    linkTitle.value = "";
    linkUrl.value = "";
    activeId.value = null;
    await nextTick();
    bindStorage(
      () => store.account.flows.find((f) => f.id === flow.id)?.data || {},
      (value) => {
        const current = store.account.flows.find((f) => f.id === flow.id);
        if (current) {
          current.data = value;
          current.updatedAt = Date.now();
          changed();
        }
      },
    );
    activeId.value = flow.id;
    page.value = "workspace";
  }
  function update() {
    if (active.value) active.value.updatedAt = Date.now();
    changed();
  }
  function addTask() {
    if (!newTask.value.trim()) return;
    active.value.data.tasks ||= [];
    active.value.data.tasks.push({
      id: crypto.randomUUID(),
      text: newTask.value.trim(),
      done: false,
    });
    newTask.value = "";
    update();
  }
  function addLink() {
    const url = safeUrl(linkUrl.value);
    if (!url)
      return notify("Insira um link válido começando com https:// ou http://.");
    active.value.data.links ||= [];
    active.value.data.links.push({
      id: crypto.randomUUID(),
      title: linkTitle.value.trim() || new URL(url).hostname,
      url,
    });
    linkTitle.value = "";
    linkUrl.value = "";
    update();
  }
  function editComponents(id) {
    const ids = active.value.components;
    const index = ids.indexOf(id);
    index < 0 ? ids.push(id) : ids.splice(index, 1);
    update();
  }
  function moveComponent(index, direction) {
    const ids = active.value.components;
    const target = index + direction;
    if (target < 0 || target >= ids.length) return;
    [ids[index], ids[target]] = [ids[target], ids[index]];
    update();
  }
  function toggleSession() {
    now.value = Date.now();
    if (!session.value)
      store.account.activeSession = {
        flowId: active.value.id,
        startedAt: Date.now(),
        elapsed: 0,
        running: true,
        pomodoros: 0,
        baseline: completed.value,
      };
    else if (session.value.flowId !== active.value.id)
      return notify(
        "Finalize a sessão em andamento antes de começar outro Flow.",
      );
    else {
      if (session.value.running && focusRunning.value) {
        focusLeft.value = Math.max(
          0,
          Math.ceil((focusEnd.value - Date.now()) / 1000),
        );
        focusRunning.value = false;
      }
      session.value.elapsed = seconds.value;
      session.value.running = !session.value.running;
      session.value.startedAt = Date.now();
    }
    changed();
  }
  function finishSession() {
    if (!session.value) return;
    now.value = Date.now();
    const flow = store.account.flows.find((f) => f.id === session.value.flowId);
    const record = {
      id: crypto.randomUUID(),
      endedAt: Date.now(),
      seconds: seconds.value,
      pomodoros: session.value.pomodoros,
      tasks: Math.max(
        0,
        (flow.data.tasks || []).filter((t) => t.done).length -
          session.value.baseline,
      ),
    };
    flow.sessions.push(record);
    summary.value = { ...record, name: flow.name };
    store.account.activeSession = null;
    focusRunning.value = false;
    changed();
    modal.value = "summary";
  }
  function toggleFocus() {
    if (focusRunning.value) {
      focusLeft.value = Math.max(
        0,
        Math.ceil((focusEnd.value - Date.now()) / 1000),
      );
      focusRunning.value = false;
    } else {
      if (!session.value || !session.value.running) toggleSession();
      if (session.value?.flowId !== active.value.id) return;
      focusEnd.value = Date.now() + focusLeft.value * 1000;
      focusRunning.value = true;
    }
  }
  function resetFocus() {
    focusRunning.value = false;
    focusBreak.value = false;
    focusLeft.value = (active.value?.data.focusMinutes || 25) * 60;
  }
  function downloadCard() {
    const canvas = document.createElement("canvas");
    canvas.width = 1200;
    canvas.height = 630;
    const ctx = canvas.getContext("2d");
    ctx.fillStyle = "#142d2b";
    ctx.fillRect(0, 0, 1200, 630);
    ctx.fillStyle = "#bff5cd";
    ctx.font = "24px sans-serif";
    ctx.fillText("CENTRAL OS  /  MEU FLOW", 80, 90);
    ctx.font = "bold 78px sans-serif";
    ctx.fillText(
      `${Math.floor(summary.value.seconds / 60)} min de dedicação`,
      80,
      260,
    );
    ctx.fillStyle = "#ffffff";
    ctx.font = "34px sans-serif";
    ctx.fillText(summary.value.name.slice(0, 48), 80, 350);
    ctx.font = "26px sans-serif";
    ctx.fillText(
      `${summary.value.tasks} tarefas concluídas · ${summary.value.pomodoros} ciclos de foco`,
      80,
      440,
    );
    ctx.fillStyle = "#a1bcb4";
    ctx.fillText("Um próximo passo, todos os dias.", 80, 560);
    const a = document.createElement("a");
    a.download = "meu-flow.png";
    a.href = canvas.toDataURL();
    a.click();
  }
  async function loadCommunity() {
    community.value = [];
    if (!supabase) return;
    const { data, error } = await supabase
      .from("flow_templates")
      .select("id,user_id,blueprint")
      .order("created_at", { ascending: false })
      .limit(100);
    if (error) throw error;
    community.value = data
      .filter(
        (row) =>
          row.blueprint &&
          typeof row.blueprint.name === "string" &&
          Array.isArray(row.blueprint.components),
      )
      .map((row) => ({ ...row.blueprint, id: row.id, owner: row.user_id }));
  }
  async function navigate(destination) {
    activeId.value = null;
    await nextTick();
    page.value = destination;
    filter.value = "Todos";
    search.value = "";
    if (destination === "community") await perform(loadCommunity);
  }
  async function publish() {
    if (!store.user) {
      modal.value = "account";
      return;
    }
    const { data, error } = await supabase
      .from("flow_templates")
      .insert({ blueprint: publicTemplate(active.value) })
      .select("id")
      .single();
    if (error) throw error;
    const url = new URL(location.href);
    url.search = "";
    url.hash = "";
    url.searchParams.set("flow", data.id);
    notify("Modelo publicado. Copie o link para compartilhar.");
    shareLink.value = url.href;
    modal.value = "share";
  }
  const shareLink = ref("");
  async function sendLink() {
    if (!supabase) return;
    const { error } = await supabase.auth.signInWithOtp({
      email: email.value,
      options: { emailRedirectTo: location.origin + location.pathname },
    });
    if (error) throw error;
    notify("Confira seu e-mail para entrar pelo link seguro.");
  }
  async function deleteTemplate(id) {
    const { error } = await supabase
      .from("flow_templates")
      .delete()
      .eq("id", id);
    if (error) throw error;
    await loadCommunity();
  }
  async function signOut() {
    const { error } = await supabase.auth.signOut();
    if (error) throw error;
  }
  async function copyLink() {
    await navigator.clipboard.writeText(shareLink.value);
    notify("Link copiado.");
  }
  function deleteFlow() {
    if (session.value?.flowId === active.value.id)
      return notify("Finalize a sessão antes de excluir o Flow.");
    store.account.flows = store.account.flows.filter(
      (f) => f.id !== active.value.id,
    );
    changed();
    modal.value = null;
    navigate("flows");
  }
  let ticker;
  let previousFocus;
  watch(modal, async (value) => {
    if (value) {
      previousFocus = document.activeElement;
      await nextTick();
      document.querySelector(".modal")?.focus();
    } else previousFocus?.focus?.();
  });
  function trapDialog(event) {
    if (!modal.value) return;
    if (event.key === "Escape") {
      modal.value = null;
      return;
    }
    if (event.key !== "Tab") return;
    const dialog = document.querySelector(".modal");
    const items = [
      ...(dialog?.querySelectorAll(
        "button:not(:disabled), input:not(:disabled), select, textarea, a[href]",
      ) || []),
    ].filter((el) => el.getClientRects().length);
    const first = items[0],
      last = items[items.length - 1];
    if (
      event.shiftKey &&
      (document.activeElement === first || document.activeElement === dialog)
    ) {
      event.preventDefault();
      last?.focus();
    } else if (!event.shiftKey && document.activeElement === last) {
      event.preventDefault();
      first?.focus();
    }
  }
  onMounted(async () => {
    document.addEventListener("keydown", trapDialog);

    const shared = new URLSearchParams(location.search).get("flow") || sessionStorage.getItem("centralos-intended-flow");
    if (shared && supabase)
      await perform(async () => {
        const { data, error } = await supabase
          .from("flow_templates")
          .select("blueprint")
          .eq("id", shared)
          .single();
        if (error) throw error;
        if (!Array.isArray(data.blueprint?.components))
          throw new Error("Modelo inválido.");
        choose(data.blueprint); sessionStorage.removeItem("centralos-intended-flow");
      });
    else if (sessionStorage.getItem("centralos-intended-template")) { const template = templates.find(t => t.id === sessionStorage.getItem("centralos-intended-template")); sessionStorage.removeItem("centralos-intended-template"); if(template) choose(template); } else if (store.account.onboarded) page.value = "flows";
    ticker = setInterval(() => {
      now.value = Date.now();
      for (const flow of store.account.flows) {
        const state = flow.data.focusState;
        if (state?.running && now.value >= state.end) {
          state.running = false;
          if (!state.break && session.value?.flowId === flow.id)
            session.value.pomodoros++;
          state.break = !state.break;
          state.left = state.break ? 300 : (flow.data.focusMinutes || 25) * 60;
          changed();
          notify(
            `${flow.name}: ${state.break ? "ciclo concluído. Faça uma pausa de 5 minutos." : "pausa concluída."}`,
          );
        }
      }
    }, 1000);
  });
  onUnmounted(() => {
    clearInterval(ticker);
    document.removeEventListener("keydown", trapDialog);
  });
  watch(
    () => store.user?.id,
    () => {
      activeId.value = null;
      page.value = "flows";
      modal.value = null;
    },
  );
  watch(
    () => store.remoteVersion,
    async () => {
      if (active.value) await openFlow(active.value);
    },
  );
  watch(
    () => store.ready,
    (value) => {
      if (!value) activeId.value = null;
    },
  );
  return {
    components,
    templates,
    store,
    supabase,
    syncNow,
    exportBackup,
    loadCloudVersion,
    importGuest,
    initialize,
    safeUrl,
    tools,
    page,
    filter,
    search,
    activeId,
    modal,
    step,
    draft,
    flowName,
    displayName,
    email,
    message,
    busy,
    adding,
    newTask,
    linkTitle,
    linkUrl,
    community,
    summary,
    focusRunning,
    focusBreak,
    active,
    categories,
    filtered,
    sessions,
    totalMinutes,
    completed,
    session,
    seconds,
    clock,
    focusDisplay,
    activity,
    perform,
    choose,
    toggleComponent,
    createFlow,
    openFlow,
    update,
    addTask,
    addLink,
    editComponents,
    moveComponent,
    toggleSession,
    finishSession,
    toggleFocus,
    resetFocus,
    downloadCard,
    navigate,
    publish,
    shareLink,
    sendLink,
    deleteTemplate,
    deleteFlow,
    signOut,
    copyLink,
  };
}

