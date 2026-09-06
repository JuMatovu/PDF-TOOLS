import * as pdfjsLib from 'pdfjs-dist';
import { PDFDocument } from 'pdf-lib';
import { PdfDocumentInfo, PdfPageDimensions, ExtractedPdfWord } from '../types/editorTypes';

// Configure pdfjs worker source safely
if (typeof window !== 'undefined') {
  try {
    if (!pdfjsLib.GlobalWorkerOptions.workerSrc) {
      // Use version-matched worker from CDN or local bundle
      pdfjsLib.GlobalWorkerOptions.workerSrc = `https://unpkg.com/pdfjs-dist@${pdfjsLib.version || '6.3.289'}/build/pdf.worker.min.mjs`;
    }
  } catch (err) {
    console.warn('[pdfRendererService] Worker setup warning:', err);
  }
}

export class PdfRendererService {
  private static instance: PdfRendererService;
  private currentPdf: any = null;
  private currentArrayBuffer: ArrayBuffer | null = null;
  private thumbnailCache: Map<string, string> = new Map();
  private pageDimensionsCache: Map<number, PdfPageDimensions> = new Map();
  private pageTextCache: Map<number, ExtractedPdfWord[]> = new Map();

  public static getInstance(): PdfRendererService {
    if (!PdfRendererService.instance) {
      PdfRendererService.instance = new PdfRendererService();
    }
    return PdfRendererService.instance;
  }

  /**
   * Load a PDF file into PDF.js and extract initial document metadata
   */
  public async loadDocument(
    fileOrBuffer: File | ArrayBuffer,
    fileName = 'document.pdf'
  ): Promise<{ info: PdfDocumentInfo; pdfDoc: any }> {
    this.thumbnailCache.clear();
    this.pageDimensionsCache.clear();
    this.pageTextCache.clear();

    let rawBuffer: ArrayBuffer;
    if (fileOrBuffer instanceof File) {
      rawBuffer = await fileOrBuffer.arrayBuffer();
    } else if (fileOrBuffer instanceof ArrayBuffer) {
      rawBuffer = fileOrBuffer.slice(0);
    } else {
      const view = fileOrBuffer as any;
      if (view && view.buffer) {
        rawBuffer = view.buffer.slice(view.byteOffset || 0, (view.byteOffset || 0) + (view.byteLength || view.buffer.byteLength));
      } else {
        throw new Error('Invalid PDF data format provided.');
      }
    }

    // Retain an un-detached, permanent clone in memory for export and page operations
    this.currentArrayBuffer = rawBuffer.slice(0);

    try {
      // PDF.js worker transfers the ArrayBuffer provided in `data` to its web worker thread.
      // We pass a separate clone so our stored `this.currentArrayBuffer` remains 100% intact!
      const workerCopy = new Uint8Array(rawBuffer.slice(0));

      const loadingTask = pdfjsLib.getDocument({
        data: workerCopy,
        cMapUrl: `https://unpkg.com/pdfjs-dist@${pdfjsLib.version || '6.3.289'}/cmaps/`,
        cMapPacked: true,
        standardFontDataUrl: `https://unpkg.com/pdfjs-dist@${pdfjsLib.version || '6.3.289'}/standard_fonts/`,
      });

      const pdf = await loadingTask.promise;
      this.currentPdf = pdf;

      let metadata: any = {};
      try {
        const meta = await pdf.getMetadata();
        metadata = meta?.info || {};
      } catch {
        // metadata read optional
      }

      const info: PdfDocumentInfo = {
        id: crypto.randomUUID ? crypto.randomUUID() : `doc_${Date.now()}`,
        name: metadata.Title || (fileOrBuffer instanceof File ? fileOrBuffer.name : fileName),
        size: this.currentArrayBuffer.byteLength,
        type: 'application/pdf',
        pageCount: pdf.numPages,
        lastModified: fileOrBuffer instanceof File ? fileOrBuffer.lastModified : Date.now(),
        loadedAt: Date.now(),
      };

      // Pre-read dimensions of the first page
      await this.getPageDimensions(1);

      return { info, pdfDoc: pdf };
    } catch (err: any) {
      console.error('[pdfRendererService] Failed to load PDF:', err);
      if (err?.name === 'PasswordException') {
        throw new Error('This PDF is password protected. Please provide an unlocked PDF.');
      }
      throw new Error(err?.message || 'Failed to parse PDF document. The file might be corrupted.');
    }
  }

