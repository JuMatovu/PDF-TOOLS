import React, { useState, useRef } from 'react';
import { CommentElement } from '../types/editorTypes';
import { MessageSquare, Trash2, X, Check } from 'lucide-react';

interface CommentElementItemProps {
  element: CommentElement;
  isSelected: boolean;
  zoom: number;
  pageWidth: number;
  pageHeight: number;
  onSelect: (id: string, e: React.MouseEvent) => void;
  onUpdate: (id: string, updates: Partial<CommentElement>, recordHistory?: boolean) => void;
  onDelete: (id: string) => void;
}

export const CommentElementItem: React.FC<CommentElementItemProps> = ({
  element,
  isSelected,
  zoom,
  pageWidth,
  pageHeight,
  onSelect,
  onUpdate,
  onDelete,
}) => {
  const [isOpen, setIsOpen] = useState<boolean>(element.isOpen ?? true);
  const [noteText, setNoteText] = useState<string>(element.commentText || '');

  const zoomScale = zoom / 100;
  const dragStartPos = useRef<{ mouseX: number; mouseY: number; startX: number; startY: number } | null>(null);

  const handleMouseDown = (e: React.MouseEvent) => {
    e.stopPropagation();
    onSelect(element.id, e);

    dragStartPos.current = {
      mouseX: e.clientX,
      mouseY: e.clientY,
      startX: element.x,
      startY: element.y,
    };

    const handleMouseMove = (moveEvent: MouseEvent) => {
      if (!dragStartPos.current) return;
      const deltaX = (moveEvent.clientX - dragStartPos.current.mouseX) / zoomScale;
      const deltaY = (moveEvent.clientY - dragStartPos.current.mouseY) / zoomScale;

      const newX = Math.max(0, Math.min(pageWidth - 20, dragStartPos.current.startX + deltaX));
      const newY = Math.max(0, Math.min(pageHeight - 20, dragStartPos.current.startY + deltaY));

      onUpdate(element.id, { x: newX, y: newY }, false);
    };

    const handleMouseUp = () => {
      window.removeEventListener('mousemove', handleMouseMove);
      window.removeEventListener('mouseup', handleMouseUp);
      onUpdate(element.id, {}, true);
      dragStartPos.current = null;
    };

    window.addEventListener('mousemove', handleMouseMove);
    window.addEventListener('mouseup', handleMouseUp);
  };

  const handleSaveNote = () => {
    onUpdate(element.id, { commentText: noteText, isOpen: false }, true);
    setIsOpen(false);
  };

  const displayX = element.x * zoomScale;
  const displayY = element.y * zoomScale;

  return (
    <div
      onMouseDown={handleMouseDown}
      className={`absolute cursor-move select-none z-30`}
      style={{
        left: `${displayX}px`,
        top: `${displayY}px`,
      }}
    >
      {/* Sticky Note Badge Icon */}
      <button
        type="button"
        onClick={(e) => {
          e.stopPropagation();
          setIsOpen(!isOpen);
        }}
        className="w-7 h-7 rounded-full bg-amber-400 hover:bg-amber-500 text-amber-950 flex items-center justify-center shadow-lg border-2 border-white ring-1 ring-amber-500/30 cursor-pointer transition-transform hover:scale-110"
        title="Click to view/edit comment"
      >
        <MessageSquare className="w-3.5 h-3.5 fill-current" />
      </button>

      {/* Popover Bubble */}
      {isOpen && (
        <div
          onMouseDown={(e) => e.stopPropagation()}
          className="absolute left-8 -top-2 w-64 bg-amber-50 dark:bg-neutral-900 border border-amber-300 dark:border-neutral-700 rounded-2xl shadow-xl p-3 z-50 text-xs space-y-2"
        >
          <div className="flex items-center justify-between pb-1.5 border-b border-amber-200/80 dark:border-neutral-800">
            <span className="font-bold text-amber-900 dark:text-amber-400 text-[11px]">
              {element.author || 'Reviewer'}
            </span>
            <div className="flex items-center gap-1">
              <button
                type="button"
                onClick={() => onDelete(element.id)}
                className="p-1 rounded text-neutral-400 hover:text-rose-600 cursor-pointer"
                title="Delete Comment"
              >
                <Trash2 className="w-3.5 h-3.5" />
              </button>
              <button
                type="button"
                onClick={() => setIsOpen(false)}
                className="p-1 rounded text-neutral-400 hover:text-neutral-700 cursor-pointer"
              >
                <X className="w-3.5 h-3.5" />
              </button>
            </div>
          </div>

          <textarea
            value={noteText}
            onChange={(e) => setNoteText(e.target.value)}
            placeholder="Add a comment or review note..."
            rows={3}
            className="w-full bg-white/80 dark:bg-neutral-800 text-neutral-900 dark:text-neutral-100 p-2 rounded-lg border border-amber-200 dark:border-neutral-700 text-xs focus:outline-none focus:border-amber-500 resize-none"
          />

          <div className="flex justify-end">
            <button
              type="button"
              onClick={handleSaveNote}
              className="px-2.5 py-1 bg-amber-500 hover:bg-amber-600 text-white font-bold rounded-lg flex items-center gap-1 text-[11px] cursor-pointer"
            >
              <Check className="w-3 h-3" />
              <span>Save</span>
            </button>
          </div>
        </div>
      )}
    </div>
  );
};
