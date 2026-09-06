import React, { useState, useEffect, useRef } from 'react';
import { PDFTool, UploadedFileItem } from '../types';
import { useRouter } from '../hooks/useRouter';
import { FileUploader } from '../components/tools/FileUploader';
import { ProcessingPanel } from '../components/tools/ProcessingPanel';
import { ResultPanel } from '../components/tools/ResultPanel';
import { ErrorMessage } from '../components/common/ErrorMessage';
import { PrivacyNotice } from '../components/common/PrivacyNotice';
import { ToolIcon, formatFileSize } from '../lib/icons';
import { PDFDocument, rgb, StandardFonts } from 'pdf-lib';
import {
  ChevronRight,
  ShieldCheck,
  CheckCircle2,
  SlidersHorizontal,
  ArrowRight,
  Sparkles,
  AlertTriangle,
  FileText,
  RotateCw,
  Scissors,
  RefreshCw,
} from 'lucide-react';
import { TOOLS } from '../data/tools';
import { PdfPageVisualizer, formatPageNumbersToRange } from '../components/pdf/PdfPageVisualizer';

interface ToolPageProps {
  tool: PDFTool;
}

type ToolStage = 'upload' | 'processing' | 'completed' | 'error';

interface CompletedResult {
  jobId: string;
  fileName: string;
  fileSize: number;
  originalSize: number;
  downloadUrl: string;
  previewUrl?: string;
}

// Approved backend tools
const ACTIVE_BACKEND_TOOLS = [
  'jpg-to-pdf',
  'merge-pdf',
  'split-pdf',
  'rotate-pdf',
  'add-page-numbers',
  'add-watermark',
  'remove-pages',
  'extract-pages',
  'compress-pdf',
  'crop-pdf',
  'organize-pdf',
  'pdf-to-markdown',
  'ai-summarizer',
  'translate-pdf',
];

/**
 * Safe JSON response parser that prevents syntax errors on non-JSON/HTML responses
 */
async function parseJsonResponse(response: Response): Promise<any> {
  const contentType = response.headers.get('content-type') || '';
  if (contentType.includes('application/json')) {
    try {
      return await response.json();
    } catch {
      throw new Error('Failed to parse server response as JSON.');
    }
  }

  // Not JSON, inspect text to prevent raw HTML crashing UI
  const text = await response.text();
  if (text.includes('<!doctype') || text.includes('<html')) {
    throw new Error('The processing service is initializing. Please try your request again in a moment.');
  }

  throw new Error(text || `Server returned response status ${response.status}`);
}

