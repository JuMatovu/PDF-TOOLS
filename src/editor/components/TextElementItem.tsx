import React, { useState, useRef, useEffect, useCallback } from 'react';
import { TextElement } from '../types/editorTypes';
import {
  Bold,
  Italic,
  Trash2,
  Copy,
  AlignLeft,
  AlignCenter,
  AlignRight,
  Move,
  GripVertical,
} from 'lucide-react';

interface TextElementItemProps {
  element: TextElement;
  isSelected: boolean;
  zoom: number; // e.g. 100
  pageWidth: number; // PDF points
  pageHeight: number; // PDF points
  onSelect: (id: string, e: React.MouseEvent) => void;
  onUpdate: (id: string, updates: Partial<TextElement>, recordHistory?: boolean) => void;
  onDelete: (id: string) => void;
  onDuplicate: (id: string) => void;
}

const QUICK_COLORS = [
  { hex: '#0f172a', label: 'Dark Slate' },
  { hex: '#16a34a', label: 'PDFTOOL Green' },
  { hex: '#d97706', label: 'Amber' },
  { hex: '#dc2626', label: 'Red' },
  { hex: '#2563eb', label: 'Blue' },
];

export const TextElementItem: React.FC<TextElementItemProps> = ({
  element,
  isSelected,
  zoom,
  pageWidth,
  pageHeight,
  onSelect,
  onUpdate,
  onDelete,
  onDuplicate,
}) => {
  const [isEditing, setIsEditing] = useState<boolean>(false);
  const [editText, setEditText] = useState<string>(element.text);
  const [isDragging, setIsDragging] = useState<boolean>(false);
  const [showColorPicker, setShowColorPicker] = useState<boolean>(false);

  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const elementRef = useRef<HTMLDivElement>(null);
  const dragStartPos = useRef<{ mouseX: number; mouseY: number; startX: number; startY: number } | null>(null);

  const zoomScale = zoom / 100;

  // Sync edit text if element text changes externally
  useEffect(() => {
    setEditText(element.text);
  }, [element.text]);

  // Focus and select textarea when entering edit mode
  useEffect(() => {
    if (isEditing && textareaRef.current) {
      textareaRef.current.focus();
      textareaRef.current.select();
    }
  }, [isEditing]);

  // Handle Drag / Move
  const handleMouseDown = (e: React.MouseEvent) => {
    // If currently editing text, let textarea handle mouse events
    if (isEditing) return;

    e.stopPropagation();
    onSelect(element.id, e);

    // Prepare drag
    dragStartPos.current = {
      mouseX: e.clientX,
      mouseY: e.clientY,
      startX: element.x,
      startY: element.y,
    };
    setIsDragging(true);

    const handleMouseMove = (moveEvent: MouseEvent) => {
      if (!dragStartPos.current) return;
      const deltaX = (moveEvent.clientX - dragStartPos.current.mouseX) / zoomScale;
      const deltaY = (moveEvent.clientY - dragStartPos.current.mouseY) / zoomScale;

      const newX = Math.max(0, Math.min(pageWidth - 40, dragStartPos.current.startX + deltaX));
      const newY = Math.max(0, Math.min(pageHeight - 20, dragStartPos.current.startY + deltaY));

      onUpdate(element.id, { x: newX, y: newY }, false);
    };

    const handleMouseUp = (upEvent: MouseEvent) => {
      setIsDragging(false);
      window.removeEventListener('mousemove', handleMouseMove);
      window.removeEventListener('mouseup', handleMouseUp);

      if (dragStartPos.current) {
        const deltaX = Math.abs((upEvent.clientX - dragStartPos.current.mouseX) / zoomScale);
        const deltaY = Math.abs((upEvent.clientY - dragStartPos.current.mouseY) / zoomScale);

        // If moved more than 2px, commit history
        if (deltaX > 2 || deltaY > 2) {
          const finalX = (elementRef.current?.offsetLeft || 0) / zoomScale;
          const finalY = (elementRef.current?.offsetTop || 0) / zoomScale;
          onUpdate(element.id, { x: finalX, y: finalY }, true);
        }
      }
      dragStartPos.current = null;
    };

    window.addEventListener('mousemove', handleMouseMove);
    window.addEventListener('mouseup', handleMouseUp);
  };

  // Double click enters text edit mode
  const handleDoubleClick = (e: React.MouseEvent) => {
    e.stopPropagation();
    setIsEditing(true);
  };

  const handleTextBlur = () => {
    setIsEditing(false);
    const trimmed = editText.trim();
    if (!trimmed) {
      // If completely blank, delete it
      onDelete(element.id);
    } else if (trimmed !== element.text) {
      onUpdate(element.id, { text: trimmed }, true);
    }
  };

  const handleTextKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === 'Escape') {
      setIsEditing(false);
      handleTextBlur();
    }
    // Allow Shift+Enter for newlines, Enter commits in single line mode if desired, but multi-line text is great
  };

  // Pixel calculations for rendered screen
  const displayX = element.x * zoomScale;
  const displayY = element.y * zoomScale;
  const displayFontSize = Math.max(9, element.fontSize * zoomScale);

  const getFontFamilyStyle = (family: string) => {
    switch (family) {
      case 'Roboto':
        return "'Roboto', sans-serif";
      case 'Helvetica':
        return 'Helvetica, Arial, sans-serif';
      case 'Times New Roman':
        return "'Times New Roman', Times, serif";
      case 'Courier':
        return "'Courier New', Courier, monospace";
      default:
        return "'Roboto', sans-serif";
    }
  };

  return (
    <div
      ref={elementRef}
      onMouseDown={handleMouseDown}
      onDoubleClick={handleDoubleClick}
      className={`absolute select-none cursor-move transition-shadow ${
        isSelected
          ? 'ring-2 ring-emerald-600 ring-offset-1 z-30'
          : 'hover:ring-1 hover:ring-emerald-400/60 z-20'
      }`}
      style={{
        left: `${displayX}px`,
        top: `${displayY}px`,
        opacity: element.opacity ?? 1.0,
      }}
    >
      {/* Floating Mini-Toolbar when Selected (Canva/Google Docs style) */}
      {isSelected && !isEditing && (
        <div
          onMouseDown={(e) => e.stopPropagation()}
          className="absolute -top-10 left-0 bg-white dark:bg-neutral-900 border border-neutral-200 dark:border-neutral-800 rounded-xl shadow-lg px-1.5 py-1 flex items-center gap-1 z-50 text-neutral-700 dark:text-neutral-200 text-xs whitespace-nowrap"
        >
          {element.coverOriginal && (
            <span className="px-1.5 py-0.5 rounded bg-emerald-100 text-emerald-800 dark:bg-emerald-950 dark:text-emerald-300 text-[10px] font-bold">
              PDF Text
            </span>
          )}

          {/* Quick Edit Button */}
          <button
            type="button"
            onClick={() => setIsEditing(true)}
            className="px-2 py-0.5 rounded bg-emerald-600 hover:bg-emerald-700 text-white font-medium text-[11px] cursor-pointer"
            title="Edit text content (or double-click)"
          >
            Edit
          </button>

          {/* Drag Handle Indicator */}
          <div className="text-neutral-400 px-0.5 cursor-grab" title="Drag to move">
            <GripVertical className="w-3.5 h-3.5" />
          </div>

          <div className="h-3.5 w-px bg-neutral-200 dark:bg-neutral-700" />

          {/* Font Family Selector */}
          <select
            value={element.fontFamily}
            onChange={(e) => onUpdate(element.id, { fontFamily: e.target.value }, true)}
            className="text-[11px] font-medium bg-transparent border-none focus:outline-none cursor-pointer pr-1"
          >
            <option value="Roboto">Roboto</option>
            <option value="Helvetica">Helvetica</option>
            <option value="Times New Roman">Times</option>
            <option value="Courier">Courier</option>
          </select>

          <div className="h-3.5 w-px bg-neutral-200 dark:bg-neutral-700" />

          {/* Font Size Steps */}
          <div className="flex items-center gap-0.5">
            <button
              type="button"
              onClick={() => onUpdate(element.id, { fontSize: Math.max(8, element.fontSize - 2) }, true)}
              className="px-1.5 py-0.5 rounded hover:bg-neutral-100 dark:hover:bg-neutral-800 text-[11px] font-bold"
              title="Decrease Font Size"
            >
              -
            </button>
            <span className="text-[11px] font-semibold min-w-[20px] text-center font-mono">
              {element.fontSize}
            </span>
            <button
              type="button"
              onClick={() => onUpdate(element.id, { fontSize: Math.min(72, element.fontSize + 2) }, true)}
              className="px-1.5 py-0.5 rounded hover:bg-neutral-100 dark:hover:bg-neutral-800 text-[11px] font-bold"
              title="Increase Font Size"
            >
              +
            </button>
          </div>

          <div className="h-3.5 w-px bg-neutral-200 dark:bg-neutral-700" />

          {/* Bold */}
          <button
            type="button"
            onClick={() => onUpdate(element.id, { isBold: !element.isBold }, true)}
            className={`p-1 rounded ${
              element.isBold
                ? 'bg-emerald-100 text-emerald-700 dark:bg-emerald-950 dark:text-emerald-300 font-bold'
                : 'hover:bg-neutral-100 dark:hover:bg-neutral-800'
            }`}
            title="Bold"
          >
            <Bold className="w-3 h-3" />
          </button>

          {/* Italic */}
          <button
            type="button"
            onClick={() => onUpdate(element.id, { isItalic: !element.isItalic }, true)}
            className={`p-1 rounded ${
              element.isItalic
                ? 'bg-emerald-100 text-emerald-700 dark:bg-emerald-950 dark:text-emerald-300'
                : 'hover:bg-neutral-100 dark:hover:bg-neutral-800'
            }`}
            title="Italic"
          >
            <Italic className="w-3 h-3" />
          </button>

          {/* Color Swatch Button */}
          <div className="relative">
            <button
              type="button"
              onClick={() => setShowColorPicker(!showColorPicker)}
              className="p-1 rounded hover:bg-neutral-100 dark:hover:bg-neutral-800 flex items-center gap-1"
              title="Change Text Color"
            >
              <div
                className="w-3 h-3 rounded-full border border-neutral-300 dark:border-neutral-600 shadow-2xs"
                style={{ backgroundColor: element.color }}
              />
            </button>

            {showColorPicker && (
              <div
                className="absolute top-7 left-0 bg-white dark:bg-neutral-900 border border-neutral-200 dark:border-neutral-800 rounded-xl shadow-xl p-2 flex items-center gap-1.5 z-50"
                onMouseLeave={() => setShowColorPicker(false)}
              >
                {QUICK_COLORS.map((col) => (
                  <button
                    key={col.hex}
                    type="button"
                    onClick={() => {
                      onUpdate(element.id, { color: col.hex }, true);
                      setShowColorPicker(false);
                    }}
                    className="w-4 h-4 rounded-full border border-neutral-300 hover:scale-115 transition-transform"
                    style={{ backgroundColor: col.hex }}
                    title={col.label}
                  />
                ))}
              </div>
            )}
          </div>

          <div className="h-3.5 w-px bg-neutral-200 dark:bg-neutral-700" />

          {/* Duplicate */}
          <button
            type="button"
            onClick={() => onDuplicate(element.id)}
            className="p-1 rounded hover:bg-neutral-100 dark:hover:bg-neutral-800 text-neutral-500 hover:text-neutral-900"
            title="Duplicate"
          >
            <Copy className="w-3 h-3" />
          </button>

          {/* Delete */}
          <button
            type="button"
            onClick={() => onDelete(element.id)}
            className="p-1 rounded hover:bg-rose-50 text-neutral-400 hover:text-rose-600"
            title="Delete (Backspace/Del)"
          >
            <Trash2 className="w-3 h-3" />
          </button>
        </div>
      )}

      {/* Selection Corner Handles */}
      {isSelected && !isEditing && (
        <>
          <div className="absolute -top-1 -left-1 w-2 h-2 bg-white border border-emerald-600 rounded-2xs pointer-events-none" />
          <div className="absolute -top-1 -right-1 w-2 h-2 bg-white border border-emerald-600 rounded-2xs pointer-events-none" />
          <div className="absolute -bottom-1 -left-1 w-2 h-2 bg-white border border-emerald-600 rounded-2xs pointer-events-none" />
          <div className="absolute -bottom-1 -right-1 w-2 h-2 bg-white border border-emerald-600 rounded-2xs pointer-events-none" />
        </>
      )}

      {/* Text Box Content or Inline Editor */}
      {isEditing ? (
        <textarea
          ref={textareaRef}
          value={editText}
          onChange={(e) => setEditText(e.target.value)}
          onBlur={handleTextBlur}
          onKeyDown={handleTextKeyDown}
          className="bg-white/95 text-neutral-900 border border-emerald-500 rounded p-1 outline-none resize-none overflow-hidden block min-w-[120px] shadow-md"
          style={{
            fontSize: `${displayFontSize}px`,
            fontFamily: getFontFamilyStyle(element.fontFamily),
            fontWeight: element.isBold ? 700 : 400,
            fontStyle: element.isItalic ? 'italic' : 'normal',
            textAlign: element.alignment,
            color: element.color,
            lineHeight: 1.25,
          }}
          rows={Math.max(1, editText.split('\n').length)}
        />
      ) : (
        <div
          className="p-1 min-w-[40px] whitespace-pre-wrap leading-tight transition-colors rounded-xs"
          style={{
            fontSize: `${displayFontSize}px`,
            fontFamily: getFontFamilyStyle(element.fontFamily),
            fontWeight: element.isBold ? 700 : 400,
            fontStyle: element.isItalic ? 'italic' : 'normal',
            textAlign: element.alignment,
            color: element.color,
            textDecoration: element.isUnderline ? 'underline' : 'none',
            backgroundColor:
              element.backgroundColor ||
              (element.coverOriginal ? '#ffffff' : 'transparent'),
            boxShadow: element.coverOriginal ? '0 0 0 1px rgba(0,0,0,0.06)' : undefined,
          }}
        >
          {element.text || 'Type something...'}
        </div>
      )}
    </div>
  );
};
