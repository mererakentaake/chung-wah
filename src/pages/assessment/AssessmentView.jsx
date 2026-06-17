// src/pages/assessment/AssessmentView.jsx
// Student/Parent: view assessments and marks
import React, { useState, useEffect } from 'react';
import {
  BookOpen, ClipboardList, FileText, GraduationCap,
  CheckCircle, Clock, ChevronDown, ChevronUp, MessageCircle, Send, X
} from 'lucide-react';
import toast from 'react-hot-toast';
import { useAuth } from '../../context/AuthContext';
import {
  getAssessmentsByClass, getParentGuardianLinks, adminGetStudents,
  getAssessmentNotifications, sendHomeworkEnquiry,
  getHomeworkEnquiries, replyToHomeworkEnquiry
} from '../../services/firestore';
import {
  USER_TYPES, ASSESSMENT_TYPES, ASSESSMENT_CONFIG, ROUTES
} from '../../utils/constants';
import TopBar from '../../components/layout/TopBar';
import BottomNav from '../../components/layout/BottomNav';

const TYPE_TABS = [
  { key: 'all',                         label: 'All'         },
  { key: ASSESSMENT_TYPES.HOMEWORK,     label: 'Homework'    },
  { key: ASSESSMENT_TYPES.UNIT_TEST,    label: 'Tests'       },
  { key: ASSESSMENT_TYPES.ASSIGNMENT,   label: 'Assignments' },
  { key: ASSESSMENT_TYPES.EXAM,         label: 'Exams'       },
];

function ScoreBadge({ assessment, studentId }) {
  const m = assessment.studentMarks?.[studentId];
  if (!m && !assessment.isMarked) return (
    <span className="text-xs font-body text-gray-400 bg-gray-100 px-2 py-0.5 rounded-full">Pending</span>
  );
  if (!m) return (
    <span className="text-xs font-body text-gray-300 bg-gray-50 px-2 py-0.5 rounded-full">—</span>
  );

  const type = assessment.type;
  if (type === ASSESSMENT_TYPES.HOMEWORK || type === ASSESSMENT_TYPES.UNIT_TEST) {
    return (
      <span className="text-sm font-display font-bold text-indigo-600">
        {m.marksAwarded} <span className="text-gray-300 font-normal text-xs">/ {assessment.totalMarks}</span>
      </span>
    );
  }
  if (type === ASSESSMENT_TYPES.ASSIGNMENT) {
    return (
      <span className="text-sm font-display font-bold text-emerald-600">{m.percentage}%</span>
    );
  }
  if (type === ASSESSMENT_TYPES.EXAM) {
    const gradeColors = { A: 'text-emerald-600', B: 'text-blue-600', C: 'text-yellow-600', D: 'text-orange-500', E: 'text-red-400', F: 'text-red-600' };
    return (
      <div className="text-right">
        <span className={`text-xl font-display font-bold ${gradeColors[m.grade] || 'text-gray-600'}`}>{m.grade}</span>
        {m.positionOverall && (
          <p className="text-gray-400 text-[10px] font-body">#{m.positionOverall}</p>
        )}
      </div>
    );
  }
  return null;
}

