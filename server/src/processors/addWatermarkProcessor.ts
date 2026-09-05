import fs from 'fs';
import path from 'path';
import { PDFDocument, StandardFonts, rgb, degrees } from 'pdf-lib';
import { IProcessor, ProcessorInput, ProcessorResult } from './types';

export class AddWatermarkProcessor implements IProcessor {
  public async process(
    input: ProcessorInput,
    onProgress?: (progress: number, message?: string) => void
  ): Promise<ProcessorResult> {
    const { inputFiles, options, outputDir } = input;

    if (!inputFiles || inputFiles.length === 0) {
      throw new Error('Please select a PDF document to add a watermark.');
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
      throw new Error('This PDF contains no pages to watermark.');
    }

    onProgress?.(30, 'Embedding typography for watermark stamp...');
    const boldFont = await srcDoc.embedFont(StandardFonts.HelveticaBold);

    // Options
    const watermarkText = (options.watermarkText || options.text || 'CONFIDENTIAL').toString().trim() || 'CONFIDENTIAL';
    const angle = parseInt(options.angle || '45', 10);
    const validAngle = isNaN(angle) ? 45 : angle;
    const opacityVal = parseFloat(options.opacity || '0.25');
    const opacity = isNaN(opacityVal) ? 0.25 : Math.max(0.05, Math.min(1.0, opacityVal));
    const fontSize = parseInt(options.fontSize || '54', 10) || 54;
    const colorKey = (options.color || 'gray').toString().toLowerCase();

    let color = rgb(0.5, 0.5, 0.5);
    if (colorKey === 'red') {
      color = rgb(0.85, 0.15, 0.15);
    } else if (colorKey === 'blue') {
      color = rgb(0.15, 0.35, 0.85);
    } else if (colorKey === 'black') {
      color = rgb(0.1, 0.1, 0.1);
    }

    const pages = srcDoc.getPages();
    onProgress?.(50, `Stamping watermark on ${pages.length} pages...`);

    const textWidth = boldFont.widthOfTextAtSize(watermarkText, fontSize);
    const rad = (validAngle * Math.PI) / 180;

    for (let i = 0; i < pages.length; i++) {
      const page = pages[i];
      const { width, height } = page.getSize();

      // Center the rotated text
      const x = width / 2 - (textWidth / 2) * Math.cos(rad) + (fontSize / 2) * Math.sin(rad);
      const y = height / 2 - (textWidth / 2) * Math.sin(rad) - (fontSize / 2) * Math.cos(rad);

      page.drawText(watermarkText, {
        x,
        y,
        size: fontSize,
        font: boldFont,
        color,
        opacity,
        rotate: degrees(validAngle),
      });

      if ((i + 1) % 5 === 0 || i === pages.length - 1) {
        const percent = Math.min(85, Math.round(50 + ((i + 1) / pages.length) * 35));
        onProgress?.(percent, `Stamped page ${i + 1} of ${pages.length}...`);
      }
    }

    onProgress?.(90, 'Saving watermarked PDF document...');
    const outputBytes = await srcDoc.save({ useObjectStreams: true });

    const baseName = path.parse(sourceFile.originalName).name || 'document';
    const outputFileName = `${baseName}_watermarked.pdf`;
    const outputPath = path.join(outputDir, outputFileName);

    await fs.promises.writeFile(outputPath, outputBytes);

    onProgress?.(100, 'Watermark applied successfully!');

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

export const addWatermarkProcessor = new AddWatermarkProcessor();
