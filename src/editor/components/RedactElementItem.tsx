import React, { useRef } from 'react';
import { RedactElement } from '../types/editorTypes';
import { Trash2, ShieldAlert } from 'lucide-react';

interface RedactElementItemProps {
  element: RedactElement;
  isSelected: boolean;
  zoom: number;
  pageWidth: number;
  pageHeight: number;
  onSelect: (id: string, e: React.MouseEvent) => void;
  onUpdate: (id: string, updates: Partial<RedactElement>, recordHistory?: boolean) => void;
  onDelete: (id: string) => void;
}

export const RedactElementItem: React.FC<RedactElementItemProps> = ({
  element,
  isSelected,
  zoom,
  pageWidth,
  pageHeight,
  onSelect,
  onUpdate,
  onDelete,
}) => {
  const zoomScale = zoom / 100;
  const dragStartPos = useRef<{ mouseX: number; mouseY: number; startX: number; startY: number } | null>(null);
  const resizeStartPos = useRef<{ mouseX: number; mouseY: number; startW: number; startH: number } | null>(null);

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

  const handleResizeDown = (e: React.MouseEvent) => {
    e.stopPropagation();
    resizeStartPos.current = {
      mouseX: e.clientX,
      mouseY: e.clientY,
      startW: element.width,
      startH: element.height,
    };

    const handleResizeMove = (moveEvent: MouseEvent) => {
      if (!resizeStartPos.current) return;
      const deltaX = (moveEvent.clientX - resizeStartPos.current.mouseX) / zoomScale;
      const deltaY = (moveEvent.clientY - resizeStartPos.current.mouseY) / zoomScale;

      const newW = Math.max(20, resizeStartPos.current.startW + deltaX);
      const newH = Math.max(10, resizeStartPos.current.startH + deltaY);

      onUpdate(element.id, { width: newW, height: newH }, false);
    };

    const handleResizeUp = () => {
      window.removeEventListener('mousemove', handleResizeMove);
      window.removeEventListener('mouseup', handleResizeUp);
      resizeStartPos.current = null;
      onUpdate(element.id, {}, true);
    };

    window.addEventListener('mousemove', handleResizeMove);
    window.addEventListener('mouseup', handleResizeUp);
  };

  const displayX = element.x * zoomScale;
  const displayY = element.y * zoomScale;
  const displayW = element.width * zoomScale;
  const displayH = element.height * zoomScale;

  return (
    <div
      onMouseDown={handleMouseDown}
      className={`absolute cursor-move select-none ${
        isSelected ? 'ring-2 ring-rose-600 ring-offset-1 z-30' : 'hover:ring-1 hover:ring-rose-400 z-20'
      }`}
      style={{
        left: `${displayX}px`,
        top: `${displayY}px`,
        width: `${displayW}px`,
        height: `${displayH}px`,
        backgroundColor: element.fillColor || '#000000',
      }}
    >
      {isSelected && (
        <div
          onMouseDown={(e) => e.stopPropagation()}
          className="absolute -top-9 left-0 bg-neutral-900 text-white border border-neutral-800 rounded-lg shadow-md px-2 py-0.5 flex items-center gap-1.5 z-50 text-[11px]"
        >
          <ShieldAlert className="w-3 h-3 text-rose-500" />
          <span className="font-semibold text-rose-300">Redacted Area</span>
          <button
            type="button"
            onClick={() => onDelete(element.id)}
            className="p-1 rounded hover:bg-neutral-800 text-neutral-400 hover:text-rose-400 cursor-pointer ml-1"
            title="Remove Redaction"
          >
            <Trash2 className="w-3 h-3" />
          </button>
        </div>
      )}

      {/* Resize Handle */}
      {isSelected && (
        <div
          onMouseDown={handleResizeDown}
          className="absolute -bottom-1.5 -right-1.5 w-3.5 h-3.5 bg-white border-2 border-rose-600 rounded-sm cursor-nwse-resize shadow-xs z-40"
          title="Drag to resize redacted area"
        />
      )}
    </div>
  );
};
