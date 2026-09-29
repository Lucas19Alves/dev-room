// Funções utilitárias para acessar o objeto principal do localStorage
export function getDevRoomData() {
  try {
    const data = JSON.parse(localStorage.getItem('dev-room-data'));
    return data && typeof data === 'object' && !Array.isArray(data) ? data : {};
  } catch {
    return {};
  }
}

export function setDevRoomData(newData, { remote = false } = {}) {
  const previousData = getDevRoomData();
  const data = { ...newData, lastModified: remote ? Number(newData.lastModified || 0) : Math.max(Date.now(), Number(previousData.lastModified || 0) + 1) };
  const previous = localStorage.getItem('dev-room-data');
  const { lastModified: oldTime, ...oldContent } = previousData;
  const { lastModified: newTime, ...newContent } = data;
  if (!remote && JSON.stringify(oldContent) === JSON.stringify(newContent)) return;
  const serialized = JSON.stringify(data);
  localStorage.setItem('dev-room-data', serialized);
  localStorage.setItem('dev-room-lastModified', String(data.lastModified));
  if (remote) window.dispatchEvent(new StorageEvent('storage', { key: 'dev-room-data', oldValue: previous, newValue: serialized }));
}
