import fs from 'fs';
import path from 'path';
import { PDFDocument } from 'pdf-lib';
import { IProcessor, ProcessorInput, ProcessorResult } from './types';

export class MergePdfProcessor implements IProcessor {
  public async process(
    input: ProcessorInput,
    onProgress?: (progress: number, message?: string) => void
  ): Promise<ProcessorResult> {
    const { inputFiles, options, outputDir } = input;

    if (!inputFiles || inputFiles.length < 2) {
      throw new Error('Please select at least 2 PDF documents to merge.');
    }

    onProgress?.(10, 'Initializing merged PDF document...');
    const mergedPdf = await PDFDocument.create();

    // Determine ordering option
    const orderOption = options.order || 'original';
    let orderedFiles = [...inputFiles];

    if (orderOption === 'reverse') {
      orderedFiles.reverse();
    } else if (orderOption === 'alphabetical') {
      orderedFiles.sort((a, b) => a.originalName.localeCompare(b.originalName));
    }

    const totalFiles = orderedFiles.length;
    let totalPagesMerged = 0;

    for (let i = 0; i < totalFiles; i++) {
      const file = orderedFiles[i];
      const progressPercent = 15 + Math.round(((i + 1) / totalFiles) * 70);
      onProgress?.(
        progressPercent,
        `Merging document ${i + 1} of ${totalFiles}: ${file.originalName}...`
      );

      if (!fs.existsSync(file.path)) {
        throw new Error(`PDF file not found on server: ${file.originalName}`);
      }

      const fileBytes = await fs.promises.readFile(file.path);
      if (fileBytes.length === 0) {
        throw new Error(`File is empty: ${file.originalName}`);
      }

      let srcDoc: PDFDocument;
      try {
        srcDoc = await PDFDocument.load(fileBytes, { ignoreEncryption: false });
      } catch (loadErr: any) {
        if (loadErr.message && loadErr.message.toLowerCase().includes('encrypted')) {
          throw new Error(
            `Document "${file.originalName}" is password protected. Please unlock it before merging.`
          );
        }
        throw new Error(
          `Unable to read "${file.originalName}". Please ensure it is a valid, uncorrupted PDF document.`
        );
      }

      const pageCount = srcDoc.getPageCount();
      if (pageCount === 0) {
        continue;
      }

      const pageIndices = srcDoc.getPageIndices();
      const copiedPages = await mergedPdf.copyPages(srcDoc, pageIndices);

      for (const page of copiedPages) {
        mergedPdf.addPage(page);
      }

      totalPagesMerged += pageCount;
    }

    if (totalPagesMerged === 0) {
      throw new Error('The selected PDF files do not contain any pages to merge.');
    }

    onProgress?.(90, `Finalizing unified document (${totalPagesMerged} pages)...`);
    const mergedPdfBytes = await mergedPdf.save();

    // Determine safe output filename
    const outName = `merged_${totalFiles}_documents_${Date.now()}.pdf`;
    const outputPath = path.join(outputDir, outName);
    await fs.promises.writeFile(outputPath, mergedPdfBytes);

    const stats = await fs.promises.stat(outputPath);

    onProgress?.(100, `Merged ${totalFiles} documents (${totalPagesMerged} pages) successfully.`);

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

export const mergePdfProcessor = new MergePdfProcessor();
