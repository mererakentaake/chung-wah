// src/pages/assessment/ReportCard.jsx
// View or generate a final year report card
import React, { useState, useEffect } from 'react';
import { useSearchParams } from 'react-router-dom';
import { Award, ChevronDown, ChevronUp, BarChart3, GraduationCap } from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import {
  generateReportCard, getParentGuardianLinks, adminGetStudents,
  getAssessmentsByClass
} from '../../services/firestore';
import {
  USER_TYPES, SCHOOL_STRUCTURE, isSecondaryClass
} from '../../utils/constants';
import TopBar from '../../components/layout/TopBar';
import BottomNav from '../../components/layout/BottomNav';

const GRADE_COLORS = {
  A: 'text-emerald-600 bg-emerald-50',
  B: 'text-blue-600 bg-blue-50',
  C: 'text-yellow-600 bg-yellow-50',
  D: 'text-orange-500 bg-orange-50',
  E: 'text-red-400 bg-red-50',
  F: 'text-red-600 bg-red-100',
};

function positionSuffix(n) {
  if (!n) return '—';
  const s = ['th', 'st', 'nd', 'rd'];
  const v = n % 100;
  return n + (s[(v - 20) % 10] || s[v] || s[0]);
}

function StudentReportCard({ studentData, isSecondary, totalStudents }) {
  const [expanded, setExpanded] = useState(true);
  if (!studentData) return null;
  const { studentName, subjectGrades, positionOverall, subjectPositions } = studentData;

  return (
    <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
      <button className="w-full flex items-center gap-3 p-4 text-left"
        onClick={() => setExpanded(v => !v)}>
        <div className="w-10 h-10 rounded-xl bg-purple-50 flex items-center justify-center shrink-0">
          <GraduationCap size={18} className="text-purple-600" />
        </div>
        <div className="flex-1 min-w-0">
          <p className="font-display font-semibold text-gray-800">{studentName}</p>
          <p className="text-gray-400 text-xs font-body">
            Overall Position: <span className="font-semibold text-purple-600">{positionSuffix(positionOverall)}</span>
            {totalStudents ? ` / ${totalStudents}` : ''}
          </p>
        </div>
        {expanded ? <ChevronUp size={15} className="text-gray-300" /> : <ChevronDown size={15} className="text-gray-300" />}
      </button>

      {expanded && (
        <div className="border-t border-gray-100">
          <table className="w-full">
            <thead>
              <tr className="bg-gray-50">
                <th className="text-left py-2 px-4 text-gray-400 text-xs font-body font-semibold">Subject</th>
                <th className="text-center py-2 px-2 text-gray-400 text-xs font-body font-semibold">Grade</th>
                {isSecondary && <th className="text-center py-2 px-2 text-gray-400 text-xs font-body font-semibold">Rank</th>}
              </tr>
            </thead>
            <tbody>
              {subjectGrades.map((sg, i) => {
                const gc = GRADE_COLORS[sg.grade] || 'text-gray-600 bg-gray-50';
                const subjectPos = subjectPositions?.[sg.subject];
                return (
                  <tr key={i} className="border-t border-gray-50">
                    <td className="py-2.5 px-4 text-gray-700 text-sm font-body">{sg.subject}</td>
                    <td className="py-2.5 px-2 text-center">
                      <span className={`inline-block w-8 h-8 rounded-lg flex items-center justify-center font-display font-bold text-sm ${gc}`}>
                        {sg.grade || '—'}
                      </span>
                    </td>
                    {isSecondary && (
                      <td className="py-2.5 px-2 text-center text-gray-500 text-xs font-body">
                        {positionSuffix(subjectPos)}
                      </td>
                    )}
                  </tr>
                );
              })}
            </tbody>
          </table>
          <div className="px-4 py-3 bg-purple-50 border-t border-gray-100">
            <p className="text-purple-600 text-sm font-display font-bold">
              Overall Position: {positionSuffix(positionOverall)}
              {totalStudents ? ` out of ${totalStudents} students` : ''}
            </p>
          </div>
        </div>
      )}
    </div>
  );
}

