export function restoreWindows(saved, tools, width, height) {
  if (!Array.isArray(saved)) return []
  const allowed = new Set(tools.map(tool => tool.type))
  const used = new Set()
  const finite = (value, fallback) => Number.isFinite(value) ? value : fallback
  return saved.filter(win => win && allowed.has(win.type) && !used.has(win.type) && used.add(win.type)).map((win, index) => {
    const w = Math.min(Math.max(280, finite(win.width, 400)), Math.max(280, width - 32))
    const h = Math.min(Math.max(160, finite(win.height, 400)), Math.max(160, height - 100))
    return {
      id: Number.isFinite(win.id) ? win.id : Date.now() + index,
      type: win.type, title: tools.find(tool => tool.type === win.type).label,
      width: w, height: h,
      x: Math.max(0, Math.min(finite(win.x, 16), width - w)),
      y: Math.max(0, Math.min(finite(win.y, 16), height - h)),
      minimized: win.minimized === true, zIndex: Math.max(10, finite(win.zIndex, 10 + index))
    }
  })
}
