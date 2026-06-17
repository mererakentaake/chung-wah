// src/pages/syllabus/SyllabusView.jsx
// Parent / Student: read-only syllabus view with notifications
import React, { useState, useEffect } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import {
  BookOpen, CheckCircle, Circle, AlertTriangle,
  ChevronRight, Bell, ChevronDown, ChevronUp, Zap
} from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import {
  getSyllabusesByClass, getSyllabusNotifications,
  markSyllabusNotificationRead, checkAndFlagOverdueTopics,
  getParentGuardianLinks, adminGetStudents
} from '../../services/firestore';
import { USER_TYPES, SCHOOL_STRUCTURE } from '../../utils/constants';
import TopBar from '../../components/layout/TopBar';
import BottomNav from '../../components/layout/BottomNav';

const today = () => new Date().toISOString().slice(0, 10);

function topicStatus(topic) {
  if (topic.isCompleted) return 'complete';
  if (topic.dueDate && topic.dueDate < today()) return 'overdue';
  return 'upcoming';
}

function NotificationBanner({ notifications, onDismiss }) {
  const unread = notifications.filter(n => !n.read);
  if (!unread.length) return null;

  return (
    <div className="mb-4">
      <p className="text-gray-400 text-xs font-body font-semibold uppercase tracking-wider mb-2">
        Updates ({unread.length})
      </p>
      <div className="flex flex-col gap-2">
        {unread.slice(0, 3).map(n => {
          const colors = {
            topic_complete: { bg: 'bg-emerald-50 border-emerald-200', text: 'text-emerald-700', icon: CheckCircle, iconColor: 'text-emerald-500' },
            topic_overdue:  { bg: 'bg-red-50 border-red-200',     text: 'text-red-700',     icon: AlertTriangle, iconColor: 'text-red-500' },
            topic_ahead:    { bg: 'bg-blue-50 border-blue-200',    text: 'text-blue-700',    icon: Zap, iconColor: 'text-blue-500' },
          };
          const cfg = colors[n.type] || colors.topic_complete;
          const Icon = cfg.icon;
          return (
            <div key={n.id} className={`flex items-start gap-2.5 p-3 rounded-xl border ${cfg.bg}`}>
              <Icon size={15} className={`${cfg.iconColor} shrink-0 mt-0.5`} />
              <p className={`${cfg.text} text-xs font-body flex-1 leading-relaxed`}>{n.message}</p>
              <button onClick={() => onDismiss(n.id)}
                className="text-gray-300 text-xs font-body shrink-0 hover:text-gray-500">✕</button>
            </div>
          );
        })}
      </div>
    </div>
  );
}

function TopicCard({ topic, index }) {
  const [expanded, setExpanded] = useState(false);
  const status = topicStatus(topic);

  const statusStyles = {
    complete: { border: 'border-emerald-200', dot: 'bg-emerald-500', label: 'Completed', labelColor: 'text-emerald-600', icon: CheckCircle, iconColor: 'text-emerald-500' },
    overdue:  { border: 'border-red-200',     dot: 'bg-red-400',     label: 'Overdue',   labelColor: 'text-red-500',     icon: AlertTriangle, iconColor: 'text-red-400' },
    upcoming: { border: 'border-gray-100',    dot: 'bg-gray-200',    label: topic.dueDate ? `Due ${topic.dueDate}` : 'Upcoming', labelColor: 'text-gray-400', icon: Circle, iconColor: 'text-gray-300' },
  };
  const s = statusStyles[status];
  const Icon = s.icon;
  const hasDetails = topic.description || (topic.outcomes?.some(o => o.trim()));

  return (
    <div className={`bg-white rounded-2xl border shadow-sm overflow-hidden ${s.border}`}>
      <button className="w-full flex items-center gap-3 p-3.5 text-left"
        onClick={() => hasDetails && setExpanded(v => !v)}>
        <Icon size={20} className={s.iconColor + ' shrink-0'} />
        <div className="flex-1 min-w-0">
          <p className={`font-display font-semibold text-sm ${status === 'complete' ? 'text-gray-400 line-through' : 'text-gray-800'}`}>
            {index + 1}. {topic.title}
          </p>
          <p className={`text-xs font-body mt-0.5 ${s.labelColor}`}>{s.label}</p>
        </div>
        {hasDetails && (expanded
          ? <ChevronUp size={15} className="text-gray-300 shrink-0" />
          : <ChevronDown size={15} className="text-gray-300 shrink-0" />
        )}
      </button>

      {expanded && hasDetails && (
        <div className="px-4 pb-4 border-t border-gray-100 pt-3 flex flex-col gap-3">
          {topic.description && (
            <p className="text-gray-600 text-sm font-body leading-relaxed">{topic.description}</p>
          )}
          {topic.outcomes?.some(o => o.trim()) && (
            <div>
              <p className="text-gray-400 text-xs font-body font-semibold mb-2">Expected Outcomes</p>
              <ul className="flex flex-col gap-1">
                {topic.outcomes.filter(o => o.trim()).map((o, i) => (
                  <li key={i} className="flex items-start gap-2">
                    <span className="text-indigo-400 text-xs mt-0.5 shrink-0">•</span>
                    <p className="text-gray-600 text-sm font-body leading-relaxed">{o}</p>
                  </li>
                ))}
              </ul>
            </div>
          )}
          {topic.completedDate && (
            <p className="text-emerald-600 text-xs font-body">Completed on {topic.completedDate}</p>
          )}
        </div>
      )}
    </div>
  );
}

