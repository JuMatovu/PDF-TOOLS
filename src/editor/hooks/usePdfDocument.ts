import { useState, useCallback, useRef } from 'react';
import { PdfDocumentInfo, PdfPageDimensions } from '../types/editorTypes';
import { PdfRendererService } from '../services/pdfRendererService';

export interface UsePdfDocumentReturn {
  docInfo: PdfDocumentInfo | null;
  currentPage: number;
  pageCount: number;
  currentDimensions: PdfPageDimensions | null;
  isLoading: boolean;
  error: string | null;
  loadFromFile: (file: File) => Promise<void>;
  loadSampleDocument: () => Promise<void>;
  loadFromBuffer: (buffer: ArrayBuffer, name?: string) => Promise<void>;
  goToPage: (pageNumber: number) => void;
  nextPage: () => void;
  prevPage: () => void;
  renameDocument: (newName: string) => void;
  clearError: () => void;
  addBlankPage: (afterPage?: number) => Promise<void>;
  duplicateCurrentPage: (pageNum?: number) => Promise<void>;
  deleteCurrentPage: (pageNum?: number) => Promise<void>;
  getPdfBuffer: () => ArrayBuffer | null;
}

export function usePdfDocument(): UsePdfDocumentReturn {
  const [docInfo, setDocInfo] = useState<PdfDocumentInfo | null>(null);
  const [currentPage, setCurrentPage] = useState<number>(1);
  const [pageCount, setPageCount] = useState<number>(1);
  const [currentDimensions, setCurrentDimensions] = useState<PdfPageDimensions | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);

  const currentBufferRef = useRef<ArrayBuffer | null>(null);
  const renderer = PdfRendererService.getInstance();

  const getPdfBuffer = useCallback((): ArrayBuffer | null => {
    if (currentBufferRef.current && currentBufferRef.current.byteLength > 0) {
      return currentBufferRef.current.slice(0);
    }
    return renderer.getRawBuffer();
  }, [renderer]);

  const updatePageDimensions = useCallback(async (page: number) => {
    try {
      const dims = await renderer.getPageDimensions(page);
      setCurrentDimensions(dims);
    } catch (e) {
      console.warn('[usePdfDocument] Could not fetch page dimensions:', e);
    }
  }, [renderer]);

  const loadFromBuffer = useCallback(async (buffer: ArrayBuffer, name = 'document.pdf') => {
    setIsLoading(true);
    setError(null);
    try {
      currentBufferRef.current = buffer.slice(0);
      const { info } = await renderer.loadDocument(buffer, name);
      setDocInfo(info);
      setPageCount(info.pageCount);
      setCurrentPage(1);
      await updatePageDimensions(1);
    } catch (err: any) {
      console.error('[usePdfDocument] Failed loading buffer:', err);
      setError(err?.message || 'Failed to open PDF document.');
    } finally {
      setIsLoading(false);
    }
  }, [renderer, updatePageDimensions]);

  const loadFromFile = useCallback(async (file: File) => {
    setIsLoading(true);
    setError(null);
    try {
      const fileBuffer = await file.arrayBuffer();
      currentBufferRef.current = fileBuffer.slice(0);
      const { info } = await renderer.loadDocument(fileBuffer, file.name);
      setDocInfo(info);
      setPageCount(info.pageCount);
      setCurrentPage(1);
      await updatePageDimensions(1);
    } catch (err: any) {
      console.error('[usePdfDocument] Failed loading file:', err);
      setError(err?.message || 'Failed to open PDF document.');
    } finally {
      setIsLoading(false);
    }
  }, [renderer, updatePageDimensions]);

  const loadSampleDocument = useCallback(async () => {
    setIsLoading(true);
    setError(null);
    try {
      const sample = await renderer.createSampleDocument();
      currentBufferRef.current = sample.buffer.slice(0);
      const { info } = await renderer.loadDocument(sample.buffer, sample.name);
      setDocInfo(info);
      setPageCount(info.pageCount);
      setCurrentPage(1);
      await updatePageDimensions(1);
    } catch (err: any) {
      console.error('[usePdfDocument] Failed generating sample:', err);
      setError('Could not generate welcome sample document.');
    } finally {
      setIsLoading(false);
    }
  }, [renderer, updatePageDimensions]);

  const goToPage = useCallback((pageNumber: number) => {
    const valid = Math.max(1, Math.min(pageCount, pageNumber));
    setCurrentPage(valid);
    updatePageDimensions(valid);
  }, [pageCount, updatePageDimensions]);

  const nextPage = useCallback(() => {
    setCurrentPage((prev) => {
      const next = Math.min(pageCount, prev + 1);
      updatePageDimensions(next);
      return next;
    });
  }, [pageCount, updatePageDimensions]);

  const prevPage = useCallback(() => {
    setCurrentPage((prev) => {
      const prevP = Math.max(1, prev - 1);
      updatePageDimensions(prevP);
      return prevP;
    });
  }, [updatePageDimensions]);

  const renameDocument = useCallback((newName: string) => {
    const cleanName = newName.trim();
    if (!cleanName) return;
    setDocInfo((prev) => (prev ? { ...prev, name: cleanName.endsWith('.pdf') ? cleanName : `${cleanName}.pdf` } : null));
  }, []);

  const clearError = useCallback(() => setError(null), []);

  const addBlankPage = useCallback(async (afterPage?: number) => {
    const target = afterPage ?? currentPage;
    setIsLoading(true);
    try {
      const newBuf = await renderer.addBlankPage(target);
      currentBufferRef.current = newBuf.slice(0);
      const { info } = await renderer.loadDocument(newBuf, docInfo?.name || 'document.pdf');
      setDocInfo(info);
      setPageCount(info.pageCount);
      setCurrentPage(target + 1);
      await updatePageDimensions(target + 1);
    } catch (err: any) {
      console.error('[usePdfDocument] Failed adding page:', err);
      setError('Failed to add page.');
    } finally {
      setIsLoading(false);
    }
  }, [renderer, currentPage, docInfo?.name, updatePageDimensions]);

  const duplicateCurrentPage = useCallback(async (pageNum?: number) => {
    const target = (pageNum ?? currentPage) - 1; // 0-indexed for pdfDoc
    setIsLoading(true);
    try {
      const newBuf = await renderer.duplicatePage(target);
      currentBufferRef.current = newBuf.slice(0);
      const { info } = await renderer.loadDocument(newBuf, docInfo?.name || 'document.pdf');
      setDocInfo(info);
      setPageCount(info.pageCount);
      setCurrentPage(target + 2);
      await updatePageDimensions(target + 2);
    } catch (err: any) {
      console.error('[usePdfDocument] Failed duplicating page:', err);
      setError('Failed to duplicate page.');
    } finally {
      setIsLoading(false);
    }
  }, [renderer, currentPage, docInfo?.name, updatePageDimensions]);

  const deleteCurrentPage = useCallback(async (pageNum?: number) => {
    const target = (pageNum ?? currentPage) - 1;
    if (pageCount <= 1) {
      setError('Cannot delete the only page in the document.');
      return;
    }
    setIsLoading(true);
    try {
      const newBuf = await renderer.deletePage(target);
      currentBufferRef.current = newBuf.slice(0);
      const { info } = await renderer.loadDocument(newBuf, docInfo?.name || 'document.pdf');
      const newCurrent = Math.max(1, Math.min(info.pageCount, target + 1));
      setDocInfo(info);
      setPageCount(info.pageCount);
      setCurrentPage(newCurrent);
      await updatePageDimensions(newCurrent);
    } catch (err: any) {
      console.error('[usePdfDocument] Failed deleting page:', err);
      setError('Failed to delete page.');
    } finally {
      setIsLoading(false);
    }
  }, [renderer, currentPage, pageCount, docInfo?.name, updatePageDimensions]);

  return {
    docInfo,
    currentPage,
    pageCount,
    currentDimensions,
    isLoading,
    error,
    loadFromFile,
    loadSampleDocument,
    loadFromBuffer,
    goToPage,
    nextPage,
    prevPage,
    renameDocument,
    clearError,
    addBlankPage,
    duplicateCurrentPage,
    deleteCurrentPage,
    getPdfBuffer,
  };
}
