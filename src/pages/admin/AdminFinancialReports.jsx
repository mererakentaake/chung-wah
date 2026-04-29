// src/pages/admin/AdminFinancialReports.jsx
import React, { useState, useEffect } from 'react';
import { BarChart3, FileText } from 'lucide-react';
import { getFinancialReports } from '../../services/firestore';
import TopBar from '../../components/layout/TopBar';

export default function AdminFinancialReports() {
  const [reports, setReports] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const unsub = getFinancialReports(data => { setReports(data); setLoading(false); });
    return unsub;
  }, []);

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col">
      <TopBar title="Financial Reports" showBack />
      <div className="flex-1 overflow-y-auto px-4 pt-4 pb-10">
        {loading ? (
          <div className="flex flex-col gap-3">
            {[1,2,3].map(i => <div key={i} className="h-32 rounded-2xl bg-gray-100 animate-pulse" />)}
          </div>
        ) : reports.length === 0 ? (
          <div className="flex flex-col items-center gap-3 py-20 text-center">
            <div className="w-14 h-14 rounded-2xl bg-gray-100 flex items-center justify-center">
              <BarChart3 size={24} className="text-gray-300" />
            </div>
            <p className="text-gray-400 font-body">No reports submitted yet</p>
            <p className="text-gray-300 text-sm font-body">Reports appear once the Accounts team generates them</p>
          </div>
        ) : (
          <div className="flex flex-col gap-4">
            {reports.map(r => (
              <div key={r.id} className="bg-white rounded-2xl border border-gray-100 shadow-sm p-4">
                <div className="flex items-start gap-3 mb-3">
                  <div className="w-9 h-9 rounded-xl bg-purple-50 flex items-center justify-center shrink-0">
                    <FileText size={16} className="text-purple-600" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-gray-800 font-display font-semibold">{r.title}</p>
                    <p className="text-gray-400 text-xs font-body mt-0.5">{r.generatedDate}</p>
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-2 mb-3">
                  {[
                    { label: 'Total Collected', value: r.totalRevenue,     bg: 'bg-emerald-50', color: 'text-emerald-600' },
                    { label: 'Outstanding',      value: r.totalOutstanding, bg: 'bg-red-50',     color: 'text-red-500' },
                    { label: 'Total Expenses',   value: r.totalExpenses,    bg: 'bg-yellow-50',  color: 'text-yellow-600' },
                    { label: 'Net Balance',      value: r.netBalance,       bg: (r.netBalance || 0) >= 0 ? 'bg-emerald-50' : 'bg-red-50', color: (r.netBalance || 0) >= 0 ? 'text-emerald-600' : 'text-red-500' },
                  ].map(item => (
                    <div key={item.label} className={"p-2.5 rounded-xl " + item.bg}>
                      <p className="text-gray-400 text-[10px] font-body">{item.label}</p>
                      <p className={"font-display font-bold text-base " + item.color}>
                        RM {(item.value || 0).toFixed(2)}
                      </p>
                    </div>
                  ))}
                </div>

                {r.feeStats && (
                  <div className="flex gap-3 pt-3 border-t border-gray-100 mb-3">
                    {[
                      { label: 'Paid',    value: r.feeStats.paidCount,    color: 'text-emerald-600' },
                      { label: 'Pending', value: r.feeStats.pendingCount, color: 'text-yellow-600' },
                      { label: 'Overdue', value: r.feeStats.overdueCount, color: 'text-red-500' },
                      { label: 'Total',   value: r.feeStats.total,         color: 'text-gray-600' },
                    ].map(item => (
                      <div key={item.label} className="flex-1 text-center">
                        <p className={"font-display font-bold " + item.color}>{item.value}</p>
                        <p className="text-gray-300 text-[10px] font-body">{item.label}</p>
                      </div>
                    ))}
                  </div>
                )}

                {r.notes && (
                  <p className="text-gray-500 text-xs font-body leading-relaxed border-t border-gray-100 pt-3">{r.notes}</p>
                )}
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
