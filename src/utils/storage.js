const clone = (value) => JSON.parse(JSON.stringify(value));
let context = { read: () => null, write: () => {} };

export function bindFlowStorage(read, write) {
  context = { read, write };
}

export function readComponentData(type, fallback) {
  const flow = context.read();
  const value = flow?.componentData?.[type];
  return clone(value === undefined ? fallback : value);
}

export function writeComponentData(type, value) {
  const flow = context.read();
  if (!flow) return;
  flow.componentData ||= {};
  flow.componentData[type] = clone(value);
  flow.updatedAt = Date.now();
  context.write(flow);
}
