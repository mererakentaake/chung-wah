// src/pages/StudentReports.jsx
import React, { useState, useEffect, useRef } from 'react';
import { ClipboardList, Plus, Search, X, ChevronDown, Send } from 'lucide-react';
import toast from 'react-hot-toast';
import { useAuth } from '../context/AuthContext';
import { adminGetStudents, createStudentReport, getStudentReportsByTeacher } from '../services/firestore';
import TopBar from '../components/layout/TopBar';
import BottomNav from '../components/layout/BottomNav';
import { REPORT_TYPES } from '../utils/constants';

/* ─── Student Search Box ─────────────────────────────────────────────────── */
function StudentSearchBox({ students, selected, onSelect }) {
  const [query, setQuery] = useState(selected?.displayName || '');
  const [open, setOpen] = useState(false);
  const ref = useRef(null);

  const matches = query.trim().length > 0
    ? students.filter(s =>
        (s.displayName || '').toLowerCase().includes(query.toLowerCase()) ||
        (s.standard || '').toString().includes(query)
      ).slice(0, 6)
    : [];

  useEffect(() => {
    const h = e => { if (ref.current && !ref.current.contains(e.target)) setOpen(false); };
    document.addEventListener('mousedown', h);
    return () => document.removeEventListener('mousedown', h);
  }, []);

  const pick = (s) => {
    setQuery(s.displayName || s.email);
    setOpen(false);
    onSelect(s);
  };

  return (
    <div ref={ref} className="relative">
      <label className="text-white/60 text-xs font-body font-medium mb-1.5 block">
        Student<span className="text-red-400 ml-0.5">*</span>
      </label>
      <div className="relative">
        <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-white/30" />
        <input
          className="field-dark pl-9"
          placeholder="Search student by name or class…"
          value={query}
          onChange={e => { setQuery(e.target.value); setOpen(true); onSelect(null); }}
          onFocus={() => setOpen(true)}
        />
      </div>
      {open && matches.length > 0 && (
        <div className="absolute z-50 w-full mt-1 rounded-xl overflow-hidden shadow-2xl"
          style={{ background: '#1a2040', border: '1px solid rgba(255,255,255,0.12)' }}>
          {matches.map(s => (
            <button key={s.id} type="button" onMouseDown={() => pick(s)}
              className="w-full px-4 py-3 text-left hover:bg-white/8 transition-colors border-b border-white/5 last:border-0">
              <p className="text-white text-sm font-display font-semibold">{s.displayName || s.email}</p>
              {s.standard && (
                <p className="text-white/40 text-xs font-body mt-0.5">
                  Std {s.standard} {s.division}
                </p>
              )}
            </button>
          ))}
        </div>
      )}
    </div>
  );
}

/* ─── Report Card ────────────────────────────────────────────────────────── */
function ReportCard({ report }) {
  const typeColors = {
    'Marks / Assessment': '#F9C61F',
    'Behaviour': '#E84545',
    'Performance': '#22c55e',
    'General Improvement': '#8b5cf6',
  };
  const color = typeColors[report.reportType] || '#F9C61F';
  const date = report.createdAt?.toDate
    ? report.createdAt.toDate().toLocaleDateString()
    : report.createdAt
      ? new Date(report.createdAt).toLocaleDateString()
      : '—';

  return (
    <div className="glass-card p-4">
      <div className="flex items-start justify-between gap-3 mb-2">
        <div>
          <p className="text-white font-display font-semibold text-sm">{report.studentName}</p>
          {report.studentClass && (
            <p className="text-white/40 text-xs font-body">{report.studentClass}</p>
          )}
        </div>
        <div className="flex flex-col items-end gap-1">
          <span className="px-2 py-0.5 rounded-full text-xs font-body font-semibold"
            style={{ background: `${color}18`, color, border: `1px solid ${color}30` }}>
            {report.reportType}
          </span>
          <span className="text-white/25 text-xs font-body">{date}</span>
        </div>
      </div>
      {report.subject && (
        <p className="text-yellow-400/70 text-xs font-body mb-1.5">Subject: {report.subject}</p>
      )}
      {report.marks && (
        <p className="text-emerald-400/80 text-xs font-body font-semibold mb-1.5">
          Mark: {report.marks}
        </p>
      )}
      <p className="text-white/60 text-sm font-body leading-relaxed">{report.content}</p>
    </div>
  );
}