  /**
   * Get dimensions of a specific page
   */
  public async getPageDimensions(pageNumber: number): Promise<PdfPageDimensions> {
    if (this.pageDimensionsCache.has(pageNumber)) {
      return this.pageDimensionsCache.get(pageNumber)!;
    }

    if (!this.currentPdf) {
      throw new Error('No PDF document loaded');
    }

    const safePageNum = Math.max(1, Math.min(this.currentPdf.numPages, pageNumber));
    const page = await this.currentPdf.getPage(safePageNum);
    const viewport = page.getViewport({ scale: 1.0 });

    const dims: PdfPageDimensions = {
      pageNumber: safePageNum,
      width: viewport.width,
      height: viewport.height,
      rotation: viewport.rotation || 0,
      aspectRatio: viewport.width / (viewport.height || 1),
    };

    this.pageDimensionsCache.set(pageNumber, dims);
    return dims;
  }

  /**
   * Render a page directly onto an HTML canvas with crisp high-DPI scaling
   */
  public async renderPageToCanvas(
    canvas: HTMLCanvasElement,
    pageNumber: number,
    zoomScale = 1.0
  ): Promise<{ width: number; height: number; viewportWidth: number; viewportHeight: number }> {
    if (!this.currentPdf) {
      throw new Error('No PDF loaded');
    }

    const safePageNum = Math.max(1, Math.min(this.currentPdf.numPages, pageNumber));
    const page = await this.currentPdf.getPage(safePageNum);

    // Get unscaled viewport
    const baseViewport = page.getViewport({ scale: 1.0 });

    // Calculate actual pixel scaling for High-DPI screens (Retina)
    const dpr = typeof window !== 'undefined' ? Math.min(window.devicePixelRatio || 1, 2.5) : 1;
    const renderScale = zoomScale * dpr;
    const viewport = page.getViewport({ scale: renderScale });

    // CSS display size (points)
    const displayWidth = Math.round(baseViewport.width * zoomScale);
    const displayHeight = Math.round(baseViewport.height * zoomScale);

    // Hardware canvas buffer size (multiplied by DPR for sharpness)
    canvas.width = Math.floor(viewport.width);
    canvas.height = Math.floor(viewport.height);
    canvas.style.width = `${displayWidth}px`;
    canvas.style.height = `${displayHeight}px`;

    const ctx = canvas.getContext('2d', { alpha: false });
    if (!ctx) {
      throw new Error('Failed to acquire canvas 2D context');
    }

    // Fill white backdrop before rendering page
    ctx.fillStyle = '#ffffff';
    ctx.fillRect(0, 0, canvas.width, canvas.height);

    const renderTask = page.render({
      canvasContext: ctx,
      viewport,
    });

    await renderTask.promise;

    return {
      width: displayWidth,
      height: displayHeight,
      viewportWidth: baseViewport.width,
      viewportHeight: baseViewport.height,
    };
  }

  /**
   * Render a low-overhead thumbnail for the page panel (cached)
   */
  public async renderThumbnail(pageNumber: number, targetWidth = 180): Promise<string> {
    const cacheKey = `thumb_${pageNumber}_${targetWidth}`;
    if (this.thumbnailCache.has(cacheKey)) {
      return this.thumbnailCache.get(cacheKey)!;
    }

    if (!this.currentPdf) {
      return this.generatePlaceholderThumbnail(pageNumber, targetWidth);
    }

    try {
      const page = await this.currentPdf.getPage(pageNumber);
      const baseViewport = page.getViewport({ scale: 1.0 });
      const scale = targetWidth / baseViewport.width;
      const viewport = page.getViewport({ scale });

      const canvas = document.createElement('canvas');
      canvas.width = Math.floor(viewport.width);
      canvas.height = Math.floor(viewport.height);
      const ctx = canvas.getContext('2d', { alpha: false });

      if (!ctx) throw new Error('Cannot get context');

      ctx.fillStyle = '#ffffff';
      ctx.fillRect(0, 0, canvas.width, canvas.height);

      await page.render({
        canvasContext: ctx,
        viewport,
      }).promise;

      const dataUrl = canvas.toDataURL('image/jpeg', 0.85);
      this.thumbnailCache.set(cacheKey, dataUrl);
      return dataUrl;
    } catch (err) {
      console.warn(`[pdfRendererService] Failed thumbnail render for page ${pageNumber}:`, err);
      const fallback = this.generatePlaceholderThumbnail(pageNumber, targetWidth);
      this.thumbnailCache.set(cacheKey, fallback);
      return fallback;
    }
  }

