import React, { useRef } from 'react';
import { DrawElement } from '../types/editorTypes';
import { Trash2 } from 'lucide-react';

interface DrawElementItemProps {
  element: DrawElement;
  isSelected: boolean;
  zoom: number;
  onSelect: (id: string, e: React.MouseEvent) => void;
  onDelete: (id: string) => void;
}

export const DrawElementItem: React.FC<DrawElementItemProps> = ({
  element,
  isSelected,
  zoom,
  onSelect,
  onDelete,
}) => {
  const zoomScale = zoom / 100;

  if (!element.points || element.points.length < 2) return null;

  // Build SVG path string: "M x y L x y ..."
  const pathD = element.points
    .map((p, idx) => `${idx === 0 ? 'M' : 'L'} ${p.x * zoomScale} ${p.y * zoomScale}`)
    .join(' ');

  const strokeW = (element.strokeWidth || 3) * zoomScale;
  const opacity = element.isHighlighter ? 0.38 : (element.opacity ?? 1.0);

  return (
    <g
      onClick={(e) => onSelect(element.id, e)}
      className="cursor-pointer group"
    >
      {/* Invisible wider stroke for easier clicking/selection */}
      <path
        d={pathD}
        fill="none"
        stroke="transparent"
        strokeWidth={Math.max(16, strokeW * 2)}
        strokeLinecap="round"
        strokeLinejoin="round"
      />

      {/* Actual visible stroke */}
      <path
        d={pathD}
        fill="none"
        stroke={element.strokeColor}
        strokeWidth={strokeW}
        strokeLinecap="round"
        strokeLinejoin="round"
        opacity={opacity}
        className={isSelected ? 'filter drop-shadow-[0_0_3px_#16a34a]' : ''}
      />
    </g>
  );
};
