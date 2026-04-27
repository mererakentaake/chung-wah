// src/pages/admin/CreateEditUser.jsx
import React, { useState, useEffect, useRef } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import {
  ArrowLeft, Save, GraduationCap, UserCheck, Users,
  Plus, X, Search, ChevronDown, User2,
} from 'lucide-react';
import toast from 'react-hot-toast';
import {
  adminCreateStudent, adminCreateTeacherParent,
  adminUpdateStudent, adminUpdateTeacherParent,
  adminGetStudents, adminGetTeachersParents,
  adminGetLinkedParent, adminGetNextEnrolNo,
} from '../../services/firestore';
import { ROUTES, TITLES, GENDERS, RELATIONSHIP_TYPES, USER_TYPES } from '../../utils/constants';
import { useAuth } from '../../context/AuthContext';

/* ── Custom Dropdown ──────────────────────────────────────────────────────── */
function CustomDropdown({ label, value, onChange, options, placeholder, required, disabled }) {
  const [open, setOpen] = useState(false);
  const ref = useRef(null);

  useEffect(() => {
    const h = (e) => { if (ref.current && !ref.current.contains(e.target)) setOpen(false); };
    document.addEventListener('mousedown', h);
    return () => document.removeEventListener('mousedown', h);
  }, []);

  return (
    <div>
      {label && (
        <label className="text-white/60 text-xs font-body font-medium mb-1.5 block">
          {label}{required && <span className="text-red-400 ml-0.5">*</span>}
        </label>
      )}
      <div ref={ref} className="relative">
        <button
          type="button"
          disabled={disabled}
          onClick={() => !disabled && setOpen(o => !o)}
          className="field-dark w-full text-left flex items-center justify-between gap-2"
          style={disabled ? { opacity: 0.5, cursor: 'not-allowed' } : {}}
        >
          {value
            ? <span className="text-white text-sm">{value}</span>
            : <span style={{ color: 'rgba(255,255,255,0.35)', fontStyle: 'italic', fontSize: '0.875rem' }}>{placeholder}</span>
          }
          <ChevronDown size={14} className="text-white/40 shrink-0 transition-transform"
            style={{ transform: open ? 'rotate(180deg)' : 'rotate(0)' }} />
        </button>
        {open && (
          <div className="absolute z-50 w-full mt-1 rounded-xl overflow-hidden shadow-2xl"
            style={{ background: '#1a2040', border: '1px solid rgba(255,255,255,0.15)' }}>
            {options.map(opt => (
              <button key={opt} type="button"
                onMouseDown={() => { onChange(opt); setOpen(false); }}
                className="w-full px-4 py-3 text-left hover:bg-white/10 transition-colors border-b border-white/5 last:border-0 text-white text-sm font-display">
                {opt}
              </button>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

/* ── Child Search Row ─────────────────────────────────────────────────────── */
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
    const h = (e) => { if (ref.current && !ref.current.contains(e.target)) setOpen(false); };
    document.addEventListener('mousedown', h);
    return () => document.removeEventListener('mousedown', h);
  }, []);

  const select = (student) => {
    setQuery(student.displayName || student.email);
    setOpen(false);
    onChange({
      studentId: student.id,
      studentName: student.displayName || student.email,
      studentClass: student.standard && student.division ? `Std ${student.standard} ${student.division}` : '',
    });
  };

  return (
    <div ref={ref} className="relative">
      <div className="flex items-center gap-2">
        <div className="flex-1 relative">
          <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-white/30" />
          <input className="field-dark pl-9 text-sm"
            placeholder={`Search student ${index + 1} by name…`}
            value={query}
            onChange={e => { setQuery(e.target.value); setOpen(true); onChange({ studentId: '', studentName: e.target.value, studentClass: '' }); }}
            onFocus={() => setOpen(true)} />
        </div>
        <button type="button" onClick={onRemove}
          className="w-9 h-9 rounded-xl bg-red-500/15 flex items-center justify-center shrink-0">
          <X size={15} className="text-red-400" />
        </button>
      </div>
      {open && matches.length > 0 && (
        <div className="absolute z-50 w-full mt-1 rounded-xl overflow-hidden shadow-2xl"
          style={{ background: '#1a2040', border: '1px solid rgba(255,255,255,0.12)' }}>
          {matches.map(s => (
            <button key={s.id} type="button" onMouseDown={() => select(s)}
              className="w-full px-4 py-3 text-left hover:bg-white/8 transition-colors border-b border-white/5 last:border-0">
              <p className="text-white text-sm font-display font-semibold leading-tight">{s.displayName || s.email}</p>
              {s.standard && (
                <p className="text-white/40 text-xs font-body mt-0.5">
                  Std {s.standard} {s.division} {s.enrollNo ? `• ID: ${s.enrollNo}` : ''}
                </p>
              )}
            </button>
          ))}
        </div>
      )}
      {child.studentId && (
        <p className="text-emerald-400 text-xs font-body mt-1 ml-1">
          ✓ {child.studentName} {child.studentClass ? `(${child.studentClass})` : ''}
        </p>
      )}
    </div>
  );
}

/* ── Text Field ───────────────────────────────────────────────────────────── */
function Field({ label, value, onChange, placeholder, type = 'text', disabled = false, note, required, readOnly }) {
  return (
    <div>
      {label && (
        <label className="text-white/60 text-xs font-body font-medium mb-1.5 block">
          {label}{required && <span className="text-red-400 ml-0.5">*</span>}
        </label>
      )}
      <input
        className={`field-dark ${disabled || readOnly ? 'opacity-50 cursor-not-allowed' : ''}`}
        type={type}
        value={value || ''}
        onChange={onChange}
        placeholder={placeholder}
        disabled={disabled || readOnly}
      />
      {note && <p className="text-white/30 text-xs font-body mt-1">{note}</p>}
    </div>
  );
}

/* ── SelectField (native) ─────────────────────────────────────────────────── */
function SelectField({ label, value, onChange, options, required }) {
  return (
    <div>
      <label className="text-white/60 text-xs font-body font-medium mb-1.5 block">
        {label}{required && <span className="text-red-400 ml-0.5">*</span>}
      </label>
      <select className="field-dark appearance-none" value={value} onChange={onChange}
        style={{ backgroundImage: "url(\"data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='12' height='12' viewBox='0 0 12 12'%3E%3Cpath fill='rgba(255,255,255,0.4)' d='M6 8L1 3h10z'/%3E%3C/svg%3E\")", backgroundRepeat: 'no-repeat', backgroundPosition: 'right 14px center' }}>
        <option value="">Select…</option>
        {options.map(o => <option key={o} value={o}>{o}</option>)}
      </select>
    </div>
  );
}

/* ── Linked Parent Modal ──────────────────────────────────────────────────── */
function LinkedParentModal({ parent, onClose }) {
  if (!parent) return null;
  const titleStr = parent.title ? `${parent.title}. ` : '';
  const rel = parent.relationshipType || 'Parent';
  return (
    <div className="fixed inset-0 z-50 bg-black/70 flex items-end" onClick={onClose}>
      <div className="w-full rounded-t-3xl p-6 flex flex-col gap-4"
        style={{ background: '#141829', border: '1px solid rgba(255,255,255,0.1)' }}
        onClick={e => e.stopPropagation()}>
        <div className="flex items-center justify-between">
          <h3 className="font-display font-bold text-white text-lg">{rel}'s Profile</h3>
          <button onClick={onClose} className="w-8 h-8 rounded-xl bg-white/8 flex items-center justify-center">
            <X size={16} className="text-white/60" />
          </button>
        </div>
        <div className="glass-card p-4 flex flex-col">
          {[['Name', `${titleStr}${parent.displayName}`], ['Relationship', rel], ['Email', parent.email], ['Mobile', parent.mobileNo]].map(([lbl, val]) =>
            val ? (
              <div key={lbl} className="flex justify-between gap-4 py-2.5 border-b border-white/5 last:border-0">
                <span className="text-white/40 text-xs font-body">{lbl}</span>
                <span className="text-white text-sm font-body text-right">{val}</span>
              </div>
            ) : null
          )}
        </div>
      </div>
    </div>
  );
}

/* ── Main Component ───────────────────────────────────────────────────────── */
export default function CreateEditUser() {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const { userType } = useAuth();

  const type   = searchParams.get('type') || 'student';
  const editId = searchParams.get('id') || null;
  const isEdit = !!editId;

  const isStudent     = type === 'student';
  const isTeacher     = type === 'teacher';
  const isParent      = type === 'parent';
  const isTeacherUser = userType === USER_TYPES.TEACHER;

  const color = isStudent ? '#F4A334' : isTeacher ? '#F9C61F' : '#E84545';
  const Icon  = isStudent ? GraduationCap : isTeacher ? UserCheck : Users;
  const label = isStudent ? 'Student' : isTeacher ? 'Teacher' : 'Parent / Guardian';

  const [loading, setLoading]                 = useState(false);
  const [fetching, setFetching]               = useState(isEdit);
  const [allStudents, setAllStudents]         = useState([]);
  const [generatingEnrol, setGeneratingEnrol] = useState(false);
  const [linkedParent, setLinkedParent]       = useState(null);
  const [showParentModal, setShowParentModal] = useState(false);

  const [form, setForm] = useState({
    givenName: '', familyName: '', displayName: '',
    email: '', title: '', gender: '', category: '',
    relationshipType: 'Parent', standard: '', division: '',
    enrollNo: '', subject: '', mobileNo: '', dob: '', bloodGroup: '',
  });

  const [children, setChildren] = useState([{ studentId: '', studentName: '', studentClass: '' }]);

  // Derived values
  const standardLabel = form.category === 'Secondary' ? 'Form' : 'Standard';
  const standardOpts  = form.category === 'Secondary' ? ['One', 'Two', 'Three'] : ['1','2','3','4','5','6'];
  const standardPH    = form.category === 'Secondary' ? 'Select Form' : 'Select standard';
  const showClassFields = isStudent && (form.category === 'Primary' || form.category === 'Secondary');

  const readyForEnrol = isStudent && !isEdit &&
    form.givenName.trim() && form.familyName.trim() &&
    form.email.trim() && form.gender && form.category &&
    (!showClassFields || (form.standard && form.division));

  // Load students for parent child-search
  useEffect(() => {
    if (!isParent) return;
    adminGetStudents().then(data => {
      data.sort((a, b) => (a.displayName || '').localeCompare(b.displayName || ''));
      setAllStudents(data);
    }).catch(() => {});
  }, [isParent]);

  // Load existing record for editing
  useEffect(() => {
    if (!isEdit) return;
    (async () => {
      try {
        const list = isStudent ? await adminGetStudents() : await adminGetTeachersParents();
        const rec  = list.find(r => r.id === editId);
        if (rec) {
          const gn = rec.givenName  || (rec.displayName || '').split(' ')[0] || '';
          const fn = rec.familyName || (rec.displayName || '').split(' ').slice(1).join(' ') || '';
          setForm(f => ({ ...f, ...rec, givenName: gn, familyName: fn }));
          if (rec.children?.length) setChildren(rec.children);
        }
        if (isStudent) {
          const parent = await adminGetLinkedParent(editId);
          setLinkedParent(parent);
        }
      } catch { toast.error('Failed to load record'); }
      finally { setFetching(false); }
    })();
  }, [editId]);

  // Auto-generate enrol number when prerequisite fields are filled
  useEffect(() => {
    if (!readyForEnrol || form.enrollNo || generatingEnrol) return;
    setGeneratingEnrol(true);
    adminGetNextEnrolNo()
      .then(next => setForm(f => ({ ...f, enrollNo: next })))
      .catch(() => {})
      .finally(() => setGeneratingEnrol(false));
  }, [readyForEnrol]);

  const set    = k => e => setForm(f => ({ ...f, [k]: e.target.value }));
  const setVal = k => v => setForm(f => ({ ...f, [k]: v }));

  const setCategory = (val) =>
    setForm(f => ({ ...f, category: val, standard: '', division: '', enrollNo: '' }));

  const updateChild = (i, data) => setChildren(prev => prev.map((c, j) => j === i ? { ...c, ...data } : c));
  const addChild    = () => setChildren(prev => [...prev, { studentId: '', studentName: '', studentClass: '' }]);
  const removeChild = (i) => setChildren(prev => prev.filter((_, j) => j !== i));

  const handleSave = async () => {
    if (isStudent) {
      if (!form.givenName.trim())  { toast.error('Given Name is required');  return; }
      if (!form.familyName.trim()) { toast.error('Family Name is required'); return; }
      if (!form.email.trim())      { toast.error('Email is required');        return; }
      if (!form.gender)            { toast.error('Gender is required');       return; }
    } else {
      if (!form.email.trim())       { toast.error('Email is required'); return; }
      if (!form.displayName.trim()) { toast.error('Name is required');  return; }
    }
    if ((isTeacher || isParent) && !form.title) { toast.error('Title is required'); return; }
    if (isParent && !isEdit && !children.some(c => c.studentId)) {
      toast.error('Please select at least one child'); return;
    }

    setLoading(true);
    try {
      if (isStudent) {
        const fullName = `${form.givenName.trim()} ${form.familyName.trim()}`;
        const data = {
          givenName: form.givenName.trim(),
          familyName: form.familyName.trim(),
          displayName: fullName,
          email: form.email.trim(),
          gender: form.gender,
          category: form.category,
          standard: form.standard,
          division: form.division,
          enrollNo: form.enrollNo.trim(),
          mobileNo: form.mobileNo.trim(),
          dob: form.dob,
          bloodGroup: form.bloodGroup,
        };
        isEdit ? await adminUpdateStudent(editId, data) : await adminCreateStudent(data);
        toast.success(isEdit ? 'Student updated!' : 'Student added!');
        navigate(isTeacherUser ? ROUTES.HOME : ROUTES.ADMIN_STUDENTS);
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
        navigate(isTeacherUser ? ROUTES.HOME : ROUTES.ADMIN_TEACHERS);
      }
    } catch (err) {
      toast.error(err.message || 'Something went wrong');
    } finally {
      setLoading(false);
    }
  };

  const backRoute = isTeacherUser
    ? ROUTES.HOME
    : isStudent ? ROUTES.ADMIN_STUDENTS : ROUTES.ADMIN_TEACHERS;

  const editStudentName = isStudent && isEdit
    ? `${form.givenName} ${form.familyName}`.trim() || 'Student'
    : null;

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
          <div className="flex items-center gap-2.5 flex-1 min-w-0">
            <div className="w-9 h-9 rounded-xl flex items-center justify-center shrink-0"
              style={{ background: `${color}22`, border: `1px solid ${color}33` }}>
              <Icon size={18} style={{ color }} />
            </div>
            <div className="min-w-0">
              <h1 className="font-display font-bold text-white text-xl leading-tight truncate">
                {isEdit && isStudent
                  ? `Edit ${editStudentName}'s Profile`
                  : isEdit ? `Edit ${label}` : `Add ${label}`}
              </h1>
              <p className="text-white/40 text-xs font-body">
                {isEdit ? 'Update details below' : 'Fill in details to pre-register'}
              </p>
            </div>
          </div>

          {/* Parent/Guardian icon — only when editing a student that has a confirmed parent */}
          {isEdit && isStudent && linkedParent && (
            <button onClick={() => setShowParentModal(true)}
              className="flex flex-col items-center gap-0.5 shrink-0">
              <div className="w-9 h-9 rounded-xl bg-red-500/15 border border-red-500/25 flex items-center justify-center">
                <User2 size={17} className="text-red-400" />
              </div>
              <span style={{ color: 'rgba(232,69,69,0.8)', fontSize: '9px' }} className="font-body leading-none">
                {linkedParent.relationshipType || 'Parent'}
              </span>
            </button>
          )}
        </div>
      </div>

      <div className="flex-1 overflow-y-auto px-5 pb-10">
        <div className="flex flex-col gap-4">

          {/* ── STUDENT FIELDS ─────────────────────────────── */}
          {isStudent && (
            <>
              <Field label="Given Name"   value={form.givenName}   onChange={set('givenName')}   placeholder="e.g. John"  required />
              <Field label="Family Name"  value={form.familyName}  onChange={set('familyName')}  placeholder="e.g. Smith" required />
              <Field label="Email Address" value={form.email} onChange={set('email')}
                placeholder="student@example.com" type="email" disabled={isEdit}
                note={isEdit ? 'Email cannot be changed' : 'Student will register using this email'} required />

              <CustomDropdown label="Gender" value={form.gender} onChange={setVal('gender')}
                options={GENDERS} placeholder="Select gender" required />

              <CustomDropdown label="Category" value={form.category} onChange={setCategory}
                options={['Primary', 'Secondary']} placeholder="Select category" required />

              {showClassFields && (
                <div className="flex gap-3">
                  <div className="flex-1">
                    <CustomDropdown label={standardLabel} value={form.standard}
                      onChange={setVal('standard')} options={standardOpts} placeholder={standardPH} />
                  </div>
                  <div className="flex-1">
                    <CustomDropdown label="Class" value={form.division}
                      onChange={setVal('division')} options={['A', 'B']} placeholder="Select Class" />
                  </div>
                </div>
              )}

              {/* Enrol No. — auto-generated, read-only */}
              <div>
                <label className="text-white/60 text-xs font-body font-medium mb-1.5 block">Enrol No.</label>
                <div className="relative">
                  <input className="field-dark opacity-60 cursor-not-allowed w-full" readOnly
                    value={generatingEnrol ? 'Generating…' : (form.enrollNo || '')}
                    placeholder="This is auto-generated"
                    style={{
                      fontStyle: form.enrollNo || generatingEnrol ? 'normal' : 'italic',
                      color: form.enrollNo ? undefined : 'rgba(255,255,255,0.35)',
                    }} />
                  {generatingEnrol && (
                    <div className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 border-2 border-white/20 border-t-white/60 rounded-full animate-spin" />
                  )}
                </div>
              </div>

              {/* Date of Birth — calendar */}
              <div>
                <label className="text-white/60 text-xs font-body font-medium mb-1.5 block">Date of Birth</label>
                <input className="field-dark" type="date" value={form.dob || ''}
                  onChange={set('dob')} style={{ colorScheme: 'dark' }} />
              </div>

              <CustomDropdown label="Blood Group" value={form.bloodGroup} onChange={setVal('bloodGroup')}
                options={['A+', 'A−', 'B+', 'B−', 'O+', 'O−', 'AB+', 'AB−']}
                placeholder="Select blood type" />

              <div>
                <label className="text-white/60 text-xs font-body font-medium mb-1.5 block">Phone No.</label>
                <input className="field-dark" type="tel" value={form.mobileNo || ''}
                  onChange={set('mobileNo')} placeholder="+677 xx xxxxx"
                  style={{ fontStyle: form.mobileNo ? 'normal' : 'italic' }} />
              </div>
            </>
          )}

          {/* ── TEACHER / PARENT FIELDS ────────────────────── */}
          {(isTeacher || isParent) && (
            <>
              <SelectField label="Title" value={form.title} onChange={set('title')} options={TITLES} required />
              <Field label="Full Name" value={form.displayName} onChange={set('displayName')} placeholder="e.g. John Smith" required />
              <Field label="Email Address" value={form.email} onChange={set('email')}
                placeholder="user@example.com" type="email" disabled={isEdit}
                note={isEdit ? 'Email cannot be changed' : 'User will register using this email'} required />

              {isParent && (
                <div>
                  <label className="text-white/60 text-xs font-body font-medium mb-2 block">
                    Relationship to Student<span className="text-red-400 ml-0.5">*</span>
                  </label>
                  <div className="flex gap-2">
                    {RELATIONSHIP_TYPES.map(rt => (
                      <button key={rt} type="button"
                        onClick={() => setForm(f => ({ ...f, relationshipType: rt }))}
                        className="flex-1 py-3 rounded-2xl font-display font-semibold text-sm transition-all duration-200"
                        style={form.relationshipType === rt
                          ? { background: '#E84545', color: '#fff' }
                          : { background: 'rgba(255,255,255,0.06)', color: 'rgba(255,255,255,0.5)', border: '1px solid rgba(255,255,255,0.1)' }}>
                        {rt}
                      </button>
                    ))}
                  </div>
                </div>
              )}

              {isTeacher && (
                <>
                  <Field label="Subject" value={form.subject} onChange={set('subject')} placeholder="e.g. Mathematics" />
                  <Field label="Mobile No." value={form.mobileNo} onChange={set('mobileNo')} placeholder="+677 xx xxxxx" type="tel" />
                </>
              )}

              {isParent && (
                <div>
                  <label className="text-white/60 text-xs font-body font-medium mb-2 block">
                    Child / Children at this school<span className="text-red-400 ml-0.5">*</span>
                  </label>
                  <div className="flex flex-col gap-3">
                    {children.map((child, i) => (
                      <ChildSearchRow key={i} index={i} child={child} allStudents={allStudents}
                        onChange={data => updateChild(i, data)}
                        onRemove={() => children.length > 1 ? removeChild(i) : null} />
                    ))}
                    <button type="button" onClick={addChild}
                      className="flex items-center gap-2 text-sm font-display font-semibold py-3 px-4 rounded-2xl transition-colors"
                      style={{ background: 'rgba(232,69,69,0.1)', border: '1px dashed rgba(232,69,69,0.4)', color: '#E84545' }}>
                      <Plus size={15} />Add another child
                    </button>
                  </div>
                  <div className="mt-3">
                    <Field label="Mobile No." value={form.mobileNo} onChange={set('mobileNo')} placeholder="+677 xx xxxxx" type="tel" />
                  </div>
                </div>
              )}
            </>
          )}

          {/* Info note */}
          {!isEdit && (
            <div className="p-3.5 rounded-xl bg-white/5 border border-white/10">
              <p className="text-white/60 text-xs font-body font-semibold mb-1">ℹ️ How activation works</p>
              <p className="text-white/45 text-xs font-body leading-relaxed">
                This pre-registers the {label.toLowerCase()} in the system. They must open the app,
                select the <span className="text-white/70 font-semibold">"{isStudent ? 'Student' : 'Parent / Teacher'}"</span> tab
                and tap <span className="text-yellow-400 font-semibold">"Register"</span> using this email.
                {isParent && ' The child(ren) will receive a confirmation request in their panel.'}
              </p>
            </div>
          )}

          {/* Save */}
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

      {showParentModal && (
        <LinkedParentModal parent={linkedParent} onClose={() => setShowParentModal(false)} />
      )}
    </div>
  );
}