export const ToolPage: React.FC<ToolPageProps> = ({ tool }) => {
  const { navigate } = useRouter();

  const [files, setFiles] = useState<UploadedFileItem[]>([]);
  const [stage, setStage] = useState<ToolStage>('upload');
  const [progress, setProgress] = useState(0);
  const [statusMessage, setStatusMessage] = useState('Processing your files...');
  const [errorMessage, setErrorMessage] = useState('');
  const [activeJobId, setActiveJobId] = useState<string | null>(null);
  const [result, setResult] = useState<CompletedResult | null>(null);
  const [isDeleted, setIsDeleted] = useState(false);

  const pollIntervalRef = useRef<NodeJS.Timeout | null>(null);
  const abortControllerRef = useRef<AbortController | null>(null);

  const isJpgToPdf = tool.id === 'jpg-to-pdf' || tool.slug === 'jpg-to-pdf';
  const isMergePdf = tool.id === 'merge-pdf' || tool.slug === 'merge-pdf';
  const isSplitPdf = tool.id === 'split-pdf' || tool.slug === 'split-pdf';
  const isRotatePdf = tool.id === 'rotate-pdf' || tool.slug === 'rotate-pdf';
  const isRemovePages = tool.id === 'remove-pages' || tool.slug === 'remove-pages';
  const isExtractPages = tool.id === 'extract-pages' || tool.slug === 'extract-pages';
  const isAddPageNumbers = tool.id === 'add-page-numbers' || tool.slug === 'add-page-numbers';
  const isAddWatermark = tool.id === 'add-watermark' || tool.slug === 'add-watermark';
  const isCompressPdf = tool.id === 'compress-pdf' || tool.slug === 'compress-pdf';
  const isCropPdf = tool.id === 'crop-pdf' || tool.slug === 'crop-pdf';
  const isOrganizePdf = tool.id === 'organize-pdf' || tool.slug === 'organize-pdf';
  const isPdfToMarkdown = tool.id === 'pdf-to-markdown' || tool.slug === 'pdf-to-markdown';
  const isAiSummarizer = tool.id === 'ai-summarizer' || tool.slug === 'ai-summarizer';
  const isTranslatePdf = tool.id === 'translate-pdf' || tool.slug === 'translate-pdf';

  const isVisualizerTool = isSplitPdf || isRotatePdf || isRemovePages || isExtractPages || isOrganizePdf;
  const visualizerMode: 'rotate' | 'split' | 'remove' | 'extract' | 'organize' = isRotatePdf
    ? 'rotate'
    : isRemovePages
    ? 'remove'
    : isExtractPages
    ? 'extract'
    : isOrganizePdf
    ? 'organize'
    : 'split';

  const isBackendReady = ACTIVE_BACKEND_TOOLS.includes(tool.slug || tool.id);

  const [optionsState, setOptionsState] = useState<Record<string, any>>(() => {
    const initial: Record<string, any> = {};
    tool.options?.forEach((opt) => {
      initial[opt.id] = opt.defaultValue;
    });
    return initial;
  });

  // Interactive page manipulation states for Split, Rotate, Remove, and Extract
  const [pageRotations, setPageRotations] = useState<Record<number, number>>({});
  const [selectedPagesForSplit, setSelectedPagesForSplit] = useState<number[]>([]);
  const [pageRangeInput, setPageRangeInput] = useState<string>('1');
  const [organizePageOrder, setOrganizePageOrder] = useState<number[]>([]);

  // Reset state when switching tools
  useEffect(() => {
    stopPolling();
    setFiles([]);
    setStage('upload');
    setProgress(0);
    setErrorMessage('');
    setActiveJobId(null);
    setResult(null);
    setIsDeleted(false);
    setPageRotations({});
    setSelectedPagesForSplit([]);
    setPageRangeInput('1');
    setOrganizePageOrder([]);

    const initial: Record<string, any> = {};
    tool.options?.forEach((opt) => {
      initial[opt.id] = opt.defaultValue;
    });
    setOptionsState(initial);

    return () => {
      stopPolling();
    };
  }, [tool.id]);

  const stopPolling = () => {
    if (pollIntervalRef.current) {
      clearInterval(pollIntervalRef.current);
      pollIntervalRef.current = null;
    }
  };

  const handleFilesAdded = (rawFiles: File[]) => {
    const validItems: UploadedFileItem[] = [];
    const maxBytes = (tool.maxFileSizeMB || 50) * 1024 * 1024;

    for (let i = 0; i < rawFiles.length; i++) {
      const f = rawFiles[i];
      if (f.size > maxBytes) {
        setErrorMessage(`File "${f.name}" exceeds the maximum allowed size of ${tool.maxFileSizeMB || 50}MB.`);
        setStage('error');
        return;
      }

      validItems.push({
        id: `${Date.now()}-${i}-${f.name}`,
        file: f,
        name: f.name,
        size: f.size,
        type: f.type,
        status: 'ready',
        progress: 0,
      });
    }

    setFiles((prev) => [...prev, ...validItems]);
  };

  const handleRemoveFile = (id: string) => {
    setFiles((prev) => prev.filter((f) => f.id !== id));
    setPageRotations({});
    setSelectedPagesForSplit([]);
    setPageRangeInput('1');
  };

  const handleClearFiles = () => {
    setFiles([]);
    setPageRotations({});
    setSelectedPagesForSplit([]);
    setPageRangeInput('1');
  };

  const handleRotatePage = (pageNum: number, deltaAngle: number) => {
    setPageRotations((prev) => {
      const current = prev[pageNum] || 0;
      const nextAngle = ((current + deltaAngle) % 360 + 360) % 360;
      return {
        ...prev,
        [pageNum]: nextAngle,
      };
    });
  };

  const handleRotateAll = (deltaAngle: number) => {
    setPageRotations((prev) => {
      const updated: Record<number, number> = { ...prev };
      for (const k of Object.keys(updated)) {
        const p = Number(k);
        updated[p] = ((updated[p] + deltaAngle) % 360 + 360) % 360;
      }
      return updated;
    });
  };

  const handleResetRotations = () => {
    setPageRotations({});
  };

  const handleTogglePageSelectionForSplit = (pageNum: number) => {
    setSelectedPagesForSplit((prev) => {
      const exists = prev.includes(pageNum);
      const updated = exists ? prev.filter((p) => p !== pageNum) : [...prev, pageNum].sort((a, b) => a - b);
      setPageRangeInput(formatPageNumbersToRange(updated));
      return updated;
    });
  };

  const handleSetSelectedPagesForSplit = (pages: number[]) => {
    setSelectedPagesForSplit(pages);
  };

  const handleMoveUp = (index: number) => {
    if (index <= 0) return;
    setFiles((prev) => {
      const updated = [...prev];
      const temp = updated[index];
      updated[index] = updated[index - 1];
      updated[index - 1] = temp;
      return updated;
    });
  };

  const handleMoveDown = (index: number) => {
    setFiles((prev) => {
      if (index >= prev.length - 1) return prev;
      const updated = [...prev];
      const temp = updated[index];
      updated[index] = updated[index + 1];
      updated[index + 1] = temp;
      return updated;
    });
  };

  /**
   * Real File Processing Pipeline
   */
  const handleStartProcessing = async () => {
    if (files.length === 0) return;

    if (!isBackendReady) {
      setErrorMessage(
        `The "${tool.name}" converter is scheduled for an upcoming release. Please try our active tools: JPG/PNG → PDF or Merge PDF.`
      );
      setStage('error');
      return;
    }

    if (isMergePdf && files.length < 2) {
      setErrorMessage('Please select at least 2 PDF documents to merge.');
      setStage('error');
      return;
    }

    if (isSplitPdf) {
      if (selectedPagesForSplit.length === 0 && !pageRangeInput.trim()) {
        setErrorMessage('Please pick or insert at least one page you wish to split off.');
        setStage('error');
        return;
      }
    }

    if (isRemovePages) {
      if (selectedPagesForSplit.length === 0 && !pageRangeInput.trim()) {
        setErrorMessage('Please pick or insert at least one page you wish to remove.');
        setStage('error');
        return;
      }
    }

    if (isExtractPages) {
      if (selectedPagesForSplit.length === 0 && !pageRangeInput.trim()) {
        setErrorMessage('Please pick or insert at least one page you wish to extract.');
        setStage('error');
        return;
      }
    }

    setStage('processing');
    setProgress(5);
    setStatusMessage('Uploading and validating files...');
    setErrorMessage('');
    setIsDeleted(false);

    try {
      const formData = new FormData();
      files.forEach((item) => {
        formData.append('files', item.file);
      });

      const finalOptions = {
        ...optionsState,
        ...(isRotatePdf
          ? {
              pageRotations,
              angle: optionsState.angle || '90',
              pages: optionsState.pages || 'all',
            }
          : {}),
        ...(isSplitPdf || isExtractPages
          ? {
              selectedPages: selectedPagesForSplit,
              pageRange: pageRangeInput.trim() || selectedPagesForSplit.join(', '),
              splitMode: 'range',
            }
          : {}),
        ...(isRemovePages
          ? {
              selectedPages: selectedPagesForSplit,
              pagesToRemove: selectedPagesForSplit,
              pageRange: pageRangeInput.trim() || selectedPagesForSplit.join(', '),
            }
          : {}),
        ...(isOrganizePdf
          ? {
              pageRotations,
              pagesToRemove: selectedPagesForSplit,
              pageOrder: organizePageOrder,
            }
          : {}),
        ...(isCropPdf
          ? {
              marginPreset: optionsState.marginPreset || 'small',
            }
          : {}),
        ...(isAiSummarizer
          ? {
              summaryLength: optionsState.summaryLength || 'bullet',
            }
          : {}),
        ...(isTranslatePdf
          ? {
              targetLanguage: optionsState.targetLanguage || 'es',
            }
          : {}),
      };
      formData.append('options', JSON.stringify(finalOptions));

      const abortController = new AbortController();
      abortControllerRef.current = abortController;

      const response = await fetch(`/api/process/${tool.slug || tool.id}`, {
        method: 'POST',
        body: formData,
        signal: abortController.signal,
      });

      const data = await parseJsonResponse(response);

      if (!response.ok) {
        throw new Error(data.error || 'Server rejected the file upload.');
      }

      const jobId = data.jobId;
      setActiveJobId(jobId);
      setProgress(data.progress || 15);
      setStatusMessage('Processing documents...');

      // Calculate total original size
      const totalOriginalSize = files.reduce((acc, curr) => acc + curr.size, 0);

      // Start polling job status
      pollIntervalRef.current = setInterval(async () => {
        try {
          const pollRes = await fetch(`/api/jobs/${jobId}`);
          if (!pollRes.ok) {
            throw new Error('Failed to retrieve processing status.');
          }

          const job = await parseJsonResponse(pollRes);
          setProgress(job.progress || 20);
          if (job.statusMessage) {
            setStatusMessage(job.statusMessage);
          }

          if (job.status === 'completed') {
            stopPolling();
            const output = job.outputFiles?.[0];
            setResult({
              jobId: job.id,
              fileName: output?.fileName || 'processed_document.pdf',
              fileSize: output?.size || 0,
              originalSize: totalOriginalSize,
              downloadUrl: output?.downloadUrl || `/api/jobs/${job.id}/download/0`,
              previewUrl: output?.previewUrl || `/api/jobs/${job.id}/preview/0`,
            });
            setStage('completed');
          } else if (job.status === 'failed') {
            stopPolling();
            setErrorMessage(job.error || 'Document processing failed.');
            setStage('error');
          }
        } catch (pollErr: any) {
          console.error('[ToolPage] Polling error:', pollErr);
        }
      }, 500);
    } catch (err: any) {
      if (err.name === 'AbortError') {
        setStage('upload');
        return;
      }
      stopPolling();
      setErrorMessage(err.message || 'Failed to communicate with processing server.');
      setStage('error');
    }
  };

  /**
   * Cancel active processing
   */
  const handleCancelProcessing = async () => {
    stopPolling();
    if (abortControllerRef.current) {
      abortControllerRef.current.abort();
    }
    if (activeJobId) {
      try {
        await fetch(`/api/jobs/${activeJobId}`, { method: 'DELETE' });
      } catch (err) {
        console.warn('[ToolPage] Error cancelling job:', err);
      }
    }
    setActiveJobId(null);
    setStage('upload');
  };

  /**
   * Immediate server purge for privacy
   */
  const handleDeleteFromServer = async () => {
    if (!result?.jobId) return;
    try {
      await fetch(`/api/jobs/${result.jobId}`, { method: 'DELETE' });
      setIsDeleted(true);
    } catch (err) {
      console.warn('[ToolPage] Error deleting job files:', err);
    }
  };

  // Sample image generator for jpg-to-pdf testing
  const handleLoadSampleImages = async () => {
    const createSampleBlob = (text: string, color: string): Promise<File> => {
      return new Promise((resolve) => {
        const canvas = document.createElement('canvas');
        canvas.width = 600;
        canvas.height = 400;
        const ctx = canvas.getContext('2d');
        if (ctx) {
          ctx.fillStyle = color;
          ctx.fillRect(0, 0, 600, 400);
          ctx.fillStyle = '#ffffff';
          ctx.font = 'bold 28px sans-serif';
          ctx.textAlign = 'center';
          ctx.fillText(text, 300, 200);
          ctx.font = '16px sans-serif';
          ctx.fillText('PDFTOOL Sample Test Image', 300, 240);
        }
        canvas.toBlob((blob) => {
          const file = new File([blob!], `${text.toLowerCase().replace(/\s+/g, '-')}.png`, {
            type: 'image/png',
          });
          resolve(file);
        }, 'image/png');
      });
    };

    const img1 = await createSampleBlob('Sample Page 1', '#059669');
    const img2 = await createSampleBlob('Sample Page 2', '#2563eb');
    handleFilesAdded([img1, img2]);
  };

  // Sample PDF generator for merge-pdf, split-pdf, rotate-pdf testing
  const handleLoadSamplePdfs = async () => {
    try {
      const createPdf = async (title: string, subtitle: string, pageColor: [number, number, number], pageCount = 1) => {
        const doc = await PDFDocument.create();
        const font = await doc.embedFont(StandardFonts.HelveticaBold);
        const subFont = await doc.embedFont(StandardFonts.Helvetica);

        for (let p = 1; p <= pageCount; p++) {
          const page = doc.addPage([595, 842]); // A4
          // Header band
          page.drawRectangle({
            x: 40,
            y: 720,
            width: 515,
            height: 70,
            color: rgb(pageColor[0], pageColor[1], pageColor[2]),
          });

          page.drawText(`${title}${pageCount > 1 ? ` - Page ${p}` : ''}`, {
            x: 60,
            y: 745,
            size: 22,
            font,
            color: rgb(1, 1, 1),
          });

          page.drawText(subtitle, {
            x: 60,
            y: 670,
            size: 14,
            font: subFont,
            color: rgb(0.2, 0.2, 0.2),
          });

          page.drawText(`Page ${p} of ${pageCount} - PDFTOOL Real Processing Live Test`, {
            x: 60,
            y: 640,
            size: 11,
            font: subFont,
            color: rgb(0.5, 0.5, 0.5),
          });
        }

        const bytes = await doc.save();
        return new File([bytes], `${title.toLowerCase().replace(/\s+/g, '_')}.pdf`, {
          type: 'application/pdf',
        });
      };

      if (
        isVisualizerTool ||
        isAddPageNumbers ||
        isAddWatermark ||
        isCompressPdf ||
        isCropPdf ||
        isPdfToMarkdown ||
        isAiSummarizer ||
        isTranslatePdf
      ) {
        const doc = await createPdf('Multi-Page Sample Document', 'Document with 4 pages for testing', [0.02, 0.58, 0.41], 4);
        handleFilesAdded([doc]);
      } else {
        const doc1 = await createPdf('Document Part 1', 'Section A - Introduction & Overview', [0.02, 0.58, 0.41]); // Emerald
        const doc2 = await createPdf('Document Part 2', 'Section B - Detailed Analysis & Summary', [0.15, 0.39, 0.92]); // Blue
        handleFilesAdded([doc1, doc2]);
      }
    } catch (err) {
      console.error('[ToolPage] Error generating sample PDFs:', err);
    }
  };

  // Related tools
  const relatedTools = TOOLS.filter(
    (t) => t.category === tool.category && t.id !== tool.id
  ).slice(0, 3);

  const rotatedCount = Object.values(pageRotations).filter((a) => a % 360 !== 0).length;

  const actionButtonText = isMergePdf
    ? 'Merge PDFs'
    : isJpgToPdf
    ? 'Convert to PDF'
    : isSplitPdf
    ? selectedPagesForSplit.length > 0
      ? `Split ${selectedPagesForSplit.length} Selected Page${selectedPagesForSplit.length > 1 ? 's' : ''}`
      : 'Split PDF'
    : isRemovePages
    ? selectedPagesForSplit.length > 0
      ? `Remove ${selectedPagesForSplit.length} Selected Page${selectedPagesForSplit.length > 1 ? 's' : ''}`
      : 'Remove Pages'
    : isExtractPages
    ? selectedPagesForSplit.length > 0
      ? `Extract ${selectedPagesForSplit.length} Selected Page${selectedPagesForSplit.length > 1 ? 's' : ''}`
      : 'Extract Pages'
    : isOrganizePdf
    ? 'Save Organized PDF'
    : isRotatePdf
    ? rotatedCount > 0
      ? `Apply Rotation to ${rotatedCount} Page${rotatedCount > 1 ? 's' : ''}`
      : 'Rotate All Pages (+90°)'
    : isAddPageNumbers
    ? 'Add Page Numbers'
    : isAddWatermark
    ? 'Apply Watermark'
    : isCompressPdf
    ? 'Compress PDF'
    : isCropPdf
    ? 'Crop PDF Margins'
    : isPdfToMarkdown
    ? 'Convert to Markdown'
    : isAiSummarizer
    ? 'Generate AI Summary'
    : isTranslatePdf
    ? 'Translate Document'
    : `Start ${tool.name}`;

  return (
    <div id={`tool-page-${tool.id}`} className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-8">
      {/* Breadcrumb */}
      <nav aria-label="Breadcrumb" className="flex items-center gap-2 text-xs text-neutral-500 dark:text-neutral-400">
        <button
          type="button"
          onClick={() => navigate('/')}
          className="hover:text-emerald-600 dark:hover:text-emerald-400 cursor-pointer"
        >
          Home
        </button>
        <ChevronRight className="w-3.5 h-3.5 text-neutral-400" />
        <button
          type="button"
          onClick={() => navigate('/tools')}
          className="hover:text-emerald-600 dark:hover:text-emerald-400 cursor-pointer"
        >
          {tool.category}
        </button>
        <ChevronRight className="w-3.5 h-3.5 text-neutral-400" />
        <span className="font-semibold text-neutral-900 dark:text-white truncate">
          {tool.name}
        </span>
      </nav>

      {/* Tool Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-neutral-200/70 dark:border-neutral-800 pb-6">
        <div>
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-emerald-100 dark:bg-emerald-950/70 text-emerald-600 dark:text-emerald-400 flex items-center justify-center">
              <ToolIcon name={tool.iconName} className="w-5 h-5" />
            </div>
            <h1 className="text-3xl sm:text-4xl font-extrabold text-neutral-900 dark:text-white tracking-tight">
              {tool.name}
            </h1>
            {tool.badge && (
              <span className="px-2.5 py-0.5 rounded-md bg-emerald-100 text-emerald-800 dark:bg-emerald-900 dark:text-emerald-300 text-xs font-bold">
                {tool.badge}
              </span>
            )}
          </div>
          <p className="mt-2 text-base text-neutral-600 dark:text-neutral-400 max-w-2xl">
            {tool.longDescription || tool.description}
          </p>
        </div>

        {/* Real Backend Ready Indicator */}
        {isBackendReady ? (
          <div className="flex items-center gap-2 p-2 bg-emerald-50/80 dark:bg-emerald-950/40 rounded-xl border border-emerald-200 dark:border-emerald-800/80 text-xs self-start md:self-auto text-emerald-800 dark:text-emerald-200 font-medium">
            <ShieldCheck className="w-4 h-4 text-emerald-600" />
            <span>Real Server Processing Active</span>
          </div>
        ) : (
          <div className="flex items-center gap-2 p-2 bg-amber-50/80 dark:bg-amber-950/40 rounded-xl border border-amber-200 dark:border-amber-800/80 text-xs self-start md:self-auto text-amber-800 dark:text-amber-200 font-medium">
            <AlertTriangle className="w-4 h-4 text-amber-600" />
            <span>Scheduled in Stage 2</span>
          </div>
        )}
      </div>

      {/* Notice if user is viewing a tool not yet in stage 1 or 2 */}
      {!isBackendReady && (
        <div className="p-4 rounded-2xl bg-amber-50 dark:bg-amber-950/30 border border-amber-200 dark:border-amber-800/80 flex items-start gap-3">
          <AlertTriangle className="w-5 h-5 text-amber-600 flex-shrink-0 mt-0.5" />
          <div className="text-xs space-y-1">
            <p className="font-bold text-amber-900 dark:text-amber-200">
              Tool Pipeline Milestone Notice
            </p>
            <p className="text-amber-800 dark:text-amber-300">
              We are currently deploying tools sequentially. Active real tools ready to use right now:{' '}
              <button
                type="button"
                onClick={() => navigate('/tools/merge-pdf')}
                className="font-bold underline text-emerald-700 dark:text-emerald-400 cursor-pointer"
              >
                Merge PDF
              </button>
              {', '}
              <button
                type="button"
                onClick={() => navigate('/tools/split-pdf')}
                className="font-bold underline text-emerald-700 dark:text-emerald-400 cursor-pointer"
              >
                Split PDF
              </button>
              {', '}
              <button
                type="button"
                onClick={() => navigate('/tools/rotate-pdf')}
                className="font-bold underline text-emerald-700 dark:text-emerald-400 cursor-pointer"
              >
                Rotate PDF
              </button>
              {', and '}
              <button
                type="button"
                onClick={() => navigate('/tools/jpg-to-pdf')}
                className="font-bold underline text-emerald-700 dark:text-emerald-400 cursor-pointer"
              >
                JPG to PDF
              </button>
              .
            </p>
          </div>
        </div>
      )}

      {/* Main Workspace Stage */}
      {stage === 'upload' && (
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
          {/* Left Upload Area */}
          <div className="lg:col-span-8 space-y-6">
            {/* If files are loaded for Split, Rotate, Remove, or Extract mode, show interactive PDF visualizer */}
            {files.length > 0 && isVisualizerTool ? (
              <div className="space-y-6">
                {/* Active Document Header Card */}
                <div className="p-4 rounded-2xl bg-white dark:bg-neutral-900 border border-neutral-200/90 dark:border-neutral-800 flex items-center justify-between shadow-xs">
                  <div className="flex items-center gap-3 min-w-0">
                    <div className="w-10 h-10 rounded-xl bg-emerald-50 dark:bg-emerald-950/60 text-emerald-600 dark:text-emerald-400 flex items-center justify-center flex-shrink-0">
                      <FileText className="w-5 h-5" />
                    </div>
                    <div className="min-w-0">
                      <p className="text-xs font-bold text-neutral-900 dark:text-white truncate max-w-xs sm:max-w-md">
                        {files[0].name}
                      </p>
                      <p className="text-[11px] text-neutral-500 dark:text-neutral-400">
                        {formatFileSize(files[0].size)} • Ready for{' '}
                        {isRotatePdf
                          ? 'page rotation'
                          : isRemovePages
                          ? 'page removal'
                          : isExtractPages
                          ? 'page extraction'
                          : 'page splitting'}
                      </p>
                    </div>
                  </div>
                  <button
                    type="button"
                    onClick={handleClearFiles}
                    className="text-xs font-semibold text-neutral-500 hover:text-red-600 dark:hover:text-red-400 px-3 py-1.5 rounded-lg border border-neutral-200 dark:border-neutral-700 hover:border-red-300 dark:hover:border-red-900/50 cursor-pointer transition-colors"
                  >
                    Change File
                  </button>
                </div>

                {/* Interactive Page Visualizer */}
                <PdfPageVisualizer
                  file={files[0].file}
                  mode={visualizerMode}
                  pageRotations={pageRotations}
                  onRotatePage={handleRotatePage}
                  onRotateAll={handleRotateAll}
                  onResetRotations={handleResetRotations}
                  selectedPages={selectedPagesForSplit}
                  onTogglePageSelection={handleTogglePageSelectionForSplit}
                  onSetSelectedPages={handleSetSelectedPagesForSplit}
                  pageRangeInput={pageRangeInput}
                  onChangePageRangeInput={setPageRangeInput}
                  pageOrder={organizePageOrder}
                  onChangePageOrder={setOrganizePageOrder}
                />

                {/* Prompt & Action Bar */}
                <div className="p-4 rounded-2xl bg-emerald-50/70 dark:bg-emerald-950/30 border border-emerald-200 dark:border-emerald-800/80 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                  <div className="flex items-center gap-2.5 text-xs text-emerald-900 dark:text-emerald-200">
                    <CheckCircle2 className="w-4 h-4 text-emerald-600 flex-shrink-0" />
                    <span>
                      {isRotatePdf
                        ? rotatedCount > 0
                          ? `${rotatedCount} page${rotatedCount > 1 ? 's' : ''} customized for rotation.`
                          : 'No custom page rotations selected yet (all pages will be rotated by default angle).'
                        : isOrganizePdf
                        ? 'Drag and drop any page card to reorder pages, rotate them, or mark pages for removal.'
                        : isRemovePages
                        ? selectedPagesForSplit.length > 0
                          ? `${selectedPagesForSplit.length} page${selectedPagesForSplit.length > 1 ? 's' : ''} marked for removal.`
                          : 'Please select pages above or enter page numbers to remove.'
                        : isExtractPages
                        ? selectedPagesForSplit.length > 0
                          ? `${selectedPagesForSplit.length} page${selectedPagesForSplit.length > 1 ? 's' : ''} chosen for extraction.`
                          : 'Please select pages above or enter page numbers to extract.'
                        : selectedPagesForSplit.length > 0
                        ? `${selectedPagesForSplit.length} page${selectedPagesForSplit.length > 1 ? 's' : ''} chosen for splitting.`
                        : 'Please insert or pick pages above to split off.'}
                    </span>
                  </div>
                  <button
                    type="button"
                    onClick={handleStartProcessing}
                    disabled={
                      (isSplitPdf || isExtractPages || isRemovePages) &&
                      selectedPagesForSplit.length === 0 &&
                      !pageRangeInput.trim()
                    }
                    className="px-5 py-2.5 rounded-xl bg-amber-400 hover:bg-amber-500 disabled:opacity-50 disabled:cursor-not-allowed text-neutral-950 text-xs font-bold shadow-xs cursor-pointer active:scale-95 transition-all whitespace-nowrap"
                  >
                    {actionButtonText} →
                  </button>
                </div>
              </div>
            ) : (
              <FileUploader
                files={files}
                onFilesAdded={handleFilesAdded}
                onFileRemoved={handleRemoveFile}
                onClearFiles={handleClearFiles}
                onMoveUp={handleMoveUp}
                onMoveDown={handleMoveDown}
                acceptedFormats={tool.acceptedFormats}
                maxFileSizeMB={tool.maxFileSizeMB}
                toolName={tool.name}
              />
            )}

            {/* If files selected for general tools, show prompt to process */}
            {files.length > 0 && !isVisualizerTool && (
              <div className="p-4 rounded-2xl bg-emerald-50/70 dark:bg-emerald-950/30 border border-emerald-200 dark:border-emerald-800/80 flex items-center justify-between">
                <div className="flex items-center gap-2.5 text-xs text-emerald-900 dark:text-emerald-200">
                  <CheckCircle2 className="w-4 h-4 text-emerald-600 flex-shrink-0" />
                  <span>
                    {files.length} file{files.length > 1 ? 's' : ''} ready{' '}
                    {isMergePdf && files.length < 2 ? '(Select at least 2 PDFs to merge)' : 'for processing.'}
                  </span>
                </div>
                <button
                  type="button"
                  onClick={handleStartProcessing}
                  disabled={isMergePdf && files.length < 2}
                  className="px-5 py-2.5 rounded-xl bg-amber-400 hover:bg-amber-500 disabled:opacity-50 disabled:cursor-not-allowed text-neutral-950 text-xs font-bold shadow-xs cursor-pointer active:scale-95 transition-all"
                >
                  {actionButtonText} →
                </button>
              </div>
            )}

            {/* Sample File Loaders if empty */}
            {files.length === 0 && (
              <div className="text-center">
                {isMergePdf ? (
                  <button
                    type="button"
                    onClick={handleLoadSamplePdfs}
                    className="text-xs text-neutral-500 dark:text-neutral-400 hover:text-emerald-600 underline cursor-pointer"
                  >
                    Don't have PDF files handy? Click here to generate sample PDF documents
                  </button>
                ) : isVisualizerTool || isAddPageNumbers || isAddWatermark || isCompressPdf ? (
                  <button
                    type="button"
                    onClick={handleLoadSamplePdfs}
                    className="text-xs text-neutral-500 dark:text-neutral-400 hover:text-emerald-600 underline cursor-pointer"
                  >
                    Don't have a multi-page PDF handy? Click here to generate a 4-page test PDF document
                  </button>
                ) : isJpgToPdf ? (
                  <button
                    type="button"
                    onClick={handleLoadSampleImages}
                    className="text-xs text-neutral-500 dark:text-neutral-400 hover:text-emerald-600 underline cursor-pointer"
                  >
                    Don't have images ready? Click here to load sample test images
                  </button>
                ) : null}
              </div>
            )}

            {/* Privacy Notice */}
            <PrivacyNotice />
          </div>

          {/* Right Column: Options & Action Panel */}
          <div className="lg:col-span-4 space-y-6">
            <div className="p-6 rounded-3xl bg-white dark:bg-neutral-900 border border-neutral-200/90 dark:border-neutral-800 shadow-sm space-y-6">
              <div className="flex items-center justify-between border-b border-neutral-100 dark:border-neutral-800 pb-3">
                <div className="flex items-center gap-2 text-sm font-bold text-neutral-900 dark:text-white">
                  <SlidersHorizontal className="w-4 h-4 text-emerald-600" />
                  <span>Options</span>
                </div>
                <span className="text-[11px] font-mono text-neutral-400">Settings</span>
              </div>

              {/* Options customized for Rotate, Split, or standard tools */}
              {isRotatePdf ? (
                <div className="space-y-4">
                  <div className="p-3.5 rounded-2xl bg-neutral-50 dark:bg-neutral-800/60 border border-neutral-200/80 dark:border-neutral-700/80 space-y-2">
                    <div className="flex items-center justify-between text-xs">
                      <span className="text-neutral-500 dark:text-neutral-400">Pages with Custom Rotation:</span>
                      <span className="font-bold text-emerald-600 dark:text-emerald-400">
                        {rotatedCount} page{rotatedCount === 1 ? '' : 's'}
                      </span>
                    </div>
                    {rotatedCount > 0 && (
                      <p className="text-[11px] text-neutral-500 dark:text-neutral-400 pt-1 border-t border-neutral-200/60 dark:border-neutral-700/60">
                        Individual page rotations take precedence during processing.
                      </p>
                    )}
                  </div>

                  <div className="space-y-2">
                    <label className="text-xs font-semibold text-neutral-800 dark:text-neutral-200">
                      Quick Batch Rotation
                    </label>
                    <div className="grid grid-cols-2 gap-2">
                      <button
                        type="button"
                        onClick={() => handleRotateAll(90)}
                        className="py-2 px-3 rounded-xl bg-emerald-50 dark:bg-emerald-950/40 hover:bg-emerald-100 dark:hover:bg-emerald-900/60 text-emerald-700 dark:text-emerald-300 text-xs font-bold border border-emerald-200/80 dark:border-emerald-800/80 cursor-pointer active:scale-95 transition-all"
                      >
                        +90° (Clockwise)
                      </button>
                      <button
                        type="button"
                        onClick={() => handleRotateAll(180)}
                        className="py-2 px-3 rounded-xl bg-neutral-100 dark:bg-neutral-800 hover:bg-neutral-200 dark:hover:bg-neutral-700 text-neutral-700 dark:text-neutral-300 text-xs font-medium cursor-pointer active:scale-95 transition-all"
                      >
                        180° (Upside Down)
                      </button>
                    </div>
                    {rotatedCount > 0 && (
                      <button
                        type="button"
                        onClick={handleResetRotations}
                        className="w-full py-2 text-xs text-neutral-500 hover:text-red-600 dark:hover:text-red-400 cursor-pointer text-center font-medium"
                      >
                        Reset All Rotations to 0°
                      </button>
                    )}
                  </div>
                </div>
              ) : isSplitPdf || isExtractPages || isRemovePages ? (
                <div className="space-y-4">
                  <div className="p-3.5 rounded-2xl bg-neutral-50 dark:bg-neutral-800/60 border border-neutral-200/80 dark:border-neutral-700/80 space-y-2">
                    <div className="flex items-center justify-between text-xs">
                      <span className="text-neutral-500 dark:text-neutral-400">
                        {isRemovePages ? 'Pages to Remove:' : 'Pages to Extract:'}
                      </span>
                      <span className="font-bold text-emerald-600 dark:text-emerald-400">
                        {selectedPagesForSplit.length} selected
                      </span>
                    </div>
                    <div className="flex items-center justify-between text-xs">
                      <span className="text-neutral-500 dark:text-neutral-400">Range Specification:</span>
                      <span className="font-mono font-bold text-neutral-800 dark:text-neutral-200 truncate max-w-[130px]">
                        {pageRangeInput || selectedPagesForSplit.join(', ') || 'None'}
                      </span>
                    </div>
                  </div>

                  <p className="text-xs text-neutral-500 dark:text-neutral-400">
                    {isRemovePages
                      ? 'Click any page card in the preview grid or insert page numbers into the box to mark which pages to delete.'
                      : 'Click any page card in the preview grid or insert page numbers into the box to customize which pages are extracted.'}
                  </p>
                </div>
              ) : tool.options && tool.options.length > 0 ? (
                <div className="space-y-4">
                  {tool.options.map((option) => (
                    <div key={option.id} className="space-y-1.5">
                      <label className="text-xs font-semibold text-neutral-800 dark:text-neutral-200">
                        {option.label}
                      </label>
                      {option.type === 'select' && option.options && (
                        <select
                          value={optionsState[option.id] || option.defaultValue}
                          onChange={(e) =>
                            setOptionsState((prev) => ({ ...prev, [option.id]: e.target.value }))
                          }
                          className="w-full px-3 py-2 rounded-xl bg-neutral-50 dark:bg-neutral-800 border border-neutral-200 dark:border-neutral-700 text-xs font-medium text-neutral-800 dark:text-neutral-200 outline-none focus:ring-2 focus:ring-emerald-500"
                        >
                          {option.options.map((opt) => (
                            <option key={opt.value} value={opt.value}>
                              {opt.label}
                            </option>
                          ))}
                        </select>
                      )}

                      {option.type === 'text' && (
                        <input
                          type="text"
                          value={optionsState[option.id] ?? option.defaultValue ?? ''}
                          placeholder={option.placeholder}
                          onChange={(e) =>
                            setOptionsState((prev) => ({ ...prev, [option.id]: e.target.value }))
                          }
                          className="w-full px-3 py-2 rounded-xl bg-neutral-50 dark:bg-neutral-800 border border-neutral-200 dark:border-neutral-700 text-xs font-medium text-neutral-800 dark:text-neutral-200 outline-none focus:ring-2 focus:ring-emerald-500"
                        />
                      )}

                      {option.type === 'number' && (
                        <input
                          type="number"
                          min={option.min}
                          max={option.max}
                          value={optionsState[option.id] ?? option.defaultValue ?? 1}
                          onChange={(e) =>
                            setOptionsState((prev) => ({ ...prev, [option.id]: Number(e.target.value) }))
                          }
                          className="w-full px-3 py-2 rounded-xl bg-neutral-50 dark:bg-neutral-800 border border-neutral-200 dark:border-neutral-700 text-xs font-medium text-neutral-800 dark:text-neutral-200 outline-none focus:ring-2 focus:ring-emerald-500"
                        />
                      )}

                      {option.type === 'toggle' && (
                        <div className="flex items-center justify-between pt-1">
                          <span className="text-xs text-neutral-500 dark:text-neutral-400">
                            {option.description || 'Enable feature'}
                          </span>
                          <input
                            type="checkbox"
                            checked={!!optionsState[option.id]}
                            onChange={(e) =>
                              setOptionsState((prev) => ({ ...prev, [option.id]: e.target.checked }))
                            }
                            className="w-4 h-4 text-emerald-600 rounded focus:ring-emerald-500 cursor-pointer"
                          />
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              ) : (
                <div className="text-xs text-neutral-500 dark:text-neutral-400 py-2">
                  Standard lossless processing parameters will be applied automatically.
                </div>
              )}

              {/* Primary Action Button */}
              <button
                type="button"
                id="tool-primary-action-btn"
                onClick={handleStartProcessing}
                disabled={files.length === 0 || (isMergePdf && files.length < 2)}
                className="w-full py-3.5 px-5 rounded-2xl bg-amber-400 hover:bg-amber-500 text-neutral-950 font-bold text-sm shadow-sm transition-all duration-150 cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2 border border-amber-500/40 active:scale-[0.99]"
              >
                <span>{actionButtonText}</span>
                <ArrowRight className="w-4 h-4" />
              </button>

              <div className="pt-2 text-[11px] text-center text-neutral-400">
                🔒 Uploaded files are deleted automatically within 30 minutes
              </div>
            </div>

            {/* Quick Tips Side Card */}
            <div className="p-5 rounded-3xl bg-neutral-50 dark:bg-neutral-800/50 border border-neutral-200/70 dark:border-neutral-700/60 space-y-2">
              <div className="flex items-center gap-2 text-xs font-bold text-emerald-800 dark:text-emerald-300">
                <Sparkles className="w-4 h-4 text-emerald-600" />
                <span>{isMergePdf ? 'Page Order & Reordering' : 'Multi-File Ordering'}</span>
              </div>
              <p className="text-xs text-neutral-600 dark:text-neutral-400 leading-relaxed">
                {isMergePdf
                  ? 'Use the up and down arrow buttons on each file to change the merge sequence before combining.'
                  : 'You can select multiple JPG, PNG, and WebP images. They will be combined into a single, multi-page PDF document in order.'}
              </p>
            </div>
          </div>
        </div>
      )}

      {/* Stage: Processing */}
      {stage === 'processing' && (
        <div className="max-w-3xl mx-auto space-y-6">
          <ProcessingPanel
            progress={progress}
            statusText={statusMessage}
            files={files}
            toolName={tool.name}
            onCancel={handleCancelProcessing}
          />
        </div>
      )}

      {/* Stage: Completed Result */}
      {stage === 'completed' && result && (
        <div className="max-w-3xl mx-auto space-y-6">
          <ResultPanel
            fileName={result.fileName}
            fileSize={result.fileSize}
            originalSize={result.originalSize}
            downloadUrl={result.downloadUrl}
            previewUrl={result.previewUrl}
            toolName={tool.name}
            onDelete={handleDeleteFromServer}
            isDeleted={isDeleted}
            onReset={() => {
              setFiles([]);
              setResult(null);
              setStage('upload');
            }}
          />
        </div>
      )}

      {/* Stage: Error */}
      {stage === 'error' && (
        <div className="max-w-2xl mx-auto">
          <ErrorMessage
            title="Processing Failed"
            message={errorMessage || 'An error occurred during file conversion.'}
            onRetry={() => {
              setStage('upload');
              setErrorMessage('');
            }}
            onBack={() => navigate('/tools')}
          />
        </div>
      )}

      {/* How It Works Steps */}
      <section className="pt-10 border-t border-neutral-200/70 dark:border-neutral-800">
        <h3 className="text-xl font-bold text-neutral-900 dark:text-white mb-6">
          How to use {tool.name} in 3 simple steps
        </h3>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <div className="p-5 rounded-2xl bg-white dark:bg-neutral-900 border border-neutral-200/80 dark:border-neutral-800 shadow-xs">
            <div className="w-8 h-8 rounded-lg bg-emerald-100 dark:bg-emerald-950 text-emerald-700 dark:text-emerald-300 font-bold text-sm flex items-center justify-center mb-3">
              1
            </div>
            <h4 className="font-semibold text-neutral-900 dark:text-white text-sm mb-1">
              Select or Drop Files
            </h4>
            <p className="text-xs text-neutral-500 dark:text-neutral-400">
              Drag your files onto the drop area or click Choose Files.
            </p>
          </div>

          <div className="p-5 rounded-2xl bg-white dark:bg-neutral-900 border border-neutral-200/80 dark:border-neutral-800 shadow-xs">
            <div className="w-8 h-8 rounded-lg bg-emerald-100 dark:bg-emerald-950 text-emerald-700 dark:text-emerald-300 font-bold text-sm flex items-center justify-center mb-3">
              2
            </div>
            <h4 className="font-semibold text-neutral-900 dark:text-white text-sm mb-1">
              Configure & Arrange
            </h4>
            <p className="text-xs text-neutral-500 dark:text-neutral-400">
              Reorder items as needed and adjust options in the side panel.
            </p>
          </div>

          <div className="p-5 rounded-2xl bg-white dark:bg-neutral-900 border border-neutral-200/80 dark:border-neutral-800 shadow-xs">
            <div className="w-8 h-8 rounded-lg bg-emerald-100 dark:bg-emerald-950 text-emerald-700 dark:text-emerald-300 font-bold text-sm flex items-center justify-center mb-3">
              3
            </div>
            <h4 className="font-semibold text-neutral-900 dark:text-white text-sm mb-1">
              Download Real Result
            </h4>
            <p className="text-xs text-neutral-500 dark:text-neutral-400">
              Download your newly generated PDF immediately or preview it inline.
            </p>
          </div>
        </div>
      </section>

      {/* Related Tools */}
      {relatedTools.length > 0 && (
        <section className="pt-6 border-t border-neutral-200/70 dark:border-neutral-800">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-lg font-bold text-neutral-900 dark:text-white">
              More {tool.category} Tools
            </h3>
            <button
              type="button"
              onClick={() => navigate('/tools')}
              className="text-xs font-semibold text-emerald-600 dark:text-emerald-400 hover:underline cursor-pointer"
            >
              View all 27 tools →
            </button>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            {relatedTools.map((rt) => (
              <button
                key={rt.id}
                type="button"
                onClick={() => navigate(rt.route)}
                className="flex items-center gap-3 p-3.5 rounded-xl bg-white dark:bg-neutral-900 border border-neutral-200 dark:border-neutral-800 hover:border-emerald-300 text-left cursor-pointer transition-colors"
              >
                <div className="w-8 h-8 rounded-lg bg-emerald-50 dark:bg-emerald-950/60 text-emerald-600 flex items-center justify-center flex-shrink-0">
                  <ToolIcon name={rt.iconName} className="w-4 h-4" />
                </div>
                <div className="min-w-0">
                  <div className="text-xs font-semibold text-neutral-900 dark:text-white truncate">
                    {rt.name}
                  </div>
                  <div className="text-[11px] text-neutral-400 truncate">{rt.description}</div>
                </div>
              </button>
            ))}
          </div>
        </section>
      )}
    </div>
  );
};
