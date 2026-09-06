import React, { useState, useRef, useEffect } from 'react';
import { X, PenTool, Type, Upload, RotateCcw, Check } from 'lucide-react';

interface SignatureModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSaveSignature: (dataUrl: string, type: 'draw' | 'type' | 'upload') => void;
}

const SIGNATURE_COLORS = [
  { hex: '#0f172a', label: 'Black' },
  { hex: '#1d4ed8', label: 'Blue' },
  { hex: '#15803d', label: 'Green' },
];

export const SignatureModal: React.FC<SignatureModalProps> = ({
  isOpen,
  onClose,
  onSaveSignature,
}) => {
  const [activeTab, setActiveTab] = useState<'draw' | 'type' | 'upload'>('draw');
  const [selectedColor, setSelectedColor] = useState<string>('#0f172a');

  // Draw State
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [isDrawing, setIsDrawing] = useState<boolean>(false);
  const [hasDrawn, setHasDrawn] = useState<boolean>(false);

  // Type State
  const [typedName, setTypedName] = useState<string>('John Doe');
  const [selectedFont, setSelectedFont] = useState<string>('cursive-1');

  // Upload State
  const [uploadedDataUrl, setUploadedDataUrl] = useState<string | null>(null);

  useEffect(() => {
    if (isOpen && activeTab === 'draw' && canvasRef.current) {
      const canvas = canvasRef.current;
      const ctx = canvas.getContext('2d');
      if (ctx) {
        ctx.lineCap = 'round';
        ctx.lineJoin = 'round';
        ctx.strokeStyle = selectedColor;
        ctx.lineWidth = 2.5;
      }
    }
  }, [isOpen, activeTab, selectedColor]);

  if (!isOpen) return null;

  // Drawing Canvas Handlers
  const startDrawing = (e: React.MouseEvent<HTMLCanvasElement> | React.TouchEvent<HTMLCanvasElement>) => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const rect = canvas.getBoundingClientRect();
    const clientX = 'touches' in e ? e.touches[0].clientX : e.clientX;
    const clientY = 'touches' in e ? e.touches[0].clientY : e.clientY;

    const x = clientX - rect.left;
    const y = clientY - rect.top;

    ctx.beginPath();
    ctx.moveTo(x, y);
    ctx.strokeStyle = selectedColor;
    ctx.lineWidth = 2.5;
    setIsDrawing(true);
    setHasDrawn(true);
  };

  const draw = (e: React.MouseEvent<HTMLCanvasElement> | React.TouchEvent<HTMLCanvasElement>) => {
    if (!isDrawing) return;
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const rect = canvas.getBoundingClientRect();
    const clientX = 'touches' in e ? e.touches[0].clientX : e.clientX;
    const clientY = 'touches' in e ? e.touches[0].clientY : e.clientY;

    const x = clientX - rect.left;
    const y = clientY - rect.top;

    ctx.lineTo(x, y);
    ctx.stroke();
  };

  const stopDrawing = () => {
    setIsDrawing(false);
  };

  const clearCanvas = () => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    setHasDrawn(false);
  };

  // Generate dataUrl from typed name
  const generateTypedSignature = (): string => {
    const tempCanvas = document.createElement('canvas');
    tempCanvas.width = 500;
    tempCanvas.height = 160;
    const ctx = tempCanvas.getContext('2d');
    if (!ctx) return '';

    ctx.clearRect(0, 0, tempCanvas.width, tempCanvas.height);
    ctx.fillStyle = selectedColor;

    let fontStyle = "italic 44px 'Brush Script MT', cursive, sans-serif";
    if (selectedFont === 'cursive-2') {
      fontStyle = "italic 40px 'Lucida Handwriting', cursive, sans-serif";
    } else if (selectedFont === 'cursive-3') {
      fontStyle = "italic 48px 'Snell Roundhand', cursive, sans-serif";
    }

    ctx.font = fontStyle;
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillText(typedName, tempCanvas.width / 2, tempCanvas.height / 2);

    return tempCanvas.toDataURL('image/png');
  };

  // Upload handler
  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onload = () => {
        if (typeof reader.result === 'string') {
          setUploadedDataUrl(reader.result);
        }
      };
      reader.readAsDataURL(file);
    }
  };

  const handleApply = () => {
    if (activeTab === 'draw') {
      if (!canvasRef.current || !hasDrawn) return;
      const dataUrl = canvasRef.current.toDataURL('image/png');
      onSaveSignature(dataUrl, 'draw');
    } else if (activeTab === 'type') {
      if (!typedName.trim()) return;
      const dataUrl = generateTypedSignature();
      onSaveSignature(dataUrl, 'type');
    } else if (activeTab === 'upload') {
      if (!uploadedDataUrl) return;
      onSaveSignature(uploadedDataUrl, 'upload');
    }
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 bg-neutral-900/60 backdrop-blur-xs flex items-center justify-center p-4">
      <div className="bg-white dark:bg-neutral-900 border border-neutral-200 dark:border-neutral-800 rounded-2xl shadow-2xl max-w-lg w-full overflow-hidden flex flex-col">
        {/* Header */}
        <div className="px-5 py-4 border-b border-neutral-200 dark:border-neutral-800 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-lg bg-emerald-100 dark:bg-emerald-950 text-emerald-600 dark:text-emerald-400 flex items-center justify-center">
              <PenTool className="w-4 h-4" />
            </div>
            <div>
              <h3 className="text-sm font-bold text-neutral-900 dark:text-white">Add Signature</h3>
              <p className="text-[11px] text-neutral-500">Sign your document with a legally recognizable signature</p>
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

        {/* Tab Navigation */}
        <div className="flex border-b border-neutral-200 dark:border-neutral-800 px-5 pt-3 gap-2 bg-neutral-50 dark:bg-neutral-900/50">
          <button
            type="button"
            onClick={() => setActiveTab('draw')}
            className={`pb-2 px-3 text-xs font-semibold flex items-center gap-1.5 border-b-2 transition-colors cursor-pointer ${
              activeTab === 'draw'
                ? 'border-emerald-600 text-emerald-600 dark:text-emerald-400 font-bold'
                : 'border-transparent text-neutral-500 hover:text-neutral-900'
            }`}
          >
            <PenTool className="w-3.5 h-3.5" />
            <span>Draw</span>
          </button>

          <button
            type="button"
            onClick={() => setActiveTab('type')}
            className={`pb-2 px-3 text-xs font-semibold flex items-center gap-1.5 border-b-2 transition-colors cursor-pointer ${
              activeTab === 'type'
                ? 'border-emerald-600 text-emerald-600 dark:text-emerald-400 font-bold'
                : 'border-transparent text-neutral-500 hover:text-neutral-900'
            }`}
          >
            <Type className="w-3.5 h-3.5" />
            <span>Type</span>
          </button>

          <button
            type="button"
            onClick={() => setActiveTab('upload')}
            className={`pb-2 px-3 text-xs font-semibold flex items-center gap-1.5 border-b-2 transition-colors cursor-pointer ${
              activeTab === 'upload'
                ? 'border-emerald-600 text-emerald-600 dark:text-emerald-400 font-bold'
                : 'border-transparent text-neutral-500 hover:text-neutral-900'
            }`}
          >
            <Upload className="w-3.5 h-3.5" />
            <span>Upload</span>
          </button>
        </div>

        {/* Tab Body */}
        <div className="p-5 space-y-4">
          {/* TAB 1: DRAW */}
          {activeTab === 'draw' && (
            <div className="space-y-3">
              <div className="relative border-2 border-dashed border-neutral-300 dark:border-neutral-700 rounded-xl bg-neutral-50 dark:bg-neutral-950 flex flex-col items-center justify-center overflow-hidden">
                <canvas
                  ref={canvasRef}
                  width={460}
                  height={180}
                  onMouseDown={startDrawing}
                  onMouseMove={draw}
                  onMouseUp={stopDrawing}
                  onMouseLeave={stopDrawing}
                  onTouchStart={startDrawing}
                  onTouchMove={draw}
                  onTouchEnd={stopDrawing}
                  className="cursor-crosshair w-full h-[180px] touch-none"
                />
                {!hasDrawn && (
                  <div className="absolute pointer-events-none text-neutral-400 text-xs flex flex-col items-center gap-1">
                    <PenTool className="w-5 h-5 opacity-40" />
                    <span>Draw signature here</span>
                  </div>
                )}
                {/* Signature base line */}
                <div className="absolute bottom-6 left-8 right-8 h-px bg-neutral-300/80 dark:bg-neutral-700/80 pointer-events-none" />
              </div>

              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <span className="text-[11px] font-semibold text-neutral-500">Color:</span>
                  <div className="flex items-center gap-1.5">
                    {SIGNATURE_COLORS.map((col) => (
                      <button
                        key={col.hex}
                        type="button"
                        onClick={() => setSelectedColor(col.hex)}
                        className={`w-5 h-5 rounded-full border transition-transform ${
                          selectedColor === col.hex ? 'ring-2 ring-emerald-500 scale-110' : 'border-neutral-300'
                        }`}
                        style={{ backgroundColor: col.hex }}
                        title={col.label}
                      />
                    ))}
                  </div>
                </div>

                <button
                  type="button"
                  onClick={clearCanvas}
                  className="px-2.5 py-1 rounded-lg text-xs font-semibold text-neutral-600 hover:text-neutral-900 dark:text-neutral-300 hover:bg-neutral-100 dark:hover:bg-neutral-800 flex items-center gap-1 cursor-pointer"
                >
                  <RotateCcw className="w-3 h-3" />
                  <span>Clear</span>
                </button>
              </div>
            </div>
          )}

          {/* TAB 2: TYPE */}
          {activeTab === 'type' && (
            <div className="space-y-4">
              <div>
                <label className="text-xs font-bold text-neutral-700 dark:text-neutral-300 block mb-1">
                  Your Full Name
                </label>
                <input
                  type="text"
                  value={typedName}
                  onChange={(e) => setTypedName(e.target.value)}
                  placeholder="Enter your name"
                  className="w-full px-3 py-2 text-sm rounded-xl border border-neutral-200 dark:border-neutral-700 bg-neutral-50 dark:bg-neutral-800 text-neutral-900 dark:text-white focus:outline-none focus:border-emerald-600"
                />
              </div>

              {/* Style Presets */}
              <div className="space-y-2">
                <label className="text-xs font-bold text-neutral-700 dark:text-neutral-300 block">
                  Select Style
                </label>
                <div className="grid grid-cols-3 gap-2">
                  {[
                    { id: 'cursive-1', label: 'Classic Script', font: "'Brush Script MT', cursive, sans-serif" },
                    { id: 'cursive-2', label: 'Handwritten', font: "'Lucida Handwriting', cursive, sans-serif" },
                    { id: 'cursive-3', label: 'Elegant Flow', font: "'Snell Roundhand', cursive, sans-serif" },
                  ].map((style) => (
                    <button
                      key={style.id}
                      type="button"
                      onClick={() => setSelectedFont(style.id)}
                      className={`p-3 rounded-xl border text-center transition-all cursor-pointer ${
                        selectedFont === style.id
                          ? 'border-emerald-600 bg-emerald-50/50 dark:bg-emerald-950/40 ring-1 ring-emerald-500'
                          : 'border-neutral-200 dark:border-neutral-700 hover:bg-neutral-50'
                      }`}
                    >
                      <div
                        className="text-base truncate"
                        style={{ fontFamily: style.font, color: selectedColor }}
                      >
                        {typedName || 'Signature'}
                      </div>
                      <div className="text-[10px] text-neutral-400 mt-1 font-sans">{style.label}</div>
                    </button>
                  ))}
                </div>
              </div>

              <div className="flex items-center gap-2">
                <span className="text-[11px] font-semibold text-neutral-500">Color:</span>
                <div className="flex items-center gap-1.5">
                  {SIGNATURE_COLORS.map((col) => (
                    <button
                      key={col.hex}
                      type="button"
                      onClick={() => setSelectedColor(col.hex)}
                      className={`w-5 h-5 rounded-full border transition-transform ${
                        selectedColor === col.hex ? 'ring-2 ring-emerald-500 scale-110' : 'border-neutral-300'
                      }`}
                      style={{ backgroundColor: col.hex }}
                      title={col.label}
                    />
                  ))}
                </div>
              </div>
            </div>
          )}

          {/* TAB 3: UPLOAD */}
          {activeTab === 'upload' && (
            <div className="space-y-4">
              <label className="border-2 border-dashed border-neutral-300 dark:border-neutral-700 hover:border-emerald-500 rounded-2xl p-6 flex flex-col items-center justify-center gap-2 cursor-pointer bg-neutral-50 dark:bg-neutral-950 transition-colors">
                <input
                  type="file"
                  accept="image/png,image/jpeg,image/svg+xml"
                  onChange={handleFileUpload}
                  className="hidden"
                />
                <Upload className="w-6 h-6 text-neutral-400" />
                <span className="text-xs font-bold text-neutral-700 dark:text-neutral-300">
                  Click to select signature image
                </span>
                <span className="text-[11px] text-neutral-400">PNG with transparent background recommended</span>
              </label>

              {uploadedDataUrl && (
                <div className="p-3 border border-neutral-200 dark:border-neutral-700 rounded-xl bg-white dark:bg-neutral-900 flex items-center justify-center">
                  <img src={uploadedDataUrl} alt="Signature Preview" className="max-h-24 object-contain" />
                </div>
              )}
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="px-5 py-3 border-t border-neutral-200 dark:border-neutral-800 bg-neutral-50 dark:bg-neutral-900/60 flex items-center justify-end gap-2">
          <button
            type="button"
            onClick={onClose}
            className="px-3.5 py-1.5 rounded-xl border border-neutral-200 dark:border-neutral-700 text-xs font-semibold text-neutral-600 hover:bg-neutral-100 dark:text-neutral-300 cursor-pointer"
          >
            Cancel
          </button>
          <button
            type="button"
            onClick={handleApply}
            className="px-4 py-1.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold shadow-md flex items-center gap-1.5 cursor-pointer"
          >
            <Check className="w-3.5 h-3.5" />
            <span>Place Signature</span>
          </button>
        </div>
      </div>
    </div>
  );
};
