// src/pages/syllabus/SyllabusEditor.jsx
// Teacher / Admin: create or edit a syllabus with topics
import React, { useState, useEffect, useRef } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import {
  Plus, Trash2, Save, ChevronDown, ChevronUp,
  CheckCircle, Circle, GripVertical, AlertCircle, X
} from 'lucide-react';
import toast from 'react-hot-toast';
import { useAuth } from '../../context/AuthContext';
import {
  saveSyllabus, getAllSyllabuses, getSyllabusByTeacher,
  markTopicComplete, checkAndFlagOverdueTopics
} from '../../services/firestore';
import {
  ROUTES, SCHOOL_STRUCTURE, getSubjectsForClass, getClassSection,
  USER_TYPES
} from '../../utils/constants';
import TopBar from '../../components/layout/TopBar';
import BottomNav from '../../components/layout/BottomNav';

const currentYear = () => new Date().getFullYear().toString();

function uid() {
  return Math.random().toString(36).slice(2, 10);
}

function emptyTopic(order) {
  return { id: uid(), title: '', description: '', outcomes: [''], dueDate: '', isCompleted: false, completedDate: null, order };
}

function OutcomesList({ outcomes, onChange }) {
  const update = (i, val) => {
    const copy = [...outcomes];
    copy[i] = val;
    onChange(copy);
  };
  const add = () => onChange([...outcomes, '']);
  const remove = (i) => onChange(outcomes.filter((_, idx) => idx !== i));

  return (
    <div>
      <label className="text-gray-500 text-xs font-body mb-1.5 block">Expected Outcomes</label>
      <div className="flex flex-col gap-2">
        {outcomes.map((o, i) => (
          <div key={i} className="flex gap-2 items-start">
            <span className="text-gray-300 text-xs font-body mt-2.5 shrink-0">{i + 1}.</span>
            <input className="field flex-1 !py-2 text-sm"
              placeholder="Students will be able to..."
              value={o} onChange={e => update(i, e.target.value)} />
            {outcomes.length > 1 && (
              <button onClick={() => remove(i)}
                className="mt-1.5 p-1 rounded-lg bg-red-50 text-red-400 hover:bg-red-100 shrink-0">
                <X size={14} />
              </button>
            )}
          </div>
        ))}
        <button onClick={add}
          className="flex items-center gap-1.5 text-indigo-500 text-xs font-body font-semibold py-1">
          <Plus size={13} /> Add outcome
        </button>
      </div>
    </div>
  );
}

