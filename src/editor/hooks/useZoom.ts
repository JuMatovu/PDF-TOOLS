import { useState, useCallback } from 'react';
import { FitMode } from '../types/editorTypes';

export const ZOOM_PRESETS = [25, 50, 75, 100, 125, 150, 200, 300];
export const MIN_ZOOM = 25;
export const MAX_ZOOM = 300;
export const DEFAULT_ZOOM = 100;

export interface UseZoomReturn {
  zoom: number;
  fitMode: FitMode;
  setZoom: (zoom: number) => void;
  zoomIn: () => void;
  zoomOut: () => void;
  resetZoom: () => void;
  fitWidth: (containerWidth: number, pageWidth: number) => void;
  fitPage: (containerWidth: number, containerHeight: number, pageWidth: number, pageHeight: number) => void;
}

export function useZoom(initialZoom = DEFAULT_ZOOM): UseZoomReturn {
  const [zoom, setZoomState] = useState<number>(initialZoom);
  const [fitMode, setFitMode] = useState<FitMode>('custom');

  const setZoom = useCallback((newZoom: number) => {
    const clamped = Math.max(MIN_ZOOM, Math.min(MAX_ZOOM, Math.round(newZoom)));
    setZoomState(clamped);
    setFitMode('custom');
  }, []);

  const zoomIn = useCallback(() => {
    setZoomState((prev) => {
      // Find the next higher preset
      const next = ZOOM_PRESETS.find((p) => p > prev);
      return next ? Math.min(MAX_ZOOM, next) : Math.min(MAX_ZOOM, prev + 25);
    });
    setFitMode('custom');
  }, []);

  const zoomOut = useCallback(() => {
    setZoomState((prev) => {
      // Find the next lower preset
      const reversed = [...ZOOM_PRESETS].reverse();
      const prevPreset = reversed.find((p) => p < prev);
      return prevPreset ? Math.max(MIN_ZOOM, prevPreset) : Math.max(MIN_ZOOM, prev - 25);
    });
    setFitMode('custom');
  }, []);

  const resetZoom = useCallback(() => {
    setZoomState(100);
    setFitMode('custom');
  }, []);

  const fitWidth = useCallback((containerWidth: number, pageWidth: number) => {
    if (!containerWidth || !pageWidth) return;
    // Leave 48px padding (24px each side)
    const availableWidth = Math.max(200, containerWidth - 64);
    const calculatedScale = (availableWidth / pageWidth) * 100;
    const clamped = Math.max(MIN_ZOOM, Math.min(MAX_ZOOM, Math.round(calculatedScale)));
    setZoomState(clamped);
    setFitMode('fit-width');
  }, []);

  const fitPage = useCallback(
    (containerWidth: number, containerHeight: number, pageWidth: number, pageHeight: number) => {
      if (!containerWidth || !containerHeight || !pageWidth || !pageHeight) return;
      // Leave 64px width padding, 80px height padding
      const availableWidth = Math.max(200, containerWidth - 64);
      const availableHeight = Math.max(200, containerHeight - 80);

      const scaleX = (availableWidth / pageWidth) * 100;
      const scaleY = (availableHeight / pageHeight) * 100;
      const calculatedScale = Math.min(scaleX, scaleY);

      const clamped = Math.max(MIN_ZOOM, Math.min(MAX_ZOOM, Math.round(calculatedScale)));
      setZoomState(clamped);
      setFitMode('fit-page');
    },
    []
  );

  return {
    zoom,
    fitMode,
    setZoom,
    zoomIn,
    zoomOut,
    resetZoom,
    fitWidth,
    fitPage,
  };
}
