// Three-way merge at the Flow boundary: independent Flows can synchronize
// automatically. Concurrent edits to the same Flow require an explicit choice.
const clone = (value) => value === undefined ? undefined : JSON.parse(JSON.stringify(value));
const stable = (value) => {
  if (Array.isArray(value)) return value.map(stable);
  if (value && typeof value === "object") return Object.fromEntries(Object.keys(value).sort().map((key) => [key, stable(value[key])]));
  return value;
};
const same = (a,b) => JSON.stringify(stable(a)) === JSON.stringify(stable(b));

export function mergeAccountSnapshots(base, local, remote) {
  if (!base) return { account: clone(local), conflicts: ["unknown-base"] };
  const result = clone(remote), conflicts = [];
  for (const key of new Set([...Object.keys(base),...Object.keys(local),...Object.keys(remote)])) {
    if (key === "flows") continue;
    if (same(local[key], base[key])) continue;
    if (same(remote[key],base[key]) || same(remote[key],local[key])) result[key] = clone(local[key]);
    else conflicts.push(key);
  }
  const maps = [base,local,remote].map((value) => new Map((value.flows||[]).map((flow) => [flow.id,flow])));
  const [before,here,there] = maps;
  result.flows = [];
  for (const id of new Set([...here.keys(),...there.keys(),...before.keys()])) {
    const b = before.get(id), l=here.get(id), r=there.get(id);
    if (same(l,b)) { if(r) result.flows.push(clone(r)); }
    else if (same(r,b) || same(l,r)) { if(l) result.flows.push(clone(l)); }
    else { conflicts.push(id); if(l) result.flows.push(clone(l)); }
  }
  return { account: result, conflicts };
}