function SyllabusDetail({ syllabus }) {
  const [notifications, setNotifications] = useState([]);

  useEffect(() => {
    const unsub = getSyllabusNotifications(syllabus.schoolClass, setNotifications);
    checkAndFlagOverdueTopics(syllabus.id, syllabus.topics || [], syllabus.schoolClass, syllabus.subject).catch(() => {});
    return unsub;
  }, [syllabus.id, syllabus.schoolClass, syllabus.subject]);

  const topics = syllabus.topics || [];
  const completed = topics.filter(t => t.isCompleted).length;
  const pct = topics.length ? Math.round((completed / topics.length) * 100) : 0;
  const overdue = topics.filter(t => !t.isCompleted && t.dueDate && t.dueDate < today()).length;

  const relevantNotifs = notifications.filter(n => n.syllabusId === syllabus.id);

  return (
    <div>
      {/* Header card */}
      <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-4 mb-4">
        <p className="text-gray-400 text-xs font-body">{syllabus.schoolClass} · {syllabus.schoolYear}</p>
        <h2 className="font-display font-bold text-gray-900 text-xl mt-0.5 mb-2">{syllabus.subject}</h2>
        {syllabus.description && (
          <p className="text-gray-500 text-sm font-body leading-relaxed mb-3">{syllabus.description}</p>
        )}
        <div className="flex items-center justify-between mb-1.5">
          <p className="text-gray-400 text-xs font-body">{completed} of {topics.length} topics completed</p>
          <p className={`text-sm font-display font-bold ${pct === 100 ? 'text-emerald-600' : 'text-indigo-600'}`}>{pct}%</p>
        </div>
        <div className="w-full h-2 rounded-full bg-gray-100 overflow-hidden">
          <div className="h-full rounded-full transition-all"
            style={{ width: `${pct}%`, background: pct === 100 ? '#22c55e' : '#6366f1' }} />
        </div>
        {overdue > 0 && (
          <div className="flex items-center gap-1.5 mt-2">
            <AlertTriangle size={13} className="text-red-400" />
            <p className="text-red-500 text-xs font-body font-semibold">{overdue} topic{overdue > 1 ? 's' : ''} overdue</p>
          </div>
        )}
      </div>

      <NotificationBanner
        notifications={relevantNotifs}
        onDismiss={id => markSyllabusNotificationRead(id).catch(() => {})} />

      <p className="text-gray-400 text-xs font-body font-semibold uppercase tracking-wider mb-3">Topics</p>
      <div className="flex flex-col gap-3">
        {topics.map((topic, i) => (
          <TopicCard key={topic.id || i} topic={topic} index={i} />
        ))}
        {topics.length === 0 && (
          <div className="text-center py-8">
            <p className="text-gray-400 font-body text-sm">No topics added yet</p>
          </div>
        )}
      </div>
    </div>
  );
}

