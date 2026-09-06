import { PDFDocument, rgb, StandardFonts, degrees } from 'pdf-lib';
import { EditorElement, TextElement, ShapeElement, DrawElement, ImageElement, SignatureElement, StampElement, RedactElement, CommentElement } from '../types/editorTypes';

/**
 * Converts a hex color (#RRGGBB or #RGB) to pdf-lib rgb(r, g, b) (0.0 to 1.0)
 */
function hexToPdfRgb(hex: string) {
  if (!hex || hex === 'transparent') return rgb(0, 0, 0);
  let cleaned = hex.replace('#', '').trim();
  if (cleaned.length === 3) {
    cleaned = cleaned.split('').map((c) => c + c).join('');
  }
  const r = parseInt(cleaned.substring(0, 2), 16) / 255 || 0;
  const g = parseInt(cleaned.substring(2, 4), 16) / 255 || 0;
  const b = parseInt(cleaned.substring(4, 6), 16) / 255 || 0;
  return rgb(r, g, b);
}

/**
 * Converts data URL (base64) to Uint8Array
 */
function dataUrlToUint8Array(dataUrl: string): Uint8Array {
  const base64 = dataUrl.split(',')[1] || dataUrl;
  const binaryString = atob(base64);
  const bytes = new Uint8Array(binaryString.length);
  for (let i = 0; i < binaryString.length; i++) {
    bytes[i] = binaryString.charCodeAt(i);
  }
  return bytes;
}

/**
 * Normalizes text so standard PDF fonts (WinAnsi encoding) never crash on
 * curly quotes, em-dashes, bullets, or non-Latin characters.
 */
function sanitizeTextForPdf(text: string): string {
  if (!text) return '';
  return text
    .replace(/[\u2018\u2019]/g, "'") // curly single quotes
    .replace(/[\u201C\u201D]/g, '"') // curly double quotes
    .replace(/[\u2014\u2015]/g, '--') // em-dash
    .replace(/\u2013/g, '-') // en-dash
    .replace(/\u2026/g, '...') // ellipsis
    .replace(/[\u2022\u2023\u25E6\u2043\u2219]/g, '-') // bullet points
    .replace(/[^\x00-\xFF]/g, '?'); // replace any remaining non-WinAnsi characters safely
}

/**
 * Ensures any image data URL (WebP, SVG, JPEG, PNG) is converted into valid PNG bytes
 * that pdf-lib can reliably embed.
 */
async function getEmbeddableImageBytes(dataUrl: string): Promise<Uint8Array> {
  if (dataUrl.startsWith('data:image/png') || dataUrl.startsWith('data:image/jpeg') || dataUrl.startsWith('data:image/jpg')) {
    return dataUrlToUint8Array(dataUrl);
  }
  return new Promise((resolve) => {
    if (typeof document === 'undefined') {
      resolve(dataUrlToUint8Array(dataUrl));
      return;
    }
    const img = new Image();
    img.crossOrigin = 'anonymous';
    img.onload = () => {
      const canvas = document.createElement('canvas');
      canvas.width = img.naturalWidth || 400;
      canvas.height = img.naturalHeight || 300;
      const ctx = canvas.getContext('2d');
      if (ctx) {
        ctx.drawImage(img, 0, 0);
        resolve(dataUrlToUint8Array(canvas.toDataURL('image/png')));
      } else {
        resolve(dataUrlToUint8Array(dataUrl));
      }
    };
    img.onerror = () => resolve(dataUrlToUint8Array(dataUrl));
    img.src = dataUrl;
  });
}

export interface ExportOptions {
  originalPdfBytes?: ArrayBuffer | null;
  elements: EditorElement[];
  pageRotations?: Record<number, number>; // pageNumber (1-indexed) -> degrees (0, 90, 180, 270)
  fileName?: string;
}

