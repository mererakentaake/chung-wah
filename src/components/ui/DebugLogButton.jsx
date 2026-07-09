// src/components/ui/DebugLogButton.jsx
//
// Floating "Debug Log" button. Dark navy background, white text, always
// visible above the rest of the UI so it can be reached even if a page
// fails to render properly. Tapping it opens a full-screen panel listing
// every captured console.log / console.info / console.warn / console.error
// / network request call plus any uncaught JS errors, grouped by app
// session (newest first), with filtering, search and native sharing.
//
// Positioning: bottom is pinned to env(safe-area-inset-bottom) — i.e. its
// bottom edge sits flush against the top of the system nav bar (gesture bar
// or 3-button nav), never on top of it. The button has a fixed 44px height
// (DEBUG_BUTTON_HEIGHT below) so index.css can reserve exactly enough extra
// scroll space on every page to keep it from covering the last on-screen
// button — see the ".pb-28 / .pb-24" override in index.css.

import React, { useEffect, useMemo, useState } from 'react';
import { X, Trash2, Copy, Share2, Search, Clock, Wifi, WifiOff, ChevronDown, ChevronRight } from 'lucide-react';
import { getLogs, subscribe, clearLogs, getBuildInfo, getMaxEntries } from '../../services/debugLogger';

const LEVELS = ['log', 'info', 'warn', 'error', 'net'];

const LEVEL_COLORS = {
  log: '#cbd5e1',
  info: '#7dd3fc',
  warn: '#facc15',
  error: '#f87171',
  net: '#4ade80',
};

const TRUNCATE_AT = 300;

