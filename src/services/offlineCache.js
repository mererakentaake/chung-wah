// src/services/offlineCache.js
//
// Mirrors every Firestore write into a local IndexedDB store (via
// localforage) so all data entered in the app is also saved on-device,
// not only in Firestore. Firestore remains the single source of truth —
// this is a best-effort local mirror used for offline access and as a
// local backup of anything the app writes. Failures here are always
// swallowed so a caching problem can never block or break a real save.
import localforage from 'localforage';

export const offlineStore = localforage.createInstance({
  name: 'ChungWahSchool',
  storeName: 'firestore_mirror',
  description: 'Local mirror of every document written to Firestore',
});

// Firestore documents can contain Timestamp objects and FieldValue
// sentinels (serverTimestamp(), arrayUnion(), etc.) that don't store
// cleanly. Convert them to plain, IndexedDB-friendly values.
function sanitize(value) {
  if (value === null || value === undefined) return value;
  if (value instanceof Date) return value.toISOString();
  if (Array.isArray(value)) return value.map(sanitize);
  if (typeof value === 'object') {
    if (typeof value.toDate === 'function') {
      try { return value.toDate().toISOString(); } catch (_) { return null; }
    }
    if (value._methodName) return new Date().toISOString(); // FieldValue sentinel
    const out = {};
    for (const [k, v] of Object.entries(value)) out[k] = sanitize(v);
    return out;
  }
  return value;
}

// Save (or merge) a document's data at `path` (the Firestore doc path,
// e.g. "students/abc123") into the local mirror.
export async function cacheSet(path, data, merge = false) {
  try {
    const clean = sanitize(data);
    if (merge) {
      const existing = (await offlineStore.getItem(path)) || {};
      await offlineStore.setItem(path, { ...existing, ...clean });
    } else {
      await offlineStore.setItem(path, clean);
    }
  } catch (_) {
    // Best-effort only — never block or break the real Firestore write.
  }
}

export async function cacheDelete(path) {
  try { await offlineStore.removeItem(path); } catch (_) {}
}

export async function cacheGet(path) {
  try { return await offlineStore.getItem(path); } catch (_) { return null; }
}

// List every cached doc whose path starts with `prefix` (e.g. a collection
// path like "fees" or "Login/Student/users").
export async function cacheList(prefix) {
  try {
    const keys = await offlineStore.keys();
    const matched = keys.filter(k => k.startsWith(prefix));
    return Promise.all(matched.map(async (k) => ({ path: k, data: await offlineStore.getItem(k) })));
  } catch (_) {
    return [];
  }
}
