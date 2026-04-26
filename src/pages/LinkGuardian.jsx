// src/pages/LinkGuardian.jsx
// Teachers (and admin via a direct link) can link a pre-registered parent/guardian to a student.
import React, { useState, useEffect, useRef } from 'react';
import { Users, Search, CheckCircle, X, Link as LinkIcon } from 'lucide-react';
import toast from 'react-hot-toast';
import { useAuth } from '../context/AuthContext';
import {
  adminGetStudents, adminGetTeachersParents, teacherLinkGuardian
} from '../services/firestore';
import TopBar from '../components/layout/TopBar';
import BottomNav from '../components/layout/BottomNav';
import { RELATIONSHIP_TYPES } from '../utils/constants';

function SearchBox({ label, items, displayKey, subKey, selected, onSelect, placeholder }) {
  const [query, setQuery] = useState(selected ? selected[displayKey] || '' : '');
  const [open, setOpen] = useState(false);
  const ref = useRef(null);

  const matches = query.trim().length > 0
    ? items.filter(s =>
        (s[displayKey] || '').toLowerCase().includes(query.toLowerCase()) ||
        (s.email || '').toLowerCase().includes(query.toLowerCase())
      ).slice(0, 6)
    : [];

  useEffect(() => {
    const h = e => { if (ref.current && !ref.current.contains(e.target)) setOpen(false); };
    document.addEventListener('mousedown', h);
    return () => document.removeEventListener('mousedown', h);
  }, []);

  const pick = (item) => {
    setQuery(item[displayKey] || item.email);
    setOpen(false);
    onSelect(item);
  };

  return (
    <div ref={ref} className="relative">
      <label className="text-white/60 text-xs font-body font-medium mb-1.5 block">
        {label}<span className="text-red-400 ml-0.5">*</span>
      </label>
      <div className="relative">
        <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-white/30" />
        <input
          className="field-dark pl-9"
          placeholder={placeholder}
          value={query}
          onChange={e => { setQuery(e.target.value); setOpen(true); onSelect(null); }}
          onFocus={() => setOpen(true)}
        />
      </div>
      {open && matches.length > 0 && (
        <div className="absolute z-50 w-full mt-1 rounded-xl overflow-hidden shadow-2xl"
          style={{ background: '#1a2040', border: '1px solid rgba(255,255,255,0.12)' }}>
          {matches.map(item => (
            <button key={item.id} type="button" onMouseDown={() => pick(item)}
              className="w-full px-4 py-3 text-left hover:bg-white/8 transition-colors border-b border-white/5 last:border-0">
              <p className="text-white text-sm font-display font-semibold">
                {item.title ? `${item.title} ` : ''}{item[displayKey] || item.email}
              </p>
              {item[subKey] && (
                <p className="text-white/40 text-xs font-body mt-0.5">{item[subKey]}</p>
              )}
            </button>
          ))}
        </div>
      )}
      {selected && (
        <p className="text-emerald-400 text-xs font-body mt-1 ml-1">
          ✓ {selected.title ? `${selected.title} ` : ''}{selected[displayKey]}
        </p>
      )}
    </div>
  );
}

