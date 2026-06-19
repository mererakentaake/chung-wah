// src/pages/permissions/CreatePermissionForm.jsx
import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Save, Plus, X } from 'lucide-react';
import toast from 'react-hot-toast';
import { useAuth } from '../../context/AuthContext';
import { createPermissionForm } from '../../services/firestore';
import { ROUTES, SCHOOL_STRUCTURE } from '../../utils/constants';
import TopBar from '../../components/layout/TopBar';
import BottomNav from '../../components/layout/BottomNav';

export default function CreatePermissionForm() {
  const navigate = useNavigate();
  const { userType, userId } = useAuth();

  const [form, setForm] = useState({
    schoolClass:          '',
    activityTitle:        '',
    description:          '',
    activityDate:         '',
    startTime:            '',
    endTime:              '',
    responsibleTeachers:  '',
    rules:                '',
    materials:            [''],
  });
  const [saving, setSaving] = useState(false);
  const set = k => e => setForm(f => ({ ...f, [k]: e.target.value }));

  const updateMaterial = (i, val) => {
    const copy = [...form.materials];
    copy[i] = val;
    setForm(f => ({ ...f, materials: copy }));
  };
  const addMaterial    = () => setForm(f => ({ ...f, materials: [...f.materials, ''] }));
  const removeMaterial = i  => setForm(f => ({ ...f, materials: f.materials.filter((_, idx) => idx !== i) }));

  const handleSave = async () => {
    if (!form.schoolClass)   { toast.error('Select a class');          return; }
    if (!form.activityTitle) { toast.error('Enter activity title');    return; }
    if (!form.activityDate)  { toast.error('Enter the activity date'); return; }
    setSaving(true);
    try {
      await createPermissionForm({
        schoolClass:         form.schoolClass,
        activityTitle:       form.activityTitle.trim(),
        description:         form.description.trim(),
        activityDate:        form.activityDate,
        startTime:           form.startTime,
        endTime:             form.endTime,
        responsibleTeachers: form.responsibleTeachers.trim(),
        rules:               form.rules.trim(),
        materials:           form.materials.filter(m => m.trim()),
        createdByName:       '',
      });
      toast.success('Permission form sent to parents!');
      navigate(ROUTES.PERMISSIONS);
    } catch (err) {
      toast.error(err.message || 'Failed to create');
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col">
      <TopBar title="New Permission Form" showBack>
        <button onClick={handleSave} disabled={saving}
          className="flex items-center gap-1.5 px-3 h-9 rounded-xl bg-violet-600 text-white text-sm font-display font-semibold disabled:opacity-50">
          {saving
            ? <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
            : <><Save size={15} /> Send</>}
        </button>
      </TopBar>

      <div className="flex-1 overflow-y-auto px-4 pt-4 pb-28 flex flex-col gap-4">

        {/* Activity details */}
        <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-4 flex flex-col gap-4">
          <p className="text-gray-400 text-xs font-body font-semibold uppercase tracking-wider">Activity Details</p>

          <div>
            <label className="text-gray-500 text-xs font-body mb-1.5 block">Class *</label>
            <select className="field" value={form.schoolClass}
              onChange={e => setForm(f => ({ ...f, schoolClass: e.target.value }))}>
              <option value="">Select class...</option>
              {Object.values(SCHOOL_STRUCTURE).map(s => (
                <optgroup key={s.label} label={s.label}>
                  {s.classes.map(cls => <option key={cls} value={cls}>{cls}</option>)}
                </optgroup>
              ))}
            </select>
          </div>

          <div>
            <label className="text-gray-500 text-xs font-body mb-1.5 block">Activity Title *</label>
            <input className="field" placeholder="e.g. Science Museum Excursion"
              value={form.activityTitle} onChange={set('activityTitle')} />
          </div>

          <div>
            <label className="text-gray-500 text-xs font-body mb-1.5 block">Brief Description</label>
            <textarea className="field min-h-[80px] resize-none text-sm"
              placeholder="Describe the activity and its educational purpose..."
              value={form.description} onChange={set('description')} />
          </div>

          <div>
            <label className="text-gray-500 text-xs font-body mb-1.5 block">Activity Date *</label>
            <input type="date" className="field" value={form.activityDate} onChange={set('activityDate')} />
          </div>

          <div className="flex gap-3">
            <div className="flex-1">
              <label className="text-gray-500 text-xs font-body mb-1.5 block">Start Time</label>
              <input type="time" className="field" value={form.startTime} onChange={set('startTime')} />
            </div>
            <div className="flex-1">
              <label className="text-gray-500 text-xs font-body mb-1.5 block">End / Return Time</label>
              <input type="time" className="field" value={form.endTime} onChange={set('endTime')} />
            </div>
          </div>

          <div>
            <label className="text-gray-500 text-xs font-body mb-1.5 block">Teacher(s) Responsible</label>
            <input className="field" placeholder="e.g. Mr. Smith, Mrs. Jones"
              value={form.responsibleTeachers} onChange={set('responsibleTeachers')} />
          </div>
        </div>

        {/* Rules */}
        <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-4">
          <p className="text-gray-400 text-xs font-body font-semibold uppercase tracking-wider mb-3">
            Rules & Conduct
          </p>
          <textarea className="field min-h-[100px] resize-none text-sm"
            placeholder="List the rules and behaviour expectations during this activity..."
            value={form.rules} onChange={set('rules')} />
        </div>

        {/* Materials */}
        <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-4">
          <p className="text-gray-400 text-xs font-body font-semibold uppercase tracking-wider mb-3">
            What to Bring
          </p>
          <div className="flex flex-col gap-2">
            {form.materials.map((m, i) => (
              <div key={i} className="flex gap-2 items-center">
                <span className="text-gray-300 text-xs font-body shrink-0">•</span>
                <input className="field flex-1 !py-2 text-sm" placeholder="e.g. Lunch, water bottle"
                  value={m} onChange={e => updateMaterial(i, e.target.value)} />
                {form.materials.length > 1 && (
                  <button onClick={() => removeMaterial(i)}
                    className="p-1.5 rounded-lg bg-red-50 text-red-400 shrink-0">
                    <X size={13} />
                  </button>
                )}
              </div>
            ))}
            <button onClick={addMaterial}
              className="flex items-center gap-1.5 text-violet-500 text-xs font-body font-semibold py-1">
              <Plus size={13} /> Add item
            </button>
          </div>
        </div>

        <button onClick={handleSave} disabled={saving}
          className="w-full h-14 rounded-2xl font-display font-bold text-white flex items-center justify-center gap-2 disabled:opacity-50"
          style={{ background: 'linear-gradient(135deg, #7c3aed, #6d28d9)' }}>
          {saving
            ? <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
            : <><Save size={18} /> Send to Parents</>}
        </button>
      </div>
      <BottomNav userType={userType} />
    </div>
  );
}
