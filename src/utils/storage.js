export function getDevRoomData() {
  try {
    return JSON.parse(localStorage.getItem('dev-room-data')) || {};
  } catch {
    return {};
  }
}

export function setDevRoomData(newData) {
  localStorage.setItem('dev-room-data', JSON.stringify(newData));
}