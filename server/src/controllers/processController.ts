import { Request, Response } from 'express';
import fs from 'fs';
import path from 'path';
import { jobService } from '../services/jobService';
import { processorRegistry } from '../processors/processorRegistry';
import { sanitizeFilename, validateImageMagicBytes, getJobDirs, removeFile } from '../utils/fileSystem';
import { JobFile, JobOutput } from '../types/job';

export class ProcessController {
  /**
   * POST /api/process/:toolId
   * Accepts multipart files and options, creates a job, and starts processing.
   */
  public async handleProcess(req: Request, res: Response): Promise<void> {
    const toolId = req.params.toolId?.toLowerCase();
    const uploadedFiles = req.files as Express.Multer.File[] | undefined;

    if (!processorRegistry.has(toolId)) {
      // Clean up staged files if tool is not implemented yet
      if (uploadedFiles) {
        for (const f of uploadedFiles) {
          await removeFile(f.path);
        }
      }
      res.status(400).json({
        error: `Tool "${toolId}" is not yet available. Currently approved tool: JPG/PNG → PDF (jpg-to-pdf).`,
      });
      return;
    }

    if (!uploadedFiles || uploadedFiles.length === 0) {
      res.status(400).json({
        error: 'No files were uploaded. Please select at least one file.',
      });
      return;
    }

    // Parse options from body
    let options: Record<string, any> = {};
    if (req.body.options) {
      try {
        options = typeof req.body.options === 'string' ? JSON.parse(req.body.options) : req.body.options;
      } catch (err) {
        console.warn('[ProcessController] Failed to parse options JSON:', err);
      }
    }

    // Merge any top-level body keys (e.g. orientation, margin)
    for (const [key, val] of Object.entries(req.body)) {
      if (key !== 'options' && key !== 'files') {
        options[key] = val;
      }
    }

    // Prepare job files
    const jobFiles: JobFile[] = [];
    const processor = processorRegistry.get(toolId)!;

    try {
      // Create job record with designated directories
      const job = await jobService.createJob(toolId, [], options);
      const dirs = getJobDirs(job.id);

      // Move files from staging into job-specific uploads directory
      for (let i = 0; i < uploadedFiles.length; i++) {
        const f = uploadedFiles[i];
        const safeOriginalName = sanitizeFilename(f.originalname);
        const ext = path.extname(safeOriginalName).toLowerCase();
        const safeTargetName = `input_${i + 1}_${safeOriginalName}`;
        const targetPath = path.join(dirs.uploadsDir, safeTargetName);

        // Move file
        await fs.promises.rename(f.path, targetPath);

        // Magic byte validation for images
        const isValidImage = await validateImageMagicBytes(targetPath);
        if (!isValidImage) {
          // Cleanup this job and fail
          await jobService.deleteJob(job.id);
          res.status(400).json({
            error: `File "${safeOriginalName}" does not appear to be a valid image file. Processing rejected.`,
          });
          return;
        }

        const stats = await fs.promises.stat(targetPath);

        jobFiles.push({
          id: `f_${i + 1}`,
          originalName: safeOriginalName,
          safeName: safeTargetName,
          path: targetPath,
          size: stats.size,
          mimeType: f.mimetype,
          extension: ext,
        });
      }

      // Update job with actual input files
      job.inputFiles = jobFiles;
      jobService.updateProgress(job.id, 5, 'Files validated and queued');

      // Execute processor in background (non-blocking for client status polling)
      (async () => {
        try {
          jobService.updateProgress(job.id, 15, 'Processing document...');

          const result = await processor.process(
            {
              job,
              inputFiles: jobFiles,
              options,
              tempDir: dirs.jobDir,
              outputDir: dirs.outputsDir,
            },
            (progress, message) => {
              jobService.updateProgress(job.id, progress, message);
            }
          );

          // Build output files metadata
          const outputs: JobOutput[] = result.outputFiles.map((outFile, idx) => ({
            id: `out_${idx + 1}`,
            fileName: outFile.fileName,
            path: outFile.path,
            size: outFile.size,
            mimeType: outFile.mimeType,
            downloadUrl: `/api/jobs/${job.id}/download/${idx}`,
            previewUrl: `/api/jobs/${job.id}/preview/${idx}`,
          }));

          jobService.completeJob(job.id, outputs);
        } catch (procErr: any) {
          console.error(`[ProcessController] Processing error for job ${job.id}:`, procErr);
          jobService.failJob(job.id, procErr.message || 'Processing failed.');
        }
      })();

      // Respond immediately with job metadata
      res.status(202).json({
        success: true,
        jobId: job.id,
        status: job.status,
        progress: job.progress,
        message: 'Processing started',
      });
    } catch (err: any) {
      console.error('[ProcessController] Error starting job:', err);
      // Clean up any remaining staged files
      for (const f of uploadedFiles) {
        await removeFile(f.path);
      }
      res.status(500).json({
        error: `Server failed to start processing: ${err.message}`,
      });
    }
  }

