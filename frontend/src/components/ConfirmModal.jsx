import React from 'react';

const ConfirmModal = ({ isOpen, title, message, onConfirm, onCancel }) => {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-6 bg-black/80 backdrop-blur-sm animate-in fade-in duration-300">
      <div 
        className="bg-zinc-900 border border-zinc-800 rounded-[2.5rem] p-8 md:p-10 max-w-md w-full text-center shadow-[0_20px_60px_rgba(0,0,0,0.5)] animate-in zoom-in-95 duration-300"
      >
        <div className="w-16 h-16 rounded-3xl bg-amber-500/10 border border-amber-500/20 flex items-center justify-center mx-auto mb-6">
          <svg className="w-8 h-8 text-amber-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
          </svg>
        </div>

        <h3 className="text-2xl font-black text-white uppercase tracking-tighter mb-2">{title}</h3>
        <p className="text-zinc-500 text-sm leading-relaxed mb-10">{message}</p>

        <div className="flex flex-col sm:flex-row gap-3">
          <button
            onClick={onCancel}
            className="flex-1 px-6 py-4 bg-zinc-800 hover:bg-zinc-700 text-zinc-300 font-black text-xs uppercase tracking-widest rounded-2xl transition-all active:scale-[0.98]"
          >
            Cancel
          </button>
          <button
            onClick={onConfirm}
            className="flex-1 px-6 py-4 bg-emerald-500 hover:bg-emerald-400 text-zinc-950 font-black text-xs uppercase tracking-widest rounded-2xl transition-all active:scale-[0.98] shadow-[0_10px_30px_rgba(16,185,129,0.2)]"
          >
            Confirm
          </button>
        </div>
      </div>
    </div>
  );
};

export default ConfirmModal;
