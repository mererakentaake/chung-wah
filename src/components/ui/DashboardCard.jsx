// src/components/ui/DashboardCard.jsx
import React from 'react';
import { useNavigate } from 'react-router-dom';
import { ChevronRight } from 'lucide-react';

export function DashboardCardFull({ icon: Icon, label, color, route, description }) {
  const navigate = useNavigate();
  return (
    <button onClick={() => navigate(route)}
      className="w-full group relative flex items-center gap-4 p-4 rounded-2xl border border-gray-100
                 bg-white shadow-sm hover:shadow-md active:scale-[0.98] transition-all duration-200 overflow-hidden">
      <div className="absolute left-0 top-0 bottom-0 w-1 rounded-l-2xl" style={{ background: color }} />
      <div className="w-11 h-11 rounded-xl flex items-center justify-center shrink-0"
        style={{ background: `${color}18` }}>
        <Icon size={22} style={{ color }} />
      </div>
      <div className="flex-1 text-left">
        <p className="text-gray-800 font-display font-semibold text-[15px]">{label}</p>
        {description && <p className="text-gray-400 text-xs font-body mt-0.5">{description}</p>}
      </div>
      <ChevronRight size={18} className="text-gray-300 group-hover:text-gray-500 transition-colors" />
    </button>
  );
}

export function DashboardCardHalf({ icon: Icon, label, color, route }) {
  const navigate = useNavigate();
  return (
    <button onClick={() => navigate(route)}
      className="flex-1 group relative flex flex-col items-center justify-center gap-2.5 p-4 rounded-2xl
                 border border-gray-100 bg-white shadow-sm hover:shadow-md active:scale-[0.98] transition-all
                 duration-200 aspect-[1.1] overflow-hidden min-h-[100px]">
      <div className="w-12 h-12 rounded-2xl flex items-center justify-center"
        style={{ background: `${color}18` }}>
        <Icon size={24} style={{ color }} />
      </div>
      <p className="text-gray-700 font-display font-medium text-[13px] text-center leading-tight">{label}</p>
    </button>
  );
}

export function DashboardCardBanner({ icon: Icon, label, color, route }) {
  const navigate = useNavigate();
  return (
    <button onClick={() => navigate(route)}
      className="flex flex-col items-center justify-center gap-2 p-3 rounded-2xl border border-gray-100
                 bg-white shadow-sm hover:shadow-md active:scale-[0.98] transition-all duration-200 min-w-[90px]">
      <div className="w-10 h-10 rounded-xl flex items-center justify-center"
        style={{ background: `${color}18` }}>
        <Icon size={20} style={{ color }} />
      </div>
      <p className="text-gray-600 text-[11px] font-body font-medium text-center leading-tight">{label}</p>
    </button>
  );
}
