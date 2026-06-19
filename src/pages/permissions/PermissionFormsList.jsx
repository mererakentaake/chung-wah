// src/pages/permissions/PermissionFormsList.jsx
// Teacher/Admin: list of all permission forms
import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { ClipboardList, Plus, ChevronRight, CheckCircle, XCircle, Clock, Lock } from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import { getPermissionFormsByTeacher, getAllPermissionForms } from '../../services/firestore';
import { ROUTES, USER_TYPES } from '../../utils/constants';
import TopBar from '../../components/layout/TopBar';
import BottomNav from '../../components/layout/BottomNav';

export default function PermissionFormsList() {
  const { userType, userId } = useAuth();
  const navigate = useNavigate();
  const isAdmin = userType === USER_TYPES.ADMIN;

  const [forms, setForms]   = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let unsub;
    if (isAdmin) {
      unsub = getAllPermissionForms(data => { setForms(data); setLoading(false); });
    } else {
      unsub = getPermissionFormsByTeacher(userId, data => { setForms(data); setLoading(false); });
    }
    return unsub;
  }, [isAdmin, userId]);

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col">
      <TopBar title="Permission Forms" showBack>
        <button onClick={() => navigate(ROUTES.PERMISSIONS_CREATE)}
          className="w-9 h-9 rounded-xl bg-violet-600 flex items-center justify-center shadow-sm">
          <Plus size={18} className="text-white" />
        </button>
      </TopBar>

      <div className="flex-1 overflow-y-auto px-4 pt-4 pb-28">
        {loading ? (
          <div className="flex flex-col gap-3">
            {[1,2,3].map(i => <div key={i} className="h-24 rounded-2xl bg-gray-100 animate-pulse" />)}
          </div>
        ) : forms.length === 0 ? (
          <div className="flex flex-col items-center gap-3 py-20 text-center">
            <div className="w-14 h-14 rounded-2xl bg-gray-100 flex items-center justify-center">
              <ClipboardList size={24} className="text-gray-300" />
            </div>
            <p className="text-gray-400 font-body">No permission forms yet</p>
            <button onClick={() => navigate(ROUTES.PERMISSIONS_CREATE)}
              className="flex items-center gap-1.5 text-violet-500 text-sm font-display font-semibold">
              <Plus size={15} /> Create first form
            </button>
          </div>
        ) : (
          <div className="flex flex-col gap-3">
            {forms.map(f => {
              const isClosed = f.status === 'closed';
              return (
                <button key={f.id}
                  onClick={() => navigate(`${ROUTES.PERMISSIONS_DETAIL}/${f.id}`)}
                  className="w-full p-4 bg-white rounded-2xl border border-gray-100 shadow-sm hover:shadow-md active:scale-[0.99] transition-all text-left">
                  <div className="flex items-start gap-3">
                    <div className={`w-9 h-9 rounded-xl flex items-center justify-center shrink-0 ${
                      isClosed ? 'bg-gray-100' : 'bg-violet-50'
                    }`}>
                      {isClosed
                        ? <Lock size={16} className="text-gray-400" />
                        : <ClipboardList size={16} className="text-violet-600" />}
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="font-display font-semibold text-gray-800 truncate">{f.activityTitle}</p>
                      <p className="text-gray-400 text-xs font-body">{f.schoolClass} · {f.activityDate}</p>
                      <div className="flex items-center gap-2 mt-1.5">
                        <span className={`text-[10px] font-body font-semibold px-2 py-0.5 rounded-full ${
                          isClosed ? 'bg-gray-100 text-gray-500' : 'bg-violet-100 text-violet-700'
                        }`}>
                          {isClosed ? 'Closed' : 'Active'}
                        </span>
                      </div>
                    </div>
                    <ChevronRight size={15} className="text-gray-300 shrink-0 mt-1" />
                  </div>
                </button>
              );
            })}
          </div>
        )}
      </div>
      <BottomNav userType={userType} />
    </div>
  );
}
