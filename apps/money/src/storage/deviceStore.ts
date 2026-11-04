/*
 * Keeping the numbers on this device, inside the browser's own database (IndexedDB).
 * There is no server: nothing here talks to the internet.
 *
 * IndexedDB is NOT encrypted. See docs/STORAGE-AND-BACKUPS.md.
 */

export interface DeviceStore {
  /** The saved value (the numbers, unless another key is given), or null if nothing has been saved. Rejects if the device can't be read. */
  load(key?: string): Promise<unknown | null>;
  save(value: unknown, key?: string): Promise<void>;
  clear(): Promise<void>;
  /** Has the browser agreed to keep the data? null means "can't tell". */
  isPersisted(): Promise<boolean | null>;
  /** Politely asks the browser not to remove the data when space runs low. */
  requestPersistence(): Promise<boolean | null>;
}

const DATABASE = "breathe-money";
const STORE = "app";
const KEY = "form";

function openDatabase(): Promise<IDBDatabase> {
  return new Promise((resolve, reject) => {
    if (typeof indexedDB === "undefined") {
      reject(new Error("This browser can't keep data here."));
      return;
    }
    const request = indexedDB.open(DATABASE, 1);
    request.onupgradeneeded = () => {
      request.result.createObjectStore(STORE);
    };
    request.onsuccess = () => resolve(request.result);
    request.onerror = () => reject(request.error ?? new Error("Could not open the device storage."));
    request.onblocked = () => reject(new Error("The device storage is busy."));
  });
}

/*
 * One connection is kept open and reused. That matters when the page is being closed:
 * a write can be handed to an already-open database straight away, instead of having
 * to open one first (which the browser may cut short).
 */
let connection: Promise<IDBDatabase> | null = null;

function getDatabase(): Promise<IDBDatabase> {
  if (connection === null) {
    connection = openDatabase().then(
      (database) => {
        const forget = () => {
          connection = null;
        };
        database.onclose = forget;
        database.onversionchange = () => {
          database.close();
          forget();
        };
        return database;
      },
      (problem: unknown) => {
        connection = null;
        throw problem;
      },
    );
  }
  return connection;
}

function attempt<T>(database: IDBDatabase, mode: IDBTransactionMode, action: (store: IDBObjectStore) => IDBRequest<T>): Promise<T> {
  return new Promise<T>((resolve, reject) => {
    const transaction = database.transaction(STORE, mode);
    const request = action(transaction.objectStore(STORE));
    let result: T;
    request.onsuccess = () => {
      result = request.result;
    };
    transaction.oncomplete = () => resolve(result);
    transaction.onerror = () => reject(transaction.error ?? new Error("Could not use the device storage."));
    transaction.onabort = () => reject(transaction.error ?? new Error("The device storage stopped."));
  });
}

async function run<T>(mode: IDBTransactionMode, action: (store: IDBObjectStore) => IDBRequest<T>): Promise<T> {
  try {
    return await attempt(await getDatabase(), mode, action);
  } catch (problem) {
    // A connection the browser closed behind our back: open a fresh one and try once more.
    if (problem instanceof DOMException && problem.name === "InvalidStateError") {
      connection = null;
      return attempt(await getDatabase(), mode, action);
    }
    throw problem;
  }
}

export const indexedDbStore: DeviceStore = {
  async load(key = KEY) {
    const value = await run("readonly", (store) => store.get(key));
    return value === undefined ? null : value;
  },

  async save(value, key = KEY) {
    await run("readwrite", (store) => store.put(value, key));
  },

  /** Clears the numbers only. Settings are kept. */
  async clear() {
    await run("readwrite", (store) => store.delete(KEY));
  },

  async isPersisted() {
    try {
      if (typeof navigator === "undefined" || !navigator.storage?.persisted) return null;
      return await navigator.storage.persisted();
    } catch {
      return null;
    }
  },

  async requestPersistence() {
    try {
      if (typeof navigator === "undefined" || !navigator.storage?.persist) return null;
      return await navigator.storage.persist();
    } catch {
      return null;
    }
  },
};
