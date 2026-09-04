import path from 'path';

export const CONFIG = {
  PORT: 3000,
  HOST: '0.0.0.0',
  // Root directory for temporary processing
  TEMP_ROOT: path.join(process.cwd(), 'temp'),
  // Max individual upload file size (50MB)
  MAX_FILE_SIZE_BYTES: 50 * 1024 * 1024,
  // Max total files per processing job
  MAX_FILES_PER_JOB: 20,
  // Retention period before temporary files are purged (30 minutes)
  JOB_RETENTION_MS: 30 * 60 * 1000,
  // Periodic cleanup interval (every 2 minutes)
  CLEANUP_INTERVAL_MS: 2 * 60 * 1000,
};
