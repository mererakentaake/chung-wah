// src/pages/admin/AdminFinancialReports.jsx
import React, { useState, useEffect } from 'react';
import { BarChart3, FileText } from 'lucide-react';
import { getFinancialReports } from '../../services/firestore';
import TopBar from '../../components/layout/TopBar';

export default function AdminFinancialReports() {
  const [reports, setReports] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const unsub = getFinancialReports((data) => { setReports(data); setLoading(false); });
    return unsub;
  }, []);

  return (
    <div className="min-h-screen mesh-bg flex flex-col">
      <TopBar title="Financial Reports" showBack />

      <div className="flex-1 overflow-y-auto px-4 pt-4 pb-10">
        {loading ? (
          <div className="flex flex-col gap-3">
            {[1,2,3].map(i => <div key={i} className="h-32 rounded-2xl bg-white/5 animate-pulse" />)}
          </div>
        ) : reports.length === 0 ? (
          <div className="flex flex-col items-center gap-3 py-20 text-center">
            <BarChart3 size={32} className="text-white/20" />
            <p className="text-white/30 font-body">No reports submitted yet</p>
            <p className="text-white/20 text-sm font-body">Reports will appear here once the Accounts team generates them</p>
          </div>
        ) : (
          <div className="flex flex-col gap-4">
            {reports.map(r => (
              <div key={r.id} className="glass-card p-4">
                <div className="flex items-start gap-3 mb-3">
                  <div className="w-9 h-9 rounded-xl bg-purple-500/10 flex items-center justify-center shrink-0">
                    <FileText size={16} className="text-purple-400" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-white font-display font-semibold">{r.title}</p>
                    <p className="text-white/40 text-xs font-body">{r.generatedDate}</p>
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-2 mb-3">
                  {[
                    { label: 'Total Collected',  value: r.totalRevenue,     color: '#22c55e' },
                    { label: 'Outstanding',       value: r.totalOutstanding, color: '#ef4444' },
                    { label: 'Total Expenses',    value: r.totalExpenses,    color: '#f59e0b' },
                    { label: 'Net Balance',       value: r.netBalance,       color: (r.netBalance||0) >= 0 ? '#22c55e' : '#ef4444' },
                  ].map(item => (
                    <div key={item.label} className="p-2.5 rounded-xl bg-white/5">
                      <p className="text-white/30 text-[10px] font-body">{item.label}</p>
                      <p className="font-display font-bold text-base" style={{ color: item.color }}>
                        RM {(item.value||0).toFixed(2)}
                      </p>
                    </div>
                  ))}
                </div>

                {r.feeStats && (
                  <div className="flex gap-3 pt-3 border-t border-white/5 mb-3">
                    {[
                      { label: 'Paid',    value: r.feeStats.paidCount,    color: '#22c55e' },
                      { label: 'Pending', value: r.feeStats.pendingCount, color: '#f59e0b' },
                      { label: 'Overdue', value: r.feeStats.overdueCount, color: '#ef4444' },
                      { label: 'Total',   value: r.feeStats.total,         color: '#94a3b8' },
                    ].map(item => (
                      <div key={item.label} className="flex-1 text-center">
                        <p className="font-display font-bold" style={{ color: item.color }}>{item.value}</p>
                        <p className="text-white/25 text-[10px] font-body">{item.label}</p>
                      </div>
                    ))}
                  </div>
                )}

                {r.notes && (
                  <p className="text-white/40 text-xs font-body leading-relaxed">{r.notes}</p>
                )}
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
