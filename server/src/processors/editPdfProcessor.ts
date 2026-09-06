import fs from 'fs';
import path from 'path';
import { PDFDocument, StandardFonts, rgb } from 'pdf-lib';
import { IProcessor, ProcessorInput, ProcessorResult } from './types';

function parseHexColor(hex?: string): { r: number; g: number; b: number } {
  if (!hex || !hex.startsWith('#') || hex.length < 7) {
    return { r: 0.1, g: 0.1, b: 0.1 };
  }
  const r = parseInt(hex.slice(1, 3), 16) / 255;
  const g = parseInt(hex.slice(3, 5), 16) / 255;
  const b = parseInt(hex.slice(5, 7), 16) / 255;
  return {
    r: isNaN(r) ? 0 : r,
    g: isNaN(g) ? 0 : g,
    b: isNaN(b) ? 0 : b,
  };
}

export class EditPdfProcessor implements IProcessor {
  public async process(
    input: ProcessorInput,
    onProgress?: (progress: number, message?: string) => void
  ): Promise<ProcessorResult> {
    const { inputFiles, options, outputDir } = input;

    if (!inputFiles || inputFiles.length === 0) {
      throw new Error('Please select a PDF document to edit.');
    }

    const sourceFile = inputFiles[0];
    onProgress?.(15, `Loading "${sourceFile.originalName}" for editing...`);

    const fileBytes = await fs.promises.readFile(sourceFile.path);
    const pdfDoc = await PDFDocument.load(fileBytes, { ignoreEncryption: true });
    const pageCount = pdfDoc.getPageCount();

    const fontRegular = await pdfDoc.embedFont(StandardFonts.Helvetica);
    const fontBold = await pdfDoc.embedFont(StandardFonts.HelveticaBold);

    const elements: any[] = Array.isArray(options.elements) ? options.elements : [];

    onProgress?.(40, `Applying ${elements.length} edits & annotations...`);

    for (const el of elements) {
      const pageIndex = (el.page || 1) - 1;
      if (pageIndex < 0 || pageIndex >= pageCount) continue;

      const page = pdfDoc.getPage(pageIndex);
      const { width: pWidth, height: pHeight } = page.getSize();
      const color = parseHexColor(el.color || el.strokeColor);

      // Coordinates in PDF coordinate system (origin bottom-left)
      // Frontend canvas sends normalized 0..1 or pixel coordinates relative to canvas width/height
      const canvasW = el.canvasWidth || pWidth;
      const canvasH = el.canvasHeight || pHeight;
      const scaleX = pWidth / canvasW;
      const scaleY = pHeight / canvasH;

      const pdfX = (el.x || 0) * scaleX;
      // Flip Y because canvas origin is top-left, PDF origin is bottom-left
      const pdfY = pHeight - ((el.y || 0) + (el.height || 0)) * scaleY;

      if (el.type === 'text' && el.text) {
        const fontSize = Math.max(8, (el.fontSize || 14) * scaleY);
        page.drawText(String(el.text), {
          x: (el.x || 0) * scaleX,
          y: pHeight - ((el.y || 0) + fontSize) * scaleY,
          size: fontSize,
          font: el.isBold ? fontBold : fontRegular,
          color: rgb(color.r, color.g, color.b),
        });
      } else if (el.type === 'shape') {
        const w = (el.width || 50) * scaleX;
        const h = (el.height || 50) * scaleY;
        const shapeType = el.shapeType || 'rectangle';

        if (shapeType === 'rectangle') {
          page.drawRectangle({
            x: pdfX,
            y: pdfY,
            width: w,
            height: h,
            borderColor: rgb(color.r, color.g, color.b),
            borderWidth: (el.strokeWidth || 2) * scaleX,
          });
        } else if (shapeType === 'circle') {
          page.drawEllipse({
            x: pdfX + w / 2,
            y: pdfY + h / 2,
            xScale: w / 2,
            yScale: h / 2,
            borderColor: rgb(color.r, color.g, color.b),
            borderWidth: (el.strokeWidth || 2) * scaleX,
          });
        } else if (shapeType === 'line' || shapeType === 'arrow') {
          page.drawLine({
            start: { x: pdfX, y: pdfY + h },
            end: { x: pdfX + w, y: pdfY },
            color: rgb(color.r, color.g, color.b),
            thickness: (el.strokeWidth || 2) * scaleX,
          });
        }
      } else if (el.type === 'stamp') {
        const stampText = el.text || 'APPROVED';
        const w = Math.max(120, (el.width || 140) * scaleX);
        const h = (el.height || 45) * scaleY;

        page.drawRectangle({
          x: pdfX,
          y: pdfY,
          width: w,
          height: h,
          borderColor: rgb(color.r, color.g, color.b),
          borderWidth: 2,
          color: rgb(color.r, color.g, color.b),
          opacity: 0.1,
        });

        page.drawText(stampText, {
          x: pdfX + 12,
          y: pdfY + 12,
          size: 16 * scaleY,
          font: fontBold,
          color: rgb(color.r, color.g, color.b),
        });
      }
    }

    onProgress?.(80, 'Saving edited document...');

    const baseName = path.parse(sourceFile.originalName).name;
    const outputName = `${baseName}_edited.pdf`;
    const outputPath = path.join(outputDir, outputName);

    const editedBytes = await pdfDoc.save();
    await fs.promises.writeFile(outputPath, editedBytes);

    onProgress?.(100, 'Edits saved successfully!');

    const stats = await fs.promises.stat(outputPath);

    return {
      outputFiles: [
        {
          fileName: outputName,
          path: outputPath,
          size: stats.size,
          mimeType: 'application/pdf',
        },
      ],
    };
  }
}
