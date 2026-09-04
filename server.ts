import express from 'express';
import path from 'path';
import { createServer as createViteServer } from 'vite';
import { apiRouter } from './server/src/routes/api';
import { CONFIG } from './server/src/config';
import { jobService } from './server/src/services/jobService';

async function startServer() {
  const app = express();
  const PORT = CONFIG.PORT;

  // Global middlewares for parsing
  app.use(express.json());
  app.use(express.urlencoded({ extended: true }));

  // Request logging in development
  app.use((req, res, next) => {
    if (req.path.startsWith('/api')) {
      console.log(`[API] ${req.method} ${req.path}`);
    }
    next();
  });

  // Mount API routes FIRST
  app.use('/api', apiRouter);

  // Explicit API 404 handler to prevent API routes from falling through to HTML SPA
  app.all('/api/*', (req, res) => {
    res.status(404).json({ error: `API endpoint not found: ${req.method} ${req.path}` });
  });

  // Vite middleware for development or static serving for production
  if (process.env.NODE_ENV !== 'production') {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: 'spa',
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), 'dist');
    app.use(express.static(distPath));
    app.get('*', (req, res) => {
      res.sendFile(path.join(distPath, 'index.html'));
    });
  }

  const server = app.listen(PORT, CONFIG.HOST, () => {
    console.log(`PDFTOOL Server running on http://${CONFIG.HOST}:${PORT}`);
  });

  // Graceful shutdown handling
  const shutdown = async () => {
    console.log('[Server] Shutting down gracefully...');
    jobService.stopCleanupSchedule();
    await jobService.cleanupExpiredJobs();
    server.close(() => {
      process.exit(0);
    });
  };

  process.on('SIGTERM', shutdown);
  process.on('SIGINT', shutdown);
}

startServer().catch((err) => {
  console.error('[Server] Startup error:', err);
  process.exit(1);
});
