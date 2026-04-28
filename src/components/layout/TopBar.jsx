// src/components/layout/TopBar.jsx
import React from 'react';
import { useNavigate } from 'react-router-dom';
import { LogOut } from 'lucide-react';
import { logoutUser } from '../../services/auth';
import toast from 'react-hot-toast';
import { ROUTES } from '../../utils/constants';

/**
 * Global TopBar — standard layout for all authenticated screens.
 * Left:   School crest
 * Center: Screen title (+ optional subtitle)
 * Right:  Sign out button
 */
export default function TopBar({ title, subtitle }) {
  const navigate = useNavigate();

  const handleSignOut = async () => {
    try {
      await logoutUser();
      navigate(ROUTES.LOGIN, { replace: true });
    } catch {
      toast.error('Failed to sign out. Try again.');
    }
  };

  return (
    <header className="sticky top-0 z-40 bg-white border-b border-gray-100 shadow-sm">
      <div className="relative flex items-center h-14 px-4">
        {/* Left — school crest */}
        <div className="flex items-center shrink-0 w-10">
          <img
            src="/school-crest.png"
            alt="Chung Wah"
            className="w-8 h-8 object-contain"
          />
        </div>

        {/* Center — title */}
        <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none px-14">
          <h1 className="font-display font-bold text-gray-900 text-[15px] leading-tight truncate max-w-[200px] text-center">
            {title}
          </h1>
          {subtitle && (
            <p className="text-gray-400 text-[11px] font-body leading-none mt-0.5">{subtitle}</p>
          )}
        </div>

        {/* Right — sign out */}
        <div className="ml-auto flex items-center shrink-0">
          <button
            onClick={handleSignOut}
            className="w-9 h-9 rounded-xl bg-gray-100 border border-gray-200 flex items-center justify-center
                       hover:bg-red-50 hover:border-red-200 hover:text-red-500 text-gray-500 active:scale-95 transition-all"
            aria-label="Sign out"
          >
            <LogOut size={16} />
          </button>
        </div>
      </div>
    </header>
  );
}
