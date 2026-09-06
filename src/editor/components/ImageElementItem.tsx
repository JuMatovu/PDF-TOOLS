import React, { useRef } from 'react';
import { ImageElement, SignatureElement } from '../types/editorTypes';
import { Trash2, Copy } from 'lucide-react';

interface ImageElementItemProps {
  element: ImageElement | SignatureElement;
  isSelected: boolean;
  zoom: number;
  pageWidth: number;
  pageHeight: number;
  onSelect: (id: string, e: React.MouseEvent) => void;
  onUpdate: (id: string, updates: Partial<ImageElement | SignatureElement>, recordHistory?: boolean) => void;
  onDelete: (id: string) => void;
  onDuplicate: (id: string) => void;
}

export const ImageElementItem: React.FC<ImageElementItemProps> = ({
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
  const resizeStartPos = useRef<{ mouseX: number; mouseY: number; startW: number; startH: number } | null>(null);

  // Drag to move
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

    const handleMouseUp = (upEvent: MouseEvent) => {
      window.removeEventListener('mousemove', handleMouseMove);
      window.removeEventListener('mouseup', handleMouseUp);
      if (dragStartPos.current) {
        const deltaX = Math.abs((upEvent.clientX - dragStartPos.current.mouseX) / zoomScale);
        const deltaY = Math.abs((upEvent.clientY - dragStartPos.current.mouseY) / zoomScale);
        if (deltaX > 2 || deltaY > 2) {
          onUpdate(element.id, {}, true);
        }
      }
      dragStartPos.current = null;
    };

    window.addEventListener('mousemove', handleMouseMove);
    window.addEventListener('mouseup', handleMouseUp);
  };

  // Resize preserving aspect ratio
  const handleResizeDown = (e: React.MouseEvent) => {
    e.stopPropagation();
    resizeStartPos.current = {
      mouseX: e.clientX,
      mouseY: e.clientY,
      startW: element.width,
      startH: element.height,
    };

    const aspectRatio = element.width / (element.height || 1);

    const handleResizeMove = (moveEvent: MouseEvent) => {
      if (!resizeStartPos.current) return;
      const deltaX = (moveEvent.clientX - resizeStartPos.current.mouseX) / zoomScale;
      const newW = Math.max(30, resizeStartPos.current.startW + deltaX);
      const newH = Math.max(20, newW / aspectRatio);

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
      {/* Floating Action Bar */}
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

      {/* Rendered Image or Signature */}
      <img
        src={element.dataUrl}
        alt={element.type === 'signature' ? 'Document Signature' : 'Embedded Object'}
        className="w-full h-full object-contain pointer-events-none"
        draggable={false}
      />

      {/* Resize Bottom-Right Handle */}
      {isSelected && (
        <div
          onMouseDown={handleResizeDown}
          className="absolute -bottom-1.5 -right-1.5 w-3.5 h-3.5 bg-white border-2 border-emerald-600 rounded-sm cursor-nwse-resize shadow-xs z-40"
          title="Drag to resize"
        />
      )}
    </div>
  );
};
