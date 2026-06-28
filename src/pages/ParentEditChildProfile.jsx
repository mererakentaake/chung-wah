// src/pages/ParentEditChildProfile.jsx
// Parent can edit their confirmed child's profile (photo, DOB, blood group,
// gender, phone, emergency contact). Name, enrol number and class are read-only.
import React, { useState, useEffect, useRef } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import {
  Camera, Save, GraduationCap, Lock, AlertCircle
} from 'lucide-react';
import toast from 'react-hot-toast';
import { useAuth } from '../context/AuthContext';
import {
  getProfile, updateProfile, updateProfilePhoto,
  uploadFile, adminGetStudents, getParentGuardianLinks
} from '../services/firestore';
import { ROUTES, GENDERS, BLOOD_GROUPS } from '../utils/constants';
import TopBar from '../components/layout/TopBar';
import BottomNav from '../components/layout/BottomNav';

const FIELD = ({ label, value, onChange, type = 'text', placeholder = '', disabled = false, note }) => (
  <div>
    <label className="text-gray-500 text-xs font-body font-medium mb-1.5 block">{label}</label>
    <input
      className={`field ${disabled ? 'opacity-50 cursor-not-allowed bg-gray-50' : ''}`}
      type={type}
      value={value}
      onChange={onChange}
      placeholder={placeholder}
      disabled={disabled}
    />
    {note && <p className="text-gray-400 text-[11px] font-body mt-1">{note}</p>}
  </div>
);

const SELECT = ({ label, value, onChange, options, disabled = false }) => (
  <div>
    <label className="text-gray-500 text-xs font-body font-medium mb-1.5 block">{label}</label>
    <select
      className={`field ${disabled ? 'opacity-50 cursor-not-allowed bg-gray-50' : ''}`}
      value={value}
      onChange={onChange}
      disabled={disabled}
    >
      <option value="">Select…</option>
      {options.map(o => <option key={o} value={o}>{o}</option>)}
    </select>
  </div>
);

const BLOOD_GROUPS_LIST = ['A+', 'A-', 'B+', 'B-', 'AB+', 'AB-', 'O+', 'O-'];

