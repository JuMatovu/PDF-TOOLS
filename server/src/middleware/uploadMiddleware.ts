import multer from 'multer';
import path from 'path';
import crypto from 'crypto';
import fs from 'fs';
import { Request, Response, NextFunction } from 'express';
import { CONFIG } from '../config';
import { sanitizeFilename } from '../utils/fileSystem';

// Ensure base temp directory exists
if (!fs.existsSync(CONFIG.TEMP_ROOT)) {
  fs.mkdirSync(CONFIG.TEMP_ROOT, { recursive: true });
}

const stagingDir = path.join(CONFIG.TEMP_ROOT, '_staging');
if (!fs.existsSync(stagingDir)) {
  fs.mkdirSync(stagingDir, { recursive: true });
}

// Allowed extensions and MIME types mapping for tools
const ALLOWED_TYPES_BY_TOOL: Record<string, { extensions: string[]; mimes: string[] }> = {
  'jpg-to-pdf': {
    extensions: ['.jpg', '.jpeg', '.png', '.webp'],
    mimes: ['image/jpeg', 'image/png', 'image/webp', 'image/x-png', 'image/pjpeg'],
  },
  'image-to-pdf': {
    extensions: ['.jpg', '.jpeg', '.png', '.webp'],
    mimes: ['image/jpeg', 'image/png', 'image/webp', 'image/x-png', 'image/pjpeg'],
  },
  'merge-pdf': {
    extensions: ['.pdf'],
    mimes: ['application/pdf', 'application/x-pdf'],
  },
  'split-pdf': {
    extensions: ['.pdf'],
    mimes: ['application/pdf', 'application/x-pdf'],
  },
  'rotate-pdf': {
    extensions: ['.pdf'],
    mimes: ['application/pdf', 'application/x-pdf'],
  },
};

const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, stagingDir);
  },
  filename: (req, file, cb) => {
    const ext = path.extname(file.originalname).toLowerCase().replace(/[^a-z0-9.]/g, '');
    const safeUniqueName = `upload_${Date.now()}_${crypto.randomBytes(8).toString('hex')}${ext}`;
    cb(null, safeUniqueName);
  },
});

const fileFilter = (req: Request, file: Express.Multer.File, cb: multer.FileFilterCallback) => {
  const toolId = req.params.toolId?.toLowerCase() || 'jpg-to-pdf';
  const allowed = ALLOWED_TYPES_BY_TOOL[toolId] || ALLOWED_TYPES_BY_TOOL['jpg-to-pdf'];

  const ext = path.extname(file.originalname).toLowerCase();
  const mime = file.mimetype.toLowerCase();

  // Validate extension
  if (!allowed.extensions.includes(ext)) {
    return cb(
      new Error(
        `Invalid file type "${ext}". Supported formats for this tool: ${allowed.extensions.join(', ')}`
      )
    );
  }

  // Validate MIME type
  if (!allowed.mimes.includes(mime)) {
    return cb(
      new Error(
        `Unexpected MIME type "${mime}". Please upload genuine image files (${allowed.extensions.join(', ')}).`
      )
    );
  }

  // Check for path traversal in originalname
  if (file.originalname.includes('..') || file.originalname.includes('/') || file.originalname.includes('\\')) {
    return cb(new Error('Invalid filename: path traversal characters detected.'));
  }

  cb(null, true);
};

const multerInstance = multer({
  storage,
  limits: {
    fileSize: CONFIG.MAX_FILE_SIZE_BYTES, // 50MB
    files: CONFIG.MAX_FILES_PER_JOB, // 20 files
  },
  fileFilter,
});

/**
 * Middleware wrapper to handle multer errors cleanly with JSON response
 */
export const uploadFilesMiddleware = (req: Request, res: Response, next: NextFunction) => {
  const upload = multerInstance.array('files', CONFIG.MAX_FILES_PER_JOB);

  upload(req, res, (err: any) => {
    if (err instanceof multer.MulterError) {
      if (err.code === 'LIMIT_FILE_SIZE') {
        return res.status(400).json({
          error: `File too large. Maximum supported file size is ${CONFIG.MAX_FILE_SIZE_BYTES / (1024 * 1024)}MB.`,
        });
      }
      if (err.code === 'LIMIT_FILE_COUNT') {
        return res.status(400).json({
          error: `Too many files. Maximum allowed files per upload is ${CONFIG.MAX_FILES_PER_JOB}.`,
        });
      }
      return res.status(400).json({
        error: `Upload error: ${err.message}`,
      });
    } else if (err) {
      return res.status(400).json({
        error: err.message || 'File upload rejected due to validation failure.',
      });
    }

    next();
  });
};
