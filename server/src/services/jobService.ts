import crypto from 'crypto';
import fs from 'fs';
import path from 'path';
import { CONFIG } from '../config';
import { ProcessingJob, JobFile, JobOutput, JobStatus } from '../types/job';
import { getJobDirs, removeDir, ensureDir } from '../utils/fileSystem';

class JobService {
  private jobs: Map<string, ProcessingJob> = new Map();
  private cleanupTimer: NodeJS.Timeout | null = null;

  constructor() {
    this.startCleanupSchedule();
  }

  /**
   * Initializes a new processing job with unique ID and directories.
   */
  public async createJob(
    toolId: string,
    files: JobFile[],
    options: Record<string, any> = {}
  ): Promise<ProcessingJob> {
    const id = crypto.randomUUID();
    const now = Date.now();
    const { jobDir, uploadsDir, processingDir, outputsDir } = getJobDirs(id);

    // Create required directories on disk
    await ensureDir(jobDir);
    await ensureDir(uploadsDir);
    await ensureDir(processingDir);
    await ensureDir(outputsDir);

    const job: ProcessingJob = {
      id,
      toolId,
      status: 'queued',
      progress: 0,
      statusMessage: 'Job queued for processing',
      inputFiles: files,
      outputFiles: [],
      options,
      createdAt: now,
      expiresAt: now + CONFIG.JOB_RETENTION_MS,
      jobDir,
    };

    this.jobs.set(id, job);
    return job;
  }

  /**
   * Retrieves a job by ID.
   */
  public getJob(id: string): ProcessingJob | undefined {
    return this.jobs.get(id);
  }

  /**
   * Updates job progress and optional status message.
   */
  public updateProgress(id: string, progress: number, statusMessage?: string): void {
    const job = this.jobs.get(id);
    if (!job) return;

    job.progress = Math.min(100, Math.max(0, progress));
    if (job.status === 'queued' && progress > 0) {
      job.status = 'processing';
    }
    if (statusMessage) {
      job.statusMessage = statusMessage;
    }
  }

  /**
   * Marks a job as completed with its generated output files.
   */
  public completeJob(id: string, outputFiles: JobOutput[]): void {
    const job = this.jobs.get(id);
    if (!job) return;

    job.status = 'completed';
    job.progress = 100;
    job.statusMessage = 'Completed successfully';
    job.outputFiles = outputFiles;
    job.completedAt = Date.now();
  }

  /**
   * Marks a job as failed with an error message.
   */
  public failJob(id: string, errorMessage: string): void {
    const job = this.jobs.get(id);
    if (!job) return;

    job.status = 'failed';
    job.error = errorMessage;
    job.statusMessage = `Failed: ${errorMessage}`;
  }

  /**
   * Deletes a job immediately and purges its temp files from disk.
   */
  public async deleteJob(id: string): Promise<boolean> {
    const job = this.jobs.get(id);
    const { jobDir } = getJobDirs(id);

    // Delete files from disk
    await removeDir(jobDir);

    if (job) {
      this.jobs.delete(id);
      return true;
    }
    return false;
  }

  /**
   * Sweeps expired jobs and removes their temporary directories.
   */
  public async cleanupExpiredJobs(): Promise<number> {
    const now = Date.now();
    let cleanedCount = 0;

    for (const [id, job] of this.jobs.entries()) {
      if (now > job.expiresAt) {
        console.log(`[JobService] Purging expired job ${id} (created at ${new Date(job.createdAt).toISOString()})`);
        await this.deleteJob(id);
        cleanedCount++;
      }
    }

    // Also sweep filesystem for orphaned folders in temp root older than retention
    try {
      if (fs.existsSync(CONFIG.TEMP_ROOT)) {
        const entries = await fs.promises.readdir(CONFIG.TEMP_ROOT, { withFileTypes: true });
        for (const entry of entries) {
          if (entry.isDirectory()) {
            const dirPath = path.join(CONFIG.TEMP_ROOT, entry.name);
            const stats = await fs.promises.stat(dirPath);
            if (now - stats.mtimeMs > CONFIG.JOB_RETENTION_MS) {
              console.log(`[JobService] Removing orphaned directory: ${entry.name}`);
              await removeDir(dirPath);
              cleanedCount++;
            }
          }
        }
      }
    } catch (err) {
      console.error('[JobService] Error during filesystem cleanup sweep:', err);
    }

    return cleanedCount;
  }

  /**
   * Starts periodic cleanup interval.
   */
  private startCleanupSchedule(): void {
    if (this.cleanupTimer) return;
    this.cleanupTimer = setInterval(() => {
      this.cleanupExpiredJobs().catch((err) => {
        console.error('[JobService] Periodic cleanup error:', err);
      });
    }, CONFIG.CLEANUP_INTERVAL_MS);

    // Ensure timer doesn't prevent Node process from closing
    this.cleanupTimer.unref();
  }

  public stopCleanupSchedule(): void {
    if (this.cleanupTimer) {
      clearInterval(this.cleanupTimer);
      this.cleanupTimer = null;
    }
  }
}

export const jobService = new JobService();
