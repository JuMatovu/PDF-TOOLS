import express from 'express';
import { uploadFilesMiddleware } from '../middleware/uploadMiddleware';
import { processController } from '../controllers/processController';

export const apiRouter = express.Router();

// Health check
apiRouter.get('/health', (req, res) => {
  res.json({
    status: 'ok',
    service: 'PDFTOOL File Processing API',
    version: '1.0.0',
    timestamp: new Date().toISOString(),
  });
});

// Process upload for specific tool
apiRouter.post('/process/:toolId', uploadFilesMiddleware, (req, res) => {
  processController.handleProcess(req, res);
});

// Job tracking
apiRouter.get('/jobs/:jobId', (req, res) => {
  processController.getJobStatus(req, res);
});

// Output download
apiRouter.get('/jobs/:jobId/download/:fileIndex?', (req, res) => {
  processController.downloadOutputFile(req, res);
});

// Output inline preview
apiRouter.get('/jobs/:jobId/preview/:fileIndex?', (req, res) => {
  processController.previewOutputFile(req, res);
});

// Manual file deletion (privacy)
apiRouter.delete('/jobs/:jobId', (req, res) => {
  processController.deleteJob(req, res);
});