  /**
   * GET /api/jobs/:jobId
   * Returns current status, progress, and results.
   */
  public getJobStatus(req: Request, res: Response): void {
    const { jobId } = req.params;
    const job = jobService.getJob(jobId);

    if (!job) {
      res.status(404).json({
        error: 'Job not found or has expired.',
      });
      return;
    }

    res.json({
      id: job.id,
      toolId: job.toolId,
      status: job.status,
      progress: job.progress,
      statusMessage: job.statusMessage,
      outputFiles: job.outputFiles,
      error: job.error,
      createdAt: job.createdAt,
      expiresAt: job.expiresAt,
    });
  }

  /**
   * GET /api/jobs/:jobId/download/:fileIndex?
   * Sends the output file as an attachment download.
   */
  public async downloadOutputFile(req: Request, res: Response): Promise<void> {
    const { jobId } = req.params;
    const fileIndex = parseInt(req.params.fileIndex || '0', 10);
    const job = jobService.getJob(jobId);

    if (!job) {
      res.status(404).json({ error: 'Job not found or expired.' });
      return;
    }

    if (job.status !== 'completed' || !job.outputFiles || job.outputFiles.length <= fileIndex) {
      res.status(400).json({ error: 'Output file is not ready or does not exist.' });
      return;
    }

    const outputFile = job.outputFiles[fileIndex];
    if (!fs.existsSync(outputFile.path)) {
      res.status(404).json({ error: 'Output file was removed from server.' });
      return;
    }

    res.setHeader('Content-Disposition', `attachment; filename="${encodeURIComponent(outputFile.fileName)}"`);
    res.setHeader('Content-Type', outputFile.mimeType || 'application/octet-stream');
    res.setHeader('Content-Length', outputFile.size);

    const stream = fs.createReadStream(outputFile.path);
    stream.pipe(res);
  }

  /**
   * GET /api/jobs/:jobId/preview/:fileIndex?
   * Streams the output file with inline disposition for browser preview.
   */
  public async previewOutputFile(req: Request, res: Response): Promise<void> {
    const { jobId } = req.params;
    const fileIndex = parseInt(req.params.fileIndex || '0', 10);
    const job = jobService.getJob(jobId);

    if (!job) {
      res.status(404).json({ error: 'Job not found or expired.' });
      return;
    }

    if (job.status !== 'completed' || !job.outputFiles || job.outputFiles.length <= fileIndex) {
      res.status(400).json({ error: 'Output file is not ready.' });
      return;
    }

    const outputFile = job.outputFiles[fileIndex];
    if (!fs.existsSync(outputFile.path)) {
      res.status(404).json({ error: 'Output file was removed.' });
      return;
    }

    res.setHeader('Content-Disposition', `inline; filename="${encodeURIComponent(outputFile.fileName)}"`);
    res.setHeader('Content-Type', outputFile.mimeType || 'application/pdf');
    res.setHeader('Content-Length', outputFile.size);

    const stream = fs.createReadStream(outputFile.path);
    stream.pipe(res);
  }

  /**
   * DELETE /api/jobs/:jobId
   * Allows user to immediately purge job and temporary files.
   */
  public async deleteJob(req: Request, res: Response): Promise<void> {
    const { jobId } = req.params;
    const deleted = await jobService.deleteJob(jobId);

    res.json({
      success: true,
      message: deleted ? 'Files purged successfully.' : 'Job already deleted or expired.',
    });
  }
}

export const processController = new ProcessController();
