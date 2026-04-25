// src/components/ui/LoadingScreen.jsx
import React from 'react';

export default function LoadingScreen() {
  return (
    <div className="fixed inset-0 mesh-bg flex items-center justify-center z-50">
      <div className="flex flex-col items-center gap-6">
        {/* Animated logo mark */}
        <div className="relative">
          <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-gold-500 to-coral-500 flex items-center justify-center animate-bounce-in shadow-glow-gold">
            <svg width="32" height="32" viewBox="0 0 24 24" fill="none">
              <path d="M12 3L20 7.5V16.5L12 21L4 16.5V7.5L12 3Z" stroke="white" strokeWidth="2" strokeLinejoin="round"/>
              <path d="M12 3V21M4 7.5L20 16.5M20 7.5L4 16.5" stroke="white" strokeWidth="1.5" strokeOpacity="0.6"/>
            </svg>
          </div>
          <div className="absolute -inset-1 rounded-2xl bg-gradient-to-br from-gold-500/30 to-coral-500/30 blur-md -z-10 animate-pulse-glow" />
        </div>

        {/* Dots */}
        <div className="flex gap-2">
          {[0, 1, 2].map(i => (
            <div
              key={i}
              className="w-2 h-2 rounded-full bg-gold-500/60"
              style={{ animation: `bounce 1.2s ease-in-out ${i * 0.2}s infinite` }}
            />
          ))}
        </div>

        <p className="text-white/40 text-sm font-body tracking-wide">Loading...</p>
      </div>

      <style>{`
        @keyframes bounce {
          0%, 100% { transform: translateY(0); opacity: 0.4; }
          50% { transform: translateY(-8px); opacity: 1; }
        }
      `}</style>
    </div>
  );
}
