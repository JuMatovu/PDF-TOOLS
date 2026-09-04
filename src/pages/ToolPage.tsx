import React, { useState, useEffect, useRef } from 'react';
import { PDFTool, UploadedFileItem } from '../types';
import { useRouter } from '../hooks/useRouter';
import { FileUploader } from '../components/tools/FileUploader';
import { ProcessingPanel } from '../components/tools/ProcessingPanel';
import { ResultPanel } from '../components/tools/ResultPanel';
import { ErrorMessage } from '../components/common/ErrorMessage';
import { PrivacyNotice } from '../components/common/PrivacyNotice';
import { ToolIcon, formatFileSize } from '../lib/icons';
import {
  ChevronRight,
  ShieldCheck,
  CheckCircle2,
  SlidersHorizontal,
  ArrowRight,
  Sparkles,
  AlertTriangle,
} from 'lucide-react';
import { TOOLS } from '../data/tools';

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

  const [optionsState, setOptionsState] = useState<Record<string, any>>(() => {
    const initial: Record<string, any> = {};
    tool.options?.forEach((opt) => {
      initial[opt.id] = opt.defaultValue;
    });
    return initial;
  });

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

    const initial: Record<string, any> = {};
    tool.options?.forEach((opt) => {
      initial[opt.id] = opt.defaultValue;
    });
    setOptionsState(initial);

    return () => {
      stopPolling();
      if (abortControllerRef.current) {
        abortControllerRef.current.abort();
      }
    };
  }, [tool.id]);

  const stopPolling = () => {
    if (pollIntervalRef.current) {
      clearInterval(pollIntervalRef.current);
      pollIntervalRef.current = null;
    }
  };

  const handleFilesAdded = (rawFiles: File[]) => {
    // Validate file sizes and extensions client-side first
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
  };

  const handleClearFiles = () => {
    setFiles([]);
  };

  /**
   * Real File Processing Pipeline
   */
  const handleStartProcessing = async () => {
    if (files.length === 0) return;

    // Check if this tool is implemented on the backend
    const isJpgToPdf = tool.id === 'jpg-to-pdf' || tool.slug === 'jpg-to-pdf';

    if (!isJpgToPdf) {
      setErrorMessage(
        `The "${tool.name}" converter is scheduled for an upcoming release. Please try our active first tool: JPG/PNG → PDF.`
      );
      setStage('error');
      return;
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
      formData.append('options', JSON.stringify(optionsState));

      const abortController = new AbortController();
      abortControllerRef.current = abortController;

      const response = await fetch(`/api/process/${tool.slug || tool.id}`, {
        method: 'POST',
        body: formData,
        signal: abortController.signal,
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Server rejected the file upload.');
      }

      const jobId = data.jobId;
      setActiveJobId(jobId);
      setProgress(data.progress || 15);
      setStatusMessage('Processing images...');

      // Calculate total original size
      const totalOriginalSize = files.reduce((acc, curr) => acc + curr.size, 0);

      // Start polling job status
      pollIntervalRef.current = setInterval(async () => {
        try {
          const pollRes = await fetch(`/api/jobs/${jobId}`);
          if (!pollRes.ok) {
            throw new Error('Failed to retrieve processing status.');
          }

          const job = await pollRes.json();
          setProgress(job.progress || 20);
          if (job.statusMessage) {
            setStatusMessage(job.statusMessage);
          }

          if (job.status === 'completed') {
            stopPolling();
            const output = job.outputFiles?.[0];
            setResult({
              jobId: job.id,
              fileName: output?.fileName || 'converted_document.pdf',
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

  // Sample image generator for testing
  const handleLoadSampleImages = async () => {
    // Generate two simple canvas-based test images
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

  // Related tools
  const relatedTools = TOOLS.filter(
    (t) => t.category === tool.category && t.id !== tool.id
  ).slice(0, 3);

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
        <div className="flex items-center gap-2 p-2 bg-emerald-50/80 dark:bg-emerald-950/40 rounded-xl border border-emerald-200 dark:border-emerald-800/80 text-xs self-start md:self-auto text-emerald-800 dark:text-emerald-200 font-medium">
          <ShieldCheck className="w-4 h-4 text-emerald-600" />
          <span>Real Server Processing Active</span>
        </div>
      </div>

      {/* Notice if user is viewing a tool not yet in stage 1 */}
      {tool.id !== 'jpg-to-pdf' && (
        <div className="p-4 rounded-2xl bg-amber-50 dark:bg-amber-950/30 border border-amber-200 dark:border-amber-800/80 flex items-start gap-3">
          <AlertTriangle className="w-5 h-5 text-amber-600 flex-shrink-0 mt-0.5" />
          <div className="text-xs space-y-1">
            <p className="font-bold text-amber-900 dark:text-amber-200">
              Tool Pipeline Milestone Notice
            </p>
            <p className="text-amber-800 dark:text-amber-300">
              We are currently testing our real processing pipeline starting with our first approved tool:{' '}
              <button
                type="button"
                onClick={() => navigate('/tools/jpg-to-pdf')}
                className="font-bold underline text-emerald-700 dark:text-emerald-400 cursor-pointer"
              >
                JPG to PDF
              </button>
              . Subsequent tools will follow sequentially.
            </p>
          </div>
        </div>
      )}

      {/* Main Workspace Stage */}
      {stage === 'upload' && (
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
          {/* Left Upload Area */}
          <div className="lg:col-span-8 space-y-6">
            <FileUploader
              files={files}
              onFilesAdded={handleFilesAdded}
              onFileRemoved={handleRemoveFile}
              onClearFiles={handleClearFiles}
              acceptedFormats={tool.acceptedFormats}
              maxFileSizeMB={tool.maxFileSizeMB}
              toolName={tool.name}
            />

            {/* If files selected, show prompt to process */}
            {files.length > 0 && (
              <div className="p-4 rounded-2xl bg-emerald-50/70 dark:bg-emerald-950/30 border border-emerald-200 dark:border-emerald-800/80 flex items-center justify-between">
                <div className="flex items-center gap-2.5 text-xs text-emerald-900 dark:text-emerald-200">
                  <CheckCircle2 className="w-4 h-4 text-emerald-600 flex-shrink-0" />
                  <span>{files.length} file{files.length > 1 ? 's' : ''} ready for conversion.</span>
                </div>
                <button
                  type="button"
                  onClick={handleStartProcessing}
                  className="px-5 py-2.5 rounded-xl bg-amber-400 hover:bg-amber-500 text-neutral-950 text-xs font-bold shadow-xs cursor-pointer active:scale-95 transition-all"
                >
                  Start {tool.name} →
                </button>
              </div>
            )}

            {/* Sample Image Loader if empty and tool is jpg-to-pdf */}
            {files.length === 0 && (
              <div className="text-center">
                <button
                  type="button"
                  onClick={handleLoadSampleImages}
                  className="text-xs text-neutral-500 dark:text-neutral-400 hover:text-emerald-600 underline cursor-pointer"
                >
                  Don't have images ready? Click here to load sample test images
                </button>
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

              {/* Dynamic options based on tool configuration */}
              {tool.options && tool.options.length > 0 ? (
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
                disabled={files.length === 0}
                className="w-full py-3.5 px-5 rounded-2xl bg-amber-400 hover:bg-amber-500 text-neutral-950 font-bold text-sm shadow-sm transition-all duration-150 cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2 border border-amber-500/40 active:scale-[0.99]"
              >
                <span>Convert to PDF</span>
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
                <span>Multi-Image Ordering</span>
              </div>
              <p className="text-xs text-neutral-600 dark:text-neutral-400 leading-relaxed">
                You can select multiple JPG, PNG, and WebP images. They will be combined into a single, multi-page PDF document in order.
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
              Select or Drop Images
            </h4>
            <p className="text-xs text-neutral-500 dark:text-neutral-400">
              Drag your JPG or PNG files onto the drop area or click Choose Files.
            </p>
          </div>

          <div className="p-5 rounded-2xl bg-white dark:bg-neutral-900 border border-neutral-200/80 dark:border-neutral-800 shadow-xs">
            <div className="w-8 h-8 rounded-lg bg-emerald-100 dark:bg-emerald-950 text-emerald-700 dark:text-emerald-300 font-bold text-sm flex items-center justify-center mb-3">
              2
            </div>
            <h4 className="font-semibold text-neutral-900 dark:text-white text-sm mb-1">
              Set Orientation & Margin
            </h4>
            <p className="text-xs text-neutral-500 dark:text-neutral-400">
              Choose portrait, landscape, or auto to match image dimensions.
            </p>
          </div>

          <div className="p-5 rounded-2xl bg-white dark:bg-neutral-900 border border-neutral-200/80 dark:border-neutral-800 shadow-xs">
            <div className="w-8 h-8 rounded-lg bg-emerald-100 dark:bg-emerald-950 text-emerald-700 dark:text-emerald-300 font-bold text-sm flex items-center justify-center mb-3">
              3
            </div>
            <h4 className="font-semibold text-neutral-900 dark:text-white text-sm mb-1">
              Download Real PDF
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
