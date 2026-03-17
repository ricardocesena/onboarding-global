import express from 'express';
import cors from 'cors';
import tokenRoutes from './routes/tokenRoutes';

const app = express();

// Middleware
app.use(cors());
app.use(express.json());

// Routes
app.use('/api/token', tokenRoutes);

// Root health check
app.get('/', (_req, res) => {
  res.json({
    service: 'Onboarding Global Backend',
    version: '1.0.0',
    status: 'running',
    endpoints: {
      tokenGenerate: 'POST /api/token/generate',
      tokenGenerateLocal: 'POST /api/token/generate-local',
      tokenGenerateGestor: 'POST /api/token/generate-gestor',
      publicKey: 'GET /api/token/public-key',
      tokenHealth: 'GET /api/token/health',
    },
  });
});

// Global error handler
app.use(
  (
    err: Error,
    _req: express.Request,
    res: express.Response,
    _next: express.NextFunction
  ) => {
    console.error('[App] Unhandled error:', err.message);
    res.status(500).json({
      success: false,
      error: 'Internal server error',
      details: err.message,
    });
  }
);

export default app;