function TopicCard({ topic, index, total, isTeacher, syllabusId, schoolClass, subject,
  allTopics, onChange, onDelete, onMoveUp, onMoveDown }) {
  const [expanded, setExpanded] = useState(!topic.title);
  const today = new Date().toISOString().slice(0, 10);
  const isOverdue = !topic.isCompleted && topic.dueDate && topic.dueDate < today;
  const isAhead   = topic.isCompleted && topic.dueDate && topic.completedDate && topic.completedDate < topic.dueDate;

  const handleToggleComplete = async () => {
    if (!syllabusId) { toast.error('Save the syllabus first'); return; }
    try {
      await markTopicComplete(syllabusId, allTopics, topic.id, !topic.isCompleted, schoolClass, subject);
      toast.success(topic.isCompleted ? 'Marked incomplete' : 'Topic completed!');
    } catch (err) {
      toast.error(err.message || 'Failed to update');
    }
  };

  return (
    <div className={`bg-white rounded-2xl border shadow-sm overflow-hidden transition-all ${
      topic.isCompleted ? 'border-emerald-200' : isOverdue ? 'border-red-200' : 'border-gray-100'
    }`}>
      <div className="flex items-center gap-3 p-3">
        <button onClick={handleToggleComplete} disabled={!syllabusId}
          className="shrink-0">
          {topic.isCompleted
            ? <CheckCircle size={20} className="text-emerald-500" />
            : <Circle size={20} className="text-gray-300" />}
        </button>
        <div className="flex-1 min-w-0 text-left" onClick={() => setExpanded(v => !v)}>
          <p className={`font-display font-semibold text-sm truncate ${
            topic.isCompleted ? 'text-emerald-700 line-through opacity-60' : isOverdue ? 'text-red-600' : 'text-gray-800'
          }`}>
            {topic.title || `Topic ${index + 1}`}
          </p>
          <div className="flex items-center gap-2 mt-0.5">
            {topic.dueDate && (
              <span className={`text-[10px] font-body ${isOverdue ? 'text-red-400 font-semibold' : 'text-gray-400'}`}>
                {isOverdue ? '⚠ Overdue · ' : 'Due '}
                {topic.dueDate}
              </span>
            )}
            {isAhead && (
              <span className="text-[10px] font-body text-emerald-500 font-semibold">🏃 Ahead of schedule</span>
            )}
          </div>
        </div>
        <div className="flex items-center gap-1 shrink-0">
          <button onClick={() => onMoveUp(index)} disabled={index === 0}
            className="p-1 text-gray-300 hover:text-gray-500 disabled:opacity-30">
            <ChevronUp size={16} />
          </button>
          <button onClick={() => onMoveDown(index)} disabled={index === total - 1}
            className="p-1 text-gray-300 hover:text-gray-500 disabled:opacity-30">
            <ChevronDown size={16} />
          </button>
          <button onClick={() => setExpanded(v => !v)}
            className="p-1 text-gray-300 hover:text-gray-500">
            {expanded ? <ChevronUp size={16} /> : <ChevronDown size={16} />}
          </button>
        </div>
      </div>

      {expanded && (
        <div className="px-4 pb-4 border-t border-gray-100 pt-3 flex flex-col gap-3">
          <div>
            <label className="text-gray-500 text-xs font-body mb-1.5 block">Topic Title *</label>
            <input className="field text-sm" placeholder="e.g. Introduction to Fractions"
              value={topic.title} onChange={e => onChange({ ...topic, title: e.target.value })} />
          </div>
          <div>
            <label className="text-gray-500 text-xs font-body mb-1.5 block">Description</label>
            <textarea className="field text-sm min-h-[70px] resize-none"
              placeholder="Brief overview of what this topic covers..."
              value={topic.description}
              onChange={e => onChange({ ...topic, description: e.target.value })} />
          </div>
          <OutcomesList
            outcomes={topic.outcomes?.length ? topic.outcomes : ['']}
            onChange={val => onChange({ ...topic, outcomes: val })} />
          <div>
            <label className="text-gray-500 text-xs font-body mb-1.5 block">Due Date</label>
            <input type="date" className="field text-sm"
              value={topic.dueDate}
              onChange={e => onChange({ ...topic, dueDate: e.target.value })} />
          </div>
          <button onClick={() => onDelete(topic.id)}
            className="flex items-center gap-1.5 text-red-400 text-xs font-body font-semibold py-1 hover:text-red-600 transition-colors">
            <Trash2 size={13} /> Remove this topic
          </button>
        </div>
      )}
    </div>
  );
}

