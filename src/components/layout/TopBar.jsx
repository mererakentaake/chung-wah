// src/components/layout/TopBar.jsx
import React from 'react';
import { useNavigate } from 'react-router-dom';
import { ArrowLeft } from 'lucide-react';

export default function TopBar({ title, showBack = false, actions, children, subtitle, showCrest = false }) {
  const navigate = useNavigate();

  return (
    <header className="sticky top-0 z-40 px-4 pt-safe bg-navy-900/80 backdrop-blur-md">
      <div className="relative flex items-center justify-between h-14 px-1">
        {/* Left */}
        <div className="flex items-center gap-3 min-w-0">
          {showBack ? (
            <button
              onClick={() => navigate(-1)}
              className="w-9 h-9 rounded-xl bg-white/8 border border-white/10 flex items-center justify-center
                         hover:bg-white/12 active:scale-95 transition-all shrink-0"
            >
              <ArrowLeft size={18} className="text-white/80" />
            </button>
          ) : showCrest ? (
            <img
              src="/school-crest.png"
              alt="Chung Wah"
              className="w-8 h-8 object-contain shrink-0"
            />
          ) : null}

          <div className="min-w-0">
            <h1 className="font-display font-bold text-white text-lg leading-tight truncate">{title}</h1>
            {subtitle && <p className="text-white/40 text-xs font-body">{subtitle}</p>}
          </div>
        </div>

        {/* Right */}
        <div className="flex items-center gap-2 shrink-0">
          {children}
          {actions}
        </div>
      </div>

      {/* Divider */}
      <div className="absolute inset-x-0 bottom-0 h-px bg-gradient-to-r from-transparent via-white/8 to-transparent" />
    </header>
  );
}
