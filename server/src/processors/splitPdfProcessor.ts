import fs from 'fs';
import path from 'path';
import { PDFDocument } from 'pdf-lib';
import { IProcessor, ProcessorInput, ProcessorResult } from './types';

/**
 * Parses user page range strings like "1-3, 5, 8-10" into 0-indexed page numbers.
 */
function parsePageRanges(rangeStr: string, totalPages: number): number[] {
  if (!rangeStr || rangeStr.trim().toLowerCase() === 'all') {
    return Array.from({ length: totalPages }, (_, i) => i);
  }

  const indices = new Set<number>();
  const parts = rangeStr.split(/[,;\s]+/).filter(Boolean);

  for (const part of parts) {
    if (part.includes('-')) {
      const [startStr, endStr] = part.split('-');
      const start = parseInt(startStr.trim(), 10);
      const end = parseInt(endStr.trim(), 10);

      if (!isNaN(start) && !isNaN(end)) {
        const from = Math.max(1, Math.min(start, end));
        const to = Math.min(totalPages, Math.max(start, end));
        for (let p = from; p <= to; p++) {
          indices.add(p - 1);
        }
      }
    } else {
      const pageNum = parseInt(part.trim(), 10);
      if (!isNaN(pageNum) && pageNum >= 1 && pageNum <= totalPages) {
        indices.add(pageNum - 1);
      }
    }
  }

  const sorted = Array.from(indices).sort((a, b) => a - b);
  return sorted;
}

export class SplitPdfProcessor implements IProcessor {
  public async process(
    input: ProcessorInput,
    onProgress?: (progress: number, message?: string) => void
  ): Promise<ProcessorResult> {
    const { inputFiles, options, outputDir } = input;

    if (!inputFiles || inputFiles.length === 0) {
      throw new Error('Please select a PDF document to split.');
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
      throw new Error('This PDF contains no pages to split.');
    }

    onProgress?.(30, `Document has ${totalPages} page(s). Parsing page selection...`);

    const splitMode = options.splitMode || 'range';
    const pageRangeStr = (options.pageRange || options.range || '').toString().trim();

    let targetIndices: number[] = [];

    // Check if selectedPages array was directly passed
    if (Array.isArray(options.selectedPages) && options.selectedPages.length > 0) {
      const valid = options.selectedPages
        .map((p: any) => parseInt(p, 10))
        .filter((p: number) => !isNaN(p) && p >= 1 && p <= totalPages);
      targetIndices = Array.from(new Set(valid.map((p: number) => p - 1))).sort((a, b) => a - b);
    } else if (pageRangeStr) {
      targetIndices = parsePageRanges(pageRangeStr, totalPages);
    } else if (splitMode === 'all') {
      targetIndices = Array.from({ length: totalPages }, (_, i) => i);
    } else {
      // Default to page 1
      targetIndices = [0];
    }

    if (targetIndices.length === 0) {
      throw new Error(
        `No valid pages found in range "${pageRangeStr}". Document has ${totalPages} page(s) (e.g. 1-${totalPages}).`
      );
    }

    onProgress?.(50, `Extracting ${targetIndices.length} page(s)...`);
    const newDoc = await PDFDocument.create();
    const copiedPages = await newDoc.copyPages(srcDoc, targetIndices);

    for (let i = 0; i < copiedPages.length; i++) {
      newDoc.addPage(copiedPages[i]);
      const currentPct = 50 + Math.round(((i + 1) / copiedPages.length) * 35);
      onProgress?.(currentPct, `Adding page ${targetIndices[i] + 1} (${i + 1} of ${copiedPages.length})...`);
    }

    onProgress?.(90, 'Finalizing split PDF document...');
    const resultBytes = await newDoc.save();

    const baseName = path.parse(sourceFile.originalName).name || 'document';
    const rangeLabel = targetIndices.length === 1 ? `page_${targetIndices[0] + 1}` : `pages_${targetIndices[0] + 1}-${targetIndices[targetIndices.length - 1] + 1}`;
    const outName = `${baseName}_split_${rangeLabel}_${Date.now()}.pdf`;
    const outputPath = path.join(outputDir, outName);

    await fs.promises.writeFile(outputPath, resultBytes);
    const stats = await fs.promises.stat(outputPath);

    onProgress?.(100, `Successfully split into ${targetIndices.length} page(s).`);

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

export const splitPdfProcessor = new SplitPdfProcessor();
