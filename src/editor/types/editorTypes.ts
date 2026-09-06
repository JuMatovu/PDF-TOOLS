export type EditorTool =
  | 'select'
  | 'text'
  | 'edit-pdf-text'
  | 'image'
  | 'draw'
  | 'highlight'
  | 'shape'
  | 'eraser'
  | 'signature'
  | 'stamp'
  | 'comment'
  | 'redact';

export type ShapeType =
  | 'rectangle'
  | 'rounded-rectangle'
  | 'circle'
  | 'line'
  | 'arrow'
  | 'triangle'
  | 'star'
  | 'diamond';

export type PageAction = 'add' | 'delete' | 'rotate' | 'duplicate';

export type FitMode = 'custom' | 'fit-width' | 'fit-page';

export type ElementType =
  | 'text'
  | 'shape'
  | 'image'
  | 'draw'
  | 'signature'
  | 'stamp'
  | 'comment'
  | 'redact';

export interface BaseElement {
  id: string;
  type: ElementType;
  pageNumber: number; // 1-indexed PDF page where element is positioned
  x: number;          // In PDF points (scale-independent)
  y: number;          // In PDF points (scale-independent)
  width: number;      // In PDF points
  height: number;     // In PDF points
  rotation?: number;  // In degrees (default 0)
  opacity?: number;   // 0.0 to 1.0 (default 1.0)
}

export interface TextElement extends BaseElement {
  type: 'text';
  text: string;
  fontSize: number;    // In PDF points (e.g. 16)
  fontFamily: string;  // 'Roboto' | 'Helvetica' | 'Times New Roman' | 'Courier'
  color: string;       // Hex e.g. '#0f172a'
  isBold: boolean;
  isItalic: boolean;
  isUnderline: boolean;
  alignment: 'left' | 'center' | 'right';
  backgroundColor?: string;   // Hex e.g. '#ffffff' to cleanly cover original background
  coverOriginal?: boolean;    // If true, automatically conceals underlying original PDF text
  originalPdfTextId?: string; // Reference to original PDF text item if converted
}

export interface ExtractedPdfWord {
  id: string;
  text: string;
  x: number;         // In PDF points (top-left origin)
  y: number;         // In PDF points (top-left origin)
  width: number;     // In PDF points
  height: number;    // In PDF points
  fontSize: number;  // In PDF points
  fontFamily: string;
  isBold: boolean;
  isItalic: boolean;
  color?: string;
}

export interface ShapeElement extends BaseElement {
  type: 'shape';
  shapeType: ShapeType;
  fillColor: string;       // 'transparent' or hex
  strokeColor: string;     // Hex
  strokeWidth: number;     // e.g. 1, 2, 4, 8
  strokeStyle?: 'solid' | 'dashed' | 'dotted';
  isFilled: boolean;
  cornerRadius?: number;   // In PDF points for rectangle/rounded-rectangle
  fillOpacity?: number;    // 0.0 to 1.0
}

export interface Point {
  x: number;
  y: number;
}

export interface DrawElement extends BaseElement {
  type: 'draw';
  points: Point[];         // Points in relative PDF coordinates
  strokeColor: string;
  strokeWidth: number;
  isHighlighter: boolean;  // If true, 0.4 opacity and wider stroke
}

export interface ImageElement extends BaseElement {
  type: 'image';
  dataUrl: string;
  originalWidth?: number;
  originalHeight?: number;
  aspectRatio?: number;
  mimeType?: string;
}

export interface SignatureElement extends BaseElement {
  type: 'signature';
  dataUrl: string;
  signatureType: 'draw' | 'type' | 'upload';
}

export interface StampElement extends BaseElement {
  type: 'stamp';
  text: string;
  color: string;
  borderColor: string;
  style: 'solid' | 'dashed' | 'double';
}

export interface RedactElement extends BaseElement {
  type: 'redact';
  fillColor: string; // usually '#000000' or '#ffffff'
}

export interface CommentElement extends BaseElement {
  type: 'comment';
  author: string;
  commentText: string;
  isOpen: boolean;
  color: string;
}

export type EditorElement =
  | TextElement
  | ShapeElement
  | DrawElement
  | ImageElement
  | SignatureElement
  | StampElement
  | RedactElement
  | CommentElement;

export interface HistoryStep {
  description: string;
  elements: EditorElement[];
  selectedId: string | null;
}

export interface PdfDocumentInfo {
  id: string;
  name: string;
  size: number;
  type: string;
  pageCount: number;
  lastModified?: number;
  loadedAt: number;
}

export interface PdfPageDimensions {
  pageNumber: number; // 1-indexed
  width: number;      // Original PDF points (e.g. 595.28 for A4)
  height: number;     // Original PDF points (e.g. 841.89 for A4)
  rotation: number;   // 0, 90, 180, 270
  aspectRatio: number;
}

export interface RenderedPageThumbnail {
  pageNumber: number;
  dataUrl: string;
  width: number;
  height: number;
  isLoading: boolean;
  hasError: boolean;
}

export interface ViewportState {
  zoom: number; // Percentage, e.g. 100 for 1.0x
  fitMode: FitMode;
  containerWidth: number;
  containerHeight: number;
}
