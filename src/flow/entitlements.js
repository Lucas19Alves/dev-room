// A single capability boundary for the UI. Cloud authorization is enforced again
// by Postgres; changing this object in a browser never changes a subscription.
export const FREE_ENTITLEMENTS = Object.freeze({
  plan: "free",
  activeFlowLimit: 3,
  unlimitedFlows: false,
  advancedRules: false,
  fullHistory: false,
  advancedExport: false,
  advancedCalendar: false,
});

export function normalizeEntitlements(value) {
  if (value?.plan !== "pro") return { ...FREE_ENTITLEMENTS };
  return {
    plan: "pro",
    activeFlowLimit: null,
    unlimitedFlows: true,
    advancedRules: true,
    fullHistory: true,
    advancedExport: true,
    advancedCalendar: true,
  };
}

export function isFlowArchived(flow) {
  return Boolean(flow.archivedAt || flow.status === "archived");
}

export function activeFlows(flows = []) {
  return flows.filter((flow) => !isFlowArchived(flow));
}

export function mayActivate(flows, entitlements = FREE_ENTITLEMENTS, flowId) {
  if (flowId && activeFlows(flows).some((flow) => flow.id === flowId)) return true;
  return entitlements.unlimitedFlows || activeFlows(flows).length < entitlements.activeFlowLimit;
}

export function downgradeState(flows, entitlements = FREE_ENTITLEMENTS) {
  const count = activeFlows(flows).length;
  const limit = entitlements.activeFlowLimit;
  return { activeCount: count, limit, needsSelection: limit !== null && count > limit };
}
