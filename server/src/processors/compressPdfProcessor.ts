import fs from 'fs';
import path from 'path';
import { PDFDocument } from 'pdf-lib';
import { IProcessor, ProcessorInput, ProcessorResult } from './types';

export class CompressPdfProcessor implements IProcessor {
  public async process(
    input: ProcessorInput,
    onProgress?: (progress: number, message?: string) => void
  ): Promise<ProcessorResult> {
    const { inputFiles, options, outputDir } = input;

    if (!inputFiles || inputFiles.length === 0) {
      throw new Error('Please select a PDF document to compress.');
    }

    const sourceFile = inputFiles[0];
    onProgress?.(10, `Reading "${sourceFile.originalName}"...`);

    if (!fs.existsSync(sourceFile.path)) {
      throw new Error(`File not found on server: ${sourceFile.originalName}`);
    }

    const fileBytes = await fs.promises.readFile(sourceFile.path);
    const initialSize = fileBytes.length;

    if (initialSize === 0) {
      throw new Error(`File is empty: ${sourceFile.originalName}`);
    }

    let srcDoc: PDFDocument;
    try {
      srcDoc = await PDFDocument.load(fileBytes, {
        ignoreEncryption: false,
        updateMetadata: false,
      });
    } catch (err: any) {
      if (err.message && err.message.toLowerCase().includes('encrypted')) {
        throw new Error(`Document "${sourceFile.originalName}" is password protected. Please unlock it first.`);
      }
      throw new Error(`Unable to read "${sourceFile.originalName}". Please ensure it is a valid PDF.`);
    }

    const compressionLevel = (options.compressionLevel || 'recommended').toString().toLowerCase();
    onProgress?.(40, `Applying ${compressionLevel} compression stream optimization...`);

    // In extreme mode, clean metadata and unused document elements
    if (compressionLevel === 'extreme') {
      srcDoc.setTitle('');
      srcDoc.setAuthor('');
      srcDoc.setSubject('');
      srcDoc.setKeywords([]);
      srcDoc.setProducer('PDFTOOL Optimizer');
      srcDoc.setCreator('PDFTOOL Optimizer');
    }

    onProgress?.(70, 'Compacting cross-reference table and compressing object streams...');

    // Save with compressed object streams and optimized cross-reference dictionary
    const outputBytes = await srcDoc.save({
      useObjectStreams: true,
      addDefaultPage: false,
    });

    onProgress?.(90, 'Finalizing compressed document...');

    const baseName = path.parse(sourceFile.originalName).name || 'document';
    const outputFileName = `${baseName}_compressed.pdf`;
    const outputPath = path.join(outputDir, outputFileName);

    await fs.promises.writeFile(outputPath, outputBytes);

    const savedBytes = Math.max(0, initialSize - outputBytes.length);
    const savedPercent = initialSize > 0 ? Math.round((savedBytes / initialSize) * 100) : 0;

    onProgress?.(
      100,
      savedPercent > 0
        ? `Compression complete: reduced by ${savedPercent}%!`
        : `Compression complete!`
    );

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

export const compressPdfProcessor = new CompressPdfProcessor();
