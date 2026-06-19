// src/pages/permissions/PermissionFormDetail.jsx
// Teacher/Admin: view a form and its response list
import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import {
  CheckCircle, XCircle, Clock, Users, Lock, Trash2
} from 'lucide-react';
import toast from 'react-hot-toast';
import { useAuth } from '../../context/AuthContext';
import {
  getAllPermissionForms, getPermissionResponses,
  closePermissionForm, deletePermissionForm, adminGetStudents
} from '../../services/firestore';
import { ROUTES } from '../../utils/constants';
import TopBar from '../../components/layout/TopBar';
import BottomNav from '../../components/layout/BottomNav';

function fmt12(time) {
  if (!time) return '';
  const [h, m] = time.split(':').map(Number);
  const ampm = h >= 12 ? 'PM' : 'AM';
  return `${h % 12 || 12}:${String(m).padStart(2, '0')} ${ampm}`;
}

export default function PermissionFormDetail() {
  const { id: formId } = useParams();
  const navigate = useNavigate();
  const { userType } = useAuth();

  const [form, setForm]           = useState(null);
  const [responses, setResponses] = useState([]);
  const [students, setStudents]   = useState([]);
  const [loading, setLoading]     = useState(true);

  useEffect(() => {
    const unsub = getAllPermissionForms(all => {
      const found = all.find(f => f.id === formId);
      setForm(found || null);
      setLoading(false);
    });
    return unsub;
  }, [formId]);

  useEffect(() => {
    const unsub = getPermissionResponses(formId, setResponses);
    return unsub;
  }, [formId]);

  useEffect(() => {
    if (!form?.schoolClass) return;
    adminGetStudents().then(all => {
      setStudents(all.filter(s => s.schoolClass === form.schoolClass));
    }).catch(() => {});
  }, [form?.schoolClass]);

  const handleClose = async () => {
    try {
      await closePermissionForm(formId);
      toast.success('Form closed');
    } catch { toast.error('Failed'); }
  };

  const handleDelete = async () => {
    if (!window.confirm('Delete this permission form?')) return;
    try {
      await deletePermissionForm(formId);
      toast.success('Deleted');
      navigate(ROUTES.PERMISSIONS);
    } catch { toast.error('Failed'); }
  };

  if (loading || !form) return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center">
      <div className="w-8 h-8 border-2 border-violet-500 border-t-transparent rounded-full animate-spin" />
    </div>
  );

  const responseMap  = Object.fromEntries(responses.map(r => [r.studentId, r]));
  const approved     = responses.filter(r => r.response === 'approved').length;
  const declined     = responses.filter(r => r.response === 'declined').length;
  const notResponded = students.filter(s => !responseMap[s.id]);
  const isClosed     = form.status === 'closed';

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col">
      <TopBar title="Permission Form" showBack>
        <button onClick={handleDelete} className="w-9 h-9 rounded-xl bg-red-50 border border-red-200 flex items-center justify-center">
          <Trash2 size={15} className="text-red-400" />
        </button>
      </TopBar>

      <div className="flex-1 overflow-y-auto px-4 pt-4 pb-28 flex flex-col gap-4">

        {/* Activity summary */}
        <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-4">
          <div className="flex items-start justify-between mb-2">
            <div>
              <p className="font-display font-bold text-gray-900 text-lg">{form.activityTitle}</p>
              <p className="text-gray-400 text-sm font-body">{form.schoolClass}</p>
            </div>
            <span className={`text-xs font-body font-semibold px-2.5 py-1 rounded-full ${
              isClosed ? 'bg-gray-100 text-gray-500' : 'bg-emerald-100 text-emerald-700'
            }`}>
              {isClosed ? 'Closed' : 'Active'}
            </span>
          </div>

          {form.description && (
            <p className="text-gray-600 text-sm font-body leading-relaxed mb-3">{form.description}</p>
          )}

          <div className="flex flex-col gap-1.5 text-sm font-body">
            <div className="flex items-center gap-2">
              <span className="text-gray-400 w-20 shrink-0 text-xs">Date</span>
              <span className="text-gray-700 font-semibold">{form.activityDate}</span>
            </div>
            {(form.startTime || form.endTime) && (
              <div className="flex items-center gap-2">
                <span className="text-gray-400 w-20 shrink-0 text-xs">Time</span>
                <span className="text-gray-700">{fmt12(form.startTime)} – {fmt12(form.endTime)}</span>
              </div>
            )}
            {form.responsibleTeachers && (
              <div className="flex items-start gap-2">
                <span className="text-gray-400 w-20 shrink-0 text-xs mt-0.5">Teachers</span>
                <span className="text-gray-700">{form.responsibleTeachers}</span>
              </div>
            )}
          </div>
        </div>

        {/* Response summary */}
        <div className="grid grid-cols-3 gap-3">
          <div className="bg-emerald-50 rounded-2xl border border-emerald-100 p-3 text-center">
            <p className="font-display font-bold text-emerald-600 text-2xl">{approved}</p>
            <p className="text-gray-500 text-xs font-body">Approved</p>
          </div>
          <div className="bg-red-50 rounded-2xl border border-red-100 p-3 text-center">
            <p className="font-display font-bold text-red-500 text-2xl">{declined}</p>
            <p className="text-gray-500 text-xs font-body">Declined</p>
          </div>
          <div className="bg-gray-50 rounded-2xl border border-gray-200 p-3 text-center">
            <p className="font-display font-bold text-gray-500 text-2xl">{notResponded.length}</p>
            <p className="text-gray-500 text-xs font-body">Pending</p>
          </div>
        </div>

        {/* Response list */}
        <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-4">
          <p className="text-gray-400 text-xs font-body font-semibold uppercase tracking-wider mb-3">
            Responses ({students.length} students)
          </p>
          <div className="flex flex-col gap-2">
            {/* Responded */}
            {responses.map(r => (
              <div key={r.id} className="flex items-center gap-3 py-2 border-b border-gray-50 last:border-0">
                {r.response === 'approved'
                  ? <CheckCircle size={17} className="text-emerald-500 shrink-0" />
                  : <XCircle size={17} className="text-red-400 shrink-0" />}
                <div className="flex-1 min-w-0">
                  <p className="text-gray-800 text-sm font-body">{r.studentName}</p>
                  {r.notes && <p className="text-gray-400 text-xs font-body italic">&ldquo;{r.notes}&rdquo;</p>}
                </div>
                <span className={`text-[10px] font-body font-semibold px-2 py-0.5 rounded-full ${
                  r.response === 'approved'
                    ? 'bg-emerald-100 text-emerald-700'
                    : 'bg-red-100 text-red-600'
                }`}>
                  {r.response === 'approved' ? 'Approved' : 'Declined'}
                </span>
              </div>
            ))}

            {/* Not responded */}
            {notResponded.map(s => (
              <div key={s.id} className="flex items-center gap-3 py-2 border-b border-gray-50 last:border-0">
                <Clock size={17} className="text-gray-300 shrink-0" />
                <p className="text-gray-500 text-sm font-body flex-1">{s.displayName || s.name}</p>
                <span className="text-[10px] font-body text-gray-400 bg-gray-100 px-2 py-0.5 rounded-full">
                  Waiting
                </span>
              </div>
            ))}
          </div>
        </div>

        {/* Rules & materials (read) */}
        {form.rules && (
          <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-4">
            <p className="text-gray-400 text-xs font-body font-semibold uppercase tracking-wider mb-2">Rules</p>
            <p className="text-gray-600 text-sm font-body leading-relaxed whitespace-pre-wrap">{form.rules}</p>
          </div>
        )}
        {form.materials?.length > 0 && (
          <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-4">
            <p className="text-gray-400 text-xs font-body font-semibold uppercase tracking-wider mb-2">What to Bring</p>
            <ul className="flex flex-col gap-1.5">
              {form.materials.map((m, i) => (
                <li key={i} className="flex items-start gap-2">
                  <span className="text-violet-400 mt-0.5 shrink-0">•</span>
                  <p className="text-gray-600 text-sm font-body">{m}</p>
                </li>
              ))}
            </ul>
          </div>
        )}

        {/* Close form */}
        {!isClosed && (
          <button onClick={handleClose}
            className="w-full h-12 rounded-2xl border-2 border-gray-200 text-gray-500 font-display font-semibold text-sm flex items-center justify-center gap-2 hover:bg-gray-100 transition-colors">
            <Lock size={15} /> Close Form (stop accepting responses)
          </button>
        )}
      </div>
      <BottomNav userType={userType} />
    </div>
  );
}
