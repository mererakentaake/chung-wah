// src/pages/Fees.jsx
import React from 'react';
import { DollarSign, CheckCircle, AlertTriangle } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import TopBar from '../components/layout/TopBar';
import BottomNav from '../components/layout/BottomNav';

const DEMO_FEES = [
  { term: 'Term 1 – Jan/Feb', amount: 'RM 450', status: 'paid', date: '10 Jan 2024' },
  { term: 'Term 2 – Mar/Apr', amount: 'RM 450', status: 'paid', date: '8 Mar 2024' },
  { term: 'Term 3 – May/Jun', amount: 'RM 450', status: 'due', date: 'Due 1 May 2024' },
  { term: 'Term 4 – Jul/Aug', amount: 'RM 450', status: 'upcoming', date: 'Due 1 Jul 2024' },
];

export default function Fees() {
  const { userType } = useAuth();
  const paid = DEMO_FEES.filter(f => f.status === 'paid').length;
  const total = DEMO_FEES.length;

  return (
    <div className="min-h-screen mesh-bg flex flex-col">
      <TopBar title="School Fees" showBack />
      <div className="flex-1 overflow-y-auto px-4 pt-3 pb-28">
        {/* Summary card */}
        <div className="glass-card p-5 mb-4">
          <div className="flex items-center justify-between mb-3">
            <p className="text-white/50 text-sm font-body">Payment Progress</p>
            <span className="text-gold-400 font-display font-bold">{paid}/{total} terms</span>
          </div>
          <div className="w-full h-2 rounded-full bg-white/10 overflow-hidden">
            <div className="h-full rounded-full bg-gradient-to-r from-gold-500 to-emerald-500 transition-all"
              style={{ width: `${(paid / total) * 100}%` }} />
          </div>
          <div className="flex justify-between mt-3">
            <div>
              <p className="text-white/40 text-xs font-body">Total Paid</p>
              <p className="text-white font-display font-bold text-lg">RM {paid * 450}</p>
            </div>
            <div className="text-right">
              <p className="text-white/40 text-xs font-body">Outstanding</p>
              <p className="text-coral-400 font-display font-bold text-lg">RM {(total - paid) * 450}</p>
            </div>
          </div>
        </div>

        <div className="flex flex-col gap-3">
          {DEMO_FEES.map((f, i) => (
            <div key={i} className="flex items-center gap-3.5 p-4 glass-card">
              <div className={`w-10 h-10 rounded-xl flex items-center justify-center shrink-0
                ${f.status === 'paid' ? 'bg-emerald-500/15' : f.status === 'due' ? 'bg-coral-500/15' : 'bg-white/8'}`}>
                {f.status === 'paid'
                  ? <CheckCircle size={20} className="text-emerald-400" />
                  : f.status === 'due'
                  ? <AlertTriangle size={20} className="text-coral-400" />
                  : <DollarSign size={20} className="text-white/30" />}
              </div>
              <div className="flex-1">
                <p className="text-white font-display font-semibold text-sm">{f.term}</p>
                <p className="text-white/40 text-xs font-body mt-0.5">{f.date}</p>
              </div>
              <div className="text-right">
                <p className="text-white font-display font-bold text-sm">{f.amount}</p>
                <span className={`text-[10px] font-body font-semibold px-2 py-0.5 rounded-full capitalize
                  ${f.status === 'paid' ? 'bg-emerald-500/15 text-emerald-400'
                  : f.status === 'due' ? 'bg-coral-500/15 text-coral-400'
                  : 'bg-white/8 text-white/30'}`}>{f.status}</span>
              </div>
            </div>
          ))}
        </div>
      </div>
      <BottomNav userType={userType} />
    </div>
  );
}
