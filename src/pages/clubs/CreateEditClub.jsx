// src/pages/clubs/CreateEditClub.jsx
import React, { useState, useEffect } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { Save } from 'lucide-react';
import toast from 'react-hot-toast';
import { useAuth } from '../../context/AuthContext';
import { getClubs, createClub, updateClub, adminGetTeachersParents } from '../../services/firestore';
import { ROUTES } from '../../utils/constants';
import TopBar from '../../components/layout/TopBar';
import BottomNav from '../../components/layout/BottomNav';

export default function CreateEditClub() {
  const [searchParams] = useSearchParams();
  const editId = searchParams.get('edit');
  const isEdit = !!editId;
  const navigate = useNavigate();
  const { userType } = useAuth();

  const [form, setForm] = useState({
    name: '', description: '', programme: '',
    teacherId: '', teacherName: '', isActive: true,
  });
  const [teachers, setTeachers] = useState([]);
  const [saving, setSaving]     = useState(false);
  const [loading, setLoading]   = useState(isEdit);

  const set = k => e => setForm(f => ({ ...f, [k]: e.target.value }));

  // Load existing club for edit
  useEffect(() => {
    if (!isEdit) return;
    const unsub = getClubs(all => {
      const found = all.find(c => c.id === editId);
      if (found) {
        setForm({
          name:        found.name || '',
          description: found.description || '',
          programme:   found.programme || '',
          teacherId:   found.teacherId || '',
          teacherName: found.teacherName || '',
          isActive:    found.isActive !== false,
        });
        setLoading(false);
      }
    });
    return unsub;
  }, [isEdit, editId]);

  // Load teachers
  useEffect(() => {
    adminGetTeachersParents().then(all => {
      setTeachers(all.filter(t => t.isATeacher));
    }).catch(() => {});
  }, []);

  const handleTeacherChange = (e) => {
    const teacher = teachers.find(t => t.id === e.target.value);
    setForm(f => ({
      ...f,
      teacherId: teacher?.id || '',
      teacherName: teacher?.displayName || '',
    }));
  };

  const handleSave = async () => {
    if (!form.name.trim()) { toast.error('Enter a club name'); return; }
    setSaving(true);
    try {
      if (isEdit) {
        await updateClub(editId, form);
        toast.success('Club updated!');
      } else {
        await createClub(form);
        toast.success('Club created!');
      }
      navigate(ROUTES.CLUBS);
    } catch (err) {
      toast.error(err.message || 'Failed to save');
    } finally {
      setSaving(false);
    }
  };

  if (loading) return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center">
      <div className="w-8 h-8 border-2 border-emerald-500 border-t-transparent rounded-full animate-spin" />
    </div>
  );

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col">
      <TopBar title={isEdit ? 'Edit Club' : 'New Club'} showBack>
        <button onClick={handleSave} disabled={saving}
          className="flex items-center gap-1.5 px-3 h-9 rounded-xl bg-emerald-600 text-white text-sm font-display font-semibold disabled:opacity-50">
          {saving
            ? <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
            : <><Save size={15} /> Save</>}
        </button>
      </TopBar>

      <div className="flex-1 overflow-y-auto px-4 pt-4 pb-28">
        <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-4 flex flex-col gap-4">

          <div>
            <label className="text-gray-500 text-xs font-body mb-1.5 block">Club Name *</label>
            <input className="field" placeholder="e.g. Chess Club"
              value={form.name} onChange={set('name')} />
          </div>

          <div>
            <label className="text-gray-500 text-xs font-body mb-1.5 block">Description</label>
            <textarea className="field min-h-[80px] resize-none text-sm"
              placeholder="Brief overview of the club's purpose and activities..."
              value={form.description} onChange={set('description')} />
          </div>

          <div>
            <label className="text-gray-500 text-xs font-body mb-1.5 block">Programme / Syllabus</label>
            <textarea className="field min-h-[120px] resize-none text-sm"
              placeholder="Detailed curriculum, schedule, activities and goals for this club..."
              value={form.programme} onChange={set('programme')} />
          </div>

          <div>
            <label className="text-gray-500 text-xs font-body mb-1.5 block">Assigned Teacher</label>
            <select className="field" value={form.teacherId} onChange={handleTeacherChange}>
              <option value="">Select teacher...</option>
              {teachers.map(t => (
                <option key={t.id} value={t.id}>{t.displayName}</option>
              ))}
            </select>
          </div>

          {isEdit && (
            <div>
              <label className="text-gray-500 text-xs font-body mb-1.5 block">Status</label>
              <div className="flex gap-2">
                {[{ v: true, l: 'Active' }, { v: false, l: 'Inactive' }].map(opt => (
                  <button key={String(opt.v)}
                    onClick={() => setForm(f => ({ ...f, isActive: opt.v }))}
                    className={`flex-1 py-2.5 rounded-xl text-sm font-display font-semibold transition-all ${
                      form.isActive === opt.v
                        ? opt.v ? 'bg-emerald-600 text-white' : 'bg-gray-500 text-white'
                        : 'bg-gray-100 text-gray-500'
                    }`}>
                    {opt.l}
                  </button>
                ))}
              </div>
            </div>
          )}
        </div>

        <button onClick={handleSave} disabled={saving}
          className="w-full mt-5 h-14 rounded-2xl font-display font-bold text-white flex items-center justify-center gap-2 disabled:opacity-50"
          style={{ background: 'linear-gradient(135deg, #10b981, #059669)' }}>
          {saving
            ? <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
            : <><Save size={18} /> {isEdit ? 'Update Club' : 'Create Club'}</>}
        </button>
      </div>
      <BottomNav userType={userType} />
    </div>
  );
}