export default function LinkGuardian() {
  const { userType } = useAuth();
  const [students, setStudents] = useState([]);
  const [parents, setParents] = useState([]);
  const [selectedStudent, setSelectedStudent] = useState(null);
  const [selectedParent, setSelectedParent] = useState(null);
  const [relationshipType, setRelationshipType] = useState('Parent');
  const [saving, setSaving] = useState(false);
  const [done, setDone] = useState(false);

  useEffect(() => {
    adminGetStudents().then(data => {
      data.sort((a, b) => (a.displayName || '').localeCompare(b.displayName || ''));
      setStudents(data);
    }).catch(() => {});

    adminGetTeachersParents().then(data => {
      const parentsOnly = data.filter(p => !p.isATeacher);
      parentsOnly.sort((a, b) => (a.displayName || '').localeCompare(b.displayName || ''));
      setParents(parentsOnly);
    }).catch(() => {});
  }, []);

  const handleLink = async () => {
    if (!selectedStudent) { toast.error('Please select a student'); return; }
    if (!selectedParent) { toast.error('Please select a parent / guardian'); return; }
    setSaving(true);
    try {
      await teacherLinkGuardian({
        parentDocId: selectedParent.id,
        parentName: selectedParent.displayName,
        parentTitle: selectedParent.title || '',
        relationshipType,
        studentDocId: selectedStudent.id,
        studentName: selectedStudent.displayName,
      });
      setDone(true);
      toast.success('Link request sent! Student will receive a confirmation.');
    } catch (err) {
      toast.error(err.message || 'Failed to create link');
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="min-h-screen mesh-bg flex flex-col">
      <TopBar title="Link Guardian to Student" showBack />
      <div className="flex-1 overflow-y-auto px-4 pt-4 pb-28">
        {done ? (
          <div className="flex flex-col items-center gap-4 py-20 text-center">
            <div className="w-20 h-20 rounded-3xl bg-emerald-500/10 border border-emerald-500/25 flex items-center justify-center">
              <CheckCircle size={36} className="text-emerald-400" />
            </div>
            <div>
              <p className="text-white font-display font-bold text-xl mb-2">Request Sent!</p>
              <p className="text-white/50 text-sm font-body leading-relaxed">
                <span className="text-white">{selectedStudent?.displayName}</span> will see a confirmation
                request the next time they log in. Once confirmed, the parent will be able to view their child's profile.
              </p>
            </div>
            <button
              onClick={() => { setDone(false); setSelectedStudent(null); setSelectedParent(null); }}
              className="px-6 py-3 rounded-2xl font-display font-semibold text-sm text-white/70 bg-white/8 border border-white/10"
            >
              Link Another
            </button>
          </div>
        ) : (
          <div className="flex flex-col gap-5">
            {/* Info */}
            <div className="p-4 rounded-2xl bg-white/5 border border-white/10">
              <p className="text-white/50 text-xs font-body leading-relaxed">
                Select a student and an already-registered parent or guardian below. A confirmation request will be
                sent to the student. Once the student approves, the guardian can view the child's profile and activities.
              </p>
            </div>

            <SearchBox
              label="Student"
              items={students}
              displayKey="displayName"
              subKey="standard"
              selected={selectedStudent}
              onSelect={setSelectedStudent}
              placeholder="Search student by name or class…"
            />

            <SearchBox
              label="Parent / Guardian"
              items={parents}
              displayKey="displayName"
              subKey="email"
              selected={selectedParent}
              onSelect={setSelectedParent}
              placeholder="Search by name or email…"
            />

            {/* Relationship type */}
            <div>
              <label className="text-white/60 text-xs font-body font-medium mb-2 block">
                Relationship Type<span className="text-red-400 ml-0.5">*</span>
              </label>
              <div className="flex gap-2">
                {RELATIONSHIP_TYPES.map(rt => (
                  <button key={rt} type="button"
                    onClick={() => setRelationshipType(rt)}
                    className="flex-1 py-3 rounded-2xl font-display font-semibold text-sm transition-all"
                    style={relationshipType === rt
                      ? { background: '#E84545', color: '#fff' }
                      : { background: 'rgba(255,255,255,0.06)', color: 'rgba(255,255,255,0.5)', border: '1px solid rgba(255,255,255,0.1)' }
                    }>
                    {rt}
                  </button>
                ))}
              </div>
            </div>

            {/* Preview */}
            {selectedStudent && selectedParent && (
              <div className="p-4 rounded-2xl bg-emerald-500/8 border border-emerald-500/20">
                <p className="text-emerald-400 text-xs font-body font-semibold mb-1">Preview</p>
                <p className="text-white/70 text-sm font-body">
                  "{selectedParent.title ? `${selectedParent.title} ` : ''}{selectedParent.displayName}"
                  will be linked as the <span className="text-white font-semibold">{relationshipType.toLowerCase()}</span> of{' '}
                  <span className="text-white font-semibold">{selectedStudent.displayName}</span>.
                  The student will be asked to confirm.
                </p>
              </div>
            )}

            <button onClick={handleLink} disabled={saving || !selectedStudent || !selectedParent}
              className="w-full h-14 rounded-2xl font-display font-bold text-sm text-gray-900 flex items-center justify-center gap-2 disabled:opacity-40 transition-all"
              style={{ background: 'linear-gradient(135deg, #E84545, #c73333)' }}>
              {saving
                ? <div className="w-5 h-5 border-2 border-gray-700/40 border-t-gray-700 rounded-full animate-spin" />
                : <><LinkIcon size={16} className="text-white" /><span className="text-white">Send Link Request</span></>
              }
            </button>
          </div>
        )}
      </div>
      <BottomNav userType={userType} />
    </div>
  );
}