export default function SyllabusEditor() {
  const { id: syllabusId } = useParams();
  const navigate = useNavigate();
  const { userType, userId } = useAuth();
  const isEdit = !!syllabusId;

  const [schoolClass, setSchoolClass]   = useState('');
  const [subject, setSubject]           = useState('');
  const [description, setDescription]  = useState('');
  const [schoolYear, setSchoolYear]     = useState(currentYear());
  const [topics, setTopics]             = useState([emptyTopic(1)]);
  const [saving, setSaving]             = useState(false);
  const [loading, setLoading]           = useState(isEdit);

  const subjectOptions = getSubjectsForClass(schoolClass);

  // Load existing syllabus for edit
  useEffect(() => {
    if (!isEdit) return;
    const unsub = getAllSyllabuses(all => {
      const found = all.find(s => s.id === syllabusId);
      if (found) {
        setSchoolClass(found.schoolClass || '');
        setSubject(found.subject || '');
        setDescription(found.description || '');
        setSchoolYear(found.schoolYear || currentYear());
        setTopics(found.topics?.length ? found.topics : [emptyTopic(1)]);
        setLoading(false);
        // Check overdue topics on load
        if (found.topics?.length) {
          checkAndFlagOverdueTopics(syllabusId, found.topics, found.schoolClass, found.subject).catch(() => {});
        }
      }
    });
    return unsub;
  }, [isEdit, syllabusId]);

  const handleSave = async () => {
    if (!schoolClass) { toast.error('Select a class'); return; }
    if (!subject)     { toast.error('Select a subject'); return; }
    if (topics.some(t => !t.title.trim())) { toast.error('All topics must have a title'); return; }

    setSaving(true);
    try {
      const data = {
        schoolClass,
        subject,
        description,
        schoolYear,
        topics: topics.map((t, i) => ({ ...t, order: i + 1 })),
      };
      await saveSyllabus(data, isEdit ? syllabusId : null);
      toast.success(isEdit ? 'Syllabus updated!' : 'Syllabus created!');
      navigate(ROUTES.SYLLABUS);
    } catch (err) {
      toast.error(err.message || 'Failed to save');
    } finally {
      setSaving(false);
    }
  };

  const addTopic = () => setTopics(t => [...t, emptyTopic(t.length + 1)]);

  const updateTopic = (id, updated) =>
    setTopics(t => t.map(topic => topic.id === id ? updated : topic));

  const deleteTopic = (id) =>
    setTopics(t => t.filter(topic => topic.id !== id));

  const moveUp = (index) => {
    if (index === 0) return;
    const copy = [...topics];
    [copy[index - 1], copy[index]] = [copy[index], copy[index - 1]];
    setTopics(copy);
  };

  const moveDown = (index) => {
    if (index === topics.length - 1) return;
    const copy = [...topics];
    [copy[index], copy[index + 1]] = [copy[index + 1], copy[index]];
    setTopics(copy);
  };

  if (loading) return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center">
      <div className="w-8 h-8 border-2 border-indigo-500 border-t-transparent rounded-full animate-spin" />
    </div>
  );

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col">
      <TopBar title={isEdit ? 'Edit Syllabus' : 'New Syllabus'} showBack>
        <button onClick={handleSave} disabled={saving}
          className="flex items-center gap-1.5 px-3 h-9 rounded-xl bg-indigo-600 text-white text-sm font-display font-semibold disabled:opacity-50">
          {saving
            ? <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
            : <><Save size={15} /> Save</>}
        </button>
      </TopBar>

      <div className="flex-1 overflow-y-auto px-4 pt-4 pb-28">
        {/* Syllabus details */}
        <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-4 mb-5">
          <p className="text-gray-400 text-xs font-body font-semibold uppercase tracking-wider mb-3">Syllabus Details</p>
          <div className="flex flex-col gap-3">
            <div>
              <label className="text-gray-500 text-xs font-body mb-1.5 block">Class *</label>
              <select className="field" value={schoolClass}
                onChange={e => { setSchoolClass(e.target.value); setSubject(''); }}
                disabled={isEdit}>
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
            <div>
              <label className="text-gray-500 text-xs font-body mb-1.5 block">Subject *</label>
              <select className="field" value={subject}
                onChange={e => setSubject(e.target.value)}
                disabled={isEdit || !schoolClass}>
                <option value="">Select subject...</option>
                {subjectOptions.map(s => <option key={s} value={s}>{s}</option>)}
              </select>
            </div>
            <div>
              <label className="text-gray-500 text-xs font-body mb-1.5 block">Description / Overview</label>
              <textarea className="field min-h-[80px] resize-none text-sm"
                placeholder="What will students learn this year in this subject?"
                value={description} onChange={e => setDescription(e.target.value)} />
            </div>
            <div>
              <label className="text-gray-500 text-xs font-body mb-1.5 block">School Year</label>
              <input className="field text-sm" placeholder="2026" value={schoolYear}
                onChange={e => setSchoolYear(e.target.value)} />
            </div>
          </div>
        </div>

        {/* Topics */}
        <div className="flex items-center justify-between mb-3">
          <p className="text-gray-400 text-xs font-body font-semibold uppercase tracking-wider">
            Topics / Units ({topics.length})
          </p>
          <button onClick={addTopic}
            className="flex items-center gap-1.5 text-indigo-600 text-xs font-display font-semibold">
            <Plus size={14} /> Add Topic
          </button>
        </div>

        <div className="flex flex-col gap-3 mb-6">
          {topics.map((topic, i) => (
            <TopicCard
              key={topic.id}
              topic={topic}
              index={i}
              total={topics.length}
              syllabusId={isEdit ? syllabusId : null}
              schoolClass={schoolClass}
              subject={subject}
              allTopics={topics}
              isTeacher
              onChange={updated => updateTopic(topic.id, updated)}
              onDelete={deleteTopic}
              onMoveUp={moveUp}
              onMoveDown={moveDown}
            />
          ))}
        </div>

        <button onClick={addTopic}
          className="w-full py-3 rounded-2xl border-2 border-dashed border-gray-200 text-gray-400 text-sm font-body flex items-center justify-center gap-2 hover:border-indigo-300 hover:text-indigo-400 transition-colors mb-4">
          <Plus size={16} /> Add another topic
        </button>

        <button onClick={handleSave} disabled={saving}
          className="w-full h-14 rounded-2xl font-display font-bold text-white flex items-center justify-center gap-2 disabled:opacity-50"
          style={{ background: 'linear-gradient(135deg, #6366f1, #4f46e5)' }}>
          {saving
            ? <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
            : <><Save size={18} /> {isEdit ? 'Update Syllabus' : 'Create Syllabus'}</>}
        </button>
      </div>
      <BottomNav userType={userType} />
    </div>
  );
}
