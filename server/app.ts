/**
 * ==============================================================================
 * PROJECT: AROGYAVAHINI
 * MODULE:  Express Application Configuration
 * ==============================================================================
 * Shared Express application used by both server.ts (standalone Node / dev server)
 * and api/index.ts (Vercel Serverless Function).
 */

import express, { Express } from 'express';
import cors from 'cors';
import { apiRouter } from './routes.js';
import { getDb } from './db.js';

export function createApp(): Express {
  const app = express();

  // Middleware
  app.use(cors({
    origin: '*',
    methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization', 'x-user-role'],
  }));
  app.use(express.json({ limit: '10mb' }));
  app.use(express.urlencoded({ extended: true }));

  // Request logger for debugging in development & production logs
  app.use((req, res, next) => {
    if (req.path.startsWith('/api')) {
      console.log(`[API] ${req.method} ${req.path}`);
    }
    next();
  });

  // REST API Routes
  // 1. Mount on standard /api prefix
  app.use('/api', apiRouter);

  // 2. Mount on root / as universal fallback for serverless rewrites where /api is stripped
  app.use('/', apiRouter);

  // Health check endpoint
  app.get(['/api/health', '/health'], (req, res) => {
    res.json({
      status: 'healthy',
      system: 'Arogyavahini – Smart Integrated Emergency Medical Response System',
      version: '2.0.0',
      timestamp: new Date().toISOString(),
    });
  });

  // 404 JSON Handler for unmatched API routes - guarantees no HTML 404 is returned to API callers
  app.use((req, res, next) => {
    const isApi = 
      req.path.startsWith('/api') ||
      req.path.startsWith('/auth') ||
      req.path.startsWith('/emergency') ||
      req.path.startsWith('/ambulances') ||
      req.path.startsWith('/hospitals') ||
      req.path.startsWith('/notifications') ||
      req.path.startsWith('/stats') ||
      req.path.startsWith('/patient') ||
      req.path.startsWith('/users') ||
      req.headers.accept?.includes('application/json');

    if (isApi) {
      return res.status(404).json({
        error: `API endpoint not found: ${req.method} ${req.originalUrl || req.path}`,
        status: 404,
        timestamp: new Date().toISOString(),
      });
    }
    next();
  });

  // Global Error Handler - returns clean JSON error response, avoiding raw stack traces/HTML
  app.use((err: any, req: express.Request, res: express.Response, next: express.NextFunction) => {
    console.error(`[API Server Error] ${req.method} ${req.url}:`, err);
    res.status(err.status || 500).json({
      error: err.message || 'Internal Server Error',
      status: err.status || 500,
      timestamp: new Date().toISOString(),
    });
  });

  return app;
}

export const app = createApp();
