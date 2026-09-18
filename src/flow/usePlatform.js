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
  definitionUpdate,
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
import { bindFlowStorage } from "../utils/storage";
import {
  activeComponents,
  componentData,
  componentDataEntries,
  componentIds,
  componentTypes,
} from "./model";
import { elapsedSeconds, formatClock } from "./time.js";
import {
  completeReview,
  postponeReview,
  refreshFlowDerivedState,
  skipReview,
} from "./runtime.js";
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
    tracker: defineAsyncComponent(
      () => import("../components/StructuredTracker.vue"),
    ),
    tasks: defineAsyncComponent(() => import("../components/TasksTool.vue")),
    notes: defineAsyncComponent(() => import("../components/NotesTool.vue")),
    links: defineAsyncComponent(
      () => import("../components/ResourcesTool.vue"),
    ),
    focus: defineAsyncComponent(() => import("../components/FocusTool.vue")),
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
  const activeDefinitionUpdate = computed(() => definitionUpdate(active.value));
  function focusState(componentId = "focus") {
    if (!active.value) return null;
    const data = componentData(active.value, componentId, {
      minutes: active.value.properties?.focusMinutes || 25,
      state: null,
    });
    data.state ||= {
      running: false,
      end: 0,
      left: (data.minutes || active.value.properties?.focusMinutes || 25) * 60,
      break: false,
      mode: "pomodoro",
      taskId: "",
      goalId: "",
      stageId: "",
    };
    return data.state;
  }
  const focusRunningFor = (componentId) =>
    Boolean(focusState(componentId)?.running);
  const focusBreakFor = (componentId) =>
    Boolean(focusState(componentId)?.break);
  const focusDisplayFor = (componentId) => {
    const state = focusState(componentId);
    return formatClock(
      state?.running ? Math.ceil((state.end - now.value) / 1000) : state?.left,
    );
  };
  const categories = [
    "Todos",
    "Estudos",
    "Programação",
    "Organização",
    "Carreira",
    "Criativo",
    "Pessoal",
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
          name: f.identity.name,
          color: f.identity.color,
          category: f.identity.category,
        })),
      )
      .sort((a, b) => b.endedAt - a.endedAt),
  );
  const totalMinutes = computed(() =>
    Math.floor(sessions.value.reduce((sum, s) => sum + s.seconds, 0) / 60),
  );
  const allTasks = computed(() =>
    active.value
      ? componentDataEntries(active.value, "tasks").flatMap(({ data }) =>
          Array.isArray(data.items) ? data.items : [],
        )
      : [],
  );
  const completed = computed(
    () => allTasks.value.filter((task) => task.done).length,
  );
  const remainingTasks = (flow) =>
    componentDataEntries(flow, "tasks")
      .flatMap(({ data }) => data.items || [])
      .filter((task) => !task.done).length;
  const taskGroups = computed(() => {
    const groups = new Map();
    for (const item of allTasks.value) {
      const group = item.group || "Próximos passos";
      if (!groups.has(group)) groups.set(group, []);
      groups.get(group).push(item);
    }
    return [...groups.entries()].map(([name, items]) => ({ name, items }));
  });
  const session = computed(() => store.account.activeSession);
  const seconds = computed(() => elapsedSeconds(session.value, now.value));
  const clock = formatClock;
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
    draft.value.components = draft.value.components.filter((item) =>
      components.some(
        (component) =>
          component.id === (typeof item === "string" ? item : item.type),
      ),
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
  async function createFlow(payload = null) {
    const selectedComponents = payload?.components || draft.value.components;
    const name = payload?.name || flowName.value;
    const person = payload?.displayName || displayName.value;
    if (
      !name?.trim() ||
      !selectedComponents.length ||
      (!store.account.onboarded && !person?.trim())
    )
      return;
    const definition = clone(draft.value);
    definition.components = selectedComponents;
    const flow = makeFlow(definition, name, payload?.answers || {});
    store.account.flows.push(flow);
    store.account.name = person?.trim() || store.account.name;
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
    bindFlowStorage(
      () => store.account.flows.find((f) => f.id === flow.id) || null,
      (value) => {
        const current = store.account.flows.find((f) => f.id === flow.id);
        if (current) {
          Object.assign(current, value, { updatedAt: Date.now() });
          changed();
        }
      },
    );
    activeId.value = flow.id;
    page.value = "workspace";
  }
  function update() {
    if (active.value) {
      active.value.updatedAt = Date.now();
      refreshFlowDerivedState(active.value);
    }
    changed();
  }
  function updateManualMetric(id, value) {
    if (!active.value) return;
    active.value.properties.manualMetrics ||= {};
    active.value.properties.manualMetrics[id] = Math.max(0, Number(value) || 0);
    update();
  }
  function addTask() {
    if (!newTask.value.trim()) return;
    const tasks = componentData(active.value, "tasks", { items: [] });
    tasks.items ||= [];
    tasks.items.push({
      id: crypto.randomUUID(),
      text: newTask.value.trim(),
      group: "Próximos passos",
      done: false,
    });
    newTask.value = "";
    update();
  }
  function addLink() {
    const url = safeUrl(linkUrl.value);
    if (!url)
      return notify("Insira um link válido começando com https:// ou http://.");
    const links = componentData(active.value, "links", { items: [] });
    links.items ||= [];
    links.items.push({
      id: crypto.randomUUID(),
      title: linkTitle.value.trim() || new URL(url).hostname,
      url,
    });
    linkTitle.value = "";
    linkUrl.value = "";
    update();
  }
  function editComponents(type) {
    const disabled = active.value.components.find(
      (component) => component.type === type && component.enabled === false,
    );
    if (disabled) disabled.enabled = true;
    else {
      const suffix = crypto.randomUUID().slice(0, 8);
      active.value.components.push({
        id: active.value.components.some((component) => component.id === type)
          ? `${type}-${suffix}`
          : type,
        type,
        order: active.value.components.length,
        enabled: true,
        config: {},
      });
    }
    active.value.components.forEach(
      (component, order) => (component.order = order),
    );
    update();
  }
  function removeComponent(componentId) {
    const component = active.value?.components.find(
      (candidate) => candidate.id === componentId,
    );
    if (!component) return;
    component.enabled = false;
    update();
  }
  function moveComponent(index, direction) {
    const visible = activeComponents(active.value);
    const target = index + direction;
    if (target < 0 || target >= visible.length) return;
    [visible[index].order, visible[target].order] = [
      visible[target].order,
      visible[index].order,
    ];
    update();
  }
  function toggleSession(context = {}) {
    now.value = Date.now();
    if (!session.value)
      store.account.activeSession = {
        flowId: active.value.id,
        startedAt: Date.now(),
        elapsed: 0,
        running: true,
        pomodoros: 0,
        baseline: completed.value,
        componentId: context.componentId || null,
        taskId: context.taskId || null,
        goalId: context.goalId || null,
        stageId: context.stageId || null,
        mode: context.mode || "free",
      };
    else if (session.value.flowId !== active.value.id)
      return notify(
        "Finalize a sessão em andamento antes de começar outro Flow.",
      );
    else {
      if (session.value.running) {
        for (const { data } of componentDataEntries(active.value, "focus")) {
          const focus = data.state;
          if (!focus?.running) continue;
          focus.left = Math.max(0, Math.ceil((focus.end - Date.now()) / 1000));
          focus.running = false;
        }
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
      componentId: session.value.componentId || null,
      taskId: session.value.taskId || null,
      goalId: session.value.goalId || null,
      stageId: session.value.stageId || null,
      mode: session.value.mode || "free",
      tasks: Math.max(
        0,
        componentDataEntries(flow, "tasks")
          .flatMap(({ data }) => data.items || [])
          .filter((task) => task.done).length - session.value.baseline,
      ),
    };
    flow.sessions.push(record);
    refreshFlowDerivedState(flow);
    summary.value = { ...record, name: flow.identity.name };
    store.account.activeSession = null;
    for (const { data } of componentDataEntries(flow, "focus"))
      if (data.state) data.state.running = false;
    changed();
    modal.value = "summary";
  }
  function toggleFocus(componentId = "focus", context = {}) {
    const state = focusState(componentId);
    if (!state) return;
    if (state.running) {
      state.left = Math.max(0, Math.ceil((state.end - Date.now()) / 1000));
      state.running = false;
    } else {
      if (!session.value || !session.value.running)
        toggleSession({ componentId, mode: state.mode, ...context });
      if (session.value?.flowId !== active.value.id) return;
      Object.assign(state, context);
      state.end = Date.now() + state.left * 1000;
      state.running = true;
    }
    changed();
  }
  function resetFocus(componentId = "focus", minutes = null) {
    const state = focusState(componentId);
    const data = componentData(active.value, componentId, {});
    if (!state) return;
    if (minutes)
      data.minutes = Math.max(1, Math.min(180, Number(minutes) || 25));
    state.running = false;
    state.break = false;
    state.left =
      (data.minutes || active.value?.properties.focusMinutes || 25) * 60;
    state.end = 0;
    changed();
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
    ctx.fillText("NOMA  /  MEU FLOW", 80, 90);
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
    a.download = "meu-flow-noma.png";
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
  function finishReview(answers) {
    completeReview(active.value, answers);
    update();
    modal.value = null;
    notify("Revisão salva. O próximo passo continua com você.");
  }
  function delayReview() {
    postponeReview(active.value, 2);
    update();
    modal.value = null;
    notify("Revisão adiada por 2 dias.");
  }
  function dismissReview() {
    skipReview(active.value);
    update();
    modal.value = null;
    notify("Esta revisão foi registrada como ignorada.");
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

    const shared =
      new URLSearchParams(location.search).get("flow") ||
      sessionStorage.getItem("noma-intended-flow");
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
        choose(data.blueprint);
        sessionStorage.removeItem("noma-intended-flow");
      });
    else if (sessionStorage.getItem("noma-intended-template")) {
      const template = templates.find(
        (t) => t.id === sessionStorage.getItem("noma-intended-template"),
      );
      sessionStorage.removeItem("noma-intended-template");
      if (template) choose(template);
    } else if (store.account.onboarded) page.value = "flows";
    ticker = setInterval(() => {
      now.value = Date.now();
      for (const flow of store.account.flows) {
        for (const { data } of componentDataEntries(flow, "focus")) {
          const state = data.state;
          if (state?.running && now.value >= state.end) {
            state.running = false;
            if (!state.break && session.value?.flowId === flow.id)
              session.value.pomodoros++;
            state.break = !state.break;
            state.left = state.break
              ? (data.shortBreakMinutes || 5) * 60
              : (data.minutes || flow.properties.focusMinutes || 25) * 60;
            changed();
            notify(
              `${flow.identity.name}: ${state.break ? "ciclo concluído. Faça uma pausa." : "pausa concluída."}`,
            );
          }
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
    componentIds,
    componentTypes,
    activeComponents,
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
    active,
    activeDefinitionUpdate,
    categories,
    filtered,
    sessions,
    totalMinutes,
    completed,
    remainingTasks,
    taskGroups,
    session,
    seconds,
    clock,
    focusRunningFor,
    focusBreakFor,
    focusDisplayFor,
    focusState,
    activity,
    perform,
    choose,
    toggleComponent,
    createFlow,
    openFlow,
    update,
    updateManualMetric,
    addTask,
    addLink,
    editComponents,
    removeComponent,
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
    finishReview,
    delayReview,
    dismissReview,
    signOut,
    copyLink,
  };
}
