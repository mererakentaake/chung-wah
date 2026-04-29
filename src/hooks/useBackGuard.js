// src/hooks/useBackGuard.js
//
// Intercepts the device/browser back button on screens where going back
// would be wrong (e.g. Home after login, Dashboard roots).
//
// Usage:
//   useBackGuard()                  → blocks back, shows exit prompt
//   useBackGuard({ onBack: fn })    → calls fn instead of default behaviour
//   useBackGuard({ allow: true })   → does nothing (lets back proceed normally)

import { useEffect, useRef, useCallback } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';

let exitToastTimer = null;
let firstBackPress = false;

export default function useBackGuard({ onBack, allow = false, exitPrompt = true } = {}) {
  const navigate    = useNavigate();
  const location    = useLocation();
  const guardActive = useRef(false);

  // Push a dummy history entry when the guarded screen mounts so that
  // when the user presses back, we intercept the popstate BEFORE React
  // Router processes it and lands on the previous (login) route.
  useEffect(() => {
    if (allow) return;

    // Push a sentinel state so back goes here first
    window.history.pushState({ guarded: true }, '');
    guardActive.current = true;

    const handlePopState = (e) => {
      if (!guardActive.current) return;

      // Re-push the sentinel so the user stays on this screen
      window.history.pushState({ guarded: true }, '');

      if (onBack) {
        onBack();
        return;
      }

      if (!exitPrompt) return;

      // Double-tap to exit pattern (common on Android apps)
      if (firstBackPress) {
        // Second press within 2s → allow exit by going back twice
        // (past our sentinel AND past the guarded screen itself)
        guardActive.current = false;
        window.history.go(-2);
        return;
      }

      firstBackPress = true;
      // Show a subtle toast-style banner
      showExitBanner();
      clearTimeout(exitToastTimer);
      exitToastTimer = setTimeout(() => { firstBackPress = false; }, 2000);
    };

    window.addEventListener('popstate', handlePopState);

    return () => {
      guardActive.current = false;
      window.removeEventListener('popstate', handlePopState);
      clearTimeout(exitToastTimer);
      firstBackPress = false;
    };
  }, [allow, onBack, exitPrompt]);
}

// ── Tiny DOM banner (no React dependency, so it works universally) ────────
function showExitBanner() {
  const existing = document.getElementById('back-exit-banner');
  if (existing) {
    existing.style.opacity = '1';
    clearTimeout(existing._timer);
    existing._timer = setTimeout(() => { existing.style.opacity = '0'; }, 1800);
    return;
  }

  const el = document.createElement('div');
  el.id = 'back-exit-banner';
  el.textContent = 'Press back again to exit';
  Object.assign(el.style, {
    position: 'fixed',
    bottom: '90px',
    left: '50%',
    transform: 'translateX(-50%)',
    background: 'rgba(0,0,0,0.75)',
    color: '#fff',
    padding: '10px 20px',
    borderRadius: '20px',
    fontSize: '14px',
    fontFamily: 'sans-serif',
    zIndex: '9999',
    pointerEvents: 'none',
    transition: 'opacity 0.3s ease',
    opacity: '1',
    whiteSpace: 'nowrap',
  });
  document.body.appendChild(el);

  el._timer = setTimeout(() => { el.style.opacity = '0'; }, 1800);
}
