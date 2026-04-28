// src/pages/accounts/ManageExpenses.jsx
import React, { useState, useEffect } from 'react';
import { Plus, TrendingDown, Trash2 } from 'lucide-react';
import toast from 'react-hot-toast';
import { getExpenses, addExpense } from '../../services/firestore';
import TopBar from '../../components/layout/TopBar';
import BottomNav from '../../components/layout/BottomNav';
import { USER_TYPES, EXPENSE_CATEGORIES } from '../../utils/constants';

const CAT_COLORS = {
  Salaries:     '#6366f1',
  Utilities:    '#f59e0b',
  Maintenance:  '#ef4444',
  Supplies:     '#22c55e',
  Events:       '#a855f7',
  Transport:    '#3b82f6',
  Other:        '#94a3b8',
};

export default function ManageExpenses() {
  const [expenses, setExpenses] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [form, setForm] = useState({ description: '', amount: '', category: 'Other', date: new Date().toISOString().slice(0,10), notes: '' });
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    const unsub = getExpenses((data) => { setExpenses(data); setLoading(false); });
    return unsub;
  }, []);

  const set = k => e => setForm(f => ({ ...f, [k]: e.target.value }));

  const handleSave = async () => {
    if (!form.description || !form.amount) {
      toast.error('Description and amount are required');
      return;
    }
    setSaving(true);
    try {
      await addExpense({
        description: form.description,
        amount: parseFloat(form.amount),
        category: form.category,
        date: form.date,
        notes: form.notes,
      });
      toast.success('Expense recorded!');
      setShowForm(false);
      setForm({ description: '', amount: '', category: 'Other', date: new Date().toISOString().slice(0,10), notes: '' });
    } catch (err) {
      toast.error(err.message || 'Failed to save');
    } finally {
      setSaving(false);
    }
  };

  const totalByCategory = EXPENSE_CATEGORIES.reduce((acc, cat) => {
    acc[cat] = expenses.filter(e => e.category === cat).reduce((s, e) => s + (e.amount || 0), 0);
    return acc;
  }, {});
  const grandTotal = expenses.reduce((s, e) => s + (e.amount || 0), 0);

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col">
      <TopBar title="School Expenses" showBack>
        <button onClick={() => setShowForm(v => !v)}
          className="w-9 h-9 rounded-xl flex items-center justify-center"
          style={{ background: showForm ? '#ef4444' : '#6366f1' }}>
          <Plus size={18} className="text-white" style={{ transform: showForm ? 'rotate(45deg)' : 'none', transition: 'transform 0.2s' }} />
        </button>
      </TopBar>

      <div className="flex-1 overflow-y-auto px-4 pt-4 pb-28">
        {/* Add form */}
        {showForm && (
          <div className="p-4 bg-white rounded-2xl border border-gray-100 shadow-sm mb-5">
            <p className="font-display font-semibold text-gray-800 mb-4">New Expense</p>
            <div className="flex flex-col gap-3">
              <div>
                <label className="text-gray-500 text-xs font-body mb-1 block">Description *</label>
                <input className="field" placeholder="e.g. Monthly utilities bill" value={form.description} onChange={set('description')} />
              </div>
              <div className="flex gap-3">
                <div className="flex-1">
                  <label className="text-gray-500 text-xs font-body mb-1 block">Amount (RM) *</label>
                  <input className="field" type="number" placeholder="0.00" value={form.amount} onChange={set('amount')} />
                </div>
                <div className="flex-1">
                  <label className="text-gray-500 text-xs font-body mb-1 block">Date</label>
                  <input className="field" type="date" value={form.date} onChange={set('date')} />
                </div>
              </div>
              <div>
                <label className="text-gray-500 text-xs font-body mb-1 block">Category</label>
                <select className="field" value={form.category} onChange={set('category')}>
                  {EXPENSE_CATEGORIES.map(c => <option key={c} value={c}>{c}</option>)}
                </select>
              </div>
              <div>
                <label className="text-gray-500 text-xs font-body mb-1 block">Notes</label>
                <textarea className="field min-h-[70px] resize-none" placeholder="Optional..."
                  value={form.notes} onChange={set('notes')} />
              </div>
              <div className="flex gap-3">
                <button onClick={() => setShowForm(false)}
                  className="flex-1 h-12 rounded-2xl font-display font-semibold text-gray-600 bg-gray-100">
                  Cancel
                </button>
                <button onClick={handleSave} disabled={saving}
                  className="flex-1 h-12 rounded-2xl font-display font-bold text-white flex items-center justify-center disabled:opacity-50"
                  style={{ background: 'linear-gradient(135deg, #6366f1, #4f46e5)' }}>
                  {saving
                    ? <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                    : 'Save Expense'
                  }
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Summary */}
        <div className="p-4 bg-white rounded-2xl border border-gray-100 shadow-sm mb-5">
          <div className="flex items-center justify-between mb-3">
            <p className="text-gray-500 text-xs font-body font-semibold uppercase tracking-wider">Total Expenses</p>
            <p className="font-display font-bold text-gray-900 text-xl">RM {grandTotal.toFixed(2)}</p>
          </div>
          <div className="flex flex-col gap-1.5">
            {EXPENSE_CATEGORIES.filter(c => totalByCategory[c] > 0).map(cat => {
              const color = CAT_COLORS[cat] || '#94a3b8';
              const pct = grandTotal > 0 ? (totalByCategory[cat] / grandTotal) * 100 : 0;
              return (
                <div key={cat} className="flex items-center gap-2">
                  <div className="w-2 h-2 rounded-full shrink-0" style={{ background: color }} />
                  <p className="text-gray-500 text-xs font-body flex-1">{cat}</p>
                  <p className="text-gray-700 text-xs font-display font-semibold">RM {totalByCategory[cat].toFixed(2)}</p>
                  <p className="text-gray-300 text-xs font-body w-10 text-right">{pct.toFixed(0)}%</p>
                </div>
              );
            })}
          </div>
        </div>

        {/* Expense list */}
        <p className="text-gray-400 text-xs font-body font-semibold uppercase tracking-wider mb-3">Recent Expenses</p>
        {loading ? (
          <div className="flex flex-col gap-3">
            {[1,2,3].map(i => <div key={i} className="h-16 rounded-2xl bg-gray-100 animate-pulse" />)}
          </div>
        ) : expenses.length === 0 ? (
          <div className="text-center py-16">
            <TrendingDown size={32} className="text-gray-200 mx-auto mb-3" />
            <p className="text-gray-400 font-body">No expenses recorded yet</p>
          </div>
        ) : (
          <div className="flex flex-col gap-2">
            {expenses.map(exp => {
              const color = CAT_COLORS[exp.category] || '#94a3b8';
              return (
                <div key={exp.id} className="flex items-center gap-3 p-3.5 bg-white rounded-2xl border border-gray-100 shadow-sm">
                  <div className="w-9 h-9 rounded-xl flex items-center justify-center shrink-0"
                    style={{ background: `${color}15` }}>
                    <TrendingDown size={16} style={{ color }} />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="font-display font-medium text-gray-800 text-sm truncate">{exp.description}</p>
                    <p className="text-gray-400 text-xs font-body">{exp.category} · {exp.date}</p>
                  </div>
                  <p className="font-display font-bold text-gray-800 text-sm shrink-0">RM {(exp.amount || 0).toFixed(2)}</p>
                </div>
              );
            })}
          </div>
        )}
      </div>
      <BottomNav userType={USER_TYPES.ACCOUNTS} />
    </div>
  );
}
