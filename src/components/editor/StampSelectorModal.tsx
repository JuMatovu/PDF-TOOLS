import React from 'react';
import { X, Stamp } from 'lucide-react';

interface StampSelectorModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSelectStamp: (stamp: { text: string; color: string }) => void;
}

const PRESET_STAMPS = [
  { text: 'APPROVED', color: '#059669', desc: 'Approved for production' },
  { text: 'CONFIDENTIAL', color: '#dc2626', desc: 'Strictly confidential' },
  { text: 'DRAFT', color: '#d97706', desc: 'Working draft version' },
  { text: 'FINAL', color: '#2563eb', desc: 'Final approved revision' },
  { text: 'PAID', color: '#0d9488', desc: 'Payment receipt confirmed' },
  { text: 'URGENT', color: '#9333ea', desc: 'Immediate action required' },
  { text: 'VOID', color: '#e11d48', desc: 'Voided document' },
  { text: 'COMPLETED', color: '#16a34a', desc: 'Successfully executed' },
];

export const StampSelectorModal: React.FC<StampSelectorModalProps> = ({
  isOpen,
  onClose,
  onSelectStamp,
}) => {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs animate-fade-in">
      <div className="bg-white dark:bg-neutral-900 rounded-3xl border border-neutral-200 dark:border-neutral-800 shadow-2xl max-w-md w-full overflow-hidden">
        {/* Header */}
        <div className="px-6 py-4 border-b border-neutral-100 dark:border-neutral-800 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-xl bg-amber-100 dark:bg-amber-950/60 text-amber-600 dark:text-amber-400 flex items-center justify-center">
              <Stamp className="w-4 h-4" />
            </div>
            <div>
              <h3 className="font-bold text-neutral-900 dark:text-white text-sm">Choose Document Stamp</h3>
              <p className="text-xs text-neutral-500">Stamp official markings onto your PDF pages</p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="p-1.5 rounded-lg text-neutral-400 hover:text-neutral-600 hover:bg-neutral-100 dark:hover:bg-neutral-800 cursor-pointer"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Stamps Grid */}
        <div className="p-6 grid grid-cols-2 gap-3 max-h-96 overflow-y-auto">
          {PRESET_STAMPS.map((stamp) => (
            <button
              key={stamp.text}
              type="button"
              onClick={() => {
                onSelectStamp({ text: stamp.text, color: stamp.color });
                onClose();
              }}
              className="p-3 rounded-2xl border border-neutral-200 dark:border-neutral-800 hover:border-neutral-300 dark:hover:border-neutral-700 bg-neutral-50/50 dark:bg-neutral-800/40 hover:bg-white dark:hover:bg-neutral-800 flex flex-col items-center justify-center gap-2 transition-all cursor-pointer group hover:scale-[1.02] shadow-2xs"
            >
              <div
                className="px-3 py-1.5 rounded-lg border-2 font-black text-xs tracking-wider uppercase transform group-hover:-rotate-2 transition-transform"
                style={{
                  borderColor: stamp.color,
                  color: stamp.color,
                  backgroundColor: `${stamp.color}15`,
                }}
              >
                {stamp.text}
              </div>
              <span className="text-[11px] text-neutral-500 dark:text-neutral-400 text-center font-medium">
                {stamp.desc}
              </span>
            </button>
          ))}
        </div>

        {/* Footer */}
        <div className="px-6 py-3 bg-neutral-50 dark:bg-neutral-900/50 border-t border-neutral-100 dark:border-neutral-800 flex justify-end">
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-1.5 rounded-xl text-xs font-semibold text-neutral-600 dark:text-neutral-300 hover:bg-neutral-200 dark:hover:bg-neutral-800 cursor-pointer"
          >
            Cancel
          </button>
        </div>
      </div>
    </div>
  );
};
