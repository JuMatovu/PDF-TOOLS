import { IProcessor } from './types';
import { imageToPdfProcessor } from './imageToPdfProcessor';

class ProcessorRegistry {
  private processors: Map<string, IProcessor> = new Map();

  constructor() {
    this.registerDefaultProcessors();
  }

  private registerDefaultProcessors(): void {
    // Register the first approved tool: JPG/PNG -> PDF
    this.register('jpg-to-pdf', imageToPdfProcessor);
    this.register('image-to-pdf', imageToPdfProcessor);
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