  /**
   * Fallback geometric placeholder thumbnail when rendering is pending or unavailable
   */
  public generatePlaceholderThumbnail(pageNumber: number, width = 180): string {
    if (typeof document === 'undefined') return '';
    const height = Math.round(width * 1.414); // Standard A4 aspect ratio

    const canvas = document.createElement('canvas');
    canvas.width = width;
    canvas.height = height;
    const ctx = canvas.getContext('2d');
    if (!ctx) return '';

    ctx.fillStyle = '#ffffff';
    ctx.fillRect(0, 0, width, height);

    ctx.strokeStyle = '#e2e8f0';
    ctx.lineWidth = 1.5;
    ctx.strokeRect(1, 1, width - 2, height - 2);

    // Decorative simulated text lines
    ctx.fillStyle = '#f1f5f9';
    ctx.fillRect(16, 20, width * 0.6, 10);
    ctx.fillRect(16, 38, width * 0.8, 6);
    ctx.fillRect(16, 50, width * 0.75, 6);
    ctx.fillRect(16, 62, width * 0.7, 6);

    ctx.fillStyle = '#94a3b8';
    ctx.font = 'bold 12px system-ui, sans-serif';
    ctx.textAlign = 'center';
    ctx.fillText(`Page ${pageNumber}`, width / 2, height - 16);

    return canvas.toDataURL('image/jpeg', 0.8);
  }

  /**
   * Generates a sample clean PDF document in memory using pdf-lib
   * so users can immediately test the editor without having to look for a PDF file
   */
  public async createSampleDocument(): Promise<{ buffer: ArrayBuffer; name: string }> {
    const pdfDoc = await PDFDocument.create();

    // Page 1: Welcome & Cover
    const page1 = pdfDoc.addPage([595.28, 841.89]); // A4
    page1.drawText('PDFTOOL PDF EDITOR', {
      x: 50,
      y: 750,
      size: 26,
    });
    page1.drawText('Flagship Browser-Based PDF Document Editor', {
      x: 50,
      y: 720,
      size: 14,
    });
    page1.drawText('This sample document is loaded directly on your device.', {
      x: 50,
      y: 670,
      size: 12,
    });
    page1.drawText('Features in Milestone 1:', {
      x: 50,
      y: 630,
      size: 13,
    });
    page1.drawText('- High-fidelity canvas rendering with PDF.js', {
      x: 65,
      y: 605,
      size: 11,
    });
    page1.drawText('- Multi-page navigation and thumbnail panel', {
      x: 65,
      y: 585,
      size: 11,
    });
    page1.drawText('- Precision zoom (25% to 300%) with Fit Width and Fit Page', {
      x: 65,
      y: 565,
      size: 11,
    });
    page1.drawText('- Clean desktop editor layout with brand green and yellow accents', {
      x: 65,
      y: 545,
      size: 11,
    });
    page1.drawText('- Completely local: Your document stays on your device.', {
      x: 65,
      y: 525,
      size: 11,
    });

    // Page 2: Analytical sample sheet
    const page2 = pdfDoc.addPage([595.28, 841.89]);
    page2.drawText('Page 2: Document Layout & Content', {
      x: 50,
      y: 750,
      size: 20,
    });
    page2.drawText('You can switch between pages using the left thumbnail panel', {
      x: 50,
      y: 710,
      size: 12,
    });
    page2.drawText('or the bottom page navigation bar and arrow keys.', {
      x: 50,
      y: 690,
      size: 12,
    });

    // Page 3: Summary
    const page3 = pdfDoc.addPage([595.28, 841.89]);
    page3.drawText('Page 3: Document Summary', {
      x: 50,
      y: 750,
      size: 20,
    });
    page3.drawText('PDFTOOL Editor Architecture - Milestone 1 Initialized.', {
      x: 50,
      y: 710,
      size: 12,
    });

    const pdfBytes = await pdfDoc.save();
    const cleanBuffer = pdfBytes.buffer.slice(
      pdfBytes.byteOffset,
      pdfBytes.byteOffset + pdfBytes.byteLength
    );
    this.currentArrayBuffer = cleanBuffer.slice(0);
    return {
      buffer: cleanBuffer,
      name: 'pdftool-welcome-sample.pdf',
    };
  }

  public getRawBuffer(): ArrayBuffer | null {
    if (!this.currentArrayBuffer || this.currentArrayBuffer.byteLength === 0) {
      return null;
    }
    return this.currentArrayBuffer.slice(0);
  }

  public async addBlankPage(insertIndex: number): Promise<ArrayBuffer> {
    if (!this.currentArrayBuffer || this.currentArrayBuffer.byteLength === 0) throw new Error('No PDF loaded');
    const pdfDoc = await PDFDocument.load(this.currentArrayBuffer.slice(0), { ignoreEncryption: true });
    pdfDoc.insertPage(insertIndex, [595.28, 841.89]);
    const newBytes = await pdfDoc.save();
    const cleanBuffer = newBytes.buffer.slice(
      newBytes.byteOffset,
      newBytes.byteOffset + newBytes.byteLength
    );
    this.currentArrayBuffer = cleanBuffer.slice(0);
    return cleanBuffer;
  }

