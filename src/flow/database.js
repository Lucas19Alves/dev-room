let connection;
export function openDatabase() {
  if (!connection)
    connection = new Promise((resolve, reject) => {
      const request = indexedDB.open("centralos", 1);
      request.onupgradeneeded = () =>
        request.result.createObjectStore("accounts");
      request.onsuccess = () => resolve(request.result);
      request.onerror = () => {
        connection = null;
        reject(request.error);
      };
    });
  return connection;
}
export async function readAccount(key) {
  const db = await openDatabase();
  return new Promise((resolve, reject) => {
    const request = db.transaction("accounts").objectStore("accounts").get(key);
    request.onsuccess = () => resolve(request.result);
    request.onerror = () => reject(request.error);
  });
}
export async function writeAccount(key, value) {
  const db = await openDatabase();
  return new Promise((resolve, reject) => {
    const transaction = db.transaction("accounts", "readwrite");
    transaction
      .objectStore("accounts")
      .put(JSON.parse(JSON.stringify(value)), key);
    transaction.oncomplete = resolve;
    transaction.onerror = () => reject(transaction.error);
    transaction.onabort = () =>
      reject(transaction.error || new Error("Gravação local interrompida."));
  });
}
