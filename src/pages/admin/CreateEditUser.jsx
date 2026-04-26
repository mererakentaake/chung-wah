// src/pages/admin/CreateEditUser.jsx
import React, { useState, useEffect, useRef } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { ArrowLeft, Save, GraduationCap, UserCheck, Users, Plus, X, Search } from 'lucide-react';
import toast from 'react-hot-toast';
import {
  adminCreateStudent, adminCreateTeacherParent,
  adminUpdateStudent, adminUpdateTeacherParent,
  adminGetStudents, adminGetTeachersParents,
} from '../../services/firestore';
import { ROUTES, TITLES, GENDERS, RELATIONSHIP_TYPES } from '../../utils/constants';

/* ─── Child Search Row ───────────────────────────────────────────────────── */
function ChildSearchRow({ child, allStudents, onChange, onRemove, index }) {
  const [query, setQuery] = useState(child.studentName || '');
  const [open, setOpen] = useState(false);
  const ref = useRef(null);

  const matches = query.trim().length > 0
    ? allStudents.filter(s =>
        (s.displayName || '').toLowerCase().includes(query.toLowerCase()) ||
        (s.email || '').toLowerCase().includes(query.toLowerCase())
      ).slice(0, 6)
    : [];

  useEffect(() => {
    const handler = (e) => { if (ref.current && !ref.current.contains(e.target)) setOpen(false); };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, []);

  const select = (student) => {
    setQuery(student.displayName || student.email);
    setOpen(false);
    onChange({
      studentId: student.id,
      studentName: student.displayName || student.email,
      studentClass: student.standard && student.division
        ? `Std ${student.standard} ${student.division}`
        : '',
    });
  };

  return (
    <div ref={ref} className="relative">
      <div className="flex items-center gap-2">
        <div className="flex-1 relative">
          <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-white/30" />
          <input
            className="field-dark pl-9 text-sm"
            placeholder={`Search student ${index + 1} by name…`}
            value={query}
            onChange={e => { setQuery(e.target.value); setOpen(true); onChange({ studentId: '', studentName: e.target.value, studentClass: '' }); }}
            onFocus={() => setOpen(true)}
          />
        </div>
        <button
          type="button"
          onClick={onRemove}
          className="w-9 h-9 rounded-xl bg-red-500/15 flex items-center justify-center shrink-0"
        >
          <X size={15} className="text-red-400" />
        </button>
      </div>

      {/* Dropdown */}
      {open && matches.length > 0 && (
        <div className="absolute z-50 w-full mt-1 rounded-xl overflow-hidden shadow-2xl"
          style={{ background: '#1a2040', border: '1px solid rgba(255,255,255,0.12)' }}>
          {matches.map(s => (
            <button
              key={s.id}
              type="button"
              onMouseDown={() => select(s)}
              className="w-full px-4 py-3 text-left hover:bg-white/8 transition-colors border-b border-white/5 last:border-0"
            >
              <p className="text-white text-sm font-display font-semibold leading-tight">
                {s.displayName || s.email}
              </p>
              {s.standard && (
                <p className="text-white/40 text-xs font-body mt-0.5">
                  Std {s.standard} {s.division} {s.enrollNo ? `• ID: ${s.enrollNo}` : ''}
                </p>
              )}
            </button>
          ))}
        </div>
      )}

      {/* Confirmed selection chip */}
      {child.studentId && (
        <p className="text-emerald-400 text-xs font-body mt-1 ml-1">
          ✓ {child.studentName} {child.studentClass ? `(${child.studentClass})` : ''}
        </p>
      )}
    </div>
  );
}

/* ─── Select field ───────────────────────────────────────────────────────── */
function SelectField({ label, value, onChange, options, required }) {
  return (
    <div>
      <label className="text-white/60 text-xs font-body font-medium mb-1.5 block">
        {label}{required && <span className="text-red-400 ml-0.5">*</span>}
      </label>
      <select
        className="field-dark appearance-none"
        value={value}
        onChange={onChange}
        style={{ backgroundImage: "url(\"data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='12' height='12' viewBox='0 0 12 12'%3E%3Cpath fill='rgba(255,255,255,0.4)' d='M6 8L1 3h10z'/%3E%3C/svg%3E\")", backgroundRepeat: 'no-repeat', backgroundPosition: 'right 14px center' }}
      >
        <option value="">Select…</option>
        {options.map(o => <option key={o} value={o}>{o}</option>)}
      </select>
    </div>
  );
}

/* ─── Text input field ───────────────────────────────────────────────────── */
function Field({ label, value, onChange, placeholder, type = 'text', disabled = false, note, required }) {
  return (
    <div>
      <label className="text-white/60 text-xs font-body font-medium mb-1.5 block">
        {label}{required && <span className="text-red-400 ml-0.5">*</span>}
      </label>
      <input
        className={`field-dark ${disabled ? 'opacity-50 cursor-not-allowed' : ''}`}
        type={type}
        value={value || ''}
        onChange={onChange}
        placeholder={placeholder}
        disabled={disabled}
      />
      {note && <p className="text-white/30 text-xs font-body mt-1">{note}</p>}
    </div>
  );
}

/* ─── Main Component ─────────────────────────────────────────────────────── */
export default function CreateEditUser() {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const type = searchParams.get('type') || 'student';
  const editId = searchParams.get('id') || null;
  const isEdit = !!editId;

  const isStudent = type === 'student';
  const isTeacher = type === 'teacher';
  const isParent = type === 'parent';

  const color = isStudent ? '#F4A334' : isTeacher ? '#F9C61F' : '#E84545';
  const Icon = isStudent ? GraduationCap : isTeacher ? UserCheck : Users;
  const label = isStudent ? 'Student' : isTeacher ? 'Teacher' : 'Parent / Guardian';

  const [loading, setLoading] = useState(false);
  const [fetching, setFetching] = useState(isEdit);
  const [allStudents, setAllStudents] = useState([]);

  const [form, setForm] = useState({
    displayName: '',
    email: '',
    title: '',           // Mr | Mrs | Miss  (teacher & parent)
    gender: '',          // Male | Female | Other (student)
    relationshipType: 'Parent', // Parent | Guardian (parent only)
    standard: '',
    division: '',
    enrollNo: '',
    subject: '',
    mobileNo: '',
    dob: '',
    bloodGroup: '',
  });

  // Multiple children for parent
  const [children, setChildren] = useState([{ studentId: '', studentName: '', studentClass: '' }]);

  // Load students list for child search
  useEffect(() => {
    if (isParent) {
      adminGetStudents().then(data => {
        data.sort((a, b) => (a.displayName || '').localeCompare(b.displayName || ''));
        setAllStudents(data);
      }).catch(() => {});
    }
  }, [isParent]);

  // Load existing record when editing
  useEffect(() => {
    if (!isEdit) return;
    const load = async () => {
      try {
        const list = isStudent ? await adminGetStudents() : await adminGetTeachersParents();
        const record = list.find(r => r.id === editId);
        if (record) {
          setForm(f => ({ ...f, ...record }));
          if (record.children && record.children.length > 0) setChildren(record.children);
        }
      } catch { toast.error('Failed to load record'); }
      finally { setFetching(false); }
    };
    load();
  }, [editId]);

  const set = k => e => setForm(f => ({ ...f, [k]: e.target.value }));

  const updateChild = (index, data) => {
    setChildren(prev => prev.map((c, i) => i === index ? { ...c, ...data } : c));
  };
  const addChild = () => setChildren(prev => [...prev, { studentId: '', studentName: '', studentClass: '' }]);
  const removeChild = (index) => setChildren(prev => prev.filter((_, i) => i !== index));

  const handleSave = async () => {
    if (!form.email.trim()) { toast.error('Email is required'); return; }
    if (!form.displayName.trim()) { toast.error('Name is required'); return; }
    if (isStudent && !form.gender) { toast.error('Gender is required'); return; }
    if ((isTeacher || isParent) && !form.title) { toast.error('Title is required (Mr / Mrs / Miss)'); return; }
    if (isParent) {
      const validChildren = children.filter(c => c.studentId);
      if (!isEdit && validChildren.length === 0) {
        toast.error("Please search and select at least one child from the student list");
        return;
      }
    }

    setLoading(true);
    try {
      if (isStudent) {
        const data = {
          displayName: form.displayName.trim(),
          email: form.email.trim(),
          gender: form.gender,
          standard: form.standard.trim(),
          division: form.division.trim().toUpperCase(),
          enrollNo: form.enrollNo.trim(),
          mobileNo: form.mobileNo.trim(),
          dob: form.dob.trim(),
          bloodGroup: form.bloodGroup.trim(),
        };
        isEdit ? await adminUpdateStudent(editId, data) : await adminCreateStudent(data);
        toast.success(isEdit ? 'Student updated!' : 'Student added!');
        navigate(ROUTES.ADMIN_STUDENTS);
      } else {
        const validChildren = children.filter(c => c.studentId);
        const data = {
          displayName: form.displayName.trim(),
          email: form.email.trim(),
          title: form.title,
          isATeacher: isTeacher,
          relationshipType: isParent ? form.relationshipType : undefined,
          subject: form.subject.trim(),
          mobileNo: form.mobileNo.trim(),
          children: isParent ? validChildren : [],
        };
        isEdit
          ? await adminUpdateTeacherParent(editId, data)
          : await adminCreateTeacherParent(data);
        toast.success(isEdit ? `${label} updated!` : `${label} added!`);
        navigate(ROUTES.ADMIN_TEACHERS);
      }
    } catch (err) {
      toast.error(err.message || 'Something went wrong');
    } finally {
      setLoading(false);
    }
  };

  const backRoute = isStudent ? ROUTES.ADMIN_STUDENTS : ROUTES.ADMIN_TEACHERS;

  if (fetching) {
    return (
      <div className="min-h-screen mesh-bg flex items-center justify-center">
        <div className="w-8 h-8 border-2 border-white/20 border-t-white/80 rounded-full animate-spin" />
      </div>
    );
  }

  return (
    <div className="min-h-screen mesh-bg flex flex-col">
      {/* Header */}
      <div className="px-5 pt-14 pb-6">
        <div className="flex items-center gap-3">
          <button onClick={() => navigate(backRoute)}
            className="w-9 h-9 rounded-xl bg-white/8 border border-white/10 flex items-center justify-center">
            <ArrowLeft size={18} className="text-white/80" />
          </button>
          <div className="flex items-center gap-2.5">
            <div className="w-9 h-9 rounded-xl flex items-center justify-center"
              style={{ background: `${color}22`, border: `1px solid ${color}33` }}>
              <Icon size={18} style={{ color }} />
            </div>
            <div>
              <h1 className="font-display font-bold text-white text-xl leading-tight">
                {isEdit ? `Edit ${label}` : `Add ${label}`}
              </h1>
              <p className="text-white/40 text-xs font-body">
                {isEdit ? 'Update details below' : 'Fill in details to pre-register'}
              </p>
            </div>
          </div>
        </div>
      </div>

      <div className="flex-1 overflow-y-auto px-5 pb-10">
        <div className="flex flex-col gap-4">

          {/* Title for teacher/parent */}
          {(isTeacher || isParent) && (
            <SelectField label="Title" value={form.title} onChange={set('title')} options={TITLES} required />
          )}

          <Field label="Full Name" value={form.displayName} onChange={set('displayName')} placeholder="e.g. John Smith" required />
          <Field label="Email Address" value={form.email} onChange={set('email')} placeholder="user@example.com"
            type="email" disabled={isEdit}
            note={isEdit ? 'Email cannot be changed' : 'User will register using this email'} required />

          {/* Gender for student */}
          {isStudent && (
            <SelectField label="Gender" value={form.gender} onChange={set('gender')} options={GENDERS} required />
          )}

          {/* Parent: relationship type toggle */}
          {isParent && (
            <div>
              <label className="text-white/60 text-xs font-body font-medium mb-2 block">
                Relationship to Student<span className="text-red-400 ml-0.5">*</span>
              </label>
              <div className="flex gap-2">
                {RELATIONSHIP_TYPES.map(rt => (
                  <button
                    key={rt}
                    type="button"
                    onClick={() => setForm(f => ({ ...f, relationshipType: rt }))}
                    className="flex-1 py-3 rounded-2xl font-display font-semibold text-sm transition-all duration-200"
                    style={form.relationshipType === rt
                      ? { background: '#E84545', color: '#fff' }
                      : { background: 'rgba(255,255,255,0.06)', color: 'rgba(255,255,255,0.5)', border: '1px solid rgba(255,255,255,0.1)' }
                    }
                  >
                    {rt}
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* Student-specific fields */}
          {isStudent && (
            <>
              <div className="flex gap-3">
                <Field label="Standard" value={form.standard} onChange={set('standard')} placeholder="e.g. 9" />
                <Field label="Division" value={form.division} onChange={set('division')} placeholder="e.g. A" />
              </div>
              <Field label="Enroll No." value={form.enrollNo} onChange={set('enrollNo')} placeholder="School ID number" />
              <Field label="Date of Birth" value={form.dob} onChange={set('dob')} placeholder="DD/MM/YYYY" />
              <Field label="Blood Group" value={form.bloodGroup} onChange={set('bloodGroup')} placeholder="e.g. O+" />
              <Field label="Mobile No." value={form.mobileNo} onChange={set('mobileNo')} placeholder="+675 XXX XXXX" type="tel" />
            </>
          )}

          {/* Teacher-specific fields */}
          {isTeacher && (
            <>
              <Field label="Subject" value={form.subject} onChange={set('subject')} placeholder="e.g. Mathematics" />
              <Field label="Mobile No." value={form.mobileNo} onChange={set('mobileNo')} placeholder="+675 XXX XXXX" type="tel" />
            </>
          )}

          {/* Parent: children section */}
          {isParent && (
            <div>
              <label className="text-white/60 text-xs font-body font-medium mb-2 block">
                Child / Children at this school<span className="text-red-400 ml-0.5">*</span>
              </label>
              <div className="flex flex-col gap-3">
                {children.map((child, i) => (
                  <ChildSearchRow
                    key={i}
                    index={i}
                    child={child}
                    allStudents={allStudents}
                    onChange={(data) => updateChild(i, data)}
                    onRemove={() => children.length > 1 ? removeChild(i) : null}
                  />
                ))}
                <button
                  type="button"
                  onClick={addChild}
                  className="flex items-center gap-2 text-sm font-display font-semibold py-3 px-4 rounded-2xl transition-colors"
                  style={{ background: 'rgba(232,69,69,0.1)', border: '1px dashed rgba(232,69,69,0.4)', color: '#E84545' }}
                >
                  <Plus size={15} />
                  Add another child
                </button>
              </div>
              <Field label="Mobile No." value={form.mobileNo} onChange={set('mobileNo')} placeholder="+675 XXX XXXX" type="tel" />
            </div>
          )}

          {/* Info note */}
          {!isEdit && (
            <div className="p-3.5 rounded-xl bg-white/5 border border-white/10">
              <p className="text-white/60 text-xs font-body font-semibold mb-1">ℹ️ How activation works</p>
              <p className="text-white/45 text-xs font-body leading-relaxed">
                This pre-registers the {label.toLowerCase()} in the system. They must open the app,
                select the <span className="text-white/70 font-semibold">"{isStudent ? 'Student' : 'Parent / Teacher'}"</span> tab,
                and tap <span className="text-yellow-400 font-semibold">"Register"</span> using this email to activate their account.
                {isParent && ' The child(ren) will receive a confirmation request in their panel.'}
              </p>
            </div>
          )}

          {/* Save button */}
          <button onClick={handleSave} disabled={loading}
            className="w-full h-14 rounded-2xl font-display font-bold text-base flex items-center justify-center gap-2 mt-2 disabled:opacity-50 transition-all"
            style={{ background: `linear-gradient(135deg, ${color}, ${color}cc)`, color: '#0a0f2c' }}>
            {loading
              ? <div className="w-5 h-5 border-2 border-current/40 border-t-current rounded-full animate-spin" />
              : <><Save size={18} />{isEdit ? `Update ${label}` : `Add ${label}`}</>
            }
          </button>
        </div>
      </div>
    </div>
  );
}
