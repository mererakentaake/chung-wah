// src/pages/Profile.jsx
import React, { useState, useEffect } from 'react';
import { Camera, Save, GraduationCap } from 'lucide-react';
import toast from 'react-hot-toast';
import { useAuth } from '../context/AuthContext';
import { getProfile, updateProfile, uploadFile } from '../services/firestore';
import TopBar from '../components/layout/TopBar';
import BottomNav from '../components/layout/BottomNav';
import { USER_TYPES } from '../utils/constants';

export default function Profile() {
  const { userType, userId, user } = useAuth();
  const isStudent = userType === USER_TYPES.STUDENT;
  const [profile, setProfile] = useState(null);
  const [loading, setLoading] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [form, setForm] = useState({
    displayName: '', standard: '', division: '',
    guardianName: '', dob: '', bloodGroup: '', mobileNo: '', enrollNo: ''
  });

  useEffect(() => {
    if (userId) {
      getProfile(userId).then(p => {
        if (p) { setProfile(p); setForm({ ...form, ...p }); }
      });
    }
  }, [userId]);

  const set = k => e => setForm(f => ({ ...f, [k]: e.target.value }));

  const handlePhoto = async (e) => {
    const file = e.target.files[0];
    if (!file) return;
    setUploading(true);
    try {
      const url = await uploadFile(file, `schools/${localStorage.getItem('schoolCode')}/profiles/${userId}`);
      await updateProfile(userId, { photoUrl: url });
      setProfile(p => ({ ...p, photoUrl: url }));
      toast.success('Photo updated!');
    } catch { toast.error('Photo upload failed'); }
    finally { setUploading(false); }
  };

  const save = async () => {
    setLoading(true);
    try {
      await updateProfile(userId, { ...form, division: form.division?.toUpperCase() });
      toast.success('Profile saved!');
    } catch { toast.error('Save failed'); }
    finally { setLoading(false); }
  };

  return (
    <div className="min-h-screen mesh-bg flex flex-col">
      <TopBar title="My Profile" showBack />
      <div className="flex-1 overflow-y-auto px-4 pt-4 pb-28">
        {/* Avatar */}
        <div className="flex flex-col items-center mb-8">
          <div className="relative">
            <div className="w-24 h-24 rounded-3xl overflow-hidden border-2 border-gold-500/40">
              {profile?.photoUrl && profile.photoUrl !== 'default' ? (
                <img src={profile.photoUrl} alt="" className="w-full h-full object-cover" />
              ) : (
                <div className="w-full h-full bg-gradient-to-br from-gold-500 to-coral-500 flex items-center justify-center">
                  <GraduationCap size={40} className="text-white" />
                </div>
              )}
              {uploading && (
                <div className="absolute inset-0 bg-black/50 flex items-center justify-center">
                  <div className="w-6 h-6 border-2 border-white/60 border-t-white rounded-full animate-spin" />
                </div>
              )}
            </div>
            <label className="absolute -bottom-2 -right-2 w-8 h-8 rounded-xl bg-gold-500 flex items-center justify-center cursor-pointer shadow-glow-gold">
              <Camera size={15} className="text-navy-900" />
              <input type="file" accept="image/*" className="hidden" onChange={handlePhoto} />
            </label>
          </div>
          <p className="text-white font-display font-bold text-lg mt-3">{form.displayName || 'Your Name'}</p>
          <p className="text-white/40 text-sm font-body">{user?.email}</p>
        </div>

        {/* Fields */}
        <div className="flex flex-col gap-4">
          <Field label="Full Name" value={form.displayName} onChange={set('displayName')} placeholder="Your full name" />
          {isStudent && <>
            <div className="flex gap-3">
              <Field label="Standard" value={form.standard} onChange={set('standard')} placeholder="e.g. 9" />
              <Field label="Division" value={form.division} onChange={set('division')} placeholder="e.g. A" />
            </div>
            <Field label="Enroll No." value={form.enrollNo} onChange={set('enrollNo')} placeholder="School-assigned ID" />
          </>}
          <Field label={isStudent ? "Guardian Name" : "Name"} value={form.guardianName} onChange={set('guardianName')} placeholder="Parent/guardian name" />
          <Field label="Date of Birth" value={form.dob} onChange={set('dob')} placeholder="DD/MM/YYYY" />
          <Field label="Blood Group" value={form.bloodGroup} onChange={set('bloodGroup')} placeholder="e.g. O+" />
          <Field label="Mobile No." value={form.mobileNo} onChange={set('mobileNo')} placeholder="+60 12 345 6789" type="tel" />

          <button onClick={save} disabled={loading}
            className="w-full h-14 rounded-2xl btn-gradient font-display font-bold text-navy-900 flex items-center justify-center gap-2 mt-2 disabled:opacity-50">
            <Save size={18} />
            {loading ? 'Saving...' : 'Save Profile'}
          </button>
        </div>
      </div>
      <BottomNav userType={userType} />
    </div>
  );
}

function Field({ label, value, onChange, placeholder, type = 'text' }) {
  return (
    <div>
      <label className="text-white/50 text-xs font-body font-medium mb-1.5 block">{label}</label>
      <input className="field" type={type} value={value || ''} onChange={onChange} placeholder={placeholder} />
    </div>
  );
}
