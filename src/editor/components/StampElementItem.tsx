import React, { useRef } from 'react';
import { StampElement } from '../types/editorTypes';
import { Trash2, Copy } from 'lucide-react';

interface StampElementItemProps {
  element: StampElement;
  isSelected: boolean;
  zoom: number;
  pageWidth: number;
  pageHeight: number;
  onSelect: (id: string, e: React.MouseEvent) => void;
  onUpdate: (id: string, updates: Partial<StampElement>, recordHistory?: boolean) => void;
  onDelete: (id: string) => void;
  onDuplicate: (id: string) => void;
}

export const StampElementItem: React.FC<StampElementItemProps> = ({
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

  const displayX = element.x * zoomScale;
  const displayY = element.y * zoomScale;
  const displayW = element.width * zoomScale;
  const displayH = element.height * zoomScale;

  return (
    <div
      onMouseDown={handleMouseDown}
      className={`absolute cursor-move select-none ${
        isSelected ? 'ring-2 ring-emerald-600 ring-offset-1 z-30' : 'hover:ring-1 hover:ring-emerald-400/50 z-20'
      }`}
      style={{
        left: `${displayX}px`,
        top: `${displayY}px`,
        width: `${displayW}px`,
        height: `${displayH}px`,
        opacity: element.opacity ?? 1.0,
      }}
    >
      {isSelected && (
        <div
          onMouseDown={(e) => e.stopPropagation()}
          className="absolute -top-9 left-0 bg-white dark:bg-neutral-900 border border-neutral-200 dark:border-neutral-800 rounded-lg shadow-md px-1 py-0.5 flex items-center gap-1 z-50 text-xs"
        >
          <button
            type="button"
            onClick={() => onDuplicate(element.id)}
            className="p-1 rounded hover:bg-neutral-100 text-neutral-600 cursor-pointer"
            title="Duplicate"
          >
            <Copy className="w-3 h-3" />
          </button>
          <button
            type="button"
            onClick={() => onDelete(element.id)}
            className="p-1 rounded hover:bg-rose-50 text-rose-600 cursor-pointer"
            title="Delete"
          >
            <Trash2 className="w-3 h-3" />
          </button>
        </div>
      )}

      {/* Stamp Container */}
      <div
        className="w-full h-full rounded-sm bg-white/95 flex items-center justify-center font-black tracking-widest uppercase p-1"
        style={{
          color: element.color,
          borderColor: element.borderColor,
          borderWidth: `${Math.max(2, 2.5 * zoomScale)}px`,
          borderStyle: element.style === 'double' ? 'double' : element.style === 'dashed' ? 'dashed' : 'solid',
          fontSize: `${Math.max(10, 14 * zoomScale)}px`,
        }}
      >
        <span className="truncate">{element.text}</span>
      </div>
    </div>
  );
};
