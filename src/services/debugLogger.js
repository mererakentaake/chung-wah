// src/services/debugLogger.js
//
// Lightweight in-app logger for diagnosing crashes on-device (no laptop, no adb).
// It patches console.* so every existing console.log/info/warn/error call in the
// app is captured automatically — no need to touch other files — and it also
// hooks window 'error' and 'unhandledrejection' so uncaught JS exceptions show up.
// It also patches window.fetch so every network request (Firestore, Cloudinary,
// etc.) shows up with method, URL, status and duration without needing a manual
// console.log at each call site.
//
// Logs are persisted to localStorage after every entry, so if the app is killed
// or crashes right after this line runs, the log from THAT session survives and
// can still be read the next time the app opens (before it potentially crashes
// again). This is the key property that makes it useful for crash-loop debugging.
// Each entry also carries a `session` id (one per app launch) so the debug panel
// can group/collapse older sessions instead of showing one long flat list.
//
// NOTE: This can only capture JavaScript-level events. A native-layer crash
// (e.g. an uncaught exception inside the Android/Java side of a Capacitor
// plugin) happens outside the WebView's JS engine and cannot be caught here —
// but the last few log lines before such a crash (e.g. "requesting push
// permission…") are usually enough to point at the culprit.

const STORAGE_KEY = 'cw_debug_logs';
const SESSION_KEY = 'cw_debug_session';
const MAX_ENTRIES = 500;

let entries = [];
let sessionId = 0;
const listeners = new Set();

function loadPersisted() {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (raw) entries = JSON.parse(raw);
  } catch (_) {
    entries = [];
  }
}

function persist() {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(entries.slice(-MAX_ENTRIES)));
  } catch (_) {
    // storage full or unavailable — ignore, in-memory log still works
  }
}

function safeStringify(arg) {
  if (typeof arg === 'string') return arg;
  if (arg instanceof Error) return `${arg.name}: ${arg.message}\n${arg.stack || ''}`;
  try {
    return JSON.stringify(arg);
  } catch (_) {
    return String(arg);
  }
}

function push(level, args) {
  const entry = {
    ts: new Date().toISOString(),
    level,
    session: sessionId,
    message: Array.from(args).map(safeStringify).join(' '),
  };
  entries.push(entry);
  if (entries.length > MAX_ENTRIES) entries = entries.slice(-MAX_ENTRIES);
  persist();
  listeners.forEach((fn) => fn(entries));
}

export function initDebugLogger() {
  if (window.__cwDebugLoggerInstalled) return;
  window.__cwDebugLoggerInstalled = true;

  loadPersisted();

  // Each entry keeps incrementing session numbers across app restarts so the
  // panel can group logs by launch. Persisted separately from the log entries
  // themselves so it survives even if `entries` gets trimmed.
  try {
    sessionId = parseInt(localStorage.getItem(SESSION_KEY) || '0', 10) + 1;
    localStorage.setItem(SESSION_KEY, String(sessionId));
  } catch (_) {
    sessionId = 1;
  }

  push('info', ['── new session started ──']);

  const original = {
    log: console.log,
    info: console.info,
    warn: console.warn,
    error: console.error,
  };

  console.log = (...args) => { push('log', args); original.log(...args); };
  console.info = (...args) => { push('info', args); original.info(...args); };
  console.warn = (...args) => { push('warn', args); original.warn(...args); };
  console.error = (...args) => { push('error', args); original.error(...args); };

  window.addEventListener('error', (event) => {
    push('error', [`Uncaught: ${event.message} (${event.filename}:${event.lineno}:${event.colno})`]);
  });

  window.addEventListener('unhandledrejection', (event) => {
    push('error', [`Unhandled promise rejection: ${safeStringify(event.reason)}`]);
  });

  window.addEventListener('online', () => push('info', ['Network: back online']));
  window.addEventListener('offline', () => push('info', ['Network: went offline']));

  // ── Network request logging ────────────────────────────────────────────
  // Wraps window.fetch so every request the app makes (Firestore REST calls,
  // Cloudinary uploads, etc.) is logged with method, URL, status and timing,
  // without needing a manual console.log at each call site. Request bodies
  // are never logged, since they can contain auth tokens or file data.
  const originalFetch = window.fetch;
  window.fetch = async (...fetchArgs) => {
    const [resource, config] = fetchArgs;
    const url = typeof resource === 'string' ? resource : resource?.url || String(resource);
    const method = config?.method || 'GET';
    const start = performance.now();
    try {
      const response = await originalFetch(...fetchArgs);
      const ms = Math.round(performance.now() - start);
      const level = response.ok ? 'net' : 'warn';
      push(level, [`${method} ${url} → ${response.status} (${ms}ms)`]);
      return response;
    } catch (err) {
      const ms = Math.round(performance.now() - start);
      push('error', [`${method} ${url} → failed after ${ms}ms: ${safeStringify(err)}`]);
      throw err;
    }
  };
}

export function getLogs() {
  return entries;
}

export function clearLogs() {
  entries = [];
  persist();
  listeners.forEach((fn) => fn(entries));
}

export function subscribe(fn) {
  listeners.add(fn);
  return () => listeners.delete(fn);
}

export function logEvent(message, level = 'info') {
  push(level, [message]);
}

export function getMaxEntries() {
  return MAX_ENTRIES;
}

// ── Build info ────────────────────────────────────────────────────────────
// VITE_GIT_COMMIT / VITE_BUILD_TIME are written into .env.local by the CI
// workflow (android-build.yml) at build time, so this reflects exactly which
// commit + build produced the running app — the fastest way to confirm
// "is this device actually running the build I think it is?"
export function getBuildInfo() {
  return {
    commit: import.meta.env.VITE_GIT_COMMIT || 'dev',
    builtAt: import.meta.env.VITE_BUILD_TIME || null,
  };
}
