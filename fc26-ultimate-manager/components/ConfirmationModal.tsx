import React from 'react';

interface ConfirmationModalProps {
  title: string;
  message: string;
  onConfirm: () => void;
  onCancel: () => void;
}

const ConfirmationModal: React.FC<ConfirmationModalProps> = ({ title, message, onConfirm, onCancel }) => {
  return (
    <div className="fixed inset-0 bg-black/80 flex items-center justify-center z-[60] p-4 backdrop-blur-sm">
      <div className="bg-slate-900 border border-slate-700 w-full max-w-md rounded-xl shadow-2xl p-6 animate-in fade-in zoom-in duration-200">
        <h2 className="text-xl font-bold text-white mb-2">{title}</h2>
        <p className="text-slate-300 mb-6">{message}</p>
        <div className="flex justify-end gap-3">
          <button 
            onClick={onCancel} 
            className="px-4 py-2 text-slate-300 hover:text-white transition rounded hover:bg-slate-800"
          >
            Abbrechen
          </button>
          <button 
            onClick={onConfirm} 
            className="px-4 py-2 bg-red-600 hover:bg-red-500 text-white font-bold rounded shadow-lg transition transform active:scale-95"
          >
            Löschen
          </button>
        </div>
      </div>
    </div>
  );
};

export default ConfirmationModal;