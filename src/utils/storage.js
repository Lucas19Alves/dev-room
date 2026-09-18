import { refreshFlowDerivedState } from "../flow/runtime.js";

const clone = (value) => JSON.parse(JSON.stringify(value));
let context = { read: () => null, write: () => {} };

export function bindFlowStorage(read, write) {
  context = { read, write };
}

export function readComponentData(key, fallback, legacyKey = null) {
  const flow = context.read();
  const migratedSibling = legacyKey
    ? flow?.components?.some(
        (component) =>
          component.type === legacyKey &&
          component.id !== key &&
          flow?.componentData?.[component.id] !== undefined,
      )
    : false;
  const value =
    flow?.componentData?.[key] ??
    (legacyKey && !migratedSibling
      ? flow?.componentData?.[legacyKey]
      : undefined);
  return clone(value === undefined ? fallback : value);
}

export function writeComponentData(key, value) {
  const flow = context.read();
  if (!flow) return;
  flow.componentData ||= {};
  flow.componentData[key] = clone(value);
  flow.updatedAt = Date.now();
  refreshFlowDerivedState(flow);
  context.write(flow);
}
