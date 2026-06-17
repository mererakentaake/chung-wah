// src/pages/syllabus/SyllabusManager.jsx
// Teacher / Admin: view and manage all syllabuses
import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { BookOpen, Plus, ChevronRight, Search, GraduationCap, CheckCircle } from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import { getAllSyllabuses, getSyllabusByTeacher } from '../../services/firestore';
import { ROUTES, USER_TYPES, SCHOOL_STRUCTURE, ALL_CLASSES } from '../../utils/constants';
import TopBar from '../../components/layout/TopBar';
import BottomNav from '../../components/layout/BottomNav';

function progress(syllabus) {
  const topics = syllabus.topics || [];
  if (!topics.length) return { done: 0, total: 0, pct: 0 };
  const done = topics.filter(t => t.isCompleted).length;
  return { done, total: topics.length, pct: Math.round((done / topics.length) * 100) };
}

function SyllabusCard({ syllabus, onPress }) {
  const { done, total, pct } = progress(syllabus);
  const today = new Date().toISOString().slice(0, 10);
  const overdueCount = (syllabus.topics || []).filter(t => !t.isCompleted && t.dueDate && t.dueDate < today).length;

  return (
    <button onClick={onPress}
      className="w-full p-4 bg-white rounded-2xl border border-gray-100 shadow-sm hover:shadow-md active:scale-[0.99] transition-all text-left">
      <div className="flex items-start gap-3">
        <div className="w-10 h-10 rounded-xl bg-indigo-50 flex items-center justify-center shrink-0">
          <BookOpen size={18} className="text-indigo-600" />
        </div>
        <div className="flex-1 min-w-0">
          <p className="font-display font-semibold text-gray-800 truncate">{syllabus.subject}</p>
          <p className="text-gray-400 text-xs font-body">{syllabus.schoolClass} · {syllabus.schoolYear}</p>
          {overdueCount > 0 && (
            <p className="text-red-500 text-xs font-body font-semibold mt-0.5">
              {overdueCount} topic{overdueCount > 1 ? 's' : ''} overdue
            </p>
          )}
        </div>
        <div className="text-right shrink-0">
          <p className="text-gray-700 font-display font-bold text-sm">{pct}%</p>
          <p className="text-gray-300 text-xs font-body">{done}/{total} topics</p>
        </div>
        <ChevronRight size={15} className="text-gray-300 shrink-0 mt-1" />
      </div>
      {total > 0 && (
        <div className="mt-3 w-full h-1.5 rounded-full bg-gray-100 overflow-hidden">
          <div className="h-full rounded-full bg-indigo-500 transition-all"
            style={{ width: `${pct}%` }} />
        </div>
      )}
    </button>
  );
}

export default function SyllabusManager() {
  const { userType, userId } = useAuth();
  const navigate = useNavigate();
  const [syllabuses, setSyllabuses] = useState([]);
  const [loading, setLoading]       = useState(true);
  const [search, setSearch]         = useState('');
  const [classFilter, setClassFilter] = useState('');

  const isAdmin = userType === USER_TYPES.ADMIN;

  useEffect(() => {
    let unsub;
    if (isAdmin) {
      unsub = getAllSyllabuses(data => { setSyllabuses(data); setLoading(false); });
    } else {
      unsub = getSyllabusByTeacher(userId, data => { setSyllabuses(data); setLoading(false); });
    }
    return unsub;
  }, [isAdmin, userId]);

  const filtered = syllabuses.filter(s => {
    const matchSearch = !search ||
      s.subject?.toLowerCase().includes(search.toLowerCase()) ||
      s.schoolClass?.toLowerCase().includes(search.toLowerCase());
    const matchClass = !classFilter || s.schoolClass === classFilter;
    return matchSearch && matchClass;
  });

  // Group by class
  const grouped = filtered.reduce((acc, s) => {
    const key = s.schoolClass || 'Unknown';
    if (!acc[key]) acc[key] = [];
    acc[key].push(s);
    return acc;
  }, {});

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col">
      <TopBar title="Curriculum Syllabuses" showBack>
        <button onClick={() => navigate(ROUTES.SYLLABUS_CREATE)}
          className="w-9 h-9 rounded-xl bg-indigo-600 flex items-center justify-center shadow-sm">
          <Plus size={18} className="text-white" />
        </button>
      </TopBar>

      <div className="flex-1 overflow-y-auto px-4 pt-4 pb-28">
        {/* Search */}
        <div className="relative mb-3">
          <Search size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
          <input className="field pl-9 !py-2.5 text-sm" placeholder="Search by subject or class..."
            value={search} onChange={e => setSearch(e.target.value)} />
        </div>

        {/* Class filter */}
        <div className="mb-4">
          <select className="field text-sm" value={classFilter} onChange={e => setClassFilter(e.target.value)}>
            <option value="">All classes</option>
            {Object.values(SCHOOL_STRUCTURE).map(section => (
              <optgroup key={section.label} label={section.label}>
                {section.classes.map(cls => (
                  <option key={cls} value={cls}>{cls}</option>
                ))}
              </optgroup>
            ))}
          </select>
        </div>

        {loading ? (
          <div className="flex flex-col gap-3">
            {[1,2,3].map(i => <div key={i} className="h-20 rounded-2xl bg-gray-100 animate-pulse" />)}
          </div>
        ) : filtered.length === 0 ? (
          <div className="flex flex-col items-center gap-3 py-16 text-center">
            <div className="w-14 h-14 rounded-2xl bg-gray-100 flex items-center justify-center">
              <BookOpen size={24} className="text-gray-300" />
            </div>
            <p className="text-gray-400 font-body">No syllabuses found</p>
            <p className="text-gray-300 text-sm font-body">Tap + to create your first syllabus</p>
          </div>
        ) : (
          <div className="flex flex-col gap-6">
            {Object.entries(grouped).sort(([a], [b]) => ALL_CLASSES.indexOf(a) - ALL_CLASSES.indexOf(b)).map(([cls, items]) => (
              <div key={cls}>
                <p className="text-gray-400 text-xs font-body font-semibold uppercase tracking-wider mb-2">{cls}</p>
                <div className="flex flex-col gap-3">
                  {items.map(s => (
                    <SyllabusCard key={s.id} syllabus={s}
                      onPress={() => navigate(`${ROUTES.SYLLABUS_EDIT}/${s.id}`)} />
                  ))}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
      <BottomNav userType={userType} />
    </div>
  );
}
