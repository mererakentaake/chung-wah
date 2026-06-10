// src/hooks/useBackGuard.js
//
// Intercepts the device/browser back button on dashboard root screens so
// pressing back does NOT return the user to the Login screen.
//
// Fix for child-screen navigation:
//   When the user goes Home → Fees → presses Back, Home remounts landing
//   on the sentinel entry already in history. We detect this with
//   window.history.state?.guarded and skip pushing a duplicate sentinel,
//   keeping the history stack clean at all times.
//
// Usage:
//   useBackGuard()                      – blocks back, shows exit prompt
//   useBackGuard({ onBack: fn })        – calls fn instead
//   useBackGuard({ allow: true })       – no-op, lets back work normally

import { useEffect, useRef } from 'react';

let exitToastTimer = null;
let firstBackPress = false;

export default function useBackGuard({ onBack, allow = false, exitPrompt = true } = {}) {
  const guardActive = useRef(false);

  useEffect(() => {
    if (allow) return;

    // ── Key fix ──────────────────────────────────────────────────────────
    // Only push a sentinel if we are NOT already sitting on one.
    // When returning from a child screen (Fees → back → Home), the browser
    // lands on the existing sentinel entry, so we must NOT push a second
    // one — otherwise sentinel entries accumulate and back navigation breaks.
    if (!window.history.state?.guarded) {
      window.history.pushState({ guarded: true }, '');
    }
    guardActive.current = true;

    const handlePopState = () => {
      if (!guardActive.current) return;

      // Re-push the sentinel to keep the user on this screen
      window.history.pushState({ guarded: true }, '');

      if (onBack) {
        onBack();
        return;
      }

      if (!exitPrompt) return;

      // Double-tap to exit (standard Android pattern)
      if (firstBackPress) {
        // Second press within 2 s → allow exit
        guardActive.current = false;
        clearTimeout(exitToastTimer);
        firstBackPress = false;
        // Go back twice: past the re-pushed sentinel AND past the original home entry
        window.history.go(-2);
        return;
      }

      firstBackPress = true;
      showExitBanner();
      clearTimeout(exitToastTimer);
      exitToastTimer = setTimeout(() => {
        firstBackPress = false;
      }, 2000);
    };

    window.addEventListener('popstate', handlePopState);

    return () => {
      guardActive.current = false;
      window.removeEventListener('popstate', handlePopState);
      // Do NOT pop the sentinel here. When the user navigates forward to
      // a child screen and then presses back, they will land on the existing
      // sentinel. The next mount will detect state.guarded and skip
      // pushing a duplicate.
    };
  }, [allow, onBack, exitPrompt]);
}

// ── Small DOM banner — no React deps ────────────────────────────────────────
function showExitBanner() {
  const existing = document.getElementById('back-exit-banner');
  if (existing) {
    existing.style.opacity = '1';
    clearTimeout(existing._hideTimer);
    existing._hideTimer = setTimeout(() => {
      existing.style.opacity = '0';
    }, 1800);
    return;
  }

  const el = document.createElement('div');
  el.id = 'back-exit-banner';
  el.textContent = 'Press back again to exit';
  Object.assign(el.style, {
    position:     'fixed',
    bottom:       '90px',
    left:         '50%',
    transform:    'translateX(-50%)',
    background:   'rgba(0,0,0,0.72)',
    color:        '#fff',
    padding:      '10px 22px',
    borderRadius: '20px',
    fontSize:     '14px',
    fontFamily:   'sans-serif',
    zIndex:       '9999',
    pointerEvents:'none',
    whiteSpace:   'nowrap',
    transition:   'opacity 0.3s ease',
    opacity:      '1',
  });
  document.body.appendChild(el);

  el._hideTimer = setTimeout(() => {
    el.style.opacity = '0';
  }, 1800);
}
