const KIND_LABELS = {
  lesson: "Aula",
  practice: "Prática",
  checkpoint: "Checkpoint",
  milestone: "Marco",
  review: "Revisão",
};

export const stageKinds = Object.entries(KIND_LABELS);

const clone = (value) => JSON.parse(JSON.stringify(value));

export function stageKindLabel(kind) {
  return KIND_LABELS[kind] || "Passo";
}

export function slugStage(value, fallback = "passo") {
  return (
    String(value || fallback)
      .normalize("NFD")
      .replace(/[\u0300-\u036f]/g, "")
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, "-")
      .replace(/^-+|-+$/g, "")
      .slice(0, 48) || fallback
  );
}

export function normalizeStage(stage, index = 0) {
  if (typeof stage === "string") {
    return {
      id: slugStage(stage, `stage-${index + 1}`),
      title: stage,
      description: "",
      kind: "milestone",
      order: index,
      status: index === 0 ? "current" : "upcoming",
      sequential: true,
      checklist: [],
      resources: [],
      durationMinutes: null,
      completedAt: null,
    };
  }
  const title = String(stage?.title || `Passo ${index + 1}`).trim();
  return {
    id: stage?.id || slugStage(title, `stage-${index + 1}`),
    title,
    description: String(stage?.description || "").trim(),
    kind: KIND_LABELS[stage?.kind] ? stage.kind : "milestone",
    order: Number.isFinite(stage?.order) ? stage.order : index,
    status: ["completed", "current", "upcoming", "locked"].includes(
      stage?.status,
    )
      ? stage.status
      : index === 0
        ? "current"
        : "upcoming",
    sequential: stage?.sequential !== false,
    checklist: Array.isArray(stage?.checklist)
      ? stage.checklist.map((item, itemIndex) =>
          typeof item === "string"
            ? { id: `check-${itemIndex + 1}`, text: item, done: false }
            : {
                id: item.id || `check-${itemIndex + 1}`,
                text: String(item.text || "").trim(),
                done: Boolean(item.done),
              },
        )
      : [],
    resources: Array.isArray(stage?.resources)
      ? stage.resources
          .map((item) => ({
            title: String(item.title || item.url || "").trim(),
            url: String(item.url || "").trim(),
          }))
          .filter((item) => item.title || item.url)
      : [],
    durationMinutes: Number.isFinite(Number(stage?.durationMinutes))
      ? Math.max(0, Number(stage.durationMinutes))
      : null,
    completedAt: stage?.completedAt || null,
  };
}

export function normalizeStages(stages = []) {
  const list = (Array.isArray(stages) ? stages : []).map(normalizeStage);
  return reconcileStageStatus(list);
}

export function reconcileStageStatus(stages = []) {
  const list = [...stages].sort(
    (a, b) => a.order - b.order || a.id.localeCompare(b.id),
  );
  let sawCurrent = false;
  return list.map((stage, index) => {
    const previous = list[index - 1];
    const locked =
      stage.sequential !== false &&
      index > 0 &&
      previous?.status !== "completed";
    if (stage.status === "completed") {
      return { ...stage, order: index, status: "completed" };
    }
    if (locked) return { ...stage, order: index, status: "locked" };
    if (!sawCurrent) {
      sawCurrent = true;
      return { ...stage, order: index, status: "current" };
    }
    return { ...stage, order: index, status: "upcoming" };
  });
}

export function journeyProgress(flow) {
  const stages = normalizeStages(flow?.stages || []);
  const completed = stages.filter(
    (stage) => stage.status === "completed",
  ).length;
  const current = stages.find((stage) => stage.status === "current") || null;
  return {
    stages,
    completed,
    total: stages.length,
    percent: stages.length
      ? Math.round((completed / stages.length) * 100)
      : null,
    current,
  };
}

export function canCompleteStage(flow, stageId) {
  const stages = normalizeStages(flow?.stages || []);
  const stage = stages.find((item) => item.id === stageId);
  if (!stage || stage.status === "completed") return false;
  if (stage.status === "locked") return false;
  const openChecks = (stage.checklist || []).filter(
    (item) => item.text && !item.done,
  );
  return openChecks.length === 0;
}

export function completeStage(flow, stageId, now = Date.now()) {
  const stages = normalizeStages(flow.stages || []);
  const stage = stages.find((item) => item.id === stageId);
  if (!stage || !canCompleteStage({ stages }, stageId)) {
    throw new Error("Conclua o que este passo pede antes de avançar.");
  }
  stage.status = "completed";
  stage.completedAt = now;
  flow.stages = reconcileStageStatus(stages);
  flow.events = [
    ...(flow.events || []),
    {
      id: crypto.randomUUID(),
      type: "stage.completed",
      timestamp: now,
      entityId: stage.id,
      title: `${stage.title} concluído`,
      metadata: { kind: stage.kind },
    },
  ];
  return flow;
}

export function reopenStage(flow, stageId, now = Date.now()) {
  const stages = normalizeStages(flow.stages || []);
  const index = stages.findIndex((item) => item.id === stageId);
  if (index < 0) return flow;
  stages.forEach((stage, order) => {
    if (order < index) return;
    stage.status = order === index ? "current" : "upcoming";
    if (order >= index) stage.completedAt = null;
  });
  flow.stages = reconcileStageStatus(stages);
  flow.events = [
    ...(flow.events || []),
    {
      id: crypto.randomUUID(),
      type: "stage.reopened",
      timestamp: now,
      entityId: stageId,
      title: "Um passo do caminho foi reaberto",
    },
  ];
  return flow;
}

export function toggleStageCheck(flow, stageId, checkId) {
  const stages = normalizeStages(flow.stages || []);
  const stage = stages.find((item) => item.id === stageId);
  const item = stage?.checklist?.find((entry) => entry.id === checkId);
  if (!item) return flow;
  item.done = !item.done;
  flow.stages = reconcileStageStatus(stages);
  return flow;
}

export function publicStages(stages = []) {
  return normalizeStages(stages).map(
    ({
      id,
      title,
      description,
      kind,
      order,
      sequential,
      checklist,
      resources,
      durationMinutes,
    }) => ({
      id,
      title,
      description,
      kind,
      order,
      sequential,
      durationMinutes,
      checklist: (checklist || []).map(({ text }) => ({ text })),
      resources: clone(resources || []),
    }),
  );
}
