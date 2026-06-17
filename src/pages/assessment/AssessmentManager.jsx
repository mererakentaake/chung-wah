// src/pages/assessment/AssessmentManager.jsx
// Teacher/Admin: create and manage all assessments
import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  BookOpen, ClipboardList, FileText, GraduationCap,
  Plus, ChevronRight, Check, Clock, Trash2, Search
} from 'lucide-react';
import toast from 'react-hot-toast';
import { useAuth } from '../../context/AuthContext';
import { getAssessmentsByTeacher, getAllAssessments, deleteAssessment } from '../../services/firestore';
import {
  ROUTES, USER_TYPES, ASSESSMENT_TYPES, ASSESSMENT_CONFIG
} from '../../utils/constants';
import TopBar from '../../components/layout/TopBar';
import BottomNav from '../../components/layout/BottomNav';

const TYPE_TABS = [
  { key: ASSESSMENT_TYPES.HOMEWORK,   label: 'Homework',    icon: BookOpen },
  { key: ASSESSMENT_TYPES.UNIT_TEST,  label: 'Unit Tests',  icon: ClipboardList },
  { key: ASSESSMENT_TYPES.ASSIGNMENT, label: 'Assignments', icon: FileText },
  { key: ASSESSMENT_TYPES.EXAM,       label: 'Exams',       icon: GraduationCap },
];

function AssessmentCard({ item, onDelete, onEnterMarks }) {
  const cfg = ASSESSMENT_CONFIG[item.type] || ASSESSMENT_CONFIG.homework;
  const date = item.dueDate || item.testDate || item.examDate || '';
  const today = new Date().toISOString().slice(0, 10);
  const overdue = !item.isMarked && date && date < today;

  return (
    <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
      <div className="flex items-start gap-3 p-4">
        <div className="w-9 h-9 rounded-xl flex items-center justify-center shrink-0"
          style={{ background: cfg.color + '15' }}>
          <ClipboardList size={17} style={{ color: cfg.color }} />
        </div>
        <div className="flex-1 min-w-0">
          <p className="font-display font-semibold text-gray-800 text-sm truncate">{item.title}</p>
          <p className="text-gray-400 text-xs font-body">{item.schoolClass} · {item.subject}</p>
          {date && (
            <p className={`text-xs font-body mt-0.5 ${overdue ? 'text-red-400 font-semibold' : 'text-gray-400'}`}>
              {item.type === 'homework' ? 'Due' : 'Date'}: {date}
              {overdue ? ' · Overdue' : ''}
            </p>
          )}
          {item.term && <p className="text-gray-300 text-[10px] font-body">{item.term}</p>}
        </div>
        <div className="flex flex-col items-end gap-1 shrink-0">
          {item.isMarked ? (
            <span className="flex items-center gap-1 text-emerald-600 text-[10px] font-body font-semibold">
              <Check size={11} /> Marked
            </span>
          ) : (
            <span className="flex items-center gap-1 text-gray-400 text-[10px] font-body">
              <Clock size={11} /> Pending
            </span>
          )}
          {item.totalMarks > 0 && (
            <p className="text-gray-300 text-[10px] font-body">/{item.totalMarks}</p>
          )}
        </div>
      </div>
      <div className="flex border-t border-gray-100">
        <button onClick={() => onEnterMarks(item)}
          className="flex-1 py-2.5 text-xs font-display font-semibold text-indigo-600 hover:bg-indigo-50 transition-colors">
          {item.isMarked ? 'Edit Marks' : 'Enter Marks'}
        </button>
        <div className="w-px bg-gray-100" />
        <button onClick={() => onDelete(item)}
          className="px-4 py-2.5 text-xs font-display font-semibold text-red-400 hover:bg-red-50 transition-colors">
          <Trash2 size={14} />
        </button>
      </div>
    </div>
  );
}

