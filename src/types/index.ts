export type ToolCategory =
  | 'ORGANIZE PDF'
  | 'OPTIMIZE PDF'
  | 'CONVERT TO PDF'
  | 'CONVERT FROM PDF'
  | 'EDIT PDF'
  | 'PDF SECURITY'
  | 'PDF INTELLIGENCE';

export type ProcessingType = 'client' | 'batch' | 'editor' | 'ai';

export interface ToolOptionConfig {
  id: string;
  label: string;
  type: 'select' | 'toggle' | 'slider' | 'text' | 'password';
  defaultValue?: string | boolean | number;
  options?: { label: string; value: string }[];
  description?: string;
}

export interface PDFTool {
  id: string;
  slug: string;
  name: string;
  description: string;
  longDescription?: string;
  category: ToolCategory;
  iconName: string;
  route: string;
  processingType: ProcessingType;
  acceptedFormats: string[];
  outputFormat: string;
  maxFileSizeMB: number;
  popular?: boolean;
  badge?: string;
  options?: ToolOptionConfig[];
}

export interface UploadedFileItem {
  id: string;
  file: File;
  name: string;
  size: number;
  type: string;
  previewUrl?: string;
  status: 'ready' | 'processing' | 'completed' | 'error';
  progress?: number;
  error?: string;
}

export interface FeatureMetric {
  id: string;
  title: string;
  subtitle: string;
  iconName: string;
}
