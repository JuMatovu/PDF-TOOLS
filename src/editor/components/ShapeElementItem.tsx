import React, { useRef } from 'react';
import { ShapeElement } from '../types/editorTypes';
import { Trash2, Copy } from 'lucide-react';

interface ShapeElementItemProps {
  element: ShapeElement;
  isSelected: boolean;
  zoom: number;
  pageWidth: number;
  pageHeight: number;
  onSelect: (id: string, e: React.MouseEvent) => void;
  onUpdate: (id: string, updates: Partial<ShapeElement>, recordHistory?: boolean) => void;
  onDelete: (id: string) => void;
  onDuplicate: (id: string) => void;
}

type ResizeDirection = 'nw' | 'n' | 'ne' | 'e' | 'se' | 's' | 'sw' | 'w';

export const ShapeElementItem: React.FC<ShapeElementItemProps> = ({
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
  const resizeStartPos = useRef<{
    mouseX: number;
    mouseY: number;
    startX: number;
    startY: number;
    startW: number;
    startH: number;
    direction: ResizeDirection;
  } | null>(null);

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

      onUpdate(element.id, { x: Math.round(newX), y: Math.round(newY) }, false);
    };

    const handleMouseUp = (upEvent: MouseEvent) => {
      window.removeEventListener('mousemove', handleMouseMove);
      window.removeEventListener('mouseup', handleMouseUp);
      if (dragStartPos.current) {
        const deltaX = Math.abs((upEvent.clientX - dragStartPos.current.mouseX) / zoomScale);
        const deltaY = Math.abs((upEvent.clientY - dragStartPos.current.mouseY) / zoomScale);
        if (deltaX > 2 || deltaY > 2) {
          onUpdate(element.id, {}, true); // commit history
        }
      }
      dragStartPos.current = null;
    };

    window.addEventListener('mousemove', handleMouseMove);
    window.addEventListener('mouseup', handleMouseUp);
  };

  // Multi-directional Resize
  const handleResizeDown = (e: React.MouseEvent, direction: ResizeDirection) => {
    e.stopPropagation();
    resizeStartPos.current = {
      mouseX: e.clientX,
      mouseY: e.clientY,
      startX: element.x,
      startY: element.y,
      startW: element.width,
      startH: element.height,
      direction,
    };

    const handleResizeMove = (moveEvent: MouseEvent) => {
      if (!resizeStartPos.current) return;
      const { mouseX, mouseY, startX, startY, startW, startH, direction: dir } = resizeStartPos.current;
      const deltaX = (moveEvent.clientX - mouseX) / zoomScale;
      const deltaY = (moveEvent.clientY - mouseY) / zoomScale;

      let newX = startX;
      let newY = startY;
      let newW = startW;
      let newH = startH;

      // Handle horizontal resize
      if (dir === 'e' || dir === 'ne' || dir === 'se') {
        newW = Math.max(16, startW + deltaX);
      } else if (dir === 'w' || dir === 'nw' || dir === 'sw') {
        const proposedW = Math.max(16, startW - deltaX);
        newX = startX + (startW - proposedW);
        newW = proposedW;
      }

      // Handle vertical resize
      if (dir === 's' || dir === 'se' || dir === 'sw') {
        newH = Math.max(16, startH + deltaY);
      } else if (dir === 'n' || dir === 'ne' || dir === 'nw') {
        const proposedH = Math.max(16, startH - deltaY);
        newY = startY + (startH - proposedH);
        newH = proposedH;
      }

      onUpdate(
        element.id,
        {
          x: Math.round(newX),
          y: Math.round(newY),
          width: Math.round(newW),
          height: Math.round(newH),
        },
        false
      );
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
  const displayW = Math.max(12, element.width * zoomScale);
  const displayH = Math.max(12, element.height * zoomScale);
  const strokeW = Math.max(1, (element.strokeWidth || 2) * zoomScale);

  const strokeDash =
    element.strokeStyle === 'dashed'
      ? `${strokeW * 3} ${strokeW * 2}`
      : element.strokeStyle === 'dotted'
      ? `${strokeW} ${strokeW * 1.5}`
      : undefined;

  const fillColor = element.isFilled && element.fillColor !== 'transparent' ? element.fillColor : 'none';
  const fillOpacity = element.fillOpacity ?? 1.0;

  // Star Points Calculation
  const cx = displayW / 2;
  const cy = displayH / 2;
  const outerR = Math.max(4, Math.min(displayW, displayH) / 2 - strokeW);
  const innerR = outerR * 0.42;
  const starPoints = Array.from({ length: 10 }, (_, i) => {
    const angle = (i * Math.PI) / 5 - Math.PI / 2;
    const rad = i % 2 === 0 ? outerR : innerR;
    return `${(cx + rad * Math.cos(angle)).toFixed(1)},${(cy + rad * Math.sin(angle)).toFixed(1)}`;
  }).join(' ');

  return (
    <div
      onMouseDown={handleMouseDown}
      className={`absolute select-none cursor-move ${
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
      {/* Floating Action Controls when Selected */}
      {isSelected && (
        <div
          onMouseDown={(e) => e.stopPropagation()}
          className="absolute -top-9 left-0 bg-white dark:bg-neutral-900 border border-neutral-200 dark:border-neutral-800 rounded-lg shadow-md px-1.5 py-0.5 flex items-center gap-1.5 z-50 text-xs"
        >
          <span className="text-[10px] uppercase font-bold text-neutral-400 px-1">
            {element.shapeType.replace('-', ' ')}
          </span>
          <div className="h-3 w-px bg-neutral-200 dark:bg-neutral-700" />
          <button
            type="button"
            onClick={() => onDuplicate(element.id)}
            className="p-1 rounded hover:bg-neutral-100 text-neutral-600 dark:text-neutral-300 cursor-pointer"
            title="Duplicate Shape"
          >
            <Copy className="w-3.5 h-3.5" />
          </button>
          <button
            type="button"
            onClick={() => onDelete(element.id)}
            className="p-1 rounded hover:bg-rose-50 text-rose-600 cursor-pointer"
            title="Delete Shape"
          >
            <Trash2 className="w-3.5 h-3.5" />
          </button>
        </div>
      )}

      {/* SVG Canvas for precision vector shapes */}
      <svg
        className="w-full h-full overflow-visible pointer-events-none"
        viewBox={`0 0 ${displayW} ${displayH}`}
      >
        {/* RECTANGLE */}
        {element.shapeType === 'rectangle' && (
          <rect
            x={strokeW / 2}
            y={strokeW / 2}
            width={Math.max(1, displayW - strokeW)}
            height={Math.max(1, displayH - strokeW)}
            fill={fillColor}
            fillOpacity={fillOpacity}
            stroke={element.strokeColor}
            strokeWidth={strokeW}
            strokeDasharray={strokeDash}
            rx={element.cornerRadius ? element.cornerRadius * zoomScale : 0}
          />
        )}

        {/* ROUNDED RECTANGLE */}
        {element.shapeType === 'rounded-rectangle' && (
          <rect
            x={strokeW / 2}
            y={strokeW / 2}
            width={Math.max(1, displayW - strokeW)}
            height={Math.max(1, displayH - strokeW)}
            fill={fillColor}
            fillOpacity={fillOpacity}
            stroke={element.strokeColor}
            strokeWidth={strokeW}
            strokeDasharray={strokeDash}
            rx={element.cornerRadius ? element.cornerRadius * zoomScale : Math.min(16, displayH * 0.25)}
            ry={element.cornerRadius ? element.cornerRadius * zoomScale : Math.min(16, displayH * 0.25)}
          />
        )}

        {/* CIRCLE / ELLIPSE */}
        {element.shapeType === 'circle' && (
          <ellipse
            cx={displayW / 2}
            cy={displayH / 2}
            rx={Math.max(1, (displayW - strokeW) / 2)}
            ry={Math.max(1, (displayH - strokeW) / 2)}
            fill={fillColor}
            fillOpacity={fillOpacity}
            stroke={element.strokeColor}
            strokeWidth={strokeW}
            strokeDasharray={strokeDash}
          />
        )}

        {/* LINE */}
        {element.shapeType === 'line' && (
          <line
            x1={strokeW}
            y1={displayH / 2}
            x2={Math.max(strokeW, displayW - strokeW)}
            y2={displayH / 2}
            stroke={element.strokeColor}
            strokeWidth={strokeW}
            strokeDasharray={strokeDash}
            strokeLinecap="round"
          />
        )}

        {/* ARROW */}
        {element.shapeType === 'arrow' && (
          <g>
            <defs>
              <marker
                id={`arrowhead-${element.id}`}
                markerWidth="10"
                markerHeight="7"
                refX="9"
                refY="3.5"
                orient="auto"
              >
                <polygon points="0 0, 10 3.5, 0 7" fill={element.strokeColor} />
              </marker>
            </defs>
            <line
              x1={strokeW}
              y1={displayH / 2}
              x2={Math.max(strokeW, displayW - strokeW - 10)}
              y2={displayH / 2}
              stroke={element.strokeColor}
              strokeWidth={strokeW}
              strokeDasharray={strokeDash}
              strokeLinecap="round"
              markerEnd={`url(#arrowhead-${element.id})`}
            />
          </g>
        )}

        {/* TRIANGLE */}
        {element.shapeType === 'triangle' && (
          <polygon
            points={`${(displayW / 2).toFixed(1)} ${strokeW}, ${(displayW - strokeW).toFixed(1)} ${(displayH - strokeW).toFixed(1)}, ${strokeW} ${(displayH - strokeW).toFixed(1)}`}
            fill={fillColor}
            fillOpacity={fillOpacity}
            stroke={element.strokeColor}
            strokeWidth={strokeW}
            strokeDasharray={strokeDash}
            strokeLinejoin="round"
          />
        )}

        {/* STAR */}
        {element.shapeType === 'star' && (
          <polygon
            points={starPoints}
            fill={fillColor}
            fillOpacity={fillOpacity}
            stroke={element.strokeColor}
            strokeWidth={strokeW}
            strokeDasharray={strokeDash}
            strokeLinejoin="round"
          />
        )}

        {/* DIAMOND */}
        {element.shapeType === 'diamond' && (
          <polygon
            points={`${(displayW / 2).toFixed(1)} ${strokeW}, ${(displayW - strokeW).toFixed(1)} ${(displayH / 2).toFixed(1)}, ${(displayW / 2).toFixed(1)} ${(displayH - strokeW).toFixed(1)}, ${strokeW} ${(displayH / 2).toFixed(1)}`}
            fill={fillColor}
            fillOpacity={fillOpacity}
            stroke={element.strokeColor}
            strokeWidth={strokeW}
            strokeDasharray={strokeDash}
            strokeLinejoin="round"
          />
        )}
      </svg>

      {/* 8-Point Precision Resize Handles */}
      {isSelected && (
        <>
          {/* NW - Top Left */}
          <div
            onMouseDown={(e) => handleResizeDown(e, 'nw')}
            className="absolute -top-1.5 -left-1.5 w-3 h-3 bg-white border-2 border-emerald-600 rounded-xs cursor-nwse-resize shadow-xs z-40"
            title="Resize"
          />
          {/* N - Top Center */}
          <div
            onMouseDown={(e) => handleResizeDown(e, 'n')}
            className="absolute -top-1.5 left-1/2 -translate-x-1/2 w-3 h-3 bg-white border-2 border-emerald-600 rounded-xs cursor-ns-resize shadow-xs z-40"
            title="Resize Height"
          />
          {/* NE - Top Right */}
          <div
            onMouseDown={(e) => handleResizeDown(e, 'ne')}
            className="absolute -top-1.5 -right-1.5 w-3 h-3 bg-white border-2 border-emerald-600 rounded-xs cursor-nesw-resize shadow-xs z-40"
            title="Resize"
          />
          {/* E - Middle Right */}
          <div
            onMouseDown={(e) => handleResizeDown(e, 'e')}
            className="absolute top-1/2 -translate-y-1/2 -right-1.5 w-3 h-3 bg-white border-2 border-emerald-600 rounded-xs cursor-ew-resize shadow-xs z-40"
            title="Resize Width"
          />
          {/* SE - Bottom Right */}
          <div
            onMouseDown={(e) => handleResizeDown(e, 'se')}
            className="absolute -bottom-1.5 -right-1.5 w-3.5 h-3.5 bg-emerald-600 border-2 border-white rounded-xs cursor-nwse-resize shadow-xs z-40"
            title="Resize"
          />
          {/* S - Bottom Center */}
          <div
            onMouseDown={(e) => handleResizeDown(e, 's')}
            className="absolute -bottom-1.5 left-1/2 -translate-x-1/2 w-3 h-3 bg-white border-2 border-emerald-600 rounded-xs cursor-ns-resize shadow-xs z-40"
            title="Resize Height"
          />
          {/* SW - Bottom Left */}
          <div
            onMouseDown={(e) => handleResizeDown(e, 'sw')}
            className="absolute -bottom-1.5 -left-1.5 w-3 h-3 bg-white border-2 border-emerald-600 rounded-xs cursor-nesw-resize shadow-xs z-40"
            title="Resize"
          />
          {/* W - Middle Left */}
          <div
            onMouseDown={(e) => handleResizeDown(e, 'w')}
            className="absolute top-1/2 -translate-y-1/2 -left-1.5 w-3 h-3 bg-white border-2 border-emerald-600 rounded-xs cursor-ew-resize shadow-xs z-40"
            title="Resize Width"
          />
        </>
      )}
    </div>
  );
};
