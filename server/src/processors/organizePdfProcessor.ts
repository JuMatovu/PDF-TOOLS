import fs from 'fs';
import path from 'path';
import { PDFDocument, degrees } from 'pdf-lib';
import { IProcessor, ProcessorInput, ProcessorResult } from './types';

export class OrganizePdfProcessor implements IProcessor {
  public async process(
    input: ProcessorInput,
    onProgress?: (progress: number, message?: string) => void
  ): Promise<ProcessorResult> {
    const { inputFiles, options, outputDir } = input;

    if (!inputFiles || inputFiles.length === 0) {
      throw new Error('Please select a PDF document to organize.');
    }

    const sourceFile = inputFiles[0];
    onProgress?.(15, `Reading "${sourceFile.originalName}"...`);

    if (!fs.existsSync(sourceFile.path)) {
      throw new Error(`File not found: ${sourceFile.originalName}`);
    }

    const fileBytes = await fs.promises.readFile(sourceFile.path);
    const srcDoc = await PDFDocument.load(fileBytes);
    const totalPages = srcDoc.getPageCount();

    if (totalPages === 0) {
      throw new Error('Document contains no pages to organize.');
    }

    const newDoc = await PDFDocument.create();

    // Determine custom page order
    let pageOrder: number[] = Array.isArray(options.pageOrder) ? options.pageOrder : [];
    if (pageOrder.length === 0) {
      pageOrder = Array.from({ length: totalPages }, (_, i) => i + 1);
    }

    // Exclude removed pages
    const pagesToRemove = new Set(Array.isArray(options.pagesToRemove) ? options.pagesToRemove : []);
    const validOrder = pageOrder.filter(
      (p) => typeof p === 'number' && p >= 1 && p <= totalPages && !pagesToRemove.has(p)
    );

    if (validOrder.length === 0) {
      throw new Error('All pages were removed. Please keep at least one page in your organized document.');
    }

    onProgress?.(40, `Arranging ${validOrder.length} pages in custom order...`);

    const zeroBasedIndices = validOrder.map((p) => p - 1);
    const copiedPages = await newDoc.copyPages(srcDoc, zeroBasedIndices);

    const pageRotations = options.pageRotations || {};

    copiedPages.forEach((page, idx) => {
      const originalPageNumber = validOrder[idx];
      const additionalRotation = Number(pageRotations[originalPageNumber] || 0);

      if (additionalRotation % 360 !== 0) {
        const currentRotation = page.getRotation().angle;
        page.setRotation(degrees((currentRotation + additionalRotation) % 360));
      }

      newDoc.addPage(page);
    });

    onProgress?.(85, 'Saving organized document...');
    const outputBytes = await newDoc.save({ useObjectStreams: true });

    const baseName = path.parse(sourceFile.originalName).name || 'document';
    const outputFileName = `${baseName}_organized.pdf`;
    const outputPath = path.join(outputDir, outputFileName);

    await fs.promises.writeFile(outputPath, outputBytes);
    onProgress?.(100, 'Organize completed successfully!');

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

export const organizePdfProcessor = new OrganizePdfProcessor();
