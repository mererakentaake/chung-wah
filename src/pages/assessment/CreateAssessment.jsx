// src/pages/assessment/CreateAssessment.jsx
// Teacher/Admin: create a new homework, unit test, assignment, or exam
import React, { useState } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { Save } from 'lucide-react';
import toast from 'react-hot-toast';
import { useAuth } from '../../context/AuthContext';
import { createAssessment } from '../../services/firestore';
import {
  ROUTES, SCHOOL_STRUCTURE, ASSESSMENT_TYPES, EXAM_TYPES,
  TERMS, getSubjectsForClass
} from '../../utils/constants';
import TopBar from '../../components/layout/TopBar';
import BottomNav from '../../components/layout/BottomNav';

const LABELS = {
  homework:   'New Homework',
  unitTest:   'New Unit Test',
  assignment: 'New Assignment',
  exam:       'New Exam',
};

export default function CreateAssessment() {
  const [searchParams] = useSearchParams();
  const type = searchParams.get('type') || ASSESSMENT_TYPES.HOMEWORK;
  const navigate = useNavigate();
  const { userType } = useAuth();

  const [form, setForm] = useState({
    schoolClass: '',
    subject: '',
    title: '',
    description: '',
    dueDate: '',
    testDate: '',
    totalMarks: '',
    term: '',
    examType: EXAM_TYPES.MID_SEMESTER,
  });
  const [saving, setSaving] = useState(false);

  const set = k => e => setForm(f => ({ ...f, [k]: e.target.value }));
  const subjects = getSubjectsForClass(form.schoolClass);

  const isHomework   = type === ASSESSMENT_TYPES.HOMEWORK;
  const isUnitTest   = type === ASSESSMENT_TYPES.UNIT_TEST;
  const isAssignment = type === ASSESSMENT_TYPES.ASSIGNMENT;
  const isExam       = type === ASSESSMENT_TYPES.EXAM;
  const isFinalYear  = isExam && form.examType === EXAM_TYPES.FINAL_YEAR;

  const validate = () => {
    if (!form.schoolClass) { toast.error('Select a class'); return false; }
    if (!form.subject)     { toast.error('Select a subject'); return false; }
    if (!form.title.trim()){ toast.error('Enter a title'); return false; }
    if ((isHomework || isUnitTest) && !form.totalMarks) { toast.error('Enter total marks'); return false; }
    return true;
  };

  const handleSave = async () => {
    if (!validate()) return;
    setSaving(true);
    try {
      await createAssessment({
        type,
        examType: isExam ? form.examType : undefined,
        schoolClass: form.schoolClass,
        subject: form.subject,
        title: form.title.trim(),
        description: form.description.trim(),
        dueDate:  isHomework || isAssignment ? form.dueDate : undefined,
        testDate: isUnitTest || isExam ? form.testDate : undefined,
        totalMarks: (isHomework || isUnitTest) ? parseInt(form.totalMarks) : 0,
        term: form.term || undefined,
      });
      toast.success('Created!');
      navigate(ROUTES.ASSESSMENT);
    } catch (err) {
      toast.error(err.message || 'Failed to create');
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col">
      <TopBar title={LABELS[type] || 'New Assessment'} showBack>
        <button onClick={handleSave} disabled={saving}
          className="flex items-center gap-1.5 px-3 h-9 rounded-xl bg-indigo-600 text-white text-sm font-display font-semibold disabled:opacity-50">
          {saving
            ? <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
            : <><Save size={15} /> Save</>}
        </button>
      </TopBar>

      <div className="flex-1 overflow-y-auto px-4 pt-4 pb-28">
        <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-4 flex flex-col gap-4">

          {/* Class */}
          <div>
            <label className="text-gray-500 text-xs font-body mb-1.5 block">Class *</label>
            <select className="field" value={form.schoolClass}
              onChange={e => setForm(f => ({ ...f, schoolClass: e.target.value, subject: '' }))}>
              <option value="">Select class...</option>
              {Object.values(SCHOOL_STRUCTURE).map(section => (
                <optgroup key={section.label} label={section.label}>
                  {section.classes.map(cls => (
                    <option key={cls} value={cls}>{cls}</option>
                  ))}
                </optgroup>
              ))}
            </select>
          </div>

          {/* Subject */}
          <div>
            <label className="text-gray-500 text-xs font-body mb-1.5 block">Subject *</label>
            <select className="field" value={form.subject} onChange={set('subject')} disabled={!form.schoolClass}>
              <option value="">Select subject...</option>
              {subjects.map(s => <option key={s} value={s}>{s}</option>)}
            </select>
          </div>

          {/* Title */}
          <div>
            <label className="text-gray-500 text-xs font-body mb-1.5 block">Title *</label>
            <input className="field" placeholder={
              isHomework ? 'e.g. Chapter 4 Exercises' :
              isUnitTest ? 'e.g. Chapter 4 Unit Test' :
              isAssignment ? 'e.g. Science Project' : 'e.g. Mid-Semester Exam 2026'
            } value={form.title} onChange={set('title')} />
          </div>

          {/* Description / Content */}
          <div>
            <label className="text-gray-500 text-xs font-body mb-1.5 block">
              {isHomework ? 'Homework Content *' : 'Description / Instructions'}
            </label>
            <textarea className="field min-h-[100px] resize-none text-sm"
              placeholder={isHomework
                ? 'Write out the full homework questions or instructions here...'
                : 'Brief description or instructions for students...'}
              value={form.description} onChange={set('description')} />
          </div>

          {/* Exam type selector */}
          {isExam && (
            <div>
              <label className="text-gray-500 text-xs font-body mb-1.5 block">Exam Type</label>
              <div className="flex gap-2">
                {[{ v: EXAM_TYPES.MID_SEMESTER, l: 'Mid-Semester' }, { v: EXAM_TYPES.FINAL_YEAR, l: 'Final Year' }].map(opt => (
                  <button key={opt.v} onClick={() => setForm(f => ({ ...f, examType: opt.v }))}
                    className={`flex-1 py-2.5 rounded-xl text-sm font-display font-semibold transition-all ${
                      form.examType === opt.v ? 'bg-indigo-600 text-white' : 'bg-gray-100 text-gray-500'
                    }`}>
                    {opt.l}
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* Total marks */}
          {(isHomework || isUnitTest) && (
            <div>
              <label className="text-gray-500 text-xs font-body mb-1.5 block">Total Marks *</label>
              <input className="field" type="number" placeholder="e.g. 20"
                value={form.totalMarks} onChange={set('totalMarks')} />
            </div>
          )}

          {/* Due / Test date */}
          {(isHomework || isAssignment) && (
            <div>
              <label className="text-gray-500 text-xs font-body mb-1.5 block">Due Date</label>
              <input className="field" type="date" value={form.dueDate} onChange={set('dueDate')} />
            </div>
          )}
          {(isUnitTest || isExam) && (
            <div>
              <label className="text-gray-500 text-xs font-body mb-1.5 block">
                {isExam ? 'Exam Date' : 'Test Date'}
              </label>
              <input className="field" type="date" value={form.testDate} onChange={set('testDate')} />
            </div>
          )}

          {/* Term */}
          <div>
            <label className="text-gray-500 text-xs font-body mb-1.5 block">Term (optional)</label>
            <select className="field" value={form.term} onChange={set('term')}>
              <option value="">Select term...</option>
              {TERMS.map(t => <option key={t} value={t}>{t}</option>)}
            </select>
          </div>
        </div>

        <button onClick={handleSave} disabled={saving}
          className="w-full mt-5 h-14 rounded-2xl font-display font-bold text-white flex items-center justify-center gap-2 disabled:opacity-50"
          style={{ background: 'linear-gradient(135deg, #6366f1, #4f46e5)' }}>
          {saving
            ? <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
            : <><Save size={18} /> Create {LABELS[type]?.replace('New ', '')}</>}
        </button>
      </div>
      <BottomNav userType={userType} />
    </div>
  );
}