export default function AssessmentManager() {
  const { userType, userId } = useAuth();
  const navigate = useNavigate();
  const isAdmin = userType === USER_TYPES.ADMIN;

  const [activeTab, setActiveTab]       = useState(ASSESSMENT_TYPES.HOMEWORK);
  const [assessments, setAssessments]   = useState([]);
  const [loading, setLoading]           = useState(true);
  const [search, setSearch]             = useState('');

  useEffect(() => {
    let unsub;
    if (isAdmin) {
      unsub = getAllAssessments(data => { setAssessments(data); setLoading(false); });
    } else {
      unsub = getAssessmentsByTeacher(userId, data => { setAssessments(data); setLoading(false); });
    }
    return unsub;
  }, [isAdmin, userId]);

  const filtered = assessments.filter(a => {
    const matchType = a.type === activeTab;
    const matchSearch = !search ||
      a.title?.toLowerCase().includes(search.toLowerCase()) ||
      a.schoolClass?.toLowerCase().includes(search.toLowerCase()) ||
      a.subject?.toLowerCase().includes(search.toLowerCase());
    return matchType && matchSearch;
  });

  const handleDelete = async (item) => {
    if (!window.confirm(`Delete "${item.title}"? This cannot be undone.`)) return;
    try {
      await deleteAssessment(item.id);
      toast.success('Deleted');
    } catch {
      toast.error('Failed to delete');
    }
  };

  const handleEnterMarks = (item) => {
    navigate(`${ROUTES.ASSESSMENT_MARKS}/${item.id}`);
  };

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col">
      <TopBar title="Assessments" showBack>
        <button onClick={() => navigate(`${ROUTES.ASSESSMENT_CREATE}?type=${activeTab}`)}
          className="w-9 h-9 rounded-xl bg-indigo-600 flex items-center justify-center shadow-sm">
          <Plus size={18} className="text-white" />
        </button>
      </TopBar>

      {/* Type tabs */}
      <div className="flex gap-1 px-4 pt-3 overflow-x-auto">
        {TYPE_TABS.map(tab => {
          const cfg = ASSESSMENT_CONFIG[tab.key];
          const active = activeTab === tab.key;
          return (
            <button key={tab.key} onClick={() => setActiveTab(tab.key)}
              className={`flex-shrink-0 px-3 py-2 rounded-xl text-xs font-display font-semibold transition-all ${
                active ? 'text-white' : 'bg-white border border-gray-200 text-gray-500'
              }`}
              style={active ? { background: cfg.color } : {}}>
              {tab.label}
            </button>
          );
        })}
      </div>

      <div className="flex-1 overflow-y-auto px-4 pt-3 pb-28">
        <div className="relative mb-4">
          <Search size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
          <input className="field pl-9 !py-2.5 text-sm" placeholder="Search..."
            value={search} onChange={e => setSearch(e.target.value)} />
        </div>

        {loading ? (
          <div className="flex flex-col gap-3">
            {[1,2,3].map(i => <div key={i} className="h-24 rounded-2xl bg-gray-100 animate-pulse" />)}
          </div>
        ) : filtered.length === 0 ? (
          <div className="flex flex-col items-center gap-3 py-16 text-center">
            <div className="w-14 h-14 rounded-2xl bg-gray-100 flex items-center justify-center">
              <ClipboardList size={24} className="text-gray-300" />
            </div>
            <p className="text-gray-400 font-body">No {ASSESSMENT_CONFIG[activeTab]?.label.toLowerCase()} yet</p>
            <button onClick={() => navigate(`${ROUTES.ASSESSMENT_CREATE}?type=${activeTab}`)}
              className="flex items-center gap-1.5 text-indigo-500 text-sm font-display font-semibold">
              <Plus size={15} /> Create one now
            </button>
          </div>
        ) : (
          <div className="flex flex-col gap-3">
            {filtered.map(item => (
              <AssessmentCard key={item.id} item={item}
                onDelete={handleDelete} onEnterMarks={handleEnterMarks} />
            ))}
          </div>
        )}
      </div>
      <BottomNav userType={userType} />
    </div>
  );
}
