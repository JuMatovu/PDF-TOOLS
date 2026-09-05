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
const PDF_CONFIG = {
  extensions: ['.pdf'],
  mimes: [
    'application/pdf',
    'application/x-pdf',
    'application/acrobat',
    'applications/vnd.pdf',
    'text/pdf',
    'text/x-pdf',
    'application/octet-stream',
    'binary/octet-stream',
  ],
};

const IMAGE_CONFIG = {
  extensions: ['.jpg', '.jpeg', '.png', '.webp', '.bmp', '.tiff', '.gif'],
  mimes: [
    'image/jpeg',
    'image/png',
    'image/webp',
    'image/bmp',
    'image/tiff',
    'image/gif',
    'image/x-png',
    'image/pjpeg',
    'application/octet-stream',
  ],
};

const OFFICE_DOC_CONFIG = {
  extensions: ['.docx', '.doc', '.pdf'],
  mimes: [
    'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
    'application/msword',
    'application/pdf',
    'application/octet-stream',
  ],
};

const OFFICE_PPT_CONFIG = {
  extensions: ['.pptx', '.ppt', '.pdf'],
  mimes: [
    'application/vnd.openxmlformats-officedocument.presentationml.presentation',
    'application/vnd.ms-powerpoint',
    'application/pdf',
    'application/octet-stream',
  ],
};

const OFFICE_SHEET_CONFIG = {
  extensions: ['.xlsx', '.xls', '.csv', '.pdf'],
  mimes: [
    'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
    'application/vnd.ms-excel',
    'text/csv',
    'application/pdf',
    'application/octet-stream',
  ],
};

const HTML_CONFIG = {
  extensions: ['.html', '.htm', '.zip', '.pdf'],
  mimes: ['text/html', 'application/zip', 'application/pdf', 'application/octet-stream'],
};

const TEXT_DOC_CONFIG = {
  extensions: ['.pdf', '.docx', '.txt', '.md'],
  mimes: ['application/pdf', 'text/plain', 'text/markdown', 'application/octet-stream'],
};

const ALLOWED_TYPES_BY_TOOL: Record<string, { extensions: string[]; mimes: string[] }> = {
  // Image to PDF
  'jpg-to-pdf': IMAGE_CONFIG,
  'image-to-pdf': IMAGE_CONFIG,
  'png-to-pdf': IMAGE_CONFIG,
  'scan-to-pdf': {
    extensions: ['.jpg', '.jpeg', '.png', '.pdf'],
    mimes: [...IMAGE_CONFIG.mimes, ...PDF_CONFIG.mimes],
  },

  // Document conversions to PDF
  'word-to-pdf': OFFICE_DOC_CONFIG,
  'powerpoint-to-pdf': OFFICE_PPT_CONFIG,
  'excel-to-pdf': OFFICE_SHEET_CONFIG,
  'html-to-pdf': HTML_CONFIG,

  // Text / AI tools
  'ai-summarizer': TEXT_DOC_CONFIG,

  // All PDF tools
  'merge-pdf': PDF_CONFIG,
  'split-pdf': PDF_CONFIG,
  'extract-pages': PDF_CONFIG,
  'rotate-pdf': PDF_CONFIG,
  'compress-pdf': PDF_CONFIG,
  'remove-pages': PDF_CONFIG,
  'organize-pdf': PDF_CONFIG,
  'add-page-numbers': PDF_CONFIG,
  'add-watermark': PDF_CONFIG,
  'crop-pdf': PDF_CONFIG,
  'unlock-pdf': PDF_CONFIG,
  'protect-pdf': PDF_CONFIG,
  'sign-pdf': PDF_CONFIG,
  'redact-pdf': PDF_CONFIG,
  'pdf-to-jpg': PDF_CONFIG,
  'pdf-to-word': PDF_CONFIG,
  'pdf-to-powerpoint': PDF_CONFIG,
  'pdf-to-pdfa': PDF_CONFIG,
  'translate-pdf': PDF_CONFIG,
  'pdf-to-markdown': PDF_CONFIG,
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
  const toolId = req.params.toolId?.toLowerCase() || 'merge-pdf';
  const allowed = ALLOWED_TYPES_BY_TOOL[toolId] || PDF_CONFIG;

  const ext = path.extname(file.originalname).toLowerCase();
  const mime = file.mimetype?.toLowerCase() || '';

  // Validate extension
  if (!allowed.extensions.includes(ext)) {
    return cb(
      new Error(
        `Invalid file type "${ext}". Supported formats for this tool: ${allowed.extensions.join(', ')}`
      )
    );
  }

  // Validate MIME type
  if (mime && !allowed.mimes.includes(mime) && mime !== 'application/octet-stream') {
    return cb(
      new Error(
        `Unexpected MIME type "${mime}". Please upload valid ${allowed.extensions.join(', ')} files.`
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
