// Compatibility adapter for existing tools. The owning Flow is bound at mount time.
let context = { read: () => ({}), write: () => {} };
export function bindStorage(read, write) {
  context = { read, write };
}
export function getDevRoomData() {
  return JSON.parse(JSON.stringify(context.read()));
}
export function setDevRoomData(data) {
  context.write(JSON.parse(JSON.stringify(data)));
}