/* ─── Main Page ──────────────────────────────────────────────────────────── */
export default function StudentReports() {
  const { userType, userId } = useAuth();
  const [students, setStudents] = useState([]);
  const [reports, setReports] = useState([]);
  const [showForm, setShowForm] = useState(false);
  const [selectedStudent, setSelectedStudent] = useState(null);
  const [form, setForm] = useState({ reportType: '', subject: '', marks: '', content: '' });
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    adminGetStudents().then(data => {
      data.sort((a, b) => (a.displayName || '').localeCompare(b.displayName || ''));
      setStudents(data);
    }).catch(() => {});
  }, []);

  useEffect(() => {
    if (!userId) return;
    const unsub = getStudentReportsByTeacher(setReports);
    return unsub;
  }, [userId]);

  const set = k => e => setForm(f => ({ ...f, [k]: e.target.value }));

  const handleSubmit = async () => {
    if (!selectedStudent) { toast.error('Please select a student'); return; }
    if (!form.reportType) { toast.error('Please select a report type'); return; }
    if (!form.content.trim()) { toast.error('Report content is required'); return; }

    setSaving(true);
    try {
      await createStudentReport({
        studentId: selectedStudent.id,
        studentName: selectedStudent.displayName || selectedStudent.email,
        studentClass: selectedStudent.standard
          ? `Std ${selectedStudent.standard} ${selectedStudent.division}`
          : '',
        reportType: form.reportType,
        subject: form.subject.trim(),
        marks: form.marks.trim(),
        content: form.content.trim(),
      });
      toast.success('Report submitted!');
      setShowForm(false);
      setSelectedStudent(null);
      setForm({ reportType: '', subject: '', marks: '', content: '' });
    } catch (err) {
      toast.error(err.message || 'Failed to submit report');
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="min-h-screen mesh-bg flex flex-col">
      <TopBar title="Student Reports" showBack>
        <button
          onClick={() => setShowForm(true)}
          className="flex items-center gap-1.5 px-3 h-9 rounded-xl font-display font-bold text-sm text-gray-900"
          style={{ background: '#22c55e' }}>
          <Plus size={15} /> New
        </button>
      </TopBar>

      <div className="flex-1 overflow-y-auto px-4 pt-3 pb-28">
        {reports.length === 0 ? (
          <div className="flex flex-col items-center gap-3 py-20 text-center">
            <div className="w-16 h-16 rounded-2xl bg-white/5 flex items-center justify-center">
              <ClipboardList size={28} className="text-white/20" />
            </div>
            <p className="text-white/30 font-body">No reports submitted yet</p>
            <p className="text-white/20 text-sm font-body">Tap "New" to submit your first student report</p>
          </div>
        ) : (
          <div className="flex flex-col gap-3">
            {reports.map(r => <ReportCard key={r.id} report={r} />)}
          </div>
        )}
      </div>

      {/* New Report Sheet */}
      {showForm && (
        <div className="fixed inset-0 z-50 bg-black/70 flex items-end" onClick={() => setShowForm(false)}>
          <div className="w-full max-h-[90vh] overflow-y-auto rounded-t-3xl p-6 flex flex-col gap-4"
            style={{ background: '#141829', border: '1px solid rgba(255,255,255,0.1)' }}
            onClick={e => e.stopPropagation()}>

            <div className="flex items-center justify-between">
              <h3 className="font-display font-bold text-white text-lg">New Student Report</h3>
              <button onClick={() => setShowForm(false)}
                className="w-8 h-8 rounded-xl bg-white/8 flex items-center justify-center">
                <X size={16} className="text-white/60" />
              </button>
            </div>

            <StudentSearchBox students={students} selected={selectedStudent} onSelect={setSelectedStudent} />

            {/* Report type */}
            <div>
              <label className="text-white/60 text-xs font-body font-medium mb-1.5 block">
                Report Type<span className="text-red-400 ml-0.5">*</span>
              </label>
              <div className="flex flex-wrap gap-2">
                {REPORT_TYPES.map(rt => (
                  <button key={rt} type="button"
                    onClick={() => setForm(f => ({ ...f, reportType: rt }))}
                    className="px-3 py-2 rounded-xl text-xs font-display font-semibold transition-all"
                    style={form.reportType === rt
                      ? { background: '#22c55e', color: '#fff' }
                      : { background: 'rgba(255,255,255,0.06)', color: 'rgba(255,255,255,0.5)', border: '1px solid rgba(255,255,255,0.1)' }
                    }>
                    {rt}
                  </button>
                ))}
              </div>
            </div>

            {/* Subject (optional) */}
            <div>
              <label className="text-white/60 text-xs font-body font-medium mb-1.5 block">Subject (optional)</label>
              <input className="field-dark" placeholder="e.g. Mathematics" value={form.subject} onChange={set('subject')} />
            </div>

            {/* Marks */}
            {form.reportType === 'Marks / Assessment' && (
              <div>
                <label className="text-white/60 text-xs font-body font-medium mb-1.5 block">Mark / Score</label>
                <input className="field-dark" placeholder="e.g. 78/100 or B+" value={form.marks} onChange={set('marks')} />
              </div>
            )}

            {/* Report content */}
            <div>
              <label className="text-white/60 text-xs font-body font-medium mb-1.5 block">
                Report Details<span className="text-red-400 ml-0.5">*</span>
              </label>
              <textarea
                className="field-dark resize-none"
                rows={4}
                placeholder="Write your report here — describe performance, behaviour, improvements needed, or any observations…"
                value={form.content}
                onChange={set('content')}
              />
            </div>

            <button onClick={handleSubmit} disabled={saving}
              className="w-full h-12 rounded-2xl font-display font-bold text-sm text-gray-900 flex items-center justify-center gap-2 disabled:opacity-50"
              style={{ background: 'linear-gradient(135deg, #22c55e, #16a34a)' }}>
              {saving
                ? <div className="w-4 h-4 border-2 border-gray-700/40 border-t-gray-700 rounded-full animate-spin" />
                : <><Send size={15} /> Submit Report</>
              }
            </button>
          </div>
        </div>
      )}

      <BottomNav userType={userType} />
    </div>
  );
}
