import { JobFile, ProcessingJob } from '../types/job';

export interface ProcessorInput {
  job: ProcessingJob;
  inputFiles: JobFile[];
  options: Record<string, any>;
  tempDir: string;
  outputDir: string;
}

export interface GeneratedOutputFile {
  fileName: string;
  path: string;
  mimeType: string;
  size: number;
}

export interface ProcessorResult {
  outputFiles: GeneratedOutputFile[];
}

export interface IProcessor {
  process(
    input: ProcessorInput,
    onProgress?: (progress: number, message?: string) => void
  ): Promise<ProcessorResult>;
}