export default function ReportCard() {
  const { userType, userId } = useAuth();
  const [searchParams] = useSearchParams();
  const isParent  = userType === USER_TYPES.PARENT;
  const isStudent = userType === USER_TYPES.STUDENT;
  const isAdmin   = userType === USER_TYPES.ADMIN;

  const [schoolClass, setSchoolClass]     = useState(searchParams.get('class') || '');
  const [schoolYear, setSchoolYear]       = useState(new Date().getFullYear().toString());
  const [reportCard, setReportCard]       = useState(null);
  const [loading, setLoading]             = useState(false);
  const [generating, setGenerating]       = useState(false);
  const [children, setChildren]           = useState([]);
  const [selectedChild, setSelectedChild] = useState(null);
  const [studentId, setStudentId]         = useState(userId);

  const secondary = isSecondaryClass(schoolClass);

  // Parent: load confirmed children
  useEffect(() => {
    if (!isParent || !userId) return;
    const unsub = getParentGuardianLinks(userId, async links => {
      const confirmed = links.filter(l => l.status === 'confirmed');
      if (confirmed.length) {
        const all = await adminGetStudents().catch(() => []);
        const mapped = confirmed.map(l => {
          const data = all.find(s => s.id === l.studentDocId);
          return { id: l.studentDocId, name: l.studentName, schoolClass: data?.schoolClass || '' };
        }).filter(c => c.id);
        setChildren(mapped);
        if (mapped.length) {
          setSelectedChild(mapped[0]);
          setSchoolClass(mapped[0].schoolClass);
          setStudentId(mapped[0].id);
        }
      }
    });
    return unsub;
  }, [isParent, userId]);

  // Student: get class
  useEffect(() => {
    if (!isStudent) return;
    const sc = localStorage.getItem('studentClass') || '';
    setSchoolClass(sc);
    setStudentId(userId);
  }, [isStudent, userId]);

  const generate = async () => {
    if (!schoolClass) return;
    setGenerating(true);
    try {
      const data = await generateReportCard(schoolClass, schoolYear);
      setReportCard(data);
    } catch (err) {
      console.error(err);
    } finally {
      setGenerating(false);
    }
  };

  // Auto-generate when class is set for students/parents
  useEffect(() => {
    if (schoolClass && (isStudent || isParent)) generate();
  }, [schoolClass]);

  const myData = reportCard?.students?.find(s => s.studentId === studentId);

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col">
      <TopBar title="Report Card" showBack />

      {/* Child selector for parents */}
      {isParent && children.length > 1 && (
        <div className="flex gap-2 px-4 pt-3 overflow-x-auto">
          {children.map(c => (
            <button key={c.id}
              onClick={() => { setSelectedChild(c); setSchoolClass(c.schoolClass); setStudentId(c.id); }}
              className={`px-3 py-1.5 rounded-xl text-xs font-display font-semibold whitespace-nowrap transition-all ${
                selectedChild?.id === c.id ? 'bg-purple-500 text-white' : 'bg-white border border-gray-200 text-gray-500'
              }`}>
              {c.name}
            </button>
          ))}
        </div>
      )}

      <div className="flex-1 overflow-y-auto px-4 pt-4 pb-28">
        {/* Admin class selector */}
        {isAdmin && (
          <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-4 mb-4 flex flex-col gap-3">
            <div>
              <label className="text-gray-500 text-xs font-body mb-1.5 block">Class</label>
              <select className="field" value={schoolClass} onChange={e => setSchoolClass(e.target.value)}>
                <option value="">Select class...</option>
                {Object.values(SCHOOL_STRUCTURE).map(s => (
                  <optgroup key={s.label} label={s.label}>
                    {s.classes.map(cls => <option key={cls} value={cls}>{cls}</option>)}
                  </optgroup>
                ))}
              </select>
            </div>
            <div>
              <label className="text-gray-500 text-xs font-body mb-1.5 block">School Year</label>
              <input className="field" value={schoolYear} onChange={e => setSchoolYear(e.target.value)} />
            </div>
            <button onClick={generate} disabled={!schoolClass || generating}
              className="w-full h-11 rounded-xl font-display font-bold text-white flex items-center justify-center gap-2 disabled:opacity-50"
              style={{ background: 'linear-gradient(135deg, #a855f7, #7c3aed)' }}>
              {generating
                ? <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                : <><BarChart3 size={16} /> Generate Report Card</>}
            </button>
          </div>
        )}

        {generating && (
          <div className="flex flex-col gap-3 mt-2">
            {[1,2,3].map(i => <div key={i} className="h-24 rounded-2xl bg-gray-100 animate-pulse" />)}
          </div>
        )}

        {!generating && !reportCard && schoolClass && (
          <div className="flex flex-col items-center gap-3 py-20 text-center">
            <Award size={32} className="text-gray-300" />
            <p className="text-gray-400 font-body">No final year exam data found</p>
            <p className="text-gray-300 text-sm font-body">
              Report cards are generated once the teacher enters all final year exam grades
            </p>
          </div>
        )}

        {reportCard && (
          <>
            {/* Header */}
            <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-4 mb-4 text-center">
              <div className="w-12 h-12 rounded-2xl bg-purple-100 flex items-center justify-center mx-auto mb-2">
                <Award size={22} className="text-purple-600" />
              </div>
              <h2 className="font-display font-bold text-gray-900 text-lg">
                {reportCard.schoolClass} — Final Year Report
              </h2>
              <p className="text-gray-400 text-sm font-body">{reportCard.schoolYear}</p>
              <p className="text-gray-300 text-xs font-body mt-1">
                {reportCard.totalStudents} students · {reportCard.exams?.length || 0} subjects
              </p>
            </div>

            {/* For student/parent: show only their card */}
            {(isStudent || isParent) && myData && (
              <StudentReportCard
                studentData={myData}
                isSecondary={secondary}
                totalStudents={reportCard.totalStudents}
              />
            )}
            {(isStudent || isParent) && !myData && (
              <div className="text-center py-12">
                <p className="text-gray-400 font-body">Your report card is not yet available</p>
              </div>
            )}

            {/* For admin: show all students */}
            {isAdmin && (
              <div className="flex flex-col gap-4">
                {reportCard.students?.map(s => (
                  <StudentReportCard
                    key={s.studentId}
                    studentData={s}
                    isSecondary={secondary}
                    totalStudents={reportCard.totalStudents}
                  />
                ))}
              </div>
            )}
          </>
        )}
      </div>
      <BottomNav userType={userType} />
    </div>
  );
}
