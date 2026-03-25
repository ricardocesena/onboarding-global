import express from 'express';
import cors from 'cors';
import path from 'path';
import tokenRoutes from './routes/tokenRoutes';
import watchlistScreeningRoutes from './routes/watchlistScreeningRoutes';
import documentManagementRoutes from './routes/documentManagementRoutes';
import documentComposerRoutes from './routes/documentComposerRoutes';
import beneficiariesRoutes from './routes/beneficiariesRoutes';
import accountWarningBlocksRoutes from './routes/accountWarningBlocksRoutes';
import countriesRoutes from './routes/countriesRoutes';
import accountsRoutes from './routes/accountsRoutes';
import administrativeGeographiesRoutes from './routes/administrativeGeographiesRoutes';
import cardInformationRoutes from './routes/cardInformationRoutes';
import customerContactPointsRoutes from './routes/customerContactPointsRoutes';
import customersRoutes from './routes/customersRoutes';
import economicActivitiesRoutes from './routes/economicActivitiesRoutes';
import fraudRoutes from './routes/fraudRoutes';
import partyParametersRoutes from './routes/partyParametersRoutes';
import servicePointLocatorRoutes from './routes/servicePointLocatorRoutes';
import channelAccessRoutes from './routes/channelAccessRoutes';
import knowYourCustomerRoutes from './routes/knowYourCustomerRoutes';

const app = express();

// Middleware
app.use(cors());
app.use(express.json({ limit: '10mb' }));

// Token routes
app.use('/api/token', tokenRoutes);

// Onboarding API routes
app.use('/api/watchlist-screening', watchlistScreeningRoutes);
app.use('/api/document-management', documentManagementRoutes);
app.use('/api/document-composer', documentComposerRoutes);
app.use('/api/beneficiaries', beneficiariesRoutes);
app.use('/api/account-warning-blocks', accountWarningBlocksRoutes);
app.use('/api/countries', countriesRoutes);
app.use('/api/accounts', accountsRoutes);
app.use('/api/administrative-geographies', administrativeGeographiesRoutes);
app.use('/api/cards', cardInformationRoutes);
app.use('/api/customer-contact-points', customerContactPointsRoutes);
app.use('/api/customers', customersRoutes);
app.use('/api/economic-activities', economicActivitiesRoutes);
app.use('/api/fraud', fraudRoutes);
app.use('/api/party-parameters', partyParametersRoutes);
app.use('/api/service-points', servicePointLocatorRoutes);
app.use('/api/channel-access', channelAccessRoutes);
app.use('/api/kyc', knowYourCustomerRoutes);

// Serve frontend static files (production mode)
const frontendPath = path.join(__dirname, '..', '..', 'frontend');
app.use(express.static(frontendPath));

// Health check (only at /api/health so it doesn't conflict with frontend)
app.get('/api/health', (_req, res) => {
  res.json({ service: 'Onboarding Global Backend', version: '2.0.0', status: 'running' });
});

// SPA fallback: any non-API route serves index.html
app.use((req, res, next) => {
  if (req.method !== 'GET' || req.path.startsWith('/api/')) return next();
  res.sendFile(path.join(frontendPath, 'index.html'));
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
