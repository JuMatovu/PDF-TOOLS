import { PDFDocument, StandardFonts, rgb } from 'pdf-lib';
import { EditorElement, TextElement, ShapeElement, DrawElement, ImageElement, StampElement } from '../types/editor';

function hexToRgb(hex?: string): { r: number; g: number; b: number } {
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

/**
 * Converts a base64 dataUrl into Uint8Array
 */
function dataUrlToBytes(dataUrl: string): Uint8Array {
  const base64 = dataUrl.split(',')[1] || '';
  const binaryString = atob(base64);
  const bytes = new Uint8Array(binaryString.length);
  for (let i = 0; i < binaryString.length; i++) {
    bytes[i] = binaryString.charCodeAt(i);
  }
  return bytes;
}

/**
 * Bakes all interactive canvas elements into the PDF document
 */
export async function exportEditedPdfToBlob(
  sourcePdfBytes: ArrayBuffer | Uint8Array,
  elements: EditorElement[],
  canvasDimensions: Record<number, { width: number; height: number }> = {}
): Promise<Blob> {
  let pdfDoc: PDFDocument;

  if (sourcePdfBytes && sourcePdfBytes.byteLength > 0) {
    pdfDoc = await PDFDocument.load(sourcePdfBytes, { ignoreEncryption: true });
  } else {
    // If no document was uploaded, create a clean A4 document
    pdfDoc = await PDFDocument.create();
    pdfDoc.addPage([595.28, 841.89]);
  }

  const pageCount = pdfDoc.getPageCount();

  const fontHelvetica = await pdfDoc.embedFont(StandardFonts.Helvetica);
  const fontHelveticaBold = await pdfDoc.embedFont(StandardFonts.HelveticaBold);
  const fontTimes = await pdfDoc.embedFont(StandardFonts.TimesRoman);
  const fontCourier = await pdfDoc.embedFont(StandardFonts.Courier);

  for (let i = 0; i < pageCount; i++) {
    const pageNum = i + 1;
    const page = pdfDoc.getPage(i);
    const { width: pWidth, height: pHeight } = page.getSize();

    const canvasDim = canvasDimensions[pageNum] || { width: pWidth, height: pHeight };
    const scaleX = pWidth / canvasDim.width;
    const scaleY = pHeight / canvasDim.height;

    const pageElements = elements.filter((el) => el.page === pageNum);

    for (const el of pageElements) {
      const pdfX = el.x * scaleX;
      // Convert top-left origin to bottom-left PDF coordinate system
      const pdfY = pHeight - (el.y + el.height) * scaleY;

      if (el.type === 'text') {
        const textEl = el as TextElement;
        const color = hexToRgb(textEl.color);
        const fontSize = Math.max(8, textEl.fontSize * scaleY);

        let font = fontHelvetica;
        if (textEl.isBold) font = fontHelveticaBold;
        else if (textEl.fontFamily === 'Times') font = fontTimes;
        else if (textEl.fontFamily === 'Courier') font = fontCourier;

        // Background box if any
        if (textEl.backgroundColor) {
          const bgColor = hexToRgb(textEl.backgroundColor);
          page.drawRectangle({
            x: pdfX,
            y: pdfY,
            width: textEl.width * scaleX,
            height: textEl.height * scaleY,
            color: rgb(bgColor.r, bgColor.g, bgColor.b),
          });
        }

        // Draw lines
        const lines = (textEl.text || '').split('\n');
        let currentTextY = pHeight - (textEl.y * scaleY) - fontSize;

        for (const line of lines) {
          page.drawText(line, {
            x: pdfX + 4 * scaleX,
            y: currentTextY,
            size: fontSize,
            font,
            color: rgb(color.r, color.g, color.b),
          });
          currentTextY -= fontSize * 1.25;
        }
      } else if (el.type === 'shape') {
        const shapeEl = el as ShapeElement;
        const strokeColor = hexToRgb(shapeEl.strokeColor);
        const strokeWidth = (shapeEl.strokeWidth || 2) * scaleX;
        const w = shapeEl.width * scaleX;
        const h = shapeEl.height * scaleY;

        let fillColor;
        if (shapeEl.fillColor && shapeEl.fillColor !== 'transparent') {
          const fc = hexToRgb(shapeEl.fillColor);
          fillColor = rgb(fc.r, fc.g, fc.b);
        }

        if (shapeEl.shapeType === 'rectangle') {
          page.drawRectangle({
            x: pdfX,
            y: pdfY,
            width: Math.max(1, w),
            height: Math.max(1, h),
            borderColor: rgb(strokeColor.r, strokeColor.g, strokeColor.b),
            borderWidth: strokeWidth,
            color: fillColor,
          });
        } else if (shapeEl.shapeType === 'circle') {
          page.drawEllipse({
            x: pdfX + w / 2,
            y: pdfY + h / 2,
            xScale: Math.max(1, w / 2),
            yScale: Math.max(1, h / 2),
            borderColor: rgb(strokeColor.r, strokeColor.g, strokeColor.b),
            borderWidth: strokeWidth,
            color: fillColor,
          });
        } else if (shapeEl.shapeType === 'line' || shapeEl.shapeType === 'arrow') {
          page.drawLine({
            start: { x: pdfX, y: pdfY + h },
            end: { x: pdfX + w, y: pdfY },
            color: rgb(strokeColor.r, strokeColor.g, strokeColor.b),
            thickness: strokeWidth,
          });

          if (shapeEl.shapeType === 'arrow') {
            // Draw arrowhead tick
            page.drawCircle({
              x: pdfX + w,
              y: pdfY,
              size: strokeWidth * 2,
              color: rgb(strokeColor.r, strokeColor.g, strokeColor.b),
            });
          }
        }
      } else if (el.type === 'draw' || el.type === 'highlight') {
        const drawEl = el as DrawElement;
        const color = hexToRgb(drawEl.color);
        const strokeWidth = (drawEl.strokeWidth || (el.type === 'highlight' ? 14 : 3)) * scaleX;
        const opacity = el.type === 'highlight' ? 0.35 : (drawEl.opacity ?? 1.0);

        if (drawEl.points && drawEl.points.length > 1) {
          for (let p = 0; p < drawEl.points.length - 1; p++) {
            const p1 = drawEl.points[p];
            const p2 = drawEl.points[p + 1];

            page.drawLine({
              start: {
                x: p1.x * scaleX,
                y: pHeight - p1.y * scaleY,
              },
              end: {
                x: p2.x * scaleX,
                y: pHeight - p2.y * scaleY,
              },
              color: rgb(color.r, color.g, color.b),
              thickness: strokeWidth,
              opacity,
            });
          }
        }
      } else if (el.type === 'image') {
        const imgEl = el as ImageElement;
        if (imgEl.dataUrl) {
          try {
            const imgBytes = dataUrlToBytes(imgEl.dataUrl);
            const isPng = imgEl.dataUrl.includes('image/png');
            const embeddedImage = isPng
              ? await pdfDoc.embedPng(imgBytes)
              : await pdfDoc.embedJpg(imgBytes);

            page.drawImage(embeddedImage, {
              x: pdfX,
              y: pdfY,
              width: imgEl.width * scaleX,
              height: imgEl.height * scaleY,
            });
          } catch (imgErr) {
            console.warn('[pdfEditorExporter] Could not embed image:', imgErr);
          }
        }
      } else if (el.type === 'stamp') {
        const stampEl = el as StampElement;
        const color = hexToRgb(stampEl.color);
        const w = stampEl.width * scaleX;
        const h = stampEl.height * scaleY;

        // Border rectangle
        page.drawRectangle({
          x: pdfX,
          y: pdfY,
          width: w,
          height: h,
          borderColor: rgb(color.r, color.g, color.b),
          borderWidth: 2 * scaleX,
          color: rgb(color.r, color.g, color.b),
          opacity: 0.12,
        });

        // Text
        page.drawText(stampEl.text.toUpperCase(), {
          x: pdfX + 12 * scaleX,
          y: pdfY + (h / 2) - 4 * scaleY,
          size: 14 * scaleY,
          font: fontHelveticaBold,
          color: rgb(color.r, color.g, color.b),
        });

        if (stampEl.dateStr) {
          page.drawText(stampEl.dateStr, {
            x: pdfX + 12 * scaleX,
            y: pdfY + 6 * scaleY,
            size: 7 * scaleY,
            font: fontHelvetica,
            color: rgb(color.r, color.g, color.b),
          });
        }
      }
    }
  }

  const outputBytes = await pdfDoc.save();
  return new Blob([outputBytes], { type: 'application/pdf' });
}