export default function ParentEditChildProfile() {
  const { studentId } = useParams();
  const navigate = useNavigate();
  const { userId } = useAuth();
  const fileRef = useRef(null);

  // Form state — parent-editable fields
  const [form, setForm] = useState({
    dob:                   '',
    bloodGroup:            '',
    gender:                '',
    mobileNo:              '',
    emergencyContactName:  '',
    emergencyContactPhone: '',
  });
  // Read-only reference fields (shown but not sent)
  const [readOnly, setReadOnly] = useState({
    displayName: '',
    enrollNo:    '',
    schoolClass: '',
  });
  const [photoUrl, setPhotoUrl]     = useState(null);
  const [photoFile, setPhotoFile]   = useState(null);
  const [photoPreview, setPhotoPreview] = useState(null);
  const [loading, setLoading]       = useState(true);
  const [saving, setSaving]         = useState(false);
  const [authorized, setAuthorized] = useState(false);

  // Verify this parent is actually linked to this student
  useEffect(() => {
    if (!userId || !studentId) return;
    getParentGuardianLinks(userId, links => {
      const confirmed = links.find(
        l => l.studentDocId === studentId && l.status === 'confirmed'
      );
      setAuthorized(!!confirmed);
    });
  }, [userId, studentId]);

  // Load student profile from both Login collection (authoritative) and users collection
  useEffect(() => {
    if (!studentId) return;
    Promise.all([
      getProfile(studentId),
      adminGetStudents().catch(() => []),
    ]).then(([profile, students]) => {
      const loginData = students.find(s => s.id === studentId) || {};
      // Merge: profile (users/) may have newer editable fields; loginData has name/class/enrolNo
      setReadOnly({
        displayName: loginData.displayName || profile?.displayName || '',
        enrollNo:    loginData.enrollNo    || profile?.enrollNo    || '',
        schoolClass: loginData.schoolClass || profile?.schoolClass || '',
      });
      setForm({
        dob:                   profile?.dob                   || loginData.dob                   || '',
        bloodGroup:            profile?.bloodGroup            || loginData.bloodGroup            || '',
        gender:                profile?.gender                || loginData.gender                || '',
        mobileNo:              profile?.mobileNo              || loginData.mobileNo              || '',
        emergencyContactName:  profile?.emergencyContactName  || loginData.emergencyContactName  || '',
        emergencyContactPhone: profile?.emergencyContactPhone || loginData.emergencyContactPhone || '',
      });
      setPhotoUrl(profile?.photoUrl || null);
    }).catch(() => {}).finally(() => setLoading(false));
  }, [studentId]);

  const handlePhotoChange = (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setPhotoFile(file);
    const reader = new FileReader();
    reader.onload = ev => setPhotoPreview(ev.target.result);
    reader.readAsDataURL(file);
  };

  const set = (k) => (e) => setForm(f => ({ ...f, [k]: e.target.value }));

  const handleSave = async () => {
    setSaving(true);
    try {
      // Upload photo first if a new one was selected
      if (photoFile) {
        const url = await uploadFile(photoFile, `profiles/${studentId}_${Date.now()}`);
        await updateProfilePhoto(studentId, url);
      }
      // Save editable fields to users/{studentId}
      await updateProfile(studentId, {
        dob:                   form.dob,
        bloodGroup:            form.bloodGroup,
        gender:                form.gender,
        mobileNo:              form.mobileNo.trim(),
        emergencyContactName:  form.emergencyContactName.trim(),
        emergencyContactPhone: form.emergencyContactPhone.trim(),
      });
      toast.success('Profile updated!');
      navigate(ROUTES.CHILDREN);
    } catch (err) {
      toast.error(err.message || 'Failed to save. Try again.');
    } finally {
      setSaving(false);
    }
  };

  if (loading) return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center">
      <div className="w-8 h-8 border-2 border-indigo-500 border-t-transparent rounded-full animate-spin" />
    </div>
  );

  if (!authorized) return (
    <div className="min-h-screen bg-gray-50 flex flex-col">
      <TopBar title="Edit Profile" showBack />
      <div className="flex-1 flex flex-col items-center justify-center gap-3 px-6 text-center">
        <div className="w-14 h-14 rounded-2xl bg-red-50 flex items-center justify-center">
          <AlertCircle size={24} className="text-red-400" />
        </div>
        <p className="text-gray-700 font-display font-semibold">Not Authorised</p>
        <p className="text-gray-400 text-sm font-body">
          You are not linked to this student's profile.
        </p>
      </div>
    </div>
  );

  const currentPhoto = photoPreview || photoUrl;

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col">
      <TopBar title={readOnly.displayName ? `Edit ${readOnly.displayName.split(' ')[0]}'s Profile` : 'Edit Profile'} showBack>
        <button onClick={handleSave} disabled={saving}
          className="flex items-center gap-1.5 px-3 h-9 rounded-xl bg-indigo-600 text-white text-sm font-display font-semibold disabled:opacity-50">
          {saving
            ? <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
            : <><Save size={15} /> Save</>}
        </button>
      </TopBar>

      <div className="flex-1 overflow-y-auto px-4 pt-4 pb-28 flex flex-col gap-4">

        {/* Photo picker */}
        <div className="flex flex-col items-center py-4">
          <div className="relative">
            <div className="w-24 h-24 rounded-3xl overflow-hidden border-2 border-gray-200 bg-gray-100">
              {currentPhoto ? (
                <img src={currentPhoto} alt="" className="w-full h-full object-cover" />
              ) : (
                <div className="w-full h-full flex items-center justify-center">
                  <GraduationCap size={32} className="text-gray-400" />
                </div>
              )}
            </div>
            <button
              onClick={() => fileRef.current?.click()}
              className="absolute -bottom-2 -right-2 w-9 h-9 rounded-xl bg-indigo-600 flex items-center justify-center shadow-md">
              <Camera size={16} className="text-white" />
            </button>
            <input ref={fileRef} type="file" accept="image/*" className="hidden" onChange={handlePhotoChange} />
          </div>
          {photoPreview && (
            <p className="text-indigo-500 text-xs font-body mt-3">New photo selected — tap Save to apply</p>
          )}
        </div>

        {/* Read-only section */}
        <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-4 flex flex-col gap-3">
          <div className="flex items-center gap-1.5 mb-1">
            <Lock size={12} className="text-gray-400" />
            <p className="text-gray-400 text-xs font-body font-semibold uppercase tracking-wider">
              School Records (read-only)
            </p>
          </div>
          <FIELD label="Full Name"       value={readOnly.displayName} onChange={() => {}} disabled note="Managed by the school. Contact Admin to request a correction." />
          <FIELD label="Enrolment No."   value={readOnly.enrollNo}    onChange={() => {}} disabled />
          <FIELD label="Class"           value={readOnly.schoolClass} onChange={() => {}} disabled />
        </div>

        {/* Editable section */}
        <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-4 flex flex-col gap-4">
          <p className="text-gray-400 text-xs font-body font-semibold uppercase tracking-wider">
            Personal Details
          </p>

          <SELECT label="Gender" value={form.gender} onChange={set('gender')} options={GENDERS} />

          <FIELD label="Date of Birth" value={form.dob} onChange={set('dob')}
            type="date" />

          <SELECT label="Blood Group" value={form.bloodGroup} onChange={set('bloodGroup')}
            options={BLOOD_GROUPS_LIST} />

          <FIELD label="Contact Phone" value={form.mobileNo} onChange={set('mobileNo')}
            type="tel" placeholder="+677 xx xxxxx" />
        </div>

        {/* Emergency contact */}
        <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-4 flex flex-col gap-4">
          <p className="text-gray-400 text-xs font-body font-semibold uppercase tracking-wider">
            Emergency Contact
          </p>
          <FIELD label="Full Name" value={form.emergencyContactName} onChange={set('emergencyContactName')}
            placeholder="e.g. John Doe" />
          <FIELD label="Phone Number" value={form.emergencyContactPhone} onChange={set('emergencyContactPhone')}
            type="tel" placeholder="+677 xx xxxxx" />
          <p className="text-gray-400 text-xs font-body leading-relaxed">
            This person will be contacted in case of an emergency at school.
          </p>
        </div>

        <button onClick={handleSave} disabled={saving}
          className="w-full h-14 rounded-2xl font-display font-bold text-white flex items-center justify-center gap-2 disabled:opacity-50"
          style={{ background: 'linear-gradient(135deg, #6366f1, #4f46e5)' }}>
          {saving
            ? <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
            : <><Save size={18} /> Save Changes</>}
        </button>
      </div>
      <BottomNav userType="parent" />
    </div>
  );
}
