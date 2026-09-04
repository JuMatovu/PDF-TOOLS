import fs from 'fs';
import path from 'path';
import { PDFDocument, degrees } from 'pdf-lib';
import { IProcessor, ProcessorInput, ProcessorResult } from './types';

export class RotatePdfProcessor implements IProcessor {
  public async process(
    input: ProcessorInput,
    onProgress?: (progress: number, message?: string) => void
  ): Promise<ProcessorResult> {
    const { inputFiles, options, outputDir } = input;

    if (!inputFiles || inputFiles.length === 0) {
      throw new Error('Please select a PDF document to rotate.');
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
      throw new Error('This PDF contains no pages to rotate.');
    }

    // Parse options:
    // Option A: Specific per-page rotations: e.g. options.pageRotations = { "1": 90, "3": 180 }
    let pageRotationsMap: Record<number, number> = {};
    if (options.pageRotations && typeof options.pageRotations === 'object') {
      for (const [key, val] of Object.entries(options.pageRotations)) {
        const pageNum = parseInt(key, 10);
        const rot = parseInt(String(val), 10);
        if (!isNaN(pageNum) && !isNaN(rot)) {
          pageRotationsMap[pageNum] = ((rot % 360) + 360) % 360;
        }
      }
    }

    // Default angle for selected pages or all pages
    const defaultAngleOption = parseInt(options.angle || options.rotation || '90', 10);
    const defaultAngle = isNaN(defaultAngleOption) ? 90 : ((defaultAngleOption % 360) + 360) % 360;

    // Selected pages can be passed as an array [1, 3] or string "1, 3"
    let selectedPages: number[] = [];
    if (Array.isArray(options.selectedPages)) {
      selectedPages = options.selectedPages
        .map((p: any) => parseInt(p, 10))
        .filter((p: number) => !isNaN(p) && p >= 1 && p <= totalPages);
    }

    // If selectedPages was provided, populate map with defaultAngle if not already specified
    if (selectedPages.length > 0) {
      for (const p of selectedPages) {
        if (pageRotationsMap[p] === undefined) {
          pageRotationsMap[p] = defaultAngle;
        }
      }
    }

    // If no specific per-page rotations exist, fall back to pageScope ('all', 'odd', 'even', or custom string)
    const pageScope = (options.pages || 'all').toString().toLowerCase();

    onProgress?.(30, `Applying rotations to PDF pages...`);

    const pages = srcDoc.getPages();
    let rotatedCount = 0;

    for (let i = 0; i < pages.length; i++) {
      const pageNumber = i + 1;
      let angleToApply = 0;

      // Check if page has explicit rotation in pageRotationsMap
      if (pageRotationsMap[pageNumber] !== undefined) {
        angleToApply = pageRotationsMap[pageNumber];
      } else if (Object.keys(pageRotationsMap).length === 0) {
        // Fall back to scope
        let shouldRotate = false;
        if (pageScope === 'all') {
          shouldRotate = true;
        } else if (pageScope === 'odd') {
          shouldRotate = pageNumber % 2 !== 0;
        } else if (pageScope === 'even') {
          shouldRotate = pageNumber % 2 === 0;
        } else {
          const allowed = pageScope.split(/[,;\s]+/).map((n: string) => parseInt(n, 10));
          shouldRotate = allowed.includes(pageNumber);
        }

        if (shouldRotate) {
          angleToApply = defaultAngle;
        }
      }

      if (angleToApply !== 0) {
        const page = pages[i];
        const currentRotation = page.getRotation().angle;
        const newAngle = (currentRotation + angleToApply) % 360;
        page.setRotation(degrees(newAngle));
        rotatedCount++;
      }

      const pct = 30 + Math.round(((i + 1) / pages.length) * 55);
      onProgress?.(pct, `Processed page ${i + 1} of ${pages.length}...`);
    }

    if (rotatedCount === 0) {
      // If nothing rotated, rotate page 1 or default to ensure user gets their expected result
      const page = pages[0];
      const currentRotation = page.getRotation().angle;
      const newAngle = (currentRotation + defaultAngle) % 360;
      page.setRotation(degrees(newAngle));
      rotatedCount = 1;
    }

    onProgress?.(90, 'Saving rotated document...');
    const resultBytes = await srcDoc.save();

    const baseName = path.parse(sourceFile.originalName).name || 'document';
    const outName = `${baseName}_rotated_${Date.now()}.pdf`;
    const outputPath = path.join(outputDir, outName);

    await fs.promises.writeFile(outputPath, resultBytes);
    const stats = await fs.promises.stat(outputPath);

    onProgress?.(100, `Rotated ${rotatedCount} of ${totalPages} page(s).`);

    return {
      outputFiles: [
        {
          fileName: outName,
          path: outputPath,
          mimeType: 'application/pdf',
          size: stats.size,
        },
      ],
    };
  }
}

export const rotatePdfProcessor = new RotatePdfProcessor();
