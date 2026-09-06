export type ActiveTool =
  | 'select'
  | 'text'
  | 'image'
  | 'draw'
  | 'highlight'
  | 'shapes'
  | 'stamp'
  | 'signature'
  | 'eraser';

export type ShapeType = 'rectangle' | 'circle' | 'line' | 'arrow';

export interface BaseElement {
  id: string;
  page: number; // 1-indexed
  x: number; // relative px on canvas
  y: number;
  width: number;
  height: number;
}

export interface TextElement extends BaseElement {
  type: 'text';
  text: string;
  fontSize: number;
  fontFamily: string;
  color: string;
  isBold?: boolean;
  isItalic?: boolean;
  isUnderline?: boolean;
  alignment?: 'left' | 'center' | 'right';
  backgroundColor?: string;
}

export interface DrawElement extends BaseElement {
  type: 'draw' | 'highlight';
  points: Array<{ x: number; y: number }>;
  color: string;
  strokeWidth: number;
  opacity?: number;
}

export interface ShapeElement extends BaseElement {
  type: 'shape';
  shapeType: ShapeType;
  strokeColor: string;
  fillColor?: string;
  strokeWidth: number;
}

export interface ImageElement extends BaseElement {
  type: 'image';
  dataUrl: string;
  caption?: string;
}

export interface StampElement extends BaseElement {
  type: 'stamp';
  text: string;
  color: string;
  dateStr?: string;
}

export type EditorElement =
  | TextElement
  | DrawElement
  | ShapeElement
  | ImageElement
  | StampElement;

export interface EditorHistoryStep {
  elements: EditorElement[];
}
