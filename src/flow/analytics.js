// Local aggregate counters only. No Flow identifiers, names, notes or other
// private content enter this interface or leave the device.
export const PRODUCT_EVENTS = Object.freeze(["signup_completed", "flow_created", "template_installed", "action_completed", "flow_returned", "upgrade_started", "upgrade_completed"]);
export function recordProductEvent(name, storage = globalThis.localStorage) {
  if (!PRODUCT_EVENTS.includes(name) || !storage) return false;
  try {
    const stored = JSON.parse(storage.getItem("noma-product-counts") || "{}");
    const counts = Object.fromEntries(PRODUCT_EVENTS.map((key) => [key, Math.max(0, Number(stored[key]) || 0)]));
    counts[name] += 1;
    storage.setItem("noma-product-counts", JSON.stringify(counts));
    return true;
  } catch { return false; }
}
