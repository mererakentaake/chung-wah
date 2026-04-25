// src/pages/Transportation.jsx
import React from 'react';
import { Bus, MapPin, Clock } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import TopBar from '../components/layout/TopBar';
import BottomNav from '../components/layout/BottomNav';

const ROUTES_DATA = [
  { id: 'R1', name: 'Route 1 – North', stops: ['Main Gate', 'Jalan Ampang', 'KLCC', 'Chow Kit'], departure: '7:00 AM', driver: 'Mr. Ahmad' },
  { id: 'R2', name: 'Route 2 – South', stops: ['Main Gate', 'Bangsar', 'Mid Valley', 'Cheras'], departure: '7:15 AM', driver: 'Mr. Ravi' },
  { id: 'R3', name: 'Route 3 – East', stops: ['Main Gate', 'Ampang Jaya', 'Pandan Maju', 'Taman Melati'], departure: '7:30 AM', driver: 'Mr. Singh' },
];

export default function Transportation() {
  const { userType } = useAuth();
  return (
    <div className="min-h-screen mesh-bg flex flex-col">
      <TopBar title="Transportation" showBack />
      <div className="flex-1 overflow-y-auto px-4 pt-3 pb-28">
        <div className="flex flex-col gap-4">
          {ROUTES_DATA.map(r => (
            <div key={r.id} className="glass-card p-4">
              <div className="flex items-center gap-3 mb-4">
                <div className="w-10 h-10 rounded-xl bg-slate-500/20 flex items-center justify-center">
                  <Bus size={20} className="text-slate-300" />
                </div>
                <div>
                  <p className="text-white font-display font-semibold text-sm">{r.name}</p>
                  <p className="text-white/40 text-xs font-body">Driver: {r.driver}</p>
                </div>
                <div className="ml-auto flex items-center gap-1.5 text-gold-400">
                  <Clock size={13} />
                  <span className="text-xs font-body font-semibold">{r.departure}</span>
                </div>
              </div>
              <div className="relative pl-5">
                <div className="absolute left-1.5 top-2 bottom-2 w-0.5 bg-white/10 rounded-full" />
                {r.stops.map((stop, i) => (
                  <div key={i} className="relative flex items-center gap-2 mb-2 last:mb-0">
                    <div className={`absolute -left-4 w-2.5 h-2.5 rounded-full border-2 ${i === 0 ? 'border-gold-500 bg-gold-500/30' : 'border-white/20 bg-navy-900'}`} />
                    <p className={`text-sm font-body ${i === 0 ? 'text-gold-400 font-semibold' : 'text-white/60'}`}>{stop}</p>
                  </div>
                ))}
              </div>
            </div>
          ))}
        </div>
      </div>
      <BottomNav userType={userType} />
    </div>
  );
}
