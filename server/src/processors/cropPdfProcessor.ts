import fs from 'fs';
import path from 'path';
import { PDFDocument } from 'pdf-lib';
import { IProcessor, ProcessorInput, ProcessorResult } from './types';

export class CropPdfProcessor implements IProcessor {
  public async process(
    input: ProcessorInput,
    onProgress?: (progress: number, message?: string) => void
  ): Promise<ProcessorResult> {
    const { inputFiles, options, outputDir } = input;

    if (!inputFiles || inputFiles.length === 0) {
      throw new Error('Please select a PDF document to crop.');
    }

    const sourceFile = inputFiles[0];
    onProgress?.(15, `Reading "${sourceFile.originalName}"...`);

    if (!fs.existsSync(sourceFile.path)) {
      throw new Error(`File not found: ${sourceFile.originalName}`);
    }

    const fileBytes = await fs.promises.readFile(sourceFile.path);
    const doc = await PDFDocument.load(fileBytes);
    const pages = doc.getPages();

    if (pages.length === 0) {
      throw new Error('Document contains no pages to crop.');
    }

    const marginPreset = (options.marginPreset || options.cropMargin || 'small').toString().toLowerCase();

    // 72 points = 1 inch
    let marginPt = 36; // 0.5" default
    if (marginPreset === 'tight' || marginPreset === 'narrow') marginPt = 18;
    if (marginPreset === 'medium' || marginPreset === 'moderate') marginPt = 54;
    if (marginPreset === 'large' || marginPreset === 'wide') marginPt = 72;
    if (options.customMargin) {
      marginPt = Math.max(0, Number(options.customMargin) || 36);
    }

    onProgress?.(50, `Cropping ${pages.length} page margins by ${marginPt}pt...`);

    pages.forEach((page) => {
      const { width, height } = page.getSize();
      const cropX = Math.min(marginPt, width * 0.35);
      const cropY = Math.min(marginPt, height * 0.35);
      const cropWidth = Math.max(20, width - cropX * 2);
      const cropHeight = Math.max(20, height - cropY * 2);

      page.setCropBox(cropX, cropY, cropWidth, cropHeight);
    });

    onProgress?.(85, 'Saving cropped PDF document...');
    const outputBytes = await doc.save({ useObjectStreams: true });

    const baseName = path.parse(sourceFile.originalName).name || 'document';
    const outputFileName = `${baseName}_cropped.pdf`;
    const outputPath = path.join(outputDir, outputFileName);

    await fs.promises.writeFile(outputPath, outputBytes);
    onProgress?.(100, 'Cropping complete!');

    return {
      outputFiles: [
        {
          fileName: outputFileName,
          path: outputPath,
          mimeType: 'application/pdf',
          size: outputBytes.length,
        },
      ],
    };
  }
}

export const cropPdfProcessor = new CropPdfProcessor();
