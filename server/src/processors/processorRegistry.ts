import { IProcessor } from './types';
import { imageToPdfProcessor } from './imageToPdfProcessor';
import { mergePdfProcessor } from './mergePdfProcessor';
import { splitPdfProcessor } from './splitPdfProcessor';
import { rotatePdfProcessor } from './rotatePdfProcessor';

class ProcessorRegistry {
  private processors: Map<string, IProcessor> = new Map();

  constructor() {
    this.registerDefaultProcessors();
  }

  private registerDefaultProcessors(): void {
    // Approved tool 1: JPG/PNG -> PDF
    this.register('jpg-to-pdf', imageToPdfProcessor);
    this.register('image-to-pdf', imageToPdfProcessor);

    // Approved tool 2: Merge PDF
    this.register('merge-pdf', mergePdfProcessor);

    // Approved tool 3: Split PDF
    this.register('split-pdf', splitPdfProcessor);

    // Approved tool 4: Rotate PDF
    this.register('rotate-pdf', rotatePdfProcessor);
  }

  public register(toolId: string, processor: IProcessor): void {
    this.processors.set(toolId.toLowerCase(), processor);
  }

  public get(toolId: string): IProcessor | undefined {
    return this.processors.get(toolId.toLowerCase());
  }

  public has(toolId: string): boolean {
    return this.processors.has(toolId.toLowerCase());
  }
}

export const processorRegistry = new ProcessorRegistry();
