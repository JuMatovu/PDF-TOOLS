import fs from 'fs';
import path from 'path';
import { PDFDocument, PageSizes } from 'pdf-lib';
import { IProcessor, ProcessorInput, ProcessorResult, GeneratedOutputFile } from './types';

export class ImageToPdfProcessor implements IProcessor {
  public async process(
    input: ProcessorInput,
    onProgress?: (progress: number, message?: string) => void
  ): Promise<ProcessorResult> {
    const { inputFiles, options, outputDir } = input;

    if (!inputFiles || inputFiles.length === 0) {
      throw new Error('No image files provided for PDF conversion.');
    }

    onProgress?.(10, 'Initializing PDF document...');
    const pdfDoc = await PDFDocument.create();

    const orientation = options.orientation || 'auto';
    const marginOption = options.margin || 'none';

    // Margin in points (72 points = 1 inch)
    let margin = 0;
    if (marginOption === 'small') {
      margin = 24;
    } else if (marginOption === 'large') {
      margin = 48;
    }

    const totalFiles = inputFiles.length;

    for (let i = 0; i < totalFiles; i++) {
      const file = inputFiles[i];
      const progressPercent = 15 + Math.round(((i + 1) / totalFiles) * 70);
      onProgress?.(progressPercent, `Embedding image ${i + 1} of ${totalFiles}: ${file.originalName}...`);

      // Read image file from disk
      if (!fs.existsSync(file.path)) {
        throw new Error(`Input image file not found: ${file.originalName}`);
      }

      const imageBytes = await fs.promises.readFile(file.path);
      if (imageBytes.length === 0) {
        throw new Error(`File is empty: ${file.originalName}`);
      }

      // Detect format by extension and magic bytes
      const isPng =
        file.extension === '.png' ||
        file.mimeType === 'image/png' ||
        (imageBytes[0] === 0x89 && imageBytes[1] === 0x50);

      let embeddedImage;
      try {
        if (isPng) {
          embeddedImage = await pdfDoc.embedPng(imageBytes);
        } else {
          // Default to JPG
          embeddedImage = await pdfDoc.embedJpg(imageBytes);
        }
      } catch (embedError: any) {
        // Fallback attempt: if jpg failed, try png and vice-versa
        try {
          if (isPng) {
            embeddedImage = await pdfDoc.embedJpg(imageBytes);
          } else {
            embeddedImage = await pdfDoc.embedPng(imageBytes);
          }
        } catch (retryError) {
          throw new Error(
            `Unable to parse image ${file.originalName}. Please ensure it is a valid, uncorrupted JPG or PNG image.`
          );
        }
      }

      const imgWidth = embeddedImage.width;
      const imgHeight = embeddedImage.height;

      // Determine page dimensions
      let pageWidth: number;
      let pageHeight: number;

      if (orientation === 'auto') {
        if (margin === 0) {
          // Exactly match image dimensions
          pageWidth = imgWidth;
          pageHeight = imgHeight;
        } else {
          // Standard A4 oriented to match image aspect ratio
          if (imgWidth >= imgHeight) {
            // Landscape A4
            pageWidth = PageSizes.A4[1]; // 841.89
            pageHeight = PageSizes.A4[0]; // 595.28
          } else {
            // Portrait A4
            pageWidth = PageSizes.A4[0]; // 595.28
            pageHeight = PageSizes.A4[1]; // 841.89
          }
        }
      } else if (orientation === 'landscape') {
        pageWidth = PageSizes.A4[1];
        pageHeight = PageSizes.A4[0];
      } else {
        // Portrait
        pageWidth = PageSizes.A4[0];
        pageHeight = PageSizes.A4[1];
      }

      const page = pdfDoc.addPage([pageWidth, pageHeight]);

      // Calculate scaled image size fitting within bounds
      const availableWidth = pageWidth - 2 * margin;
      const availableHeight = pageHeight - 2 * margin;

      const scale = Math.min(
        availableWidth / imgWidth,
        availableHeight / imgHeight,
        margin === 0 && orientation === 'auto' ? 1 : Math.max(availableWidth / imgWidth, availableHeight / imgHeight)
      );

      const renderWidth = imgWidth * scale;
      const renderHeight = imgHeight * scale;

      // Center image within available area
      const x = margin + (availableWidth - renderWidth) / 2;
      const y = margin + (availableHeight - renderHeight) / 2;

      page.drawImage(embeddedImage, {
        x,
        y,
        width: renderWidth,
        height: renderHeight,
      });
    }

    onProgress?.(90, 'Serializing and finalizing PDF...');

    // Save final PDF
    const pdfBytes = await pdfDoc.save();

    // Determine safe output filename
    let outName = 'converted_document.pdf';
    if (totalFiles === 1) {
      const base = path.basename(inputFiles[0].originalName, path.extname(inputFiles[0].originalName));
      outName = `${base}.pdf`;
    } else {
      outName = `combined_images_${Date.now()}.pdf`;
    }

    const outputPath = path.join(outputDir, outName);
    await fs.promises.writeFile(outputPath, pdfBytes);

    const stats = await fs.promises.stat(outputPath);

    onProgress?.(100, 'PDF generated successfully');

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

export const imageToPdfProcessor = new ImageToPdfProcessor();
