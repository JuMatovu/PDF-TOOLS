import React, { useState } from 'react';
import { X, Award, Check } from 'lucide-react';
import { StampElement } from '../types/editorTypes';

interface StampSelectorModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSelectStamp: (stamp: Omit<StampElement, 'id' | 'pageNumber' | 'x' | 'y'>) => void;
}

const PRESET_STAMPS = [
  { text: 'APPROVED', color: '#16a34a', borderColor: '#16a34a', style: 'double' as const },
  { text: 'CONFIDENTIAL', color: '#dc2626', borderColor: '#dc2626', style: 'double' as const },
  { text: 'REJECTED', color: '#dc2626', borderColor: '#dc2626', style: 'solid' as const },
  { text: 'DRAFT', color: '#d97706', borderColor: '#d97706', style: 'dashed' as const },
  { text: 'FINAL', color: '#2563eb', borderColor: '#2563eb', style: 'double' as const },
  { text: 'PAID', color: '#16a34a', borderColor: '#16a34a', style: 'solid' as const },
  { text: 'VOID', color: '#64748b', borderColor: '#64748b', style: 'dashed' as const },
  { text: 'COPY', color: '#7c3aed', borderColor: '#7c3aed', style: 'solid' as const },
];

export const StampSelectorModal: React.FC<StampSelectorModalProps> = ({
  isOpen,
  onClose,
  onSelectStamp,
}) => {
  const [customText, setCustomText] = useState<string>('VERIFIED');
  const [customColor, setCustomColor] = useState<string>('#16a34a');
  const [customStyle, setCustomStyle] = useState<'solid' | 'dashed' | 'double'>('double');

  if (!isOpen) return null;

  const handleChoosePreset = (preset: typeof PRESET_STAMPS[0]) => {
    onSelectStamp({
      type: 'stamp',
      text: preset.text,
      color: preset.color,
      borderColor: preset.borderColor,
      style: preset.style,
      width: 140,
      height: 48,
    });
    onClose();
  };

  const handleApplyCustom = () => {
    if (!customText.trim()) return;
    onSelectStamp({
      type: 'stamp',
      text: customText.toUpperCase().trim(),
      color: customColor,
      borderColor: customColor,
      style: customStyle,
      width: Math.max(120, customText.length * 14),
      height: 48,
    });
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 bg-neutral-900/60 backdrop-blur-xs flex items-center justify-center p-4">
      <div className="bg-white dark:bg-neutral-900 border border-neutral-200 dark:border-neutral-800 rounded-2xl shadow-2xl max-w-md w-full overflow-hidden flex flex-col">
        {/* Header */}
        <div className="px-5 py-4 border-b border-neutral-200 dark:border-neutral-800 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-lg bg-emerald-100 dark:bg-emerald-950 text-emerald-600 dark:text-emerald-400 flex items-center justify-center">
              <Award className="w-4 h-4" />
            </div>
            <div>
              <h3 className="text-sm font-bold text-neutral-900 dark:text-white">Choose Stamp</h3>
              <p className="text-[11px] text-neutral-500">Pick a preset or generate a custom document badge</p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="p-1 rounded-lg text-neutral-400 hover:text-neutral-700 dark:hover:text-white hover:bg-neutral-100 dark:hover:bg-neutral-800 cursor-pointer"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Presets Grid */}
        <div className="p-5 space-y-4">
          <div>
            <span className="text-xs font-bold text-neutral-700 dark:text-neutral-300 block mb-2">
              Preset Stamps
            </span>
            <div className="grid grid-cols-2 gap-2.5">
              {PRESET_STAMPS.map((stamp) => (
                <button
                  key={stamp.text}
                  type="button"
                  onClick={() => handleChoosePreset(stamp)}
                  className="p-3 rounded-xl border border-neutral-200 dark:border-neutral-700 hover:border-emerald-500 bg-neutral-50/50 dark:bg-neutral-800/40 hover:bg-white dark:hover:bg-neutral-800 transition-all flex items-center justify-center cursor-pointer shadow-2xs group"
                >
                  <div
                    className="px-3 py-1.5 rounded text-xs font-black tracking-widest uppercase transition-transform group-hover:scale-105"
                    style={{
                      color: stamp.color,
                      borderColor: stamp.borderColor,
                      borderWidth: '2.5px',
                      borderStyle: stamp.style === 'double' ? 'double' : stamp.style === 'dashed' ? 'dashed' : 'solid',
                    }}
                  >
                    {stamp.text}
                  </div>
                </button>
              ))}
            </div>
          </div>

          <div className="border-t border-neutral-200 dark:border-neutral-800 pt-4 space-y-3">
            <span className="text-xs font-bold text-neutral-700 dark:text-neutral-300 block">
              Custom Stamp
            </span>
            <div className="flex gap-2">
              <input
                type="text"
                value={customText}
                onChange={(e) => setCustomText(e.target.value)}
                placeholder="Custom stamp word"
                className="flex-1 px-3 py-1.5 text-xs rounded-lg border border-neutral-200 dark:border-neutral-700 uppercase font-bold focus:outline-none focus:border-emerald-600 bg-neutral-50 dark:bg-neutral-800"
              />
              <input
                type="color"
                value={customColor}
                onChange={(e) => setCustomColor(e.target.value)}
                className="w-9 h-8 rounded-lg cursor-pointer border border-neutral-200 dark:border-neutral-700 p-0.5"
                title="Stamp Color"
              />
            </div>

            <div className="flex items-center justify-between pt-1">
              <div className="flex items-center gap-1 text-xs">
                {(['solid', 'dashed', 'double'] as const).map((style) => (
                  <button
                    key={style}
                    type="button"
                    onClick={() => setCustomStyle(style)}
                    className={`px-2 py-1 rounded text-[11px] capitalize cursor-pointer ${
                      customStyle === style
                        ? 'bg-emerald-600 text-white font-bold'
                        : 'bg-neutral-100 dark:bg-neutral-800 text-neutral-600'
                    }`}
                  >
                    {style}
                  </button>
                ))}
              </div>

              <button
                type="button"
                onClick={handleApplyCustom}
                className="px-3 py-1.5 rounded-lg bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold flex items-center gap-1 cursor-pointer"
              >
                <Check className="w-3.5 h-3.5" />
                <span>Use Custom</span>
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
