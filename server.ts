import dotenv from 'dotenv';
import path from 'path';
import express from 'express';
import { createServer as createViteServer } from 'vite';
import { apiRouter } from './src/server/routes/api';

// Load environment variables from .env.local, then fall back to .env
dotenv.config({ path: path.resolve(process.cwd(), '.env.local') });
dotenv.config({ path: path.resolve(process.cwd(), '.env') });

async function startServer() {
  const app = express();
  const PORT = 3000;

  // JSON Body Parser
  app.use(express.json({ limit: '10mb' }));

  // API Health Check
  app.get('/api/health', (req, res) => {
    res.json({
      status: 'ok',
      service: 'CircuDesign Multi-Agent Engine',
      geminiConnected: Boolean(process.env.GEMINI_API_KEY)
    });
  });

  // Mount API Router
  app.use('/api', apiRouter);

  // Vite Middleware for Development vs Static Serving for Production
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

  app.listen(PORT, '0.0.0.0', () => {
    console.log(`CircuDesign Server running on http://localhost:${PORT}`);
  });
}

startServer().catch(err => {
  console.error('Failed to start server:', err);
});