  public async duplicatePage(pageIndex: number): Promise<ArrayBuffer> {
    if (!this.currentArrayBuffer || this.currentArrayBuffer.byteLength === 0) throw new Error('No PDF loaded');
    const pdfDoc = await PDFDocument.load(this.currentArrayBuffer.slice(0), { ignoreEncryption: true });
    const [copiedPage] = await pdfDoc.copyPages(pdfDoc, [pageIndex]);
    pdfDoc.insertPage(pageIndex + 1, copiedPage);
    const newBytes = await pdfDoc.save();
    const cleanBuffer = newBytes.buffer.slice(
      newBytes.byteOffset,
      newBytes.byteOffset + newBytes.byteLength
    );
    this.currentArrayBuffer = cleanBuffer.slice(0);
    return cleanBuffer;
  }

  public async deletePage(pageIndex: number): Promise<ArrayBuffer> {
    if (!this.currentArrayBuffer || this.currentArrayBuffer.byteLength === 0) throw new Error('No PDF loaded');
    const pdfDoc = await PDFDocument.load(this.currentArrayBuffer.slice(0), { ignoreEncryption: true });
    if (pdfDoc.getPageCount() <= 1) throw new Error('Cannot delete the only page');
    pdfDoc.removePage(pageIndex);
    const newBytes = await pdfDoc.save();
    const cleanBuffer = newBytes.buffer.slice(
      newBytes.byteOffset,
      newBytes.byteOffset + newBytes.byteLength
    );
    this.currentArrayBuffer = cleanBuffer.slice(0);
    return cleanBuffer;
  }

  /**
   * Extract text items (words/phrases) from a specific page for interactive in-place editing
   */
  public async getPageTextItems(pageNumber: number): Promise<ExtractedPdfWord[]> {
    if (this.pageTextCache.has(pageNumber)) {
      return this.pageTextCache.get(pageNumber)!;
    }

    if (!this.currentPdf) return [];

    try {
      const safePageNum = Math.max(1, Math.min(this.currentPdf.numPages, pageNumber));
      const page = await this.currentPdf.getPage(safePageNum);
      const viewport = page.getViewport({ scale: 1.0 });
      const textContent = await page.getTextContent();
      const pageHeight = viewport.height;

      const words: ExtractedPdfWord[] = [];
      const rawItems = (textContent.items || []) as any[];

      for (let i = 0; i < rawItems.length; i++) {
        const item = rawItems[i];
        if (!item || typeof item.str !== 'string') continue;
        const text = item.str.trim();
        if (!text) continue;

        const transform = item.transform; // [scaleX, skewY, skewX, scaleY, transX, transY]
        if (!transform || transform.length < 6) continue;

        const transX = transform[4];
        const transY = transform[5];
        const fontSize = Math.max(8, Math.round(Math.hypot(transform[0], transform[1]) || item.height || 12));
        const itemHeight = Math.max(10, Math.round(item.height || fontSize * 1.15));
        const itemWidth = Math.max(12, Math.round(item.width || (item.str.length * fontSize * 0.55)));

        // Position in viewport coordinate space (top-left origin in points)
        let vx = transX;
        let vy = pageHeight - transY - fontSize;

        if (typeof viewport.convertToViewportPoint === 'function') {
          try {
            const pt = viewport.convertToViewportPoint(transX, transY);
            vx = pt[0];
            vy = pt[1] - fontSize;
          } catch {
            // fallback
          }
        }

        const fontName = (item.fontName || '').toLowerCase();
        const styleFamily = (textContent.styles && textContent.styles[item.fontName]?.fontFamily || '').toLowerCase();

        const isBold =
          fontName.includes('bold') ||
          styleFamily.includes('bold') ||
          fontName.includes('black') ||
          fontName.includes('heavy');
        const isItalic =
          fontName.includes('italic') ||
          fontName.includes('oblique') ||
          styleFamily.includes('italic');

        let fontFamily = 'Helvetica';
        if (
          fontName.includes('times') ||
          styleFamily.includes('times') ||
          fontName.includes('serif') ||
          styleFamily.includes('serif')
        ) {
          fontFamily = 'Times New Roman';
        } else if (fontName.includes('courier') || styleFamily.includes('mono') || fontName.includes('code')) {
          fontFamily = 'Courier';
        } else if (fontName.includes('roboto')) {
          fontFamily = 'Roboto';
        }

        words.push({
          id: `word_p${safePageNum}_${i}_${Math.round(vx)}_${Math.round(vy)}`,
          text: item.str,
          x: Math.max(0, Math.round(vx)),
          y: Math.max(0, Math.round(vy)),
          width: itemWidth,
          height: itemHeight,
          fontSize,
          fontFamily,
          isBold,
          isItalic,
          color: '#0f172a',
        });
      }

      this.pageTextCache.set(pageNumber, words);
      return words;
    } catch (err) {
      console.warn(`[pdfRendererService] Failed extracting text items for page ${pageNumber}:`, err);
      return [];
    }
  }
}
