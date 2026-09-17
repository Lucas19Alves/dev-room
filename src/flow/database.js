const DATABASE_NAME = "noma";
const STORE_NAME = "accounts";
let connection;

function openNamedDatabase(name, version) {
  return new Promise((resolve, reject) => {
    const request = version
      ? indexedDB.open(name, version)
      : indexedDB.open(name);
    request.onupgradeneeded = () => {
      if (!request.result.objectStoreNames.contains(STORE_NAME))
        request.result.createObjectStore(STORE_NAME);
    };
    request.onsuccess = () => resolve(request.result);
    request.onerror = () => reject(request.error);
  });
}

function readAll(db) {
  return new Promise((resolve, reject) => {
    if (!db.objectStoreNames.contains(STORE_NAME)) return resolve([]);
    const transaction = db.transaction(STORE_NAME);
    const store = transaction.objectStore(STORE_NAME);
    const keysRequest = store.getAllKeys();
    const valuesRequest = store.getAll();
    transaction.oncomplete = () =>
      resolve(
        keysRequest.result.map((key, index) => [
          key,
          valuesRequest.result[index],
        ]),
      );
    transaction.onerror = () => reject(transaction.error);
  });
}

async function importPreviousDatabase(target) {
  if (typeof indexedDB.databases !== "function") return;
  const targetEntries = await readAll(target);
  if (targetEntries.length) return;
  const databases = await indexedDB.databases();
  for (const info of databases) {
    if (!info.name || info.name === DATABASE_NAME) continue;
    let source;
    try {
      source = await openNamedDatabase(info.name);
      const entries = await readAll(source);
      const compatible = entries.filter(
        ([, value]) => value?.account && Array.isArray(value.account.flows),
      );
      if (!compatible.length) continue;
      await new Promise((resolve, reject) => {
        const transaction = target.transaction(STORE_NAME, "readwrite");
        const store = transaction.objectStore(STORE_NAME);
        compatible.forEach(([key, value]) => store.put(value, key));
        transaction.oncomplete = resolve;
        transaction.onerror = () => reject(transaction.error);
      });
      break;
    } finally {
      source?.close();
    }
  }
}

export function openDatabase() {
  if (!connection)
    connection = openNamedDatabase(DATABASE_NAME, 1)
      .then(async (db) => {
        await importPreviousDatabase(db);
        return db;
      })
      .catch((error) => {
        connection = null;
        throw error;
      });
  return connection;
}

export async function readAccount(key) {
  const db = await openDatabase();
  return new Promise((resolve, reject) => {
    const request = db.transaction(STORE_NAME).objectStore(STORE_NAME).get(key);
    request.onsuccess = () => resolve(request.result);
    request.onerror = () => reject(request.error);
  });
}

export async function writeAccount(key, value) {
  const db = await openDatabase();
  return new Promise((resolve, reject) => {
    const transaction = db.transaction(STORE_NAME, "readwrite");
    transaction
      .objectStore(STORE_NAME)
      .put(JSON.parse(JSON.stringify(value)), key);
    transaction.oncomplete = resolve;
    transaction.onerror = () => reject(transaction.error);
    transaction.onabort = () =>
      reject(transaction.error || new Error("Gravação local interrompida."));
  });
}