export class PdfExporter {
  public static async exportPdf(options: ExportOptions): Promise<Uint8Array> {
    const { originalPdfBytes, elements, pageRotations = {} } = options;

    let pdfDoc: PDFDocument;
    if (originalPdfBytes && originalPdfBytes.byteLength > 0) {
      try {
        pdfDoc = await PDFDocument.load(originalPdfBytes, { ignoreEncryption: true });
      } catch (loadErr) {
        console.error('[PdfExporter] Failed loading originalPdfBytes, initializing fallback document:', loadErr);
        pdfDoc = await PDFDocument.create();
        pdfDoc.addPage([595.28, 841.89]);
      }
    } else {
      console.warn('[PdfExporter] No originalPdfBytes provided or buffer empty! Creating new blank page');
      pdfDoc = await PDFDocument.create();
      pdfDoc.addPage([595.28, 841.89]); // Standard A4
    }

    // Embed standard fonts
    const fontRobotoHelvetica = await pdfDoc.embedFont(StandardFonts.Helvetica);
    const fontHelveticaBold = await pdfDoc.embedFont(StandardFonts.HelveticaBold);
    const fontHelveticaOblique = await pdfDoc.embedFont(StandardFonts.HelveticaOblique);
    const fontTimes = await pdfDoc.embedFont(StandardFonts.TimesRoman);
    const fontTimesBold = await pdfDoc.embedFont(StandardFonts.TimesRomanBold);
    const fontCourier = await pdfDoc.embedFont(StandardFonts.Courier);

    const pages = pdfDoc.getPages();
    const pageCount = pages.length;

    // 1. Apply page rotations
    for (let p = 1; p <= pageCount; p++) {
      const rot = pageRotations[p];
      if (rot !== undefined && rot % 360 !== 0) {
        const page = pages[p - 1];
        const currentRot = page.getRotation().angle;
        page.setRotation(degrees((currentRot + rot) % 360));
      }
    }

    // 2. Render each element onto its respective page
    for (const el of elements) {
      if (el.pageNumber < 1 || el.pageNumber > pageCount) continue;
      const page = pages[el.pageNumber - 1];
      const { height: pageHeight } = page.getSize();

      const elOpacity = el.opacity ?? 1.0;

      // ==========================
      // TEXT ELEMENTS
      // ==========================
      if (el.type === 'text') {
        const textEl = el as TextElement;
        let selectedFont = fontRobotoHelvetica;
        if (textEl.fontFamily === 'Times New Roman') {
          selectedFont = textEl.isBold ? fontTimesBold : fontTimes;
        } else if (textEl.fontFamily === 'Courier') {
          selectedFont = fontCourier;
        } else {
          if (textEl.isBold) selectedFont = fontHelveticaBold;
          else if (textEl.isItalic) selectedFont = fontHelveticaOblique;
        }

        const lines = (textEl.text || '').split('\n');
        const fontSize = textEl.fontSize || 14;
        const lineHeight = fontSize * 1.25;

        // In PDF coords, y starts from bottom
        const startPdfY = pageHeight - textEl.y - fontSize;

        // Draw background patch if coverOriginal or backgroundColor is set
        if (textEl.coverOriginal || textEl.backgroundColor) {
          const bgRgb = hexToPdfRgb(textEl.backgroundColor || '#ffffff');
          page.drawRectangle({
            x: textEl.x,
            y: pageHeight - textEl.y - textEl.height,
            width: textEl.width,
            height: textEl.height,
            color: bgRgb,
            opacity: 1.0,
          });
        }

        lines.forEach((rawLine, index) => {
          const line = sanitizeTextForPdf(rawLine);
          const lineY = startPdfY - index * lineHeight;
          let lineX = textEl.x;

          let textWidth = 0;
          try {
            textWidth = selectedFont.widthOfTextAtSize(line, fontSize);
          } catch {
            textWidth = line.length * (fontSize * 0.55);
          }

          if (textEl.alignment === 'center') {
            lineX = textEl.x + Math.max(0, (textEl.width - textWidth) / 2);
          } else if (textEl.alignment === 'right') {
            lineX = textEl.x + Math.max(0, textEl.width - textWidth);
          }

          try {
            page.drawText(line, {
              x: lineX,
              y: lineY,
              size: fontSize,
              font: selectedFont,
              color: hexToPdfRgb(textEl.color),
              opacity: elOpacity,
            });
          } catch (drawErr) {
            console.warn('[PdfExporter] drawText warning:', drawErr);
          }

          // Draw underline if required
          if (textEl.isUnderline && line.trim()) {
            page.drawLine({
              start: { x: lineX, y: lineY - 2 },
              end: { x: lineX + textWidth, y: lineY - 2 },
              thickness: Math.max(1, fontSize / 14),
              color: hexToPdfRgb(textEl.color),
              opacity: elOpacity,
            });
          }
        });
      }

      // ==========================
      // SHAPE ELEMENTS
      // ==========================
      else if (el.type === 'shape') {
        const shapeEl = el as ShapeElement;
        const pdfY = pageHeight - shapeEl.y - shapeEl.height;
        const strokeRgb = hexToPdfRgb(shapeEl.strokeColor);
        const hasFill = shapeEl.isFilled && shapeEl.fillColor !== 'transparent';
        const fillRgb = hasFill ? hexToPdfRgb(shapeEl.fillColor) : undefined;
        const thickness = shapeEl.strokeWidth || 2;
        const shapeFillOpacity = shapeEl.fillOpacity ?? elOpacity;
        const dashArray =
          shapeEl.strokeStyle === 'dashed'
            ? [6, 4]
            : shapeEl.strokeStyle === 'dotted'
            ? [2, 3]
            : undefined;

        if (shapeEl.shapeType === 'rectangle') {
          page.drawRectangle({
            x: shapeEl.x,
            y: pdfY,
            width: shapeEl.width,
            height: shapeEl.height,
            borderWidth: thickness,
            borderColor: strokeRgb,
            color: fillRgb,
            opacity: shapeFillOpacity,
            borderOpacity: elOpacity,
            borderDashArray: dashArray,
          });
        } else if (shapeEl.shapeType === 'rounded-rectangle') {
          const w = shapeEl.width;
          const h = shapeEl.height;
          const r = Math.min(shapeEl.cornerRadius || 12, Math.min(w, h) / 2);
          const rrPath = `M ${r} 0 L ${w - r} 0 A ${r} ${r} 0 0 1 ${w} ${r} L ${w} ${h - r} A ${r} ${r} 0 0 1 ${w - r} ${h} L ${r} ${h} A ${r} ${r} 0 0 1 0 ${h - r} L 0 ${r} A ${r} ${r} 0 0 1 ${r} 0 Z`;
          page.drawSvgPath(rrPath, {
            x: shapeEl.x,
            y: pdfY,
            color: fillRgb,
            borderColor: strokeRgb,
            borderWidth: thickness,
            opacity: shapeFillOpacity,
            borderOpacity: elOpacity,
          });
        } else if (shapeEl.shapeType === 'circle') {
          const xRadius = shapeEl.width / 2;
          const yRadius = shapeEl.height / 2;
          page.drawEllipse({
            x: shapeEl.x + xRadius,
            y: pdfY + yRadius,
            xScale: xRadius,
            yScale: yRadius,
            borderWidth: thickness,
            borderColor: strokeRgb,
            color: fillRgb,
            opacity: shapeFillOpacity,
            borderOpacity: elOpacity,
          });
        } else if (shapeEl.shapeType === 'triangle') {
          const triPath = `M 0 0 L ${shapeEl.width} 0 L ${shapeEl.width / 2} ${shapeEl.height} Z`;
          page.drawSvgPath(triPath, {
            x: shapeEl.x,
            y: pdfY,
            color: fillRgb,
            borderColor: strokeRgb,
            borderWidth: thickness,
            opacity: shapeFillOpacity,
            borderOpacity: elOpacity,
          });
        } else if (shapeEl.shapeType === 'star') {
          const cx = shapeEl.width / 2;
          const cy = shapeEl.height / 2;
          const outerR = Math.max(4, Math.min(shapeEl.width, shapeEl.height) / 2);
          const innerR = outerR * 0.42;
          const starPath =
            Array.from({ length: 10 }, (_, i) => {
              const angle = (i * Math.PI) / 5 + Math.PI / 2;
              const rad = i % 2 === 0 ? outerR : innerR;
              return (
                (i === 0 ? 'M ' : 'L ') +
                (cx + rad * Math.cos(angle)).toFixed(1) +
                ' ' +
                (cy + rad * Math.sin(angle)).toFixed(1)
              );
            }).join(' ') + ' Z';
          page.drawSvgPath(starPath, {
            x: shapeEl.x,
            y: pdfY,
            color: fillRgb,
            borderColor: strokeRgb,
            borderWidth: thickness,
            opacity: shapeFillOpacity,
            borderOpacity: elOpacity,
          });
        } else if (shapeEl.shapeType === 'diamond') {
          const diamondPath = `M 0 ${shapeEl.height / 2} L ${shapeEl.width / 2} ${shapeEl.height} L ${shapeEl.width} ${shapeEl.height / 2} L ${shapeEl.width / 2} 0 Z`;
          page.drawSvgPath(diamondPath, {
            x: shapeEl.x,
            y: pdfY,
            color: fillRgb,
            borderColor: strokeRgb,
            borderWidth: thickness,
            opacity: shapeFillOpacity,
            borderOpacity: elOpacity,
          });
        } else if (shapeEl.shapeType === 'line') {
          page.drawLine({
            start: { x: shapeEl.x, y: pageHeight - shapeEl.y },
            end: { x: shapeEl.x + shapeEl.width, y: pageHeight - shapeEl.y - shapeEl.height },
            thickness,
            color: strokeRgb,
            opacity: elOpacity,
          });
        } else if (shapeEl.shapeType === 'arrow') {
          const startX = shapeEl.x;
          const startY = pageHeight - shapeEl.y;
          const endX = shapeEl.x + shapeEl.width;
          const endY = pageHeight - shapeEl.y - shapeEl.height;

          // Main line
          page.drawLine({
            start: { x: startX, y: startY },
            end: { x: endX, y: endY },
            thickness,
            color: strokeRgb,
            opacity: elOpacity,
          });

          // Arrowhead calculation
          const angle = Math.atan2(endY - startY, endX - startX);
          const headLength = Math.max(12, thickness * 3.5);
          const arrowAngle = Math.PI / 7;

          const arrowP1X = endX - headLength * Math.cos(angle - arrowAngle);
          const arrowP1Y = endY - headLength * Math.sin(angle - arrowAngle);
          const arrowP2X = endX - headLength * Math.cos(angle + arrowAngle);
          const arrowP2Y = endY - headLength * Math.sin(angle + arrowAngle);

          page.drawLine({
            start: { x: endX, y: endY },
            end: { x: arrowP1X, y: arrowP1Y },
            thickness,
            color: strokeRgb,
            opacity: elOpacity,
          });
          page.drawLine({
            start: { x: endX, y: endY },
            end: { x: arrowP2X, y: arrowP2Y },
            thickness,
            color: strokeRgb,
            opacity: elOpacity,
          });
        }
      }

      // ==========================
      // FREEHAND DRAW / HIGHLIGHT
      // ==========================
      else if (el.type === 'draw') {
        const drawEl = el as DrawElement;
        if (drawEl.points && drawEl.points.length > 1) {
          const strokeRgb = hexToPdfRgb(drawEl.strokeColor);
          const drawOpacity = drawEl.isHighlighter ? 0.35 : elOpacity;
          const thickness = drawEl.strokeWidth || (drawEl.isHighlighter ? 14 : 3);

          for (let i = 0; i < drawEl.points.length - 1; i++) {
            const p1 = drawEl.points[i];
            const p2 = drawEl.points[i + 1];

            page.drawLine({
              start: { x: p1.x, y: pageHeight - p1.y },
              end: { x: p2.x, y: pageHeight - p2.y },
              thickness,
              color: strokeRgb,
              opacity: drawOpacity,
            });
          }
        }
      }

      // ==========================
      // IMAGES & SIGNATURES
      // ==========================
      else if (el.type === 'image' || el.type === 'signature') {
        const imgEl = el as (ImageElement | SignatureElement);
        if (imgEl.dataUrl) {
          try {
            const imageBytes = await getEmbeddableImageBytes(imgEl.dataUrl);
            let embeddedImage;
            try {
              embeddedImage = await pdfDoc.embedPng(imageBytes);
            } catch {
              try {
                embeddedImage = await pdfDoc.embedJpg(imageBytes);
              } catch (embedFallbackErr) {
                console.warn('[PdfExporter] embedJpg fallback also failed:', embedFallbackErr);
              }
            }

            if (embeddedImage) {
              const pdfY = pageHeight - imgEl.y - imgEl.height;
              page.drawImage(embeddedImage, {
                x: imgEl.x,
                y: pdfY,
                width: imgEl.width,
                height: imgEl.height,
                opacity: elOpacity,
              });
            }
          } catch (imgErr) {
            console.warn('[PdfExporter] Could not embed image onto PDF:', imgErr);
          }
        }
      }

      // ==========================
      // STAMPS
      // ==========================
      else if (el.type === 'stamp') {
        const stampEl = el as StampElement;
        const pdfY = pageHeight - stampEl.y - stampEl.height;
        const stampRgb = hexToPdfRgb(stampEl.color);

        // Draw badge box
        page.drawRectangle({
          x: stampEl.x,
          y: pdfY,
          width: stampEl.width,
          height: stampEl.height,
          borderWidth: 2.5,
          borderColor: stampRgb,
          color: rgb(1, 1, 1),
          opacity: elOpacity,
        });

        // Inner dashed or double frame
        if (stampEl.style === 'double' && stampEl.width > 12 && stampEl.height > 12) {
          page.drawRectangle({
            x: stampEl.x + 3,
            y: pdfY + 3,
            width: stampEl.width - 6,
            height: stampEl.height - 6,
            borderWidth: 1,
            borderColor: stampRgb,
            opacity: elOpacity * 0.8,
          });
        }

        // Draw Stamp Text
        const cleanStampText = sanitizeTextForPdf(stampEl.text);
        const fontSize = Math.max(12, Math.min(22, stampEl.height * 0.45));
        let textWidth = 0;
        try {
          textWidth = fontHelveticaBold.widthOfTextAtSize(cleanStampText, fontSize);
        } catch {
          textWidth = cleanStampText.length * (fontSize * 0.6);
        }
        const textX = stampEl.x + Math.max(4, (stampEl.width - textWidth) / 2);
        const textY = pdfY + (stampEl.height - fontSize) / 2 + 1;

        try {
          page.drawText(cleanStampText, {
            x: textX,
            y: textY,
            size: fontSize,
            font: fontHelveticaBold,
            color: stampRgb,
            opacity: elOpacity,
          });
        } catch (stampErr) {
          console.warn('[PdfExporter] Stamp drawText error:', stampErr);
        }
      }

      // ==========================
      // REDACTIONS (SOLID BLACKOUT)
      // ==========================
      else if (el.type === 'redact') {
        const redactEl = el as RedactElement;
        const pdfY = pageHeight - redactEl.y - redactEl.height;
        page.drawRectangle({
          x: redactEl.x,
          y: pdfY,
          width: redactEl.width,
          height: redactEl.height,
          color: hexToPdfRgb(redactEl.fillColor || '#000000'),
          opacity: 1.0, // Redaction must be 100% opaque
        });
      }

      // ==========================
      // COMMENTS / NOTES
      // ==========================
      else if (el.type === 'comment') {
        const commentEl = el as CommentElement;
        const pdfY = pageHeight - commentEl.y - commentEl.height;
        const noteColor = hexToPdfRgb(commentEl.color || '#f59e0b');

        // Draw note icon box
        page.drawRectangle({
          x: commentEl.x,
          y: pdfY,
          width: commentEl.width,
          height: commentEl.height,
          borderWidth: 1,
          borderColor: rgb(0.8, 0.6, 0.1),
          color: noteColor,
          opacity: elOpacity,
        });

        // Small note label
        if (commentEl.commentText) {
          const cleanSnippet = sanitizeTextForPdf(commentEl.commentText.slice(0, 15));
          try {
            page.drawText(cleanSnippet, {
              x: commentEl.x + 4,
              y: pdfY + 5,
              size: 8,
              font: fontRobotoHelvetica,
              color: rgb(0.1, 0.1, 0.1),
            });
          } catch (commErr) {
            console.warn('[PdfExporter] Comment drawText error:', commErr);
          }
        }
      }
    }

    return await pdfDoc.save();
  }

  /**
   * Helper to trigger real file download in the browser
   */
  public static downloadBlob(pdfBytes: Uint8Array, fileName: string = 'document_edited.pdf') {
    const blob = new Blob([pdfBytes], { type: 'application/pdf' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = fileName.endsWith('.pdf') ? fileName : `${fileName}.pdf`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    setTimeout(() => URL.revokeObjectURL(url), 5000);
  }
}
