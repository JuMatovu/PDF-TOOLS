export type JobStatus = 'queued' | 'processing' | 'completed' | 'failed' | 'cancelled';

export interface JobFile {
  id: string;
  originalName: string;
  safeName: string;
  path: string;
  size: number;
  mimeType: string;
  extension: string;
}

export interface JobOutput {
  id: string;
  fileName: string;
  path: string;
  size: number;
  mimeType: string;
  downloadUrl: string;
  previewUrl?: string;
}

export interface ProcessingJob {
  id: string;
  toolId: string;
  status: JobStatus;
  progress: number;
  statusMessage?: string;
  inputFiles: JobFile[];
  outputFiles: JobOutput[];
  options: Record<string, any>;
  error?: string;
  createdAt: number;
  completedAt?: number;
  expiresAt: number;
  jobDir: string;
}
