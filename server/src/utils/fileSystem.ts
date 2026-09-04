import fs from 'fs';
import path from 'path';
import { CONFIG } from '../config';

/**
 * Sanitizes a filename to prevent path traversal and illegal characters.
 * Never trust filename supplied by the browser.
 */
export function sanitizeFilename(originalName: string): string {
  // Strip any directory path components
  const baseName = path.basename(originalName);
  // Remove null bytes and control chars
  const cleanName = baseName.replace(/[\0\x00-\x1f\x7f-\x9f]/g, '');
  // Separate extension
  const ext = path.extname(cleanName).toLowerCase().replace(/[^a-z0-9.]/g, '');
  const nameWithoutExt = path.basename(cleanName, ext);

  // Strip illegal filesystem characters: / \ : * ? " < > | and spaces to underscores
  const safeBase = nameWithoutExt
    .replace(/[^a-zA-Z0-9_\-\.]/g, '_')
    .replace(/_{2,}/g, '_')
    .replace(/^_+|_+$/g, '')
    .slice(0, 80);

  const finalName = safeBase ? `${safeBase}${ext}` : `file_${Date.now()}${ext}`;
  return finalName;
}

/**
 * Ensures a directory exists, creating parents if necessary.
 */
export async function ensureDir(dirPath: string): Promise<void> {
  await fs.promises.mkdir(dirPath, { recursive: true });
}

/**
 * Safely removes a directory and all its contents recursively.
 */
export async function removeDir(dirPath: string): Promise<void> {
  try {
    if (fs.existsSync(dirPath)) {
      await fs.promises.rm(dirPath, { recursive: true, force: true });
    }
  } catch (err) {
    console.error(`[FileSystem] Failed to remove directory ${dirPath}:`, err);
  }
}

/**
 * Safely removes a file if it exists.
 */
export async function removeFile(filePath: string): Promise<void> {
  try {
    if (fs.existsSync(filePath)) {
      await fs.promises.unlink(filePath);
    }
  } catch (err) {
    console.error(`[FileSystem] Failed to remove file ${filePath}:`, err);
  }
}

/**
 * Resolves job directory structure for temporary file storage:
 * temp/
 *   [jobId]/
 *     uploads/
 *     processing/
 *     outputs/
 */
export function getJobDirs(jobId: string) {
  // Sanitize jobId to prevent path traversal
  const safeJobId = jobId.replace(/[^a-zA-Z0-9_-]/g, '');
  const jobDir = path.join(CONFIG.TEMP_ROOT, safeJobId);
  return {
    jobDir,
    uploadsDir: path.join(jobDir, 'uploads'),
    processingDir: path.join(jobDir, 'processing'),
    outputsDir: path.join(jobDir, 'outputs'),
  };
}

/**
 * Validates image header magic bytes to ensure file is genuinely an image.
 */
export async function validateImageMagicBytes(filePath: string): Promise<boolean> {
  try {
    const buffer = Buffer.alloc(12);
    const fd = await fs.promises.open(filePath, 'r');
    await fd.read(buffer, 0, 12, 0);
    await fd.close();

    // JPEG: FF D8 FF
    if (buffer[0] === 0xff && buffer[1] === 0xd8 && buffer[2] === 0xff) {
      return true;
    }

    // PNG: 89 50 4E 47 0D 0A 1A 0A
    if (
      buffer[0] === 0x89 &&
      buffer[1] === 0x50 &&
      buffer[2] === 0x4e &&
      buffer[3] === 0x47 &&
      buffer[4] === 0x0d &&
      buffer[5] === 0x0a &&
      buffer[6] === 0x1a &&
      buffer[7] === 0x0a
    ) {
      return true;
    }

    // WebP: RIFF ... WEBP
    if (
      buffer.toString('ascii', 0, 4) === 'RIFF' &&
      buffer.toString('ascii', 8, 12) === 'WEBP'
    ) {
      return true;
    }

    return false;
  } catch (err) {
    console.error(`[FileSystem] Error inspecting magic bytes for ${filePath}:`, err);
    return false;
  }
}

/**
 * Validates PDF header magic bytes to ensure file is genuinely a PDF.
 * PDF specification dictates header starts with %PDF- (0x25 0x50 0x44 0x46 0x2d)
 */
export async function validatePdfMagicBytes(filePath: string): Promise<boolean> {
  try {
    const buffer = Buffer.alloc(8);
    const fd = await fs.promises.open(filePath, 'r');
    await fd.read(buffer, 0, 8, 0);
    await fd.close();

    const header = buffer.toString('ascii', 0, 5);
    return header === '%PDF-';
  } catch (err) {
    console.error(`[FileSystem] Error inspecting PDF magic bytes for ${filePath}:`, err);
    return false;
  }
}