export default function DebugLogButton() {
  const [open, setOpen] = useState(false);
  const [logs, setLogs] = useState(getLogs());
  const [activeLevels, setActiveLevels] = useState(new Set(LEVELS));
  const [query, setQuery] = useState('');
  const [showLocalTime, setShowLocalTime] = useState(false);
  const [expanded, setExpanded] = useState(new Set());
  const [collapsedOverrides, setCollapsedOverrides] = useState(new Map());
  const [online, setOnline] = useState(navigator.onLine);
  const [appInfo, setAppInfo] = useState(null);
  const [deviceInfo, setDeviceInfo] = useState(null);

  useEffect(() => subscribe(setLogs), []);

  useEffect(() => {
    const goOnline = () => setOnline(true);
    const goOffline = () => setOnline(false);
    window.addEventListener('online', goOnline);
    window.addEventListener('offline', goOffline);
    return () => {
      window.removeEventListener('online', goOnline);
      window.removeEventListener('offline', goOffline);
    };
  }, []);

  useEffect(() => {
    if (!open) return;
    // Loaded lazily (only when the panel is actually opened) and wrapped in
    // try/catch since these Capacitor plugins fall back to web stubs (or are
    // simply unavailable) when running in a plain browser rather than the
    // native Android shell.
    (async () => {
      try {
        const { App } = await import('@capacitor/app');
        setAppInfo(await App.getInfo());
      } catch (_) { setAppInfo(null); }
      try {
        const { Device } = await import('@capacitor/device');
        setDeviceInfo(await Device.getInfo());
      } catch (_) { setDeviceInfo(null); }
    })();
  }, [open]);

  const buildInfo = getBuildInfo();

  const filteredLogs = useMemo(() => {
    const q = query.trim().toLowerCase();
    return logs.filter((l) => {
      if (!activeLevels.has(l.level)) return false;
      if (q && !l.message.toLowerCase().includes(q)) return false;
      return true;
    });
  }, [logs, activeLevels, query]);

  const sessions = useMemo(() => {
    const map = new Map();
    for (const entry of filteredLogs) {
      if (!map.has(entry.session)) map.set(entry.session, []);
      map.get(entry.session).push(entry);
    }
    return Array.from(map.entries()).sort((a, b) => b[0] - a[0]);
  }, [filteredLogs]);

  const latestSession = sessions.length ? Math.max(...sessions.map((s) => s[0])) : null;

  const isSessionCollapsed = (id) => {
    if (collapsedOverrides.has(id)) return collapsedOverrides.get(id);
    return id !== latestSession;
  };

  const toggleSession = (id) => {
    setCollapsedOverrides((prev) => {
      const next = new Map(prev);
      next.set(id, !isSessionCollapsed(id));
      return next;
    });
  };

  const toggleLevel = (level) => {
    setActiveLevels((prev) => {
      const next = new Set(prev);
      if (next.has(level)) next.delete(level); else next.add(level);
      return next.size ? next : new Set(LEVELS); // never allow zero levels selected
    });
  };

  const toggleExpanded = (key) => {
    setExpanded((prev) => {
      const next = new Set(prev);
      if (next.has(key)) next.delete(key); else next.add(key);
      return next;
    });
  };

  const formatTs = (ts) => {
    if (!showLocalTime) return ts;
    try { return new Date(ts).toLocaleString(); } catch (_) { return ts; }
  };

  const buildFullText = () => {
    const header = [
      `Chung Wah debug log`,
      `Build: ${buildInfo.commit}${buildInfo.builtAt ? ` · ${buildInfo.builtAt}` : ''}`,
      appInfo ? `App: v${appInfo.version} (build ${appInfo.build})` : null,
      deviceInfo ? `Device: ${deviceInfo.manufacturer || ''} ${deviceInfo.model || ''} · Android ${deviceInfo.osVersion || '?'}` : null,
      `Exported: ${new Date().toISOString()}`,
      '──────────────────────────',
    ].filter(Boolean).join('\n');
    const body = filteredLogs.map((l) => `[${l.ts}] ${l.level.toUpperCase()}: ${l.message}`).join('\n');
    return `${header}\n${body}`;
  };

  const handleCopy = () => {
    navigator.clipboard?.writeText(buildFullText()).catch(() => {});
  };

  const handleShare = async () => {
    const text = buildFullText();
    try {
      const { Share } = await import('@capacitor/share');
      await Share.share({ title: 'Chung Wah Debug Log', text });
    } catch (_) {
      // Not running under Capacitor / native share unavailable — fall back
      // to the Web Share API, then finally to clipboard.
      try {
        if (navigator.share) {
          await navigator.share({ title: 'Chung Wah Debug Log', text });
        } else {
          await navigator.clipboard?.writeText(text);
        }
      } catch (_) { /* user cancelled share sheet — not an error */ }
    }
  };

  return (
    <>
      <button
        onClick={() => setOpen(true)}
        style={{
          position: 'fixed',
          bottom: 'env(safe-area-inset-bottom, 0px)',
          right: '16px',
          zIndex: 9999,
          height: '44px',
          display: 'flex',
          alignItems: 'center',
          backgroundColor: '#0A0F2C',
          color: '#ffffff',
          border: '1px solid rgba(255,255,255,0.15)',
          borderRadius: '9999px',
          padding: '0 18px',
          fontSize: '13px',
          fontWeight: 600,
          boxShadow: '0 4px 12px rgba(0,0,0,0.35)',
          gap: '6px',
        }}
      >
        {online ? <Wifi size={14} /> : <WifiOff size={14} color="#f87171" />}
        Debug Log
      </button>

      {open && (
        <div
          style={{
            position: 'fixed',
            inset: 0,
            zIndex: 10000,
            backgroundColor: '#0A0F2C',
            color: '#fff',
            display: 'flex',
            flexDirection: 'column',
          }}
        >
          {/* Header */}
          <div style={{
            display: 'flex', alignItems: 'center', justifyContent: 'space-between',
            padding: '14px 16px', borderBottom: '1px solid rgba(255,255,255,0.15)',
          }}>
            <span style={{ fontWeight: 700, fontSize: '16px' }}>
              Debug Log ({filteredLogs.length}/{logs.length})
            </span>
            <div style={{ display: 'flex', gap: '10px' }}>
              <button onClick={handleShare} style={iconBtnStyle} aria-label="Share logs">
                <Share2 size={18} />
              </button>
              <button onClick={handleCopy} style={iconBtnStyle} aria-label="Copy logs">
                <Copy size={18} />
              </button>
              <button onClick={clearLogs} style={iconBtnStyle} aria-label="Clear logs">
                <Trash2 size={18} />
              </button>
              <button onClick={() => setOpen(false)} style={iconBtnStyle} aria-label="Close">
                <X size={20} />
              </button>
            </div>
          </div>

          {/* Build / device info strip */}
          <div style={{
            padding: '10px 16px', borderBottom: '1px solid rgba(255,255,255,0.1)',
            fontSize: '11px', color: 'rgba(255,255,255,0.55)', fontFamily: 'monospace',
            lineHeight: 1.6,
          }}>
            <div>Build: {buildInfo.commit}{buildInfo.builtAt ? ` · ${buildInfo.builtAt}` : ''}</div>
            {appInfo && <div>App: v{appInfo.version} (build {appInfo.build})</div>}
            {deviceInfo && (
              <div>Device: {deviceInfo.manufacturer} {deviceInfo.model} · Android {deviceInfo.osVersion}</div>
            )}
            <div>{online ? 'Online' : 'Offline'} · {logs.length}/{getMaxEntries()} entries stored</div>
          </div>

          {/* Filter chips */}
          <div style={{ display: 'flex', gap: '6px', padding: '10px 16px', flexWrap: 'wrap', borderBottom: '1px solid rgba(255,255,255,0.1)' }}>
            {LEVELS.map((level) => {
              const active = activeLevels.has(level);
              return (
                <button
                  key={level}
                  onClick={() => toggleLevel(level)}
                  style={{
                    fontSize: '11px', fontWeight: 700, textTransform: 'uppercase',
                    padding: '4px 10px', borderRadius: '9999px',
                    border: `1px solid ${active ? LEVEL_COLORS[level] : 'rgba(255,255,255,0.15)'}`,
                    color: active ? LEVEL_COLORS[level] : 'rgba(255,255,255,0.4)',
                    background: active ? `${LEVEL_COLORS[level]}18` : 'transparent',
                  }}
                >
                  {level}
                </button>
              );
            })}
            <button
              onClick={() => setShowLocalTime((v) => !v)}
              style={{
                marginLeft: 'auto', display: 'flex', alignItems: 'center', gap: '4px',
                fontSize: '11px', padding: '4px 10px', borderRadius: '9999px',
                border: '1px solid rgba(255,255,255,0.15)', color: 'rgba(255,255,255,0.6)', background: 'transparent',
              }}
            >
              <Clock size={12} /> {showLocalTime ? 'Local' : 'UTC'}
            </button>
          </div>

          {/* Search */}
          <div style={{ padding: '10px 16px', borderBottom: '1px solid rgba(255,255,255,0.1)' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px', background: 'rgba(255,255,255,0.06)', borderRadius: '10px', padding: '8px 12px' }}>
              <Search size={14} color="rgba(255,255,255,0.4)" />
              <input
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                placeholder="Search logs…"
                style={{ flex: 1, background: 'transparent', border: 'none', outline: 'none', color: '#fff', fontSize: '13px' }}
              />
              {query && (
                <button onClick={() => setQuery('')} style={{ background: 'none', border: 'none', color: 'rgba(255,255,255,0.4)' }}>
                  <X size={14} />
                </button>
              )}
            </div>
          </div>

          {/* Log list, grouped by session */}
          <div style={{ flex: 1, overflowY: 'auto', padding: '12px 16px', fontFamily: 'monospace', fontSize: '12px' }}>
            {sessions.length === 0 && (
              <div style={{ opacity: 0.6 }}>No log entries match.</div>
            )}
            {sessions.map(([sessionId, sessionLogs]) => {
              const collapsed = isSessionCollapsed(sessionId);
              return (
                <div key={sessionId} style={{ marginBottom: '14px' }}>
                  <button
                    onClick={() => toggleSession(sessionId)}
                    style={{
                      display: 'flex', alignItems: 'center', gap: '6px', width: '100%',
                      background: 'rgba(255,255,255,0.05)', border: 'none', borderRadius: '8px',
                      padding: '6px 10px', color: 'rgba(255,255,255,0.7)', fontSize: '11px', fontWeight: 700,
                      marginBottom: collapsed ? 0 : '8px',
                    }}
                  >
                    {collapsed ? <ChevronRight size={14} /> : <ChevronDown size={14} />}
                    Session {sessionId} {sessionId === latestSession ? '(current)' : ''} — {sessionLogs.length} entries
                  </button>
                  {!collapsed && sessionLogs.map((l, i) => {
                    const key = `${sessionId}-${i}-${l.ts}`;
                    const isLong = l.message.length > TRUNCATE_AT;
                    const isExpanded = expanded.has(key);
                    const displayMsg = isLong && !isExpanded ? `${l.message.slice(0, TRUNCATE_AT)}…` : l.message;
                    return (
                      <div key={key} style={{ marginBottom: '8px', color: LEVEL_COLORS[l.level] || '#fff', paddingLeft: '8px' }}>
                        <div style={{ opacity: 0.6, fontSize: '10px' }}>{formatTs(l.ts)} · {l.level.toUpperCase()}</div>
                        <div style={{ whiteSpace: 'pre-wrap', wordBreak: 'break-word' }}>
                          {displayMsg}
                          {isLong && (
                            <button
                              onClick={() => toggleExpanded(key)}
                              style={{ display: 'block', marginTop: '4px', background: 'none', border: 'none', color: '#7dd3fc', fontSize: '11px', padding: 0 }}
                            >
                              {isExpanded ? 'Show less' : 'Show more'}
                            </button>
                          )}
                        </div>
                      </div>
                    );
                  })}
                </div>
              );
            })}
          </div>
        </div>
      )}
    </>
  );
}

const iconBtnStyle = {
  background: 'rgba(255,255,255,0.08)',
  border: 'none',
  color: '#fff',
  borderRadius: '8px',
  padding: '6px',
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'center',
};
