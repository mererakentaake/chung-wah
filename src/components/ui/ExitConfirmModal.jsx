// src/components/ui/ExitConfirmModal.jsx
import React, { useState } from 'react';
import { LogOut, X } from 'lucide-react';
import { exitApp } from '../../utils/exitApp';

export default function ExitConfirmModal({ onCancel }) {
  const [exiting, setExiting] = useState(false);

  const handleConfirm = async () => {
    setExiting(true);
    await exitApp();
    // If exitApp() didn't actually close anything (e.g. plain web/dev),
    // just dismiss the modal instead of leaving the button stuck spinning.
    setExiting(false);
    onCancel();
  };

  return (
    <div className="fixed inset-0 z-[100] bg-black/70 flex items-center justify-center p-5">
      <div className="w-full max-w-sm rounded-3xl p-6 flex flex-col gap-5 surface-dark"
        style={{ background: '#141829', border: '1px solid rgba(255,255,255,0.12)' }}>
        <div className="flex items-center justify-between">
          <h3 className="font-display font-bold text-white text-lg">Exit App?</h3>
          <button onClick={onCancel}
            className="w-8 h-8 rounded-xl bg-white/8 flex items-center justify-center">
            <X size={16} className="text-white/60" />
          </button>
        </div>
        <p className="text-white/55 text-sm font-body leading-relaxed">
          Are you sure you want to close Chung Wah E-School?
        </p>
        <div className="flex gap-3">
          <button onClick={onCancel}
            className="flex-1 py-3.5 rounded-2xl font-display font-bold text-sm text-white/60 transition-colors"
            style={{ background: 'rgba(255,255,255,0.06)', border: '1px solid rgba(255,255,255,0.1)' }}>
            Cancel
          </button>
          <button onClick={handleConfirm} disabled={exiting}
            className="flex-1 py-3.5 rounded-2xl font-display font-bold text-sm text-white flex items-center justify-center gap-2 disabled:opacity-50 transition-all"
            style={{ background: 'linear-gradient(135deg, #E84545, #c53030)' }}>
            {exiting
              ? <div className="w-4 h-4 border-2 border-white/40 border-t-white rounded-full animate-spin" />
              : <><LogOut size={15} />Exit</>
            }
          </button>
        </div>
      </div>
    </div>
  );
}
