const DAY = 86400000;
const clone = (value) => JSON.parse(JSON.stringify(value));

function toTime(value) {
  const time = value ? new Date(value).getTime() : NaN;
  return Number.isFinite(time) ? time : null;
}

function withinWindow(value, days, now = Date.now()) {
  if (!days) return true;
  const time = toTime(value);
  return time !== null && time >= now - days * DAY && time <= now + DAY;
}

function trackerItems(flow) {
  return Array.isArray(flow?.componentData?.tracker?.items)
    ? flow.componentData.tracker.items
    : [];
}

function filteredTracker(flow, source, now) {
  return trackerItems(flow).filter((item) => {
    if (source.statuses?.length && !source.statuses.includes(item.status))
      return false;
    if (source.statusesNot?.length && source.statusesNot.includes(item.status))
      return false;
    if (
      source.field &&
      source.values?.length &&
      !source.values.includes(item.values?.[source.field])
    )
      return false;
    if (
      source.windowDays &&
      !withinWindow(item.values?.[source.dateField], source.windowDays, now)
    )
      return false;
    return true;
  });
}

function metricValue(flow, definition, resolved, now) {
  const source = definition.source || {};
  if (source.type === "tracker")
    return filteredTracker(flow, source, now).length;
  if (source.type === "trackerSum")
    return filteredTracker(flow, source, now).reduce(
      (total, item) => total + (Number(item.values?.[source.field]) || 0),
      0,
    );
  if (source.type === "trackerRatio") {
    const values = trackerItems(flow).reduce(
      (result, item) => ({
        numerator:
          result.numerator +
          (Number(item.values?.[source.numeratorField]) || 0),
        denominator:
          result.denominator +
          (Number(item.values?.[source.denominatorField]) || 0),
      }),
      { numerator: 0, denominator: 0 },
    );
    return values.denominator
      ? Math.round((values.numerator / values.denominator) * 100)
      : 0;
  }
  if (source.type === "trackerDue") {
    const limit = now + (source.days || 14) * DAY;
    return trackerItems(flow).filter((item) => {
      if (source.statusesNot?.includes(item.status)) return false;
      const due = toTime(item.values?.dueAt || item.values?.when);
      return due !== null && due >= now - DAY && due <= limit;
    }).length;
  }
  if (source.type === "sessions") {
    const sessions = (flow.sessions || []).filter(
      (session) =>
        !source.windowDays ||
        withinWindow(session.endedAt, source.windowDays, now),
    );
    if (source.aggregate === "minutes")
      return Math.floor(
        sessions.reduce((total, session) => total + session.seconds, 0) / 60,
      );
    return sessions.length;
  }
  if (source.type === "tasks")
    return (flow.componentData?.tasks?.items || []).filter(
      (item) => source.done === undefined || item.done === source.done,
    ).length;
  if (source.type === "reviews")
    return (flow.review?.history || []).filter(
      (entry) => !source.status || entry.status === source.status,
    ).length;
  if (source.type === "rate") {
    const numerator = Number(resolved[source.numerator]?.value) || 0;
    const denominator = Number(resolved[source.denominator]?.value) || 0;
    return denominator ? Math.round((numerator / denominator) * 100) : 0;
  }
  return 0;
}

export function calculateMetrics(flow, now = Date.now()) {
  const resolved = {};
  for (const definition of flow?.metricDefinitions || []) {
    const value = metricValue(flow, definition, resolved, now);
    const target = definition.targetProperty
      ? Number(flow.properties?.[definition.targetProperty]) || null
      : Number(definition.target) || null;
    resolved[definition.id] = {
      id: definition.id,
      label: definition.label,
      value,
      target,
      unit: definition.unit || "",
    };
  }
  return resolved;
}

export function refreshFlowDerivedState(flow, now = Date.now()) {
  if (!flow) return flow;
  flow.metrics = calculateMetrics(flow, now);
  const strategy = flow.progress?.strategy || { mode: "indicators" };
  let value = null;
  if (strategy.mode === "ratio") {
    const numerator = flow.metrics[strategy.numeratorMetric]?.value || 0;
    const denominator = flow.metrics[strategy.denominatorMetric]?.value || 0;
    value = denominator ? Math.round((numerator / denominator) * 100) : null;
  }
  flow.progress = {
    ...flow.progress,
    strategy,
    value,
    updatedAt: now,
  };
  return flow;
}

function dateLabel(value) {
  const date = toTime(value);
  if (date === null) return "";
  return new Intl.DateTimeFormat("pt-BR", {
    day: "2-digit",
    month: "short",
  }).format(date);
}

function firstOpenTask(flow) {
  return (flow.componentData?.tasks?.items || []).find((item) => !item.done)
    ?.text;
}

function upcomingItems(flow) {
  return trackerItems(flow)
    .filter((item) => item.status !== "Concluído" && item.status !== "Encerrada")
    .map((item) => ({
      item,
      time: toTime(
        item.values?.nextActionAt ||
          item.values?.dueAt ||
          item.values?.when ||
          item.values?.publishAt,
      ),
    }))
    .filter((entry) => entry.time !== null)
    .sort((a, b) => a.time - b.time);
}

