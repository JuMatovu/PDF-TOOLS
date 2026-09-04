import * as pdfjsLib from 'pdfjs-dist';
import { PDFDocument } from 'pdf-lib';

// Configure worker source safely for browser environments
if (typeof window !== 'undefined') {
  try {
    if (!pdfjsLib.GlobalWorkerOptions.workerSrc) {
      // Use unpkg CDN matching the installed version or cdnjs
      pdfjsLib.GlobalWorkerOptions.workerSrc = `https://unpkg.com/pdfjs-dist@${pdfjsLib.version || '4.10.38'}/build/pdf.worker.min.mjs`;
    }
  } catch (err) {
    console.warn('[pdfRenderer] Could not set pdfjs workerSrc:', err);
  }
}

export interface RenderedPdfPage {
  pageNumber: number; // 1-indexed
  dataUrl: string;
  width: number;
  height: number;
}

export interface PdfRenderResult {
  pageCount: number;
  pages: RenderedPdfPage[];
}

/**
 * Creates a clean canvas placeholder card for a page when canvas rasterization is unavailable
 */
function createPlaceholderPageThumbnail(pageNumber: number, width = 200, height = 280): string {
  if (typeof document === 'undefined') return '';
  const canvas = document.createElement('canvas');
  canvas.width = width;
  canvas.height = height;
  const ctx = canvas.getContext('2d');
  if (!ctx) return '';

  // Background
  ctx.fillStyle = '#ffffff';
  ctx.fillRect(0, 0, width, height);

  // Border outline
  ctx.strokeStyle = '#e2e8f0';
  ctx.lineWidth = 2;
  ctx.strokeRect(1, 1, width - 2, height - 2);

  // Top header bar
  ctx.fillStyle = '#f8fafc';
  ctx.fillRect(2, 2, width - 4, 32);

  // Document lines simulation
  ctx.fillStyle = '#e2e8f0';
  for (let y = 50; y < height - 40; y += 18) {
    const lineWidth = y % 36 === 0 ? width - 60 : width - 40;
    ctx.fillRect(20, y, lineWidth, 8);
  }

  // Page number tag at bottom
  ctx.fillStyle = '#64748b';
  ctx.font = 'bold 13px system-ui, -apple-system, sans-serif';
  ctx.textAlign = 'center';
  ctx.fillText(`Page ${pageNumber}`, width / 2, height - 16);

  return canvas.toDataURL('image/jpeg', 0.85);
}

/**
 * Loads a PDF file and renders thumbnail previews for every page
 */
export async function renderPdfPages(
  file: File,
  onProgress?: (current: number, total: number) => void
): Promise<PdfRenderResult> {
  const arrayBuffer = await file.arrayBuffer();

  // 1. First get accurate page count via pdf-lib (fast, synchronous-like, reliable)
  let totalPages = 1;
  try {
    const pdfDoc = await PDFDocument.load(arrayBuffer, { ignoreEncryption: true });
    totalPages = pdfDoc.getPageCount();
  } catch (e) {
    console.warn('[pdfRenderer] pdf-lib could not read page count, will defer to pdfjs:', e);
  }

  // 2. Attempt rendering high-fidelity canvas previews with pdfjs-dist
  try {
    const loadingTask = pdfjsLib.getDocument({
      data: new Uint8Array(arrayBuffer),
      cMapUrl: `https://unpkg.com/pdfjs-dist@${pdfjsLib.version || '4.10.38'}/cmaps/`,
      cMapPacked: true,
      standardFontDataUrl: `https://unpkg.com/pdfjs-dist@${pdfjsLib.version || '4.10.38'}/standard_fonts/`,
    });

    const pdf = await loadingTask.promise;
    totalPages = pdf.numPages || totalPages;

    const renderedPages: RenderedPdfPage[] = [];

    for (let p = 1; p <= totalPages; p++) {
      try {
        const page = await pdf.getPage(p);
        const originalViewport = page.getViewport({ scale: 1.0 });

        // Calculate scale to target ~220px width thumbnail
        const targetWidth = 220;
        const scale = Math.min(1.0, Math.max(0.2, targetWidth / originalViewport.width));
        const viewport = page.getViewport({ scale });

        const canvas = document.createElement('canvas');
        canvas.width = Math.floor(viewport.width);
        canvas.height = Math.floor(viewport.height);
        const ctx = canvas.getContext('2d', { alpha: false });

        if (ctx) {
          ctx.fillStyle = '#ffffff';
          ctx.fillRect(0, 0, canvas.width, canvas.height);

          await page.render({
            canvasContext: ctx,
            canvas,
            viewport,
          } as any).promise;

          renderedPages.push({
            pageNumber: p,
            dataUrl: canvas.toDataURL('image/jpeg', 0.85),
            width: canvas.width,
            height: canvas.height,
          });
        } else {
          renderedPages.push({
            pageNumber: p,
            dataUrl: createPlaceholderPageThumbnail(p),
            width: 200,
            height: 280,
          });
        }
      } catch (pageErr) {
        console.warn(`[pdfRenderer] Failed rendering page ${p}, using fallback thumbnail:`, pageErr);
        renderedPages.push({
          pageNumber: p,
          dataUrl: createPlaceholderPageThumbnail(p),
          width: 200,
          height: 280,
        });
      }

      onProgress?.(p, totalPages);
    }

    return {
      pageCount: totalPages,
      pages: renderedPages,
    };
  } catch (pdfjsErr) {
    console.warn('[pdfRenderer] pdfjs could not render PDF pages, falling back to placeholder thumbnails:', pdfjsErr);

    // Fallback: Generate thumbnails for all pages using canvas generator
    const fallbackPages: RenderedPdfPage[] = [];
    for (let p = 1; p <= totalPages; p++) {
      fallbackPages.push({
        pageNumber: p,
        dataUrl: createPlaceholderPageThumbnail(p),
        width: 200,
        height: 280,
      });
      onProgress?.(p, totalPages);
    }

    return {
      pageCount: totalPages,
      pages: fallbackPages,
    };
  }
}
