// src/services/debugLogger.js
//
// Lightweight in-app logger for diagnosing crashes on-device (no laptop, no adb).
// It patches console.* so every existing console.log/info/warn/error call in the
// app is captured automatically — no need to touch other files — and it also
// hooks window 'error' and 'unhandledrejection' so uncaught JS exceptions show up.
//
// Logs are persisted to localStorage after every entry, so if the app is killed
// or crashes right after this line runs, the log from THAT session survives and
// can still be read the next time the app opens (before it potentially crashes
// again). This is the key property that makes it useful for crash-loop debugging.
//
// NOTE: This can only capture JavaScript-level events. A native-layer crash
// (e.g. an uncaught exception inside the Android/Java side of a Capacitor
// plugin) happens outside the WebView's JS engine and cannot be caught here —
// but the last few log lines before such a crash (e.g. "requesting push
// permission…") are usually enough to point at the culprit.

const STORAGE_KEY = 'cw_debug_logs';
const MAX_ENTRIES = 500;

let entries = [];
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