export function getFlowHome(flow, now = Date.now()) {
  const metrics = calculateMetrics(flow, now);
  const properties = flow.properties || {};
  const id = flow.definitionRef?.id;
  const home = {
    eyebrow: "CONTINUE DE ONDE PAROU",
    title: flow.objective,
    facts: [],
    indicators: Object.values(metrics).slice(0, 4),
    nextActions: [],
  };

  if (id === "job") {
    home.eyebrow = "SUA BUSCA, COM CONTEXTO";
    home.title = properties.targetRole || "Seu próximo capítulo";
    home.facts = [properties.seniority, (properties.workModels || []).join(" · ")].filter(Boolean);
    home.nextActions = upcomingItems(flow).slice(0, 3).map(({ item }) => {
      const action = item.values?.nextAction || `Acompanhar ${item.values?.company || "oportunidade"}`;
      const date = dateLabel(item.values?.nextActionAt);
      return date ? `${action} · ${date}` : action;
    });
  } else if (id === "enem") {
    home.eyebrow = "O QUE ESTUDAR HOJE";
    home.title =
      (properties.lowConfidenceSubjects || [])[0] ||
      (properties.prioritySubjects || [])[0] ||
      "Escolha uma prioridade";
    home.facts = [
      properties.examDate ? `Prova em ${dateLabel(properties.examDate)}` : "",
      properties.weeklyHours ? `${properties.weeklyHours} h disponíveis por semana` : "",
    ].filter(Boolean);
    const next = trackerItems(flow).find((item) => item.status !== "Concluído");
    home.nextActions = [
      next?.values?.topic
        ? `${next.values.subject}: ${next.values.topic}`
        : `Comece por ${home.title}`,
      firstOpenTask(flow),
    ].filter(Boolean);
  } else if (id === "code") {
    home.eyebrow = "PRÓXIMO INCREMENTO";
    home.title = properties.projectName || flow.identity.name;
    home.facts = [properties.currentStage, properties.deadline ? `Prazo ${dateLabel(properties.deadline)}` : ""].filter(Boolean);
    const current = trackerItems(flow).find((item) => item.status !== "Concluído");
    home.nextActions = [current?.values?.title, firstOpenTask(flow)].filter(Boolean);
  } else if (id === "college") {
    home.eyebrow = "O QUE PEDE ATENÇÃO";
    home.title = `${properties.course || "Faculdade"} · ${properties.semester || "semestre atual"}`;
    home.facts = (properties.subjects || []).slice(0, 3);
    home.nextActions = upcomingItems(flow)
      .slice(0, 3)
      .map(({ item }) => `${item.values?.title || "Prazo"} · ${dateLabel(item.values?.dueAt)}`);
  } else if (id === "week") {
    home.eyebrow = "O QUE IMPORTA NESTA SEMANA";
    home.title = "Até três prioridades. Um pouco por vez.";
    home.facts = [properties.protectedTime ? `Tempo protegido: ${properties.protectedTime}` : "", properties.habit ? `Lembrar: ${properties.habit}` : ""].filter(Boolean);
    home.nextActions = trackerItems(flow)
      .filter((item) => item.values?.kind === "Prioridade" && item.status !== "Concluído")
      .slice(0, 3)
      .map((item) => item.values.title);
  } else if (["skill", "content", "project"].includes(id)) {
    home.title = properties.skillName || properties.projectName || properties.channel || flow.identity.name;
    home.facts = [properties.desiredOutcome || properties.projectOutcome || properties.contentGoal].filter(Boolean);
    home.nextActions = [
      trackerItems(flow).find((item) => !["Concluído", "Aprendido", "Publicado"].includes(item.status))?.values?.title,
      firstOpenTask(flow),
    ].filter(Boolean);
  } else {
    home.nextActions = [firstOpenTask(flow), ...(flow.context?.prompts || [])].filter(Boolean).slice(0, 3);
  }

  if (!home.nextActions.length)
    home.nextActions = ["Escolha um pequeno próximo passo para este Flow."];
  return home;
}

export function reviewStatus(flow, now = Date.now()) {
  const nextAt = Number(flow?.review?.nextAt) || now;
  const days = Math.max(0, Math.ceil((nextAt - now) / DAY));
  return { due: nextAt <= now, days, nextAt };
}

function scheduleReview(flow, from = Date.now()) {
  flow.review.nextAt =
    from + Math.max(1, Number(flow.review.cadenceDays) || 7) * DAY;
}

export function completeReview(flow, answers, now = Date.now()) {
  flow.review.history ||= [];
  flow.review.history.push({
    id: crypto.randomUUID(),
    status: "completed",
    answers: clone(answers || {}),
    createdAt: now,
  });
  flow.review.lastAt = now;
  scheduleReview(flow, now);
  refreshFlowDerivedState(flow, now);
}

export function postponeReview(flow, days = 2, now = Date.now()) {
  flow.review.history ||= [];
  flow.review.history.push({
    id: crypto.randomUUID(),
    status: "postponed",
    answers: {},
    createdAt: now,
  });
  flow.review.nextAt = now + Math.max(1, days) * DAY;
}

export function skipReview(flow, now = Date.now()) {
  flow.review.history ||= [];
  flow.review.history.push({
    id: crypto.randomUUID(),
    status: "skipped",
    answers: {},
    createdAt: now,
  });
  scheduleReview(flow, now);
  refreshFlowDerivedState(flow, now);
}
