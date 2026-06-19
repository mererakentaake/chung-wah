// src/pages/permissions/ParentPermissionForms.jsx
// Parent: view permission forms for their children and respond
import React, { useState, useEffect } from 'react';
import {
  ClipboardList, CheckCircle, XCircle, Clock,
  ChevronDown, ChevronUp, Send, X
} from 'lucide-react';
import toast from 'react-hot-toast';
import { useAuth } from '../../context/AuthContext';
import {
  getPermissionFormsByClass, submitPermissionResponse,
  getParentPermissionResponses, getParentGuardianLinks, adminGetStudents
} from '../../services/firestore';
import TopBar from '../../components/layout/TopBar';
import BottomNav from '../../components/layout/BottomNav';

function fmt12(time) {
  if (!time) return '';
  const [h, m] = time.split(':').map(Number);
  return `${h % 12 || 12}:${String(m).padStart(2, '0')} ${h >= 12 ? 'PM' : 'AM'}`;
}

function FormCard({ form, child, existingResponse, onRespond }) {
  const [expanded, setExpanded]   = useState(false);
  const [showModal, setShowModal] = useState(false);
  const [response, setResponse]   = useState('');
  const [notes, setNotes]         = useState('');
  const [submitting, setSubmitting] = useState(false);

  const isClosed    = form.status === 'closed';
  const hasResponded = !!existingResponse;

  const handleSubmit = async () => {
    if (!response) { toast.error('Please select Approve or Decline'); return; }
    setSubmitting(true);
    try {
      await submitPermissionResponse(form.id, child.id, {
        studentName:  child.name,
        schoolClass:  child.schoolClass,
        parentName:   '',
        response,
        notes,
      });
      toast.success(response === 'approved' ? 'Permission granted!' : 'Form declined');
      setShowModal(false);
    } catch (err) {
      toast.error(err.message || 'Failed to submit');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <>
      <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
        {/* Header row */}
        <button className="w-full flex items-start gap-3 p-4 text-left"
          onClick={() => setExpanded(v => !v)}>
          <div className="w-9 h-9 rounded-xl bg-violet-50 flex items-center justify-center shrink-0">
            <ClipboardList size={16} className="text-violet-600" />
          </div>
          <div className="flex-1 min-w-0">
            <p className="font-display font-semibold text-gray-800 truncate">{form.activityTitle}</p>
            <p className="text-gray-400 text-xs font-body">{form.activityDate}</p>
            {(form.startTime || form.endTime) && (
              <p className="text-gray-400 text-xs font-body">
                {fmt12(form.startTime)}{form.endTime ? ` – ${fmt12(form.endTime)}` : ''}
              </p>
            )}
          </div>
          <div className="flex flex-col items-end gap-1.5 shrink-0">
            {hasResponded ? (
              existingResponse.response === 'approved'
                ? <span className="flex items-center gap-1 text-emerald-600 text-xs font-body font-semibold">
                    <CheckCircle size={13} /> Approved
                  </span>
                : <span className="flex items-center gap-1 text-red-500 text-xs font-body font-semibold">
                    <XCircle size={13} /> Declined
                  </span>
            ) : (
              <span className="flex items-center gap-1 text-amber-500 text-xs font-body font-semibold">
                <Clock size={13} /> Respond
              </span>
            )}
            {expanded
              ? <ChevronUp size={14} className="text-gray-300" />
              : <ChevronDown size={14} className="text-gray-300" />}
          </div>
        </button>

        {/* Expanded details */}
        {expanded && (
          <div className="border-t border-gray-100 px-4 pt-3 pb-4 flex flex-col gap-3">
            {form.description && (
              <div>
                <p className="text-gray-400 text-xs font-body font-semibold mb-1">About the Activity</p>
                <p className="text-gray-600 text-sm font-body leading-relaxed">{form.description}</p>
              </div>
            )}
            {form.responsibleTeachers && (
              <div>
                <p className="text-gray-400 text-xs font-body font-semibold mb-1">Teachers Responsible</p>
                <p className="text-gray-600 text-sm font-body">{form.responsibleTeachers}</p>
              </div>
            )}
            {form.rules && (
              <div>
                <p className="text-gray-400 text-xs font-body font-semibold mb-1">Rules & Conduct</p>
                <p className="text-gray-600 text-sm font-body leading-relaxed whitespace-pre-wrap">{form.rules}</p>
              </div>
            )}
            {form.materials?.length > 0 && (
              <div>
                <p className="text-gray-400 text-xs font-body font-semibold mb-2">What to Bring</p>
                <ul className="flex flex-col gap-1">
                  {form.materials.map((m, i) => (
                    <li key={i} className="flex items-start gap-2">
                      <span className="text-violet-400 shrink-0">•</span>
                      <p className="text-gray-600 text-sm font-body">{m}</p>
                    </li>
                  ))}
                </ul>
              </div>
            )}

            {/* Response section */}
            {!isClosed && (
              hasResponded ? (
                <div className={`p-3 rounded-xl ${
                  existingResponse.response === 'approved'
                    ? 'bg-emerald-50 border border-emerald-100'
                    : 'bg-red-50 border border-red-100'
                }`}>
                  <p className={`text-sm font-display font-semibold ${
                    existingResponse.response === 'approved' ? 'text-emerald-700' : 'text-red-600'
                  }`}>
                    You have {existingResponse.response === 'approved' ? 'granted permission' : 'declined'}.
                  </p>
                  {existingResponse.notes && (
                    <p className="text-gray-500 text-xs font-body mt-1 italic">
                      Note: {existingResponse.notes}
                    </p>
                  )}
                  <button onClick={() => setShowModal(true)}
                    className="text-gray-400 text-xs font-body underline mt-1">
                    Change response
                  </button>
                </div>
              ) : (
                <button onClick={() => setShowModal(true)}
                  className="w-full py-3 rounded-xl font-display font-bold text-white text-sm flex items-center justify-center gap-2"
                  style={{ background: 'linear-gradient(135deg, #7c3aed, #6d28d9)' }}>
                  <Send size={15} /> Respond to This Form
                </button>
              )
            )}
            {isClosed && (
              <p className="text-gray-400 text-xs font-body text-center bg-gray-50 p-2 rounded-xl">
                This form is closed — no more responses are being accepted
              </p>
            )}
          </div>
        )}
      </div>

      {/* Response modal */}
      {showModal && (
        <div className="fixed inset-0 z-50 bg-black/60 flex items-end">
          <div className="w-full bg-white rounded-t-3xl p-5">
            <div className="flex items-center justify-between mb-4">
              <h3 className="font-display font-bold text-gray-800">Your Response</h3>
              <button onClick={() => setShowModal(false)}
                className="w-8 h-8 rounded-xl bg-gray-100 flex items-center justify-center">
                <X size={15} className="text-gray-500" />
              </button>
            </div>
            <p className="text-gray-500 text-sm font-body mb-4">
              {form.activityTitle} — for <span className="font-semibold text-gray-700">{child.name}</span>
            </p>

            <div className="flex gap-3 mb-4">
              <button onClick={() => setResponse('approved')}
                className={`flex-1 py-3.5 rounded-2xl font-display font-bold text-sm flex items-center justify-center gap-2 transition-all ${
                  response === 'approved'
                    ? 'bg-emerald-500 text-white shadow-md'
                    : 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                }`}>
                <CheckCircle size={16} /> Approve
              </button>
              <button onClick={() => setResponse('declined')}
                className={`flex-1 py-3.5 rounded-2xl font-display font-bold text-sm flex items-center justify-center gap-2 transition-all ${
                  response === 'declined'
                    ? 'bg-red-500 text-white shadow-md'
                    : 'bg-red-50 text-red-600 border border-red-200'
                }`}>
                <XCircle size={16} /> Decline
              </button>
            </div>

            <div className="mb-4">
              <label className="text-gray-500 text-xs font-body mb-1.5 block">Notes (optional)</label>
              <textarea className="field min-h-[70px] resize-none text-sm"
                placeholder="Add any notes for the teacher..."
                value={notes} onChange={e => setNotes(e.target.value)} />
            </div>

            <button onClick={handleSubmit} disabled={submitting || !response}
              className="w-full h-12 rounded-2xl font-display font-bold text-white flex items-center justify-center gap-2 disabled:opacity-50"
              style={{ background: 'linear-gradient(135deg, #7c3aed, #6d28d9)' }}>
              {submitting
                ? <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                : <><Send size={16} /> Submit Response</>}
            </button>
          </div>
        </div>
      )}
    </>
  );
}

export default function ParentPermissionForms() {
  const { userType, userId } = useAuth();
  const [children, setChildren]     = useState([]);
  const [selectedChild, setSelectedChild] = useState(null);
  const [forms, setForms]           = useState([]);
  const [myResponses, setMyResponses] = useState([]);
  const [loading, setLoading]       = useState(true);

  // Load confirmed children
  useEffect(() => {
    if (!userId) return;
    const unsub = getParentGuardianLinks(userId, async links => {
      const confirmed = links.filter(l => l.status === 'confirmed');
      if (confirmed.length) {
        const all = await adminGetStudents().catch(() => []);
        const mapped = confirmed.map(l => {
          const data = all.find(s => s.id === l.studentDocId);
          return { id: l.studentDocId, name: l.studentName, schoolClass: data?.schoolClass || '' };
        }).filter(c => c.id);
        setChildren(mapped);
        if (mapped.length && !selectedChild) setSelectedChild(mapped[0]);
      }
      setLoading(false);
    });
    return unsub;
  }, [userId]);

  // Load forms for selected child's class
  useEffect(() => {
    if (!selectedChild?.schoolClass) return;
    const unsub = getPermissionFormsByClass(selectedChild.schoolClass, setForms);
    return unsub;
  }, [selectedChild?.schoolClass]);

  // Load parent's responses
  useEffect(() => {
    if (!userId) return;
    const unsub = getParentPermissionResponses(userId, setMyResponses);
    return unsub;
  }, [userId]);

  const getResponse = (formId, studentId) =>
    myResponses.find(r => r.formId === formId && r.studentId === studentId) || null;

  const pending = forms.filter(f =>
    f.status === 'active' && !getResponse(f.id, selectedChild?.id)
  ).length;

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col">
      <TopBar title="Permission Forms" showBack />

      {/* Child selector */}
      {children.length > 1 && (
        <div className="flex gap-2 px-4 pt-3 overflow-x-auto">
          {children.map(c => (
            <button key={c.id} onClick={() => setSelectedChild(c)}
              className={`px-3 py-1.5 rounded-xl text-xs font-display font-semibold whitespace-nowrap transition-all ${
                selectedChild?.id === c.id
                  ? 'bg-violet-500 text-white'
                  : 'bg-white border border-gray-200 text-gray-500'
              }`}>
              {c.name}
            </button>
          ))}
        </div>
      )}

      <div className="flex-1 overflow-y-auto px-4 pt-4 pb-28">
        {/* Pending badge */}
        {pending > 0 && (
          <div className="flex items-center gap-2.5 p-3 rounded-xl bg-amber-50 border border-amber-200 mb-4">
            <Clock size={15} className="text-amber-500 shrink-0" />
            <p className="text-amber-700 text-sm font-body">
              <span className="font-semibold">{pending}</span> form{pending > 1 ? 's' : ''} awaiting your response
            </p>
          </div>
        )}

        {loading ? (
          <div className="flex flex-col gap-3">
            {[1,2].map(i => <div key={i} className="h-24 rounded-2xl bg-gray-100 animate-pulse" />)}
          </div>
        ) : !selectedChild ? (
          <div className="flex flex-col items-center gap-3 py-20 text-center">
            <ClipboardList size={32} className="text-gray-300" />
            <p className="text-gray-400 font-body">No linked children found</p>
          </div>
        ) : forms.length === 0 ? (
          <div className="flex flex-col items-center gap-3 py-20 text-center">
            <ClipboardList size={32} className="text-gray-300" />
            <p className="text-gray-400 font-body">No permission forms yet</p>
            <p className="text-gray-300 text-sm font-body">
              Forms from {selectedChild.name}'s teacher will appear here
            </p>
          </div>
        ) : (
          <div className="flex flex-col gap-3">
            {forms.map(f => (
              <FormCard
                key={f.id}
                form={f}
                child={selectedChild}
                existingResponse={getResponse(f.id, selectedChild.id)}
                onRespond={() => {}}
              />
            ))}
          </div>
        )}
      </div>
      <BottomNav userType={userType} />
    </div>
  );
}
