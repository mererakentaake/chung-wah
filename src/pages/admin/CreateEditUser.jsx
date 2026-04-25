// src/pages/admin/CreateEditUser.jsx
import React, { useState, useEffect } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { ArrowLeft, Save, GraduationCap, UserCheck, Users } from 'lucide-react';
import toast from 'react-hot-toast';
import {
  adminCreateStudent, adminCreateTeacherParent,
  adminUpdateStudent, adminUpdateTeacherParent,
  adminGetStudents, adminGetTeachersParents,
} from '../../services/firestore';
import { ROUTES } from '../../utils/constants';

export default function CreateEditUser() {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const type = searchParams.get('type') || 'student'; // 'student' | 'teacher' | 'parent'
  const editId = searchParams.get('id') || null;
  const isEdit = !!editId;

  const isStudent = type === 'student';
  const isTeacher = type === 'teacher';
  const isParent = type === 'parent';

  const color = isStudent ? '#F4A334' : isTeacher ? '#F9C61F' : '#E84545';
  const Icon = isStudent ? GraduationCap : isTeacher ? UserCheck : Users;
  const label = isStudent ? 'Student' : isTeacher ? 'Teacher' : 'Parent';

  const [loading, setLoading] = useState(false);
  const [fetching, setFetching] = useState(isEdit);

  const [form, setForm] = useState({
    displayName: '',
    email: '',
    standard: '',
    division: '',
    enrollNo: '',
    subject: '',         // for teachers
    mobileNo: '',
    dob: '',
    bloodGroup: '',
    childName: '',       // for parents
    childClass: '',      // for parents
  });

  // Load existing data when editing
  useEffect(() => {
    if (!isEdit) return;
    const load = async () => {
      try {
        const list = isStudent ? await adminGetStudents() : await adminGetTeachersParents();
        const record = list.find(r => r.id === editId);
        if (record) setForm(f => ({ ...f, ...record }));
      } catch {
        toast.error('Failed to load record');
      } finally {
        setFetching(false);
      }
    };
    load();
  }, [editId]);

  const set = k => e => setForm(f => ({ ...f, [k]: e.target.value }));

  const handleSave = async () => {
    if (!form.email.trim()) { toast.error('Email is required'); return; }
    if (!form.displayName.trim()) { toast.error('Name is required'); return; }

    setLoading(true);
    try {
      if (isStudent) {
        const data = {
          displayName: form.displayName.trim(),
          email: form.email.trim(),
          standard: form.standard.trim(),
          division: form.division.trim().toUpperCase(),
          enrollNo: form.enrollNo.trim(),
          mobileNo: form.mobileNo.trim(),
          dob: form.dob.trim(),
          bloodGroup: form.bloodGroup.trim(),
        };
        if (isEdit) {
          await adminUpdateStudent(editId, data);
          toast.success('Student updated!');
        } else {
          await adminCreateStudent(data);
          toast.success('Student added!');
        }
        navigate(ROUTES.ADMIN_STUDENTS);
      } else {
        const data = {
          displayName: form.displayName.trim(),
          email: form.email.trim(),
          isATeacher: isTeacher,
          subject: form.subject.trim(),
          mobileNo: form.mobileNo.trim(),
          childName: form.childName.trim(),
          childClass: form.childClass.trim(),
        };
        if (isEdit) {
          await adminUpdateTeacherParent(editId, data);
          toast.success(`${label} updated!`);
        } else {
          await adminCreateTeacherParent(data);
          toast.success(`${label} added!`);
        }
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
          <button
            onClick={() => navigate(backRoute)}
            className="w-9 h-9 rounded-xl bg-white/8 border border-white/10 flex items-center justify-center"
          >
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

          {/* Common fields */}
          <Field label="Full Name *" value={form.displayName} onChange={set('displayName')} placeholder="e.g. John Smith" />
          <Field label="Email Address *" value={form.email} onChange={set('email')} placeholder="user@example.com" type="email"
            disabled={isEdit} note={isEdit ? 'Email cannot be changed' : 'User will register using this email'} />

          {/* Student-specific */}
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

          {/* Teacher-specific */}
          {isTeacher && (
            <>
              <Field label="Subject" value={form.subject} onChange={set('subject')} placeholder="e.g. Mathematics" />
              <Field label="Mobile No." value={form.mobileNo} onChange={set('mobileNo')} placeholder="+675 XXX XXXX" type="tel" />
            </>
          )}

          {/* Parent-specific */}
          {isParent && (
            <>
              <Field label="Child's Name" value={form.childName} onChange={set('childName')} placeholder="Name of child at school" />
              <Field label="Child's Class" value={form.childClass} onChange={set('childClass')} placeholder="e.g. Std 7 A" />
              <Field label="Mobile No." value={form.mobileNo} onChange={set('mobileNo')} placeholder="+675 XXX XXXX" type="tel" />
            </>
          )}

          {/* Info note */}
          {!isEdit && (
            <div className="p-3.5 rounded-xl bg-white/5 border border-white/10">
              <p className="text-white/50 text-xs font-body leading-relaxed">
                ℹ️ This pre-registers the {label.toLowerCase()} in the system. They will then download the app
                and register using this exact email address to activate their account.
              </p>
            </div>
          )}

          {/* Save button */}
          <button
            onClick={handleSave}
            disabled={loading}
            className="w-full h-14 rounded-2xl font-display font-bold text-base
                       flex items-center justify-center gap-2 mt-2 disabled:opacity-50 transition-all"
            style={{
              background: `linear-gradient(135deg, ${color}, ${color}cc)`,
              color: isStudent || isParent ? '#0a0f2c' : '#0a0f2c',
            }}
          >
            {loading ? (
              <div className="w-5 h-5 border-2 border-current/40 border-t-current rounded-full animate-spin" />
            ) : (
              <>
                <Save size={18} />
                {isEdit ? `Update ${label}` : `Add ${label}`}
              </>
            )}
          </button>
        </div>
      </div>
    </div>
  );
}

function Field({ label, value, onChange, placeholder, type = 'text', disabled = false, note }) {
  return (
    <div>
      <label className="text-white/60 text-xs font-body font-medium mb-1.5 block">{label}</label>
      <input
        className={`field ${disabled ? 'opacity-50 cursor-not-allowed' : ''}`}
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
