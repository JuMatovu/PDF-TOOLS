import fs from 'fs';
import path from 'path';
import { PDFDocument } from 'pdf-lib';
import { IProcessor, ProcessorInput, ProcessorResult } from './types';

/**
 * Parses user input like "1-3, 5, 8" or [2, 4] into unique sorted 1-indexed page numbers
 */
function parsePageNumbers(input: any, totalPages: number): number[] {
  if (!input) return [];

  if (Array.isArray(input)) {
    return Array.from(
      new Set(
        input
          .map((n) => parseInt(String(n), 10))
          .filter((n) => !isNaN(n) && n >= 1 && n <= totalPages)
      )
    ).sort((a, b) => a - b);
  }

  const str = String(input).trim();
  if (str.toLowerCase() === 'all') {
    return Array.from({ length: totalPages }, (_, i) => i + 1);
  }

  const result = new Set<number>();
  const parts = str.split(/[,;\s]+/).filter(Boolean);

  for (const part of parts) {
    if (part.includes('-')) {
      const [s, e] = part.split('-');
      const start = parseInt(s.trim(), 10);
      const end = parseInt(e.trim(), 10);
      if (!isNaN(start) && !isNaN(end)) {
        const from = Math.max(1, Math.min(start, end));
        const to = Math.min(totalPages, Math.max(start, end));
        for (let p = from; p <= to; p++) {
          result.add(p);
        }
      }
    } else {
      const num = parseInt(part.trim(), 10);
      if (!isNaN(num) && num >= 1 && num <= totalPages) {
        result.add(num);
      }
    }
  }

  return Array.from(result).sort((a, b) => a - b);
}

export class RemovePagesProcessor implements IProcessor {
  public async process(
    input: ProcessorInput,
    onProgress?: (progress: number, message?: string) => void
  ): Promise<ProcessorResult> {
    const { inputFiles, options, outputDir } = input;

    if (!inputFiles || inputFiles.length === 0) {
      throw new Error('Please select a PDF document from which to remove pages.');
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
      throw new Error('This PDF contains no pages.');
    }

    // Determine which pages to remove
    const rawToRemove = options.pagesToRemove || options.selectedPages || options.pageRange || options.pages;
    const pagesToRemove = parsePageNumbers(rawToRemove, totalPages);

    if (pagesToRemove.length === 0) {
      throw new Error('Please select at least one page to remove from the document.');
    }

    if (pagesToRemove.length >= totalPages) {
      throw new Error(`Cannot remove all ${totalPages} pages from the document. At least one page must remain.`);
    }

    onProgress?.(30, `Removing ${pagesToRemove.length} pages from ${totalPages}-page document...`);

    // Remaining pages (1-indexed)
    const removeSet = new Set(pagesToRemove);
    const remainingPages = Array.from({ length: totalPages }, (_, i) => i + 1).filter(
      (p) => !removeSet.has(p)
    );

    // Create new PDF with remaining pages
    const newDoc = await PDFDocument.create();
    const copiedPages = await newDoc.copyPages(
      srcDoc,
      remainingPages.map((p) => p - 1)
    );

    copiedPages.forEach((page) => newDoc.addPage(page));

    onProgress?.(80, 'Saving updated PDF document...');
    const outputBytes = await newDoc.save({ useObjectStreams: true });

    const baseName = path.parse(sourceFile.originalName).name || 'document';
    const outputFileName = `${baseName}_pruned.pdf`;
    const outputPath = path.join(outputDir, outputFileName);

    await fs.promises.writeFile(outputPath, outputBytes);

    onProgress?.(100, `Removed ${pagesToRemove.length} page(s) successfully!`);

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

export const removePagesProcessor = new RemovePagesProcessor();
