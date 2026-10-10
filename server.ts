import express from 'express';
import http from 'http';
import path from 'path';
import { createServer as createViteServer } from 'vite';
import { app } from './server/app.js';
import { ensureDatabaseReady } from './server/config/database.js';
import { initializeSocketIO } from './server/sockets/socketHandler.js';

async function startServer() {
  const PORT = process.env.PORT ? parseInt(process.env.PORT, 10) : 3000;
  const httpServer = http.createServer(app);

  // Initialize real-time Socket.IO communication
  initializeSocketIO(httpServer);

  // Initialize database on startup
  try {
    await ensureDatabaseReady();
    console.log('✅ Arogyavahini Database initialized and verified successfully.');
  } catch (err) {
    console.error('❌ Failed to initialize database:', err);
  }

  // Vite middleware for development vs Static files for production
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

  httpServer.listen(PORT, '0.0.0.0', () => {
    console.log(`🚑 Arogyavahini Server listening at http://0.0.0.0:${PORT}`);
  });
}

startServer();
