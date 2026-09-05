import { IProcessor } from './types';
import { imageToPdfProcessor } from './imageToPdfProcessor';
import { mergePdfProcessor } from './mergePdfProcessor';
import { splitPdfProcessor } from './splitPdfProcessor';
import { rotatePdfProcessor } from './rotatePdfProcessor';
import { addPageNumbersProcessor } from './addPageNumbersProcessor';
import { addWatermarkProcessor } from './addWatermarkProcessor';
import { removePagesProcessor } from './removePagesProcessor';
import { compressPdfProcessor } from './compressPdfProcessor';
import { cropPdfProcessor } from './cropPdfProcessor';
import { organizePdfProcessor } from './organizePdfProcessor';
import { pdfToMarkdownProcessor } from './pdfToMarkdownProcessor';
import { aiSummarizerProcessor } from './aiSummarizerProcessor';

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

    // Approved tool 3: Split PDF & Extract Pages
    this.register('split-pdf', splitPdfProcessor);
    this.register('extract-pages', splitPdfProcessor);

    // Approved tool 4: Rotate PDF
    this.register('rotate-pdf', rotatePdfProcessor);

    // Approved tool 5: Add Page Numbers
    this.register('add-page-numbers', addPageNumbersProcessor);

    // Approved tool 6: Add Watermark
    this.register('add-watermark', addWatermarkProcessor);

    // Approved tool 7: Remove Pages
    this.register('remove-pages', removePagesProcessor);

    // Approved tool 8: Compress PDF
    this.register('compress-pdf', compressPdfProcessor);

    // Approved tool 9: Crop PDF
    this.register('crop-pdf', cropPdfProcessor);

    // Approved tool 10: Organize PDF
    this.register('organize-pdf', organizePdfProcessor);

    // Approved tool 11: PDF to Markdown
    this.register('pdf-to-markdown', pdfToMarkdownProcessor);

    // Approved tool 12: AI Summarizer
    this.register('ai-summarizer', aiSummarizerProcessor);
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
