import React, { useState } from 'react';
import {
  MousePointer,
  Type,
  FileEdit,
  Image as ImageIcon,
  PenTool,
  Highlighter,
  Shapes,
  Eraser,
  Stamp,
  MessageSquare,
  ShieldAlert,
  FilePlus,
  Trash2,
  RotateCw,
  Copy,
  Square,
  Circle,
  Minus,
  ArrowRight,
  Triangle,
  Star,
  Diamond,
} from 'lucide-react';
import { EditorTool, PageAction, ShapeType } from '../types/editorTypes';

interface LeftToolbarProps {
  activeTool: EditorTool;
  activeShapeType?: ShapeType;
  onSelectTool: (tool: EditorTool, shapeType?: ShapeType) => void;
  onPageAction?: (action: PageAction) => void;
  canDeletePage?: boolean;
}

export const LeftToolbar: React.FC<LeftToolbarProps> = ({
  activeTool,
  activeShapeType = 'rectangle',
  onSelectTool,
  onPageAction,
  canDeletePage = true,
}) => {
  const [showShapeMenu, setShowShapeMenu] = useState<boolean>(false);

  const handleShapeSelect = (shape: ShapeType) => {
    onSelectTool('shape', shape);
    setShowShapeMenu(false);
  };

  return (
    <aside
      aria-label="Editor Tools"
      className="w-14 bg-white dark:bg-neutral-900 border-r border-neutral-200 dark:border-neutral-800 flex flex-col items-center py-2.5 z-20 select-none flex-shrink-0 justify-between overflow-y-auto"
    >
      {/* Primary Object Editing Tools */}
      <div className="flex flex-col items-center gap-1 w-full px-2">
        {/* Select */}
        <button
          type="button"
          onClick={() => onSelectTool('select')}
          title="Select & Move (V)"
          className={`relative w-10 h-10 rounded-xl flex items-center justify-center transition-all cursor-pointer group ${
            activeTool === 'select'
              ? 'bg-emerald-600 text-white shadow-xs shadow-emerald-600/30'
              : 'text-neutral-600 dark:text-neutral-400 hover:text-neutral-900 dark:hover:text-white hover:bg-neutral-100 dark:hover:bg-neutral-800'
          }`}
        >
          <MousePointer className="w-4 h-4" />
          {activeTool === 'select' && <span className="absolute top-1.5 right-1.5 w-1.5 h-1.5 rounded-full bg-amber-400" />}
          <span className="absolute left-12 ml-1 px-2 py-1 rounded-md bg-neutral-900 text-white text-[11px] font-medium whitespace-nowrap opacity-0 pointer-events-none group-hover:opacity-100 transition-opacity z-50 shadow-md">
            Select & Move
          </span>
        </button>

        {/* Add Text */}
        <button
          type="button"
          onClick={() => onSelectTool('text')}
          title="Add New Text (T)"
          className={`relative w-10 h-10 rounded-xl flex items-center justify-center transition-all cursor-pointer group ${
            activeTool === 'text'
              ? 'bg-emerald-600 text-white shadow-xs shadow-emerald-600/30'
              : 'text-neutral-600 dark:text-neutral-400 hover:text-neutral-900 dark:hover:text-white hover:bg-neutral-100 dark:hover:bg-neutral-800'
          }`}
        >
          <Type className="w-4 h-4" />
          {activeTool === 'text' && <span className="absolute top-1.5 right-1.5 w-1.5 h-1.5 rounded-full bg-amber-400" />}
          <span className="absolute left-12 ml-1 px-2 py-1 rounded-md bg-neutral-900 text-white text-[11px] font-medium whitespace-nowrap opacity-0 pointer-events-none group-hover:opacity-100 transition-opacity z-50 shadow-md">
            Add Text
          </span>
        </button>

        {/* Edit Existing PDF Text */}
        <button
          type="button"
          onClick={() => onSelectTool('edit-pdf-text')}
          title="Edit Existing PDF Text (Click any word in PDF)"
          className={`relative w-10 h-10 rounded-xl flex items-center justify-center transition-all cursor-pointer group ${
            activeTool === 'edit-pdf-text'
              ? 'bg-emerald-600 text-white shadow-xs shadow-emerald-600/30'
              : 'text-neutral-600 dark:text-neutral-400 hover:text-neutral-900 dark:hover:text-white hover:bg-neutral-100 dark:hover:bg-neutral-800'
          }`}
        >
          <FileEdit className="w-4 h-4" />
          {activeTool === 'edit-pdf-text' && <span className="absolute top-1.5 right-1.5 w-1.5 h-1.5 rounded-full bg-amber-400" />}
          <span className="absolute left-12 ml-1 px-2 py-1 rounded-md bg-neutral-900 text-white text-[11px] font-medium whitespace-nowrap opacity-0 pointer-events-none group-hover:opacity-100 transition-opacity z-50 shadow-md">
            Edit PDF Text
          </span>
        </button>

        {/* Shapes (with dropdown for rect, rounded rect, circle, triangle, star, diamond, line, arrow) */}
        <div className="relative">
          <button
            type="button"
            onClick={() => setShowShapeMenu(!showShapeMenu)}
            title="Shapes (Rectangle, Rounded, Circle, Triangle, Star, Diamond, Line, Arrow)"
            className={`relative w-10 h-10 rounded-xl flex items-center justify-center transition-all cursor-pointer group ${
              activeTool === 'shape'
                ? 'bg-emerald-600 text-white shadow-xs shadow-emerald-600/30'
                : 'text-neutral-600 dark:text-neutral-400 hover:text-neutral-900 dark:hover:text-white hover:bg-neutral-100 dark:hover:bg-neutral-800'
            }`}
          >
            <Shapes className="w-4 h-4" />
            {activeTool === 'shape' && <span className="absolute top-1.5 right-1.5 w-1.5 h-1.5 rounded-full bg-amber-400" />}
            <span className="absolute left-12 ml-1 px-2 py-1 rounded-md bg-neutral-900 text-white text-[11px] font-medium whitespace-nowrap opacity-0 pointer-events-none group-hover:opacity-100 transition-opacity z-50 shadow-md">
              Shapes
            </span>
          </button>

          {/* Shape Submenu */}
          {showShapeMenu && (
            <div
              onMouseLeave={() => setShowShapeMenu(false)}
              className="absolute left-12 top-0 bg-white dark:bg-neutral-900 border border-neutral-200 dark:border-neutral-800 rounded-xl shadow-xl p-1.5 flex flex-col gap-0.5 z-50 w-44"
            >
              <button
                type="button"
                onClick={() => handleShapeSelect('rectangle')}
                className={`flex items-center gap-2 px-2.5 py-1.5 rounded-lg text-xs font-semibold hover:bg-neutral-100 dark:hover:bg-neutral-800 cursor-pointer ${
                  activeTool === 'shape' && activeShapeType === 'rectangle' ? 'text-emerald-600 font-bold bg-emerald-50 dark:bg-emerald-950/60' : 'text-neutral-700 dark:text-neutral-200'
                }`}
              >
                <Square className="w-3.5 h-3.5" />
                <span>Rectangle</span>
              </button>
              <button
                type="button"
                onClick={() => handleShapeSelect('rounded-rectangle')}
                className={`flex items-center gap-2 px-2.5 py-1.5 rounded-lg text-xs font-semibold hover:bg-neutral-100 dark:hover:bg-neutral-800 cursor-pointer ${
                  activeTool === 'shape' && activeShapeType === 'rounded-rectangle' ? 'text-emerald-600 font-bold bg-emerald-50 dark:bg-emerald-950/60' : 'text-neutral-700 dark:text-neutral-200'
                }`}
              >
                <Square className="w-3.5 h-3.5 rounded-xs" />
                <span>Rounded Rect</span>
              </button>
              <button
                type="button"
                onClick={() => handleShapeSelect('circle')}
                className={`flex items-center gap-2 px-2.5 py-1.5 rounded-lg text-xs font-semibold hover:bg-neutral-100 dark:hover:bg-neutral-800 cursor-pointer ${
                  activeTool === 'shape' && activeShapeType === 'circle' ? 'text-emerald-600 font-bold bg-emerald-50 dark:bg-emerald-950/60' : 'text-neutral-700 dark:text-neutral-200'
                }`}
              >
                <Circle className="w-3.5 h-3.5" />
                <span>Circle</span>
              </button>
              <button
                type="button"
                onClick={() => handleShapeSelect('triangle')}
                className={`flex items-center gap-2 px-2.5 py-1.5 rounded-lg text-xs font-semibold hover:bg-neutral-100 dark:hover:bg-neutral-800 cursor-pointer ${
                  activeTool === 'shape' && activeShapeType === 'triangle' ? 'text-emerald-600 font-bold bg-emerald-50 dark:bg-emerald-950/60' : 'text-neutral-700 dark:text-neutral-200'
                }`}
              >
                <Triangle className="w-3.5 h-3.5" />
                <span>Triangle</span>
              </button>
              <button
                type="button"
                onClick={() => handleShapeSelect('star')}
                className={`flex items-center gap-2 px-2.5 py-1.5 rounded-lg text-xs font-semibold hover:bg-neutral-100 dark:hover:bg-neutral-800 cursor-pointer ${
                  activeTool === 'shape' && activeShapeType === 'star' ? 'text-emerald-600 font-bold bg-emerald-50 dark:bg-emerald-950/60' : 'text-neutral-700 dark:text-neutral-200'
                }`}
              >
                <Star className="w-3.5 h-3.5" />
                <span>Star</span>
              </button>
              <button
                type="button"
                onClick={() => handleShapeSelect('diamond')}
                className={`flex items-center gap-2 px-2.5 py-1.5 rounded-lg text-xs font-semibold hover:bg-neutral-100 dark:hover:bg-neutral-800 cursor-pointer ${
                  activeTool === 'shape' && activeShapeType === 'diamond' ? 'text-emerald-600 font-bold bg-emerald-50 dark:bg-emerald-950/60' : 'text-neutral-700 dark:text-neutral-200'
                }`}
              >
                <Diamond className="w-3.5 h-3.5" />
                <span>Diamond</span>
              </button>
              <button
                type="button"
                onClick={() => handleShapeSelect('line')}
                className={`flex items-center gap-2 px-2.5 py-1.5 rounded-lg text-xs font-semibold hover:bg-neutral-100 dark:hover:bg-neutral-800 cursor-pointer ${
                  activeTool === 'shape' && activeShapeType === 'line' ? 'text-emerald-600 font-bold bg-emerald-50 dark:bg-emerald-950/60' : 'text-neutral-700 dark:text-neutral-200'
                }`}
              >
                <Minus className="w-3.5 h-3.5" />
                <span>Line</span>
              </button>
              <button
                type="button"
                onClick={() => handleShapeSelect('arrow')}
                className={`flex items-center gap-2 px-2.5 py-1.5 rounded-lg text-xs font-semibold hover:bg-neutral-100 dark:hover:bg-neutral-800 cursor-pointer ${
                  activeTool === 'shape' && activeShapeType === 'arrow' ? 'text-emerald-600 font-bold bg-emerald-50 dark:bg-emerald-950/60' : 'text-neutral-700 dark:text-neutral-200'
                }`}
              >
                <ArrowRight className="w-3.5 h-3.5" />
                <span>Arrow</span>
              </button>
            </div>
          )}
        </div>

        {/* Draw / Pen */}
        <button
          type="button"
          onClick={() => onSelectTool('draw')}
          title="Freehand Draw / Pen"
          className={`relative w-10 h-10 rounded-xl flex items-center justify-center transition-all cursor-pointer group ${
            activeTool === 'draw'
              ? 'bg-emerald-600 text-white shadow-xs shadow-emerald-600/30'
              : 'text-neutral-600 dark:text-neutral-400 hover:text-neutral-900 dark:hover:text-white hover:bg-neutral-100 dark:hover:bg-neutral-800'
          }`}
        >
          <PenTool className="w-4 h-4" />
          {activeTool === 'draw' && <span className="absolute top-1.5 right-1.5 w-1.5 h-1.5 rounded-full bg-amber-400" />}
          <span className="absolute left-12 ml-1 px-2 py-1 rounded-md bg-neutral-900 text-white text-[11px] font-medium whitespace-nowrap opacity-0 pointer-events-none group-hover:opacity-100 transition-opacity z-50 shadow-md">
            Freehand Pen
          </span>
        </button>

        {/* Highlighter */}
        <button
          type="button"
          onClick={() => onSelectTool('highlight')}
          title="Highlighter"
          className={`relative w-10 h-10 rounded-xl flex items-center justify-center transition-all cursor-pointer group ${
            activeTool === 'highlight'
              ? 'bg-emerald-600 text-white shadow-xs shadow-emerald-600/30'
              : 'text-neutral-600 dark:text-neutral-400 hover:text-neutral-900 dark:hover:text-white hover:bg-neutral-100 dark:hover:bg-neutral-800'
          }`}
        >
          <Highlighter className="w-4 h-4" />
          {activeTool === 'highlight' && <span className="absolute top-1.5 right-1.5 w-1.5 h-1.5 rounded-full bg-amber-400" />}
          <span className="absolute left-12 ml-1 px-2 py-1 rounded-md bg-neutral-900 text-white text-[11px] font-medium whitespace-nowrap opacity-0 pointer-events-none group-hover:opacity-100 transition-opacity z-50 shadow-md">
            Highlighter
          </span>
        </button>

        {/* Image */}
        <button
          type="button"
          onClick={() => onSelectTool('image')}
          title="Insert Image (PNG, JPG, SVG)"
          className={`relative w-10 h-10 rounded-xl flex items-center justify-center transition-all cursor-pointer group ${
            activeTool === 'image'
              ? 'bg-emerald-600 text-white shadow-xs shadow-emerald-600/30'
              : 'text-neutral-600 dark:text-neutral-400 hover:text-neutral-900 dark:hover:text-white hover:bg-neutral-100 dark:hover:bg-neutral-800'
          }`}
        >
          <ImageIcon className="w-4 h-4" />
          {activeTool === 'image' && <span className="absolute top-1.5 right-1.5 w-1.5 h-1.5 rounded-full bg-amber-400" />}
          <span className="absolute left-12 ml-1 px-2 py-1 rounded-md bg-neutral-900 text-white text-[11px] font-medium whitespace-nowrap opacity-0 pointer-events-none group-hover:opacity-100 transition-opacity z-50 shadow-md">
            Insert Image
          </span>
        </button>

        {/* Signature */}
        <button
          type="button"
          onClick={() => onSelectTool('signature')}
          title="Add Signature (Draw, Type, Upload)"
          className={`relative w-10 h-10 rounded-xl flex items-center justify-center transition-all cursor-pointer group ${
            activeTool === 'signature'
              ? 'bg-emerald-600 text-white shadow-xs shadow-emerald-600/30'
              : 'text-neutral-600 dark:text-neutral-400 hover:text-neutral-900 dark:hover:text-white hover:bg-neutral-100 dark:hover:bg-neutral-800'
          }`}
        >
          <PenTool className="w-4 h-4 rotate-45" />
          {activeTool === 'signature' && <span className="absolute top-1.5 right-1.5 w-1.5 h-1.5 rounded-full bg-amber-400" />}
          <span className="absolute left-12 ml-1 px-2 py-1 rounded-md bg-neutral-900 text-white text-[11px] font-medium whitespace-nowrap opacity-0 pointer-events-none group-hover:opacity-100 transition-opacity z-50 shadow-md">
            Sign Document
          </span>
        </button>

        {/* Stamp */}
        <button
          type="button"
          onClick={() => onSelectTool('stamp')}
          title="Document Stamp (Approved, Confidential, etc.)"
          className={`relative w-10 h-10 rounded-xl flex items-center justify-center transition-all cursor-pointer group ${
            activeTool === 'stamp'
              ? 'bg-emerald-600 text-white shadow-xs shadow-emerald-600/30'
              : 'text-neutral-600 dark:text-neutral-400 hover:text-neutral-900 dark:hover:text-white hover:bg-neutral-100 dark:hover:bg-neutral-800'
          }`}
        >
          <Stamp className="w-4 h-4" />
          {activeTool === 'stamp' && <span className="absolute top-1.5 right-1.5 w-1.5 h-1.5 rounded-full bg-amber-400" />}
          <span className="absolute left-12 ml-1 px-2 py-1 rounded-md bg-neutral-900 text-white text-[11px] font-medium whitespace-nowrap opacity-0 pointer-events-none group-hover:opacity-100 transition-opacity z-50 shadow-md">
            Place Stamp
          </span>
        </button>

        {/* Comment */}
        <button
          type="button"
          onClick={() => onSelectTool('comment')}
          title="Add Sticky Note / Comment"
          className={`relative w-10 h-10 rounded-xl flex items-center justify-center transition-all cursor-pointer group ${
            activeTool === 'comment'
              ? 'bg-emerald-600 text-white shadow-xs shadow-emerald-600/30'
              : 'text-neutral-600 dark:text-neutral-400 hover:text-neutral-900 dark:hover:text-white hover:bg-neutral-100 dark:hover:bg-neutral-800'
          }`}
        >
          <MessageSquare className="w-4 h-4" />
          {activeTool === 'comment' && <span className="absolute top-1.5 right-1.5 w-1.5 h-1.5 rounded-full bg-amber-400" />}
          <span className="absolute left-12 ml-1 px-2 py-1 rounded-md bg-neutral-900 text-white text-[11px] font-medium whitespace-nowrap opacity-0 pointer-events-none group-hover:opacity-100 transition-opacity z-50 shadow-md">
            Sticky Comment
          </span>
        </button>

        {/* Redact */}
        <button
          type="button"
          onClick={() => onSelectTool('redact')}
          title="Redact / Blackout Content"
          className={`relative w-10 h-10 rounded-xl flex items-center justify-center transition-all cursor-pointer group ${
            activeTool === 'redact'
              ? 'bg-rose-600 text-white shadow-xs shadow-rose-600/30'
              : 'text-neutral-600 dark:text-neutral-400 hover:text-neutral-900 dark:hover:text-white hover:bg-neutral-100 dark:hover:bg-neutral-800'
          }`}
        >
          <ShieldAlert className="w-4 h-4" />
          {activeTool === 'redact' && <span className="absolute top-1.5 right-1.5 w-1.5 h-1.5 rounded-full bg-amber-400" />}
          <span className="absolute left-12 ml-1 px-2 py-1 rounded-md bg-neutral-900 text-white text-[11px] font-medium whitespace-nowrap opacity-0 pointer-events-none group-hover:opacity-100 transition-opacity z-50 shadow-md">
            Redact Blackout
          </span>
        </button>

        {/* Eraser */}
        <button
          type="button"
          onClick={() => onSelectTool('eraser')}
          title="Eraser (Click any element to erase)"
          className={`relative w-10 h-10 rounded-xl flex items-center justify-center transition-all cursor-pointer group ${
            activeTool === 'eraser'
              ? 'bg-emerald-600 text-white shadow-xs shadow-emerald-600/30'
              : 'text-neutral-600 dark:text-neutral-400 hover:text-neutral-900 dark:hover:text-white hover:bg-neutral-100 dark:hover:bg-neutral-800'
          }`}
        >
          <Eraser className="w-4 h-4" />
          {activeTool === 'eraser' && <span className="absolute top-1.5 right-1.5 w-1.5 h-1.5 rounded-full bg-amber-400" />}
          <span className="absolute left-12 ml-1 px-2 py-1 rounded-md bg-neutral-900 text-white text-[11px] font-medium whitespace-nowrap opacity-0 pointer-events-none group-hover:opacity-100 transition-opacity z-50 shadow-md">
            Eraser
          </span>
        </button>
      </div>

      {/* Page Related Controls */}
      <div className="w-full flex flex-col items-center gap-1 pt-2 px-2 border-t border-neutral-200 dark:border-neutral-800">
        {/* Rotate Page Quick Action */}
        <button
          type="button"
          onClick={() => onPageAction?.('rotate')}
          aria-label="Rotate Current Page"
          title="Rotate Current Page (+90°)"
          className="w-10 h-10 rounded-xl flex items-center justify-center text-neutral-600 dark:text-neutral-400 hover:text-neutral-900 dark:hover:text-white hover:bg-neutral-100 dark:hover:bg-neutral-800 transition-colors cursor-pointer group relative"
        >
          <RotateCw className="w-4 h-4" />
          <span className="absolute left-12 ml-1 px-2 py-1 rounded-md bg-neutral-900 text-white text-[11px] font-medium whitespace-nowrap opacity-0 pointer-events-none group-hover:opacity-100 transition-opacity z-50 shadow-md">
            Rotate Page (+90°)
          </span>
        </button>

        {/* Add Blank Page */}
        <button
          type="button"
          onClick={() => onPageAction?.('add')}
          aria-label="Add Blank Page"
          title="Add Blank Page"
          className="w-10 h-10 rounded-xl flex items-center justify-center text-neutral-600 dark:text-neutral-400 hover:text-neutral-900 dark:hover:text-white hover:bg-neutral-100 dark:hover:bg-neutral-800 transition-colors cursor-pointer group relative"
        >
          <FilePlus className="w-4 h-4" />
          <span className="absolute left-12 ml-1 px-2 py-1 rounded-md bg-neutral-900 text-white text-[11px] font-medium whitespace-nowrap opacity-0 pointer-events-none group-hover:opacity-100 transition-opacity z-50 shadow-md">
            Add Blank Page
          </span>
        </button>

        {/* Duplicate Page */}
        <button
          type="button"
          onClick={() => onPageAction?.('duplicate')}
          aria-label="Duplicate Current Page"
          title="Duplicate Current Page"
          className="w-10 h-10 rounded-xl flex items-center justify-center text-neutral-600 dark:text-neutral-400 hover:text-neutral-900 dark:hover:text-white hover:bg-neutral-100 dark:hover:bg-neutral-800 transition-colors cursor-pointer group relative"
        >
          <Copy className="w-4 h-4" />
          <span className="absolute left-12 ml-1 px-2 py-1 rounded-md bg-neutral-900 text-white text-[11px] font-medium whitespace-nowrap opacity-0 pointer-events-none group-hover:opacity-100 transition-opacity z-50 shadow-md">
            Duplicate Page
          </span>
        </button>

        {/* Delete Page */}
        <button
          type="button"
          disabled={!canDeletePage}
          onClick={() => onPageAction?.('delete')}
          aria-label="Delete Current Page"
          title={canDeletePage ? 'Delete Current Page' : 'Cannot delete the only page'}
          className="w-10 h-10 rounded-xl flex items-center justify-center text-neutral-400 dark:text-neutral-500 hover:text-rose-600 hover:bg-rose-50 dark:hover:bg-rose-950/40 disabled:opacity-30 disabled:hover:text-neutral-400 disabled:hover:bg-transparent transition-colors cursor-pointer group relative"
        >
          <Trash2 className="w-4 h-4" />
          <span className="absolute left-12 ml-1 px-2 py-1 rounded-md bg-neutral-900 text-white text-[11px] font-medium whitespace-nowrap opacity-0 pointer-events-none group-hover:opacity-100 transition-opacity z-50 shadow-md">
            Delete Page
          </span>
        </button>
      </div>
    </aside>
  );
};