function EnquiryModal({ assessment, studentId, studentName, onClose }) {
  const [message, setMessage] = useState('');
  const [enquiries, setEnquiries] = useState([]);
  const [sending, setSending] = useState(false);

  useEffect(() => {
    const unsub = getHomeworkEnquiries(assessment.id, setEnquiries);
    return unsub;
  }, [assessment.id]);

  const myEnquiries = enquiries.filter(e => e.parentId === studentId);

  const handleSend = async () => {
    if (!message.trim()) return;
    setSending(true);
    try {
      await sendHomeworkEnquiry({
        assessmentId: assessment.id,
        assessmentTitle: assessment.title,
        subject: assessment.subject,
        schoolClass: assessment.schoolClass,
        studentName,
        message: message.trim(),
      });
      setMessage('');
      toast.success('Enquiry sent to teacher');
    } catch {
      toast.error('Failed to send');
    } finally {
      setSending(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 bg-black/60 flex items-end">
      <div className="w-full bg-white rounded-t-3xl p-5 max-h-[75vh] flex flex-col">
        <div className="flex items-center justify-between mb-4">
          <h3 className="font-display font-bold text-gray-800">Homework Enquiry</h3>
          <button onClick={onClose} className="w-8 h-8 rounded-xl bg-gray-100 flex items-center justify-center">
            <X size={15} className="text-gray-500" />
          </button>
        </div>
        <p className="text-gray-500 text-xs font-body mb-3">{assessment.title} · {assessment.subject}</p>

        {/* Previous enquiries */}
        <div className="flex-1 overflow-y-auto mb-4 flex flex-col gap-3">
          {myEnquiries.length === 0 && (
            <p className="text-gray-400 text-sm font-body text-center py-4">No enquiries yet</p>
          )}
          {myEnquiries.map(e => (
            <div key={e.id} className="flex flex-col gap-2">
              <div className="bg-indigo-50 rounded-2xl rounded-br-sm p-3 self-end max-w-[85%]">
                <p className="text-indigo-800 text-sm font-body">{e.message}</p>
              </div>
              {e.reply && (
                <div className="bg-gray-100 rounded-2xl rounded-bl-sm p-3 self-start max-w-[85%]">
                  <p className="text-gray-500 text-[10px] font-body mb-1">Teacher's reply</p>
                  <p className="text-gray-700 text-sm font-body">{e.reply}</p>
                </div>
              )}
            </div>
          ))}
        </div>

        {/* Send new enquiry */}
        <div className="flex gap-2">
          <input className="field flex-1 !py-2.5 text-sm" placeholder="Ask the teacher about this homework..."
            value={message} onChange={e => setMessage(e.target.value)}
            onKeyDown={e => e.key === 'Enter' && handleSend()} />
          <button onClick={handleSend} disabled={sending || !message.trim()}
            className="w-10 h-10 rounded-xl bg-indigo-600 flex items-center justify-center disabled:opacity-50 shrink-0">
            <Send size={16} className="text-white" />
          </button>
        </div>
      </div>
    </div>
  );
}

function AssessmentCard({ item, studentId, studentName }) {
  const [expanded, setExpanded] = useState(false);
  const [showEnquiry, setShowEnquiry] = useState(false);
  const cfg = ASSESSMENT_CONFIG[item.type] || ASSESSMENT_CONFIG.homework;
  const date = item.dueDate || item.testDate || '';
  const mark = item.studentMarks?.[studentId];
  const isHomework = item.type === ASSESSMENT_TYPES.HOMEWORK;

  return (
    <>
      <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
        <button className="w-full flex items-start gap-3 p-4 text-left"
          onClick={() => setExpanded(v => !v)}>
          <div className="w-9 h-9 rounded-xl flex items-center justify-center shrink-0 mt-0.5"
            style={{ background: cfg.color + '15' }}>
            <ClipboardList size={16} style={{ color: cfg.color }} />
          </div>
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2 mb-0.5">
              <span className="text-[10px] font-body font-semibold px-1.5 py-0.5 rounded-full"
                style={{ background: cfg.color + '18', color: cfg.color }}>
                {cfg.label}
              </span>
              {item.term && <span className="text-[10px] font-body text-gray-300">{item.term}</span>}
            </div>
            <p className="font-display font-semibold text-gray-800 text-sm">{item.title}</p>
            <p className="text-gray-400 text-xs font-body">{item.subject}</p>
            {date && <p className="text-gray-300 text-[10px] font-body mt-0.5">{isHomework ? 'Due' : 'Date'}: {date}</p>}
          </div>
          <div className="flex flex-col items-end gap-2 shrink-0">
            <ScoreBadge assessment={item} studentId={studentId} />
            {expanded ? <ChevronUp size={14} className="text-gray-300" /> : <ChevronDown size={14} className="text-gray-300" />}
          </div>
        </button>

        {expanded && (
          <div className="px-4 pb-4 border-t border-gray-100 pt-3 flex flex-col gap-3">
            {item.description && (
              <div>
                <p className="text-gray-400 text-xs font-body font-semibold mb-1">
                  {isHomework ? 'Homework Content' : 'Description'}
                </p>
                <p className="text-gray-600 text-sm font-body leading-relaxed whitespace-pre-wrap">
                  {item.description}
                </p>
              </div>
            )}
            {mark?.feedback && (
              <div className="p-3 rounded-xl bg-blue-50">
                <p className="text-blue-500 text-xs font-body font-semibold mb-0.5">Teacher Feedback</p>
                <p className="text-blue-700 text-sm font-body">{mark.feedback}</p>
              </div>
            )}
            {isHomework && mark && (
              <button onClick={() => setShowEnquiry(true)}
                className="flex items-center gap-1.5 text-indigo-500 text-xs font-display font-semibold">
                <MessageCircle size={14} /> Enquire about marked paper
              </button>
            )}
          </div>
        )}
      </div>

      {showEnquiry && (
        <EnquiryModal
          assessment={item}
          studentId={studentId}
          studentName={studentName}
          onClose={() => setShowEnquiry(false)}
        />
      )}
    </>
  );
}

export default function AssessmentView() {
  const { userType, userId } = useAuth();
  const isParent  = userType === USER_TYPES.PARENT;
  const isStudent = userType === USER_TYPES.STUDENT;

  const [activeTab, setActiveTab]       = useState('all');
  const [assessments, setAssessments]   = useState([]);
  const [loading, setLoading]           = useState(true);
  const [children, setChildren]         = useState([]);
  const [selectedChild, setSelectedChild] = useState(null);
  const [schoolClass, setSchoolClass]   = useState('');
  const [studentName, setStudentName]   = useState('');

  // Student: get their class from profile
  useEffect(() => {
    if (!isStudent) return;
    const sc = localStorage.getItem('studentClass') || '';
    setSchoolClass(sc);
    setSelectedChild({ id: userId });
  }, [isStudent, userId]);

  // Parent: load confirmed children
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
            setSelectedChild(mapped[0]);
            setSchoolClass(mapped[0].schoolClass);
            setStudentName(mapped[0].name);
          }
        } catch {}
      }
    });
    return unsub;
  }, [isParent, userId]);

  // Load assessments for selected class
  useEffect(() => {
    if (!schoolClass) return;
    setLoading(true);
    const unsub = getAssessmentsByClass(schoolClass, data => {
      setAssessments(data);
      setLoading(false);
    });
    return unsub;
  }, [schoolClass]);

  const studentId = selectedChild?.id || userId;

  const filtered = assessments.filter(a => {
    if (activeTab === 'all') return true;
    return a.type === activeTab;
  });

  // Summary stats
  const markedItems = assessments.filter(a => a.studentMarks?.[studentId]);
  const homeworkCount = assessments.filter(a => a.type === ASSESSMENT_TYPES.HOMEWORK).length;
  const avgMarks = (() => {
    const numericMarked = markedItems.filter(a =>
      (a.type === ASSESSMENT_TYPES.HOMEWORK || a.type === ASSESSMENT_TYPES.UNIT_TEST) &&
      a.studentMarks?.[studentId]?.marksAwarded !== undefined
    );
    if (!numericMarked.length) return null;
    const avg = numericMarked.reduce((s, a) => {
      const m = a.studentMarks[studentId];
      return s + (m.marksAwarded / a.totalMarks) * 100;
    }, 0) / numericMarked.length;
    return Math.round(avg);
  })();

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col">
      <TopBar title="Assessments" showBack />

      {/* Child selector for parents */}
      {isParent && children.length > 1 && (
        <div className="flex gap-2 px-4 pt-3 overflow-x-auto">
          {children.map(c => (
            <button key={c.id}
              onClick={() => { setSelectedChild(c); setSchoolClass(c.schoolClass); setStudentName(c.name); }}
              className={`px-3 py-1.5 rounded-xl text-xs font-display font-semibold whitespace-nowrap transition-all ${
                selectedChild?.id === c.id ? 'bg-indigo-500 text-white' : 'bg-white border border-gray-200 text-gray-500'
              }`}>
              {c.name}
            </button>
          ))}
        </div>
      )}

      {/* Summary */}
      {!loading && markedItems.length > 0 && (
        <div className="flex gap-3 px-4 pt-3">
          <div className="flex-1 bg-white rounded-2xl border border-gray-100 shadow-sm p-3 text-center">
            <p className="font-display font-bold text-indigo-600 text-xl">{assessments.length}</p>
            <p className="text-gray-400 text-[10px] font-body">Total</p>
          </div>
          <div className="flex-1 bg-white rounded-2xl border border-gray-100 shadow-sm p-3 text-center">
            <p className="font-display font-bold text-emerald-600 text-xl">{markedItems.length}</p>
            <p className="text-gray-400 text-[10px] font-body">Marked</p>
          </div>
          {avgMarks !== null && (
            <div className="flex-1 bg-white rounded-2xl border border-gray-100 shadow-sm p-3 text-center">
              <p className="font-display font-bold text-amber-500 text-xl">{avgMarks}%</p>
              <p className="text-gray-400 text-[10px] font-body">Avg Score</p>
            </div>
          )}
        </div>
      )}

      {/* Type tabs */}
      <div className="flex gap-1 px-4 pt-3 overflow-x-auto">
        {TYPE_TABS.map(tab => (
          <button key={tab.key} onClick={() => setActiveTab(tab.key)}
            className={`flex-shrink-0 px-3 py-2 rounded-xl text-xs font-display font-semibold transition-all ${
              activeTab === tab.key ? 'bg-indigo-600 text-white' : 'bg-white border border-gray-200 text-gray-500'
            }`}>
            {tab.label}
          </button>
        ))}
      </div>

      <div className="flex-1 overflow-y-auto px-4 pt-3 pb-28">
        {loading ? (
          <div className="flex flex-col gap-3">
            {[1,2,3,4].map(i => <div key={i} className="h-20 rounded-2xl bg-gray-100 animate-pulse" />)}
          </div>
        ) : filtered.length === 0 ? (
          <div className="flex flex-col items-center gap-3 py-16 text-center">
            <ClipboardList size={32} className="text-gray-300" />
            <p className="text-gray-400 font-body">No assessments yet</p>
          </div>
        ) : (
          <div className="flex flex-col gap-3">
            {filtered.map(item => (
              <AssessmentCard key={item.id} item={item}
                studentId={studentId}
                studentName={studentName || 'Student'} />
            ))}
          </div>
        )}
      </div>
      <BottomNav userType={userType} />
    </div>
  );
}