export default function SyllabusView() {
  const { userType, userId } = useAuth();
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();

  const isParent  = userType === USER_TYPES.PARENT;
  const isStudent = userType === USER_TYPES.STUDENT;

  // State for class/subject selection
  const [selectedClass, setSelectedClass]     = useState(searchParams.get('class') || '');
  const [syllabuses, setSyllabuses]           = useState([]);
  const [selectedSubject, setSelectedSubject] = useState(null);
  const [loading, setLoading]                 = useState(false);
  const [children, setChildren]               = useState([]);
  const [selectedChild, setSelectedChild]     = useState(null);
  const [studentClass, setStudentClass]       = useState('');
  const [profile, setProfile]                 = useState(null);

  // For student: get their own class from session
  useEffect(() => {
    if (!isStudent) return;
    const sc = localStorage.getItem('studentClass') || '';
    if (sc) { setStudentClass(sc); setSelectedClass(sc); }
  }, [isStudent]);

  // For parent: load confirmed children
  useEffect(() => {
    if (!isParent || !userId) return;
    const unsub = getParentGuardianLinks(userId, async links => {
      const confirmed = links.filter(l => l.status === 'confirmed');
      if (confirmed.length) {
        try {
          const all = await adminGetStudents();
          const mapped = confirmed.map(l => {
            const data = all.find(s => s.id === l.studentDocId);
            return { id: l.studentDocId, name: l.studentName, schoolClass: data?.schoolClass || '' };
          }).filter(c => c.id);
          setChildren(mapped);
          if (mapped.length) {
            const first = mapped[0];
            setSelectedChild(first);
            setSelectedClass(first.schoolClass);
          }
        } catch {}
      }
    });
    return unsub;
  }, [isParent, userId]);

  // Load syllabuses when class changes
  useEffect(() => {
    if (!selectedClass) return;
    setLoading(true);
    setSelectedSubject(null);
    const unsub = getSyllabusesByClass(selectedClass, data => {
      setSyllabuses(data);
      setLoading(false);
    });
    return unsub;
  }, [selectedClass]);

  const title = selectedSubject ? selectedSubject.subject : 'Curriculum';

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col">
      <TopBar title={title} showBack={!!selectedSubject} onBack={selectedSubject ? () => setSelectedSubject(null) : undefined} />

      {/* Child selector for parents */}
      {isParent && children.length > 1 && !selectedSubject && (
        <div className="flex gap-2 px-4 pt-3 overflow-x-auto">
          {children.map(c => (
            <button key={c.id} onClick={() => { setSelectedChild(c); setSelectedClass(c.schoolClass); }}
              className={`px-3 py-1.5 rounded-xl text-xs font-display font-semibold whitespace-nowrap transition-all ${
                selectedChild?.id === c.id
                  ? 'bg-indigo-500 text-white'
                  : 'bg-white border border-gray-200 text-gray-500'
              }`}>
              {c.name}
            </button>
          ))}
        </div>
      )}

      <div className="flex-1 overflow-y-auto px-4 pt-4 pb-28">
        {!selectedSubject ? (
          <>
            {/* Subject list */}
            {selectedClass && (
              <p className="text-gray-400 text-xs font-body mb-3">
                {isParent ? `${selectedChild?.name || ''} · ` : ''}{selectedClass}
              </p>
            )}
            {loading ? (
              <div className="flex flex-col gap-3">
                {[1,2,3].map(i => <div key={i} className="h-20 rounded-2xl bg-gray-100 animate-pulse" />)}
              </div>
            ) : syllabuses.length === 0 ? (
              <div className="flex flex-col items-center gap-3 py-20 text-center">
                <div className="w-14 h-14 rounded-2xl bg-gray-100 flex items-center justify-center">
                  <BookOpen size={24} className="text-gray-300" />
                </div>
                <p className="text-gray-400 font-body">No syllabus available yet</p>
                <p className="text-gray-300 text-sm font-body">The teacher hasn't added the curriculum yet</p>
              </div>
            ) : (
              <div className="flex flex-col gap-3">
                {syllabuses.map(s => {
                  const topics = s.topics || [];
                  const done = topics.filter(t => t.isCompleted).length;
                  const pct  = topics.length ? Math.round((done / topics.length) * 100) : 0;
                  const overdue = topics.filter(t => !t.isCompleted && t.dueDate && t.dueDate < today()).length;
                  return (
                    <button key={s.id} onClick={() => setSelectedSubject(s)}
                      className="w-full p-4 bg-white rounded-2xl border border-gray-100 shadow-sm hover:shadow-md active:scale-[0.99] transition-all text-left">
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-xl bg-indigo-50 flex items-center justify-center shrink-0">
                          <BookOpen size={18} className="text-indigo-600" />
                        </div>
                        <div className="flex-1 min-w-0">
                          <p className="font-display font-semibold text-gray-800">{s.subject}</p>
                          <p className="text-gray-400 text-xs font-body">{done}/{topics.length} topics done</p>
                          {overdue > 0 && (
                            <p className="text-red-400 text-xs font-body font-semibold">{overdue} overdue</p>
                          )}
                        </div>
                        <div className="text-right shrink-0 mr-1">
                          <p className="font-display font-bold text-indigo-600">{pct}%</p>
                        </div>
                        <ChevronRight size={15} className="text-gray-300 shrink-0" />
                      </div>
                      <div className="mt-2.5 w-full h-1.5 rounded-full bg-gray-100 overflow-hidden">
                        <div className="h-full rounded-full bg-indigo-500 transition-all"
                          style={{ width: `${pct}%` }} />
                      </div>
                    </button>
                  );
                })}
              </div>
            )}
          </>
        ) : (
          <SyllabusDetail syllabus={selectedSubject} />
        )}
      </div>
      <BottomNav userType={userType} />
    </div>
  );
}
