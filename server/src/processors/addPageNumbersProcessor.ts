import fs from 'fs';
import path from 'path';
import { PDFDocument, StandardFonts, rgb } from 'pdf-lib';
import { IProcessor, ProcessorInput, ProcessorResult } from './types';

export class AddPageNumbersProcessor implements IProcessor {
  public async process(
    input: ProcessorInput,
    onProgress?: (progress: number, message?: string) => void
  ): Promise<ProcessorResult> {
    const { inputFiles, options, outputDir } = input;

    if (!inputFiles || inputFiles.length === 0) {
      throw new Error('Please select a PDF document to add page numbers.');
    }

    const sourceFile = inputFiles[0];
    onProgress?.(10, `Reading "${sourceFile.originalName}"...`);

    if (!fs.existsSync(sourceFile.path)) {
      throw new Error(`File not found on server: ${sourceFile.originalName}`);
    }

    const fileBytes = await fs.promises.readFile(sourceFile.path);
    if (fileBytes.length === 0) {
      throw new Error(`File is empty: ${sourceFile.originalName}`);
    }

    let srcDoc: PDFDocument;
    try {
      srcDoc = await PDFDocument.load(fileBytes);
    } catch (err: any) {
      if (err.message && err.message.toLowerCase().includes('encrypted')) {
        throw new Error(`Document "${sourceFile.originalName}" is password protected. Please unlock it first.`);
      }
      throw new Error(`Unable to read "${sourceFile.originalName}". Please ensure it is a valid PDF.`);
    }

    const totalPages = srcDoc.getPageCount();
    if (totalPages === 0) {
      throw new Error('This PDF contains no pages to number.');
    }

    onProgress?.(30, 'Embedding typography and calculating coordinates...');
    const helveticaFont = await srcDoc.embedFont(StandardFonts.Helvetica);

    // Options
    const position = (options.position || 'bottom-center').toString();
    const format = (options.format || 'page-n-of-total').toString();
    const startNumber = parseInt(options.startNumber || '1', 10) || 1;
    const fontSize = parseInt(options.fontSize || '10', 10) || 10;
    const margin = parseInt(options.margin || '25', 10) || 25;

    const pages = srcDoc.getPages();
    onProgress?.(50, `Adding page numbers to ${pages.length} pages...`);

    for (let i = 0; i < pages.length; i++) {
      const page = pages[i];
      const pageNum = startNumber + i;
      const { width, height } = page.getSize();

      let label = `Page ${pageNum} of ${totalPages}`;
      if (format === 'number-only') {
        label = `${pageNum}`;
      } else if (format === 'page-n') {
        label = `Page ${pageNum}`;
      } else if (format === 'dash-n-dash') {
        label = `- ${pageNum} -`;
      } else if (format === 'page-n-of-total') {
        label = `Page ${pageNum} of ${totalPages}`;
      }

      const textWidth = helveticaFont.widthOfTextAtSize(label, fontSize);

      let x = (width - textWidth) / 2;
      let y = margin;

      switch (position) {
        case 'bottom-center':
          x = (width - textWidth) / 2;
          y = margin;
          break;
        case 'bottom-right':
          x = width - textWidth - margin;
          y = margin;
          break;
        case 'bottom-left':
          x = margin;
          y = margin;
          break;
        case 'top-center':
          x = (width - textWidth) / 2;
          y = height - margin - fontSize;
          break;
        case 'top-right':
          x = width - textWidth - margin;
          y = height - margin - fontSize;
          break;
        case 'top-left':
          x = margin;
          y = height - margin - fontSize;
          break;
      }

      // Draw page number
      page.drawText(label, {
        x,
        y,
        size: fontSize,
        font: helveticaFont,
        color: rgb(0.35, 0.35, 0.35),
      });

      if ((i + 1) % 5 === 0 || i === pages.length - 1) {
        const percent = Math.min(85, Math.round(50 + ((i + 1) / pages.length) * 35));
        onProgress?.(percent, `Stamped page ${i + 1} of ${pages.length}...`);
      }
    }

    onProgress?.(90, 'Saving numbered PDF document...');
    const outputBytes = await srcDoc.save({ useObjectStreams: true });

    const baseName = path.parse(sourceFile.originalName).name || 'document';
    const outputFileName = `${baseName}_numbered.pdf`;
    const outputPath = path.join(outputDir, outputFileName);

    await fs.promises.writeFile(outputPath, outputBytes);

    onProgress?.(100, 'Page numbering completed successfully!');

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

export const addPageNumbersProcessor = new AddPageNumbersProcessor();
