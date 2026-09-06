import React, { useRef, useState, useEffect } from 'react';
import { Point, DrawElement } from '../types/editorTypes';

interface DrawingLayerProps {
  currentPage: number;
  zoom: number;
  pageWidth: number;
  pageHeight: number;
  isActive: boolean;
  isHighlighter: boolean;
  strokeColor: string;
  strokeWidth: number;
  onFinishStroke: (element: DrawElement) => void;
}

export const DrawingLayer: React.FC<DrawingLayerProps> = ({
  currentPage,
  zoom,
  pageWidth,
  pageHeight,
  isActive,
  isHighlighter,
  strokeColor,
  strokeWidth,
  onFinishStroke,
}) => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [isDrawing, setIsDrawing] = useState<boolean>(false);
  const currentPoints = useRef<Point[]>([]);

  const zoomScale = zoom / 100;
  const canvasW = pageWidth * zoomScale;
  const canvasH = pageHeight * zoomScale;

  // Clear live overlay canvas on unmount or page change
  useEffect(() => {
    const canvas = canvasRef.current;
    if (canvas) {
      const ctx = canvas.getContext('2d');
      ctx?.clearRect(0, 0, canvas.width, canvas.height);
    }
  }, [currentPage, zoom]);

  if (!isActive) return null;

  const startDrawing = (e: React.MouseEvent<HTMLCanvasElement>) => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const rect = canvas.getBoundingClientRect();
    const clientX = e.clientX - rect.left;
    const clientY = e.clientY - rect.top;

    const pdfPoint: Point = {
      x: clientX / zoomScale,
      y: clientY / zoomScale,
    };

    currentPoints.current = [pdfPoint];
    setIsDrawing(true);

    ctx.beginPath();
    ctx.moveTo(clientX, clientY);
    ctx.lineCap = 'round';
    ctx.lineJoin = 'round';
    ctx.strokeStyle = strokeColor;
    ctx.lineWidth = (isHighlighter ? Math.max(16, strokeWidth * 3) : strokeWidth) * zoomScale;
    ctx.globalAlpha = isHighlighter ? 0.4 : 1.0;
  };

  const draw = (e: React.MouseEvent<HTMLCanvasElement>) => {
    if (!isDrawing) return;
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const rect = canvas.getBoundingClientRect();
    const clientX = e.clientX - rect.left;
    const clientY = e.clientY - rect.top;

    const pdfPoint: Point = {
      x: clientX / zoomScale,
      y: clientY / zoomScale,
    };

    currentPoints.current.push(pdfPoint);
    ctx.lineTo(clientX, clientY);
    ctx.stroke();
  };

  const stopDrawing = () => {
    if (!isDrawing) return;
    setIsDrawing(false);

    const canvas = canvasRef.current;
    if (canvas) {
      const ctx = canvas.getContext('2d');
      ctx?.clearRect(0, 0, canvas.width, canvas.height);
    }

    if (currentPoints.current.length > 1) {
      const points = [...currentPoints.current];

      // Calculate bounding box
      let minX = points[0].x;
      let minY = points[0].y;
      let maxX = points[0].x;
      let maxY = points[0].y;

      for (const p of points) {
        if (p.x < minX) minX = p.x;
        if (p.x > maxX) maxX = p.x;
        if (p.y < minY) minY = p.y;
        if (p.y > maxY) maxY = p.y;
      }

      const newDrawEl: DrawElement = {
        id: crypto.randomUUID ? crypto.randomUUID() : `draw_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`,
        type: 'draw',
        pageNumber: currentPage,
        x: minX,
        y: minY,
        width: Math.max(10, maxX - minX),
        height: Math.max(10, maxY - minY),
        points,
        strokeColor,
        strokeWidth: isHighlighter ? 16 : strokeWidth,
        isHighlighter,
        opacity: isHighlighter ? 0.4 : 1.0,
      };

      onFinishStroke(newDrawEl);
    }

    currentPoints.current = [];
  };

  return (
    <canvas
      ref={canvasRef}
      width={canvasW}
      height={canvasH}
      onMouseDown={startDrawing}
      onMouseMove={draw}
      onMouseUp={stopDrawing}
      onMouseLeave={stopDrawing}
      className={`absolute inset-0 z-40 touch-none ${
        isHighlighter ? 'cursor-cell' : 'cursor-crosshair'
      }`}
      style={{
        width: `${canvasW}px`,
        height: `${canvasH}px`,
      }}
    />
  );
};
