// src/components/ui/DashboardCard.jsx
import React from 'react';
import { useNavigate } from 'react-router-dom';
import { ChevronRight } from 'lucide-react';

export function DashboardCardFull({ icon: Icon, label, color, route, description }) {
  const navigate = useNavigate();
  return (
    <button onClick={() => navigate(route)}
      className="w-full flex items-center gap-4 p-4 bg-white rounded-2xl border border-gray-100 shadow-sm
                 hover:shadow-md active:scale-[0.99] transition-all text-left">
      <div className="w-11 h-11 rounded-xl flex items-center justify-center shrink-0"
        style={{ background: `${color}18` }}>
        <Icon size={21} style={{ color }} />
      </div>
      <div className="flex-1 min-w-0">
        <p className="font-display font-semibold text-gray-800 text-sm">{label}</p>
        {description && (
          <p className="text-gray-400 text-xs font-body mt-0.5 truncate">{description}</p>
        )}
      </div>
      <ChevronRight size={16} className="text-gray-300 shrink-0" />
    </button>
  );
}

export function DashboardCardHalf({ icon: Icon, label, color, route }) {
  const navigate = useNavigate();
  return (
    <button onClick={() => navigate(route)}
      className="flex-1 flex flex-col items-center gap-2 p-4 bg-white rounded-2xl border border-gray-100 shadow-sm
                 hover:shadow-md active:scale-[0.98] transition-all">
      <div className="w-11 h-11 rounded-xl flex items-center justify-center"
        style={{ background: `${color}18` }}>
        <Icon size={21} style={{ color }} />
      </div>
      <p className="font-display font-semibold text-gray-700 text-xs text-center leading-tight">{label}</p>
    </button>
  );
}

export function DashboardCardBanner({ icon: Icon, label, color, route }) {
  const navigate = useNavigate();
  return (
    <button onClick={() => navigate(route)}
      className="flex flex-col items-center gap-2 p-4 rounded-2xl border active:scale-[0.98] transition-all"
      style={{
        background: `${color}10`,
        borderColor: `${color}25`,
        minWidth: 100,
      }}>
      <div className="w-10 h-10 rounded-xl flex items-center justify-center"
        style={{ background: `${color}20` }}>
        <Icon size={19} style={{ color }} />
      </div>
      <p className="font-display font-semibold text-xs text-center leading-tight" style={{ color }}>
        {label}
      </p>
    </button>
  );
}

// Legacy default export for backward compat
export default function DashboardCard({ icon: Icon, label, color, route, full = false, description }) {
  if (full) return <DashboardCardFull icon={Icon} label={label} color={color} route={route} description={description} />;
  return <DashboardCardHalf icon={Icon} label={label} color={color} route={route} />;
}
