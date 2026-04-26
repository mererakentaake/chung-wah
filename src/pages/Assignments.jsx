// src/pages/Assignments.jsx
import React, { useState, useEffect } from 'react';
import { Upload, FileText, Download, Plus, X, ClipboardList } from 'lucide-react';
import toast from 'react-hot-toast';
import { useAuth } from '../context/AuthContext';
import { USER_TYPES } from '../utils/constants';
import { getAssignments, uploadAssignment } from '../services/firestore';
import TopBar from '../components/layout/TopBar';
import BottomNav from '../components/layout/BottomNav';
import { formatDistanceToNow } from 'date-fns';

function UploadModal({ onClose }) {
  const [form, setForm] = useState({ title: '', description: '', standard: '', division: '' });
  const [file, setFile] = useState(null);
  const [loading, setLoading] = useState(false);

  const submit = async () => {
    if (!form.title.trim()) return;
    setLoading(true);
    try {
      await uploadAssignment({ ...form, division: form.division.toUpperCase() }, file);
      toast.success('Assignment uploaded!');
      onClose(true);
    } catch (e) {
      toast.error('Upload failed');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm flex items-end">
      <div className="w-full bg-navy-800 rounded-t-3xl p-5 pb-safe max-h-[85vh] overflow-y-auto"
        style={{ background: '#0f1530' }}>
        <div className="flex items-center justify-between mb-5">
          <h3 className="font-display font-bold text-white text-lg">Upload Assignment</h3>
          <button onClick={() => onClose(false)} className="w-8 h-8 rounded-xl bg-white/10 flex items-center justify-center">
            <X size={18} className="text-white/70" />
          </button>
        </div>
        <div className="flex flex-col gap-4">
          <input className="field-dark" placeholder="Title" value={form.title} onChange={e => setForm(f => ({ ...f, title: e.target.value }))} />
          <textarea className="field-dark resize-none min-h-[70px]" placeholder="Description (optional)" value={form.description} onChange={e => setForm(f => ({ ...f, description: e.target.value }))} />
          <div className="flex gap-3">
            <input className="field-dark flex-1" placeholder="Class" value={form.standard} onChange={e => setForm(f => ({ ...f, standard: e.target.value }))} />
            <input className="field-dark flex-1" placeholder="Div" value={form.division} onChange={e => setForm(f => ({ ...f, division: e.target.value }))} />
          </div>
          <label className="flex items-center gap-3 p-4 rounded-2xl border border-dashed border-white/15 cursor-pointer hover:bg-white/5 transition-colors">
            <div className="w-10 h-10 rounded-xl bg-gold-500/20 flex items-center justify-center shrink-0">
              <Upload size={18} className="text-gold-400" />
            </div>
            <div>
              <p className="text-white/70 text-sm font-body">{file ? file.name : 'Attach file (PDF, image, etc.)'}</p>
              {file && <p className="text-white/30 text-xs mt-0.5">{(file.size / 1024).toFixed(1)} KB</p>}
            </div>
            <input type="file" className="hidden" onChange={e => setFile(e.target.files[0])} />
          </label>
          <button onClick={submit} disabled={loading || !form.title.trim()}
            className="h-12 rounded-2xl btn-gradient font-display font-bold text-navy-900 disabled:opacity-50">
            {loading ? 'Uploading...' : 'Upload Assignment'}
          </button>
        </div>
      </div>
    </div>
  );
}

export default function Assignments() {
  const { userType } = useAuth();
  const [assignments, setAssignments] = useState([]);
  const [showUpload, setShowUpload] = useState(false);
  const isTeacher = userType === USER_TYPES.TEACHER;

  useEffect(() => {
    const unsub = getAssignments(setAssignments);
    return unsub;
  }, []);

  return (
    <div className="min-h-screen mesh-bg flex flex-col">
      <TopBar title="Assignments" showBack>
        {isTeacher && (
          <button onClick={() => setShowUpload(true)}
            className="w-9 h-9 rounded-xl bg-emerald-500/80 flex items-center justify-center">
            <Plus size={18} className="text-white" />
          </button>
        )}
      </TopBar>

      <div className="flex-1 overflow-y-auto px-4 pt-3 pb-28">
        {assignments.length === 0 ? (
          <div className="flex flex-col items-center gap-3 py-20 text-center">
            <div className="w-16 h-16 rounded-2xl bg-white/5 flex items-center justify-center">
              <ClipboardList size={28} className="text-white/20" />
            </div>
            <p className="text-white/30 font-body">No assignments yet</p>
          </div>
        ) : (
          <div className="flex flex-col gap-3">
            {assignments.map(a => {
              const date = a.createdAt?.toDate?.() || new Date();
              return (
                <div key={a.id} className="glass-card p-4 page-enter">
                  <div className="flex items-start gap-3">
                    <div className="w-10 h-10 rounded-xl bg-emerald-500/15 flex items-center justify-center shrink-0">
                      <FileText size={18} className="text-emerald-400" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-white font-display font-semibold text-sm">{a.title}</p>
                      {a.description && <p className="text-white/50 text-xs font-body mt-0.5 line-clamp-2">{a.description}</p>}
                      <div className="flex items-center gap-2 mt-2">
                        {a.standard && (
                          <span className="text-[10px] px-2 py-0.5 rounded-full bg-white/8 text-white/50 font-body">
                            Std {a.standard}{a.division}
                          </span>
                        )}
                        <span className="text-white/30 text-xs font-body">{formatDistanceToNow(date, { addSuffix: true })}</span>
                      </div>
                    </div>
                    {a.fileUrl && (
                      <a href={a.fileUrl} target="_blank" rel="noopener noreferrer"
                        className="w-9 h-9 rounded-xl bg-gold-500/20 flex items-center justify-center shrink-0">
                        <Download size={16} className="text-gold-400" />
                      </a>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {showUpload && <UploadModal onClose={(success) => setShowUpload(false)} />}
      <BottomNav userType={userType} />
    </div>
  );
}
