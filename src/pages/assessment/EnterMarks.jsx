// src/pages/assessment/EnterMarks.jsx
// Teacher: enter marks/grades for each student in a class
import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { Save, CheckCircle } from 'lucide-react';
import toast from 'react-hot-toast';
import { getAllAssessments, saveAssessmentMarks, adminGetStudents } from '../../services/firestore';
import { ROUTES, ASSESSMENT_TYPES, EXAM_TYPES, GRADE_OPTIONS } from '../../utils/constants';
import TopBar from '../../components/layout/TopBar';
import BottomNav from '../../components/layout/BottomNav';
import { useAuth } from '../../context/AuthContext';

export default function EnterMarks() {
  const { id: assessmentId } = useParams();
  const navigate = useNavigate();
  const { userType } = useAuth();

  const [assessment, setAssessment] = useState(null);
  const [students, setStudents]     = useState([]);
  const [marks, setMarks]           = useState({});
  const [loading, setLoading]       = useState(true);
  const [saving, setSaving]         = useState(false);

  useEffect(() => {
    const unsub = getAllAssessments(all => {
      const found = all.find(a => a.id === assessmentId);
      if (found) {
        setAssessment(found);
        // Pre-fill marks from existing data
        setMarks(found.studentMarks || {});
      }
    });
    return unsub;
  }, [assessmentId]);

  useEffect(() => {
    if (!assessment?.schoolClass) return;
    adminGetStudents().then(all => {
      const cls = all.filter(s => s.schoolClass === assessment.schoolClass);
      setStudents(cls);
      // Pre-set empty marks for new students
      setMarks(prev => {
        const updated = { ...prev };
        cls.forEach(s => {
          if (!updated[s.id]) {
            updated[s.id] = {
              studentName: s.displayName || s.name || '',
              marksAwarded: '',
              percentage: '',
              grade: '',
              positionOverall: '',
              feedback: '',
            };
          }
        });
        return updated;
      });
      setLoading(false);
    }).catch(() => setLoading(false));
  }, [assessment]);

  if (!assessment) return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center">
      <div className="w-8 h-8 border-2 border-indigo-500 border-t-transparent rounded-full animate-spin" />
    </div>
  );

  const isHomework   = assessment.type === ASSESSMENT_TYPES.HOMEWORK;
  const isUnitTest   = assessment.type === ASSESSMENT_TYPES.UNIT_TEST;
  const isAssignment = assessment.type === ASSESSMENT_TYPES.ASSIGNMENT;
  const isExam       = assessment.type === ASSESSMENT_TYPES.EXAM;
  const isFinalYear  = isExam && assessment.examType === EXAM_TYPES.FINAL_YEAR;
  const usesMarks    = isHomework || isUnitTest;
  const usesPercent  = isAssignment;
  const usesGrade    = isExam;

  const updateMark = (studentId, field, value) => {
    setMarks(prev => ({
      ...prev,
      [studentId]: { ...prev[studentId], [field]: value },
    }));
  };

  const handleSave = async () => {
    // Validate
    const missing = students.filter(s => {
      const m = marks[s.id];
      if (usesMarks   && (m?.marksAwarded === '' || m?.marksAwarded === undefined)) return true;
      if (usesPercent && (m?.percentage   === '' || m?.percentage   === undefined)) return true;
      if (usesGrade   && !m?.grade) return true;
      return false;
    });
    if (missing.length) {
      toast.error(`${missing.length} student(s) still missing marks`);
      return;
    }

    // Clean up marks
    const clean = {};
    students.forEach(s => {
      const m = marks[s.id] || {};
      clean[s.id] = {
        studentName: s.displayName || s.name || '',
        marksAwarded:    usesMarks   ? parseFloat(m.marksAwarded) : undefined,
        percentage:      usesPercent ? parseFloat(m.percentage)   : undefined,
        grade:           usesGrade   ? m.grade                    : undefined,
        positionOverall: isFinalYear  ? parseInt(m.positionOverall) || null : undefined,
        feedback: m.feedback || '',
        markedAt: new Date().toISOString().slice(0, 10),
      };
    });

    setSaving(true);
    try {
      await saveAssessmentMarks(assessmentId, clean);
      toast.success('Marks saved!');
      navigate(ROUTES.ASSESSMENT);
    } catch (err) {
      toast.error(err.message || 'Failed to save');
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col">
      <TopBar title="Enter Marks" showBack>
        <button onClick={handleSave} disabled={saving}
          className="flex items-center gap-1.5 px-3 h-9 rounded-xl bg-indigo-600 text-white text-sm font-display font-semibold disabled:opacity-50">
          {saving
            ? <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
            : <><Save size={15} /> Save</>}
        </button>
      </TopBar>

      <div className="flex-1 overflow-y-auto px-4 pt-4 pb-28">
        {/* Assessment header */}
        <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-4 mb-4">
          <p className="font-display font-bold text-gray-800">{assessment.title}</p>
          <p className="text-gray-400 text-sm font-body">{assessment.schoolClass} · {assessment.subject}</p>
          {usesMarks && (
            <p className="text-gray-400 text-xs font-body mt-1">Marks out of {assessment.totalMarks}</p>
          )}
          {usesPercent && (
            <p className="text-gray-400 text-xs font-body mt-1">Enter percentage (0–100)</p>
          )}
          {usesGrade && (
            <p className="text-gray-400 text-xs font-body mt-1">
              Enter grade (A–F){isFinalYear ? ' and position in class' : ''}
            </p>
          )}
        </div>

        {loading ? (
          <div className="flex flex-col gap-3">
            {[1,2,3,4].map(i => <div key={i} className="h-20 rounded-2xl bg-gray-100 animate-pulse" />)}
          </div>
        ) : students.length === 0 ? (
          <div className="text-center py-12">
            <p className="text-gray-400 font-body">No students found in {assessment.schoolClass}</p>
          </div>
        ) : (
          <div className="flex flex-col gap-3">
            {students.map((s, i) => {
              const m = marks[s.id] || {};
              const name = s.displayName || s.name || 'Student';
              const hasValue = usesMarks ? m.marksAwarded !== '' && m.marksAwarded !== undefined
                : usesPercent ? m.percentage !== '' && m.percentage !== undefined
                : !!m.grade;

              return (
                <div key={s.id} className="bg-white rounded-2xl border border-gray-100 shadow-sm p-4">
                  <div className="flex items-center justify-between mb-3">
                    <div className="flex items-center gap-2">
                      <span className="text-gray-300 text-xs font-body">{i + 1}</span>
                      <p className="font-display font-semibold text-gray-800 text-sm">{name}</p>
                    </div>
                    {hasValue && <CheckCircle size={15} className="text-emerald-500" />}
                  </div>

                  <div className="flex gap-2">
                    {usesMarks && (
                      <div className="flex-1">
                        <label className="text-gray-400 text-[10px] font-body mb-1 block">
                          Marks / {assessment.totalMarks}
                        </label>
                        <input className="field !py-2 text-sm" type="number"
                          min="0" max={assessment.totalMarks}
                          placeholder="0"
                          value={m.marksAwarded ?? ''}
                          onChange={e => updateMark(s.id, 'marksAwarded', e.target.value)} />
                      </div>
                    )}

                    {usesPercent && (
                      <div className="flex-1">
                        <label className="text-gray-400 text-[10px] font-body mb-1 block">
                          Percentage %
                        </label>
                        <input className="field !py-2 text-sm" type="number"
                          min="0" max="100" placeholder="0"
                          value={m.percentage ?? ''}
                          onChange={e => updateMark(s.id, 'percentage', e.target.value)} />
                      </div>
                    )}

                    {usesGrade && (
                      <div className="flex-1">
                        <label className="text-gray-400 text-[10px] font-body mb-1 block">Grade</label>
                        <select className="field !py-2 text-sm"
                          value={m.grade || ''}
                          onChange={e => updateMark(s.id, 'grade', e.target.value)}>
                          <option value="">Grade</option>
                          {GRADE_OPTIONS.map(g => <option key={g} value={g}>{g}</option>)}
                        </select>
                      </div>
                    )}

                    {isFinalYear && (
                      <div className="w-20">
                        <label className="text-gray-400 text-[10px] font-body mb-1 block">Position</label>
                        <input className="field !py-2 text-sm" type="number" min="1"
                          placeholder="1st"
                          value={m.positionOverall ?? ''}
                          onChange={e => updateMark(s.id, 'positionOverall', e.target.value)} />
                      </div>
                    )}
                  </div>

                  <div className="mt-2">
                    <input className="field !py-2 text-sm text-gray-500"
                      placeholder="Feedback (optional)"
                      value={m.feedback || ''}
                      onChange={e => updateMark(s.id, 'feedback', e.target.value)} />
                  </div>
                </div>
              );
            })}
          </div>
        )}

        <button onClick={handleSave} disabled={saving}
          className="w-full mt-5 h-14 rounded-2xl font-display font-bold text-white flex items-center justify-center gap-2 disabled:opacity-50"
          style={{ background: 'linear-gradient(135deg, #6366f1, #4f46e5)' }}>
          {saving
            ? <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
            : <><Save size={18} /> Save All Marks</>}
        </button>
      </div>
      <BottomNav userType={userType} />
    </div>
  );
}
