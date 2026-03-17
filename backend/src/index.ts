import { config } from './config/environment';
import app from './app';

const PORT = config.port;

app.listen(PORT, () => {
  console.log(`[Server] Onboarding Global Backend running on port ${PORT}`);
  console.log(`[Server] Environment: ${config.nodeEnv}`);
  console.log(`[Server] Upstream PRE Host: ${config.hostPre}`);
  console.log(`[Server] Endpoints:`);
  console.log(`  --- Token ---`);
  console.log(`  POST http://localhost:${PORT}/api/token/generate`);
  console.log(`  POST http://localhost:${PORT}/api/token/generate-local`);
  console.log(`  POST http://localhost:${PORT}/api/token/generate-gestor`);
  console.log(`  GET  http://localhost:${PORT}/api/token/public-key`);
  console.log(`  GET  http://localhost:${PORT}/api/token/health`);
  console.log(`  --- Onboarding APIs ---`);
  console.log(`  POST http://localhost:${PORT}/api/watchlist-screening/validate-status`);
  console.log(`  POST http://localhost:${PORT}/api/document-management/upload`);
  console.log(`  POST http://localhost:${PORT}/api/document-composer/compose`);
  console.log(`  GET  http://localhost:${PORT}/api/beneficiaries/:accountId`);
  console.log(`  POST http://localhost:${PORT}/api/account-warning-blocks/:accountId/warning-blocks`);
  console.log(`  GET  http://localhost:${PORT}/api/countries`);
  console.log(`  POST http://localhost:${PORT}/api/accounts`);
  console.log(`  GET  http://localhost:${PORT}/api/administrative-geographies/districts`);
  console.log(`  POST http://localhost:${PORT}/api/cards`);
  console.log(`  POST http://localhost:${PORT}/api/customer-contact-points/:customerId/contact-points`);
  console.log(`  POST http://localhost:${PORT}/api/customers`);
  console.log(`  POST http://localhost:${PORT}/api/economic-activities/retrieve`);
  console.log(`  POST http://localhost:${PORT}/api/fraud/evaluate`);
  console.log(`  GET  http://localhost:${PORT}/api/party-parameters/:parameterId`);
  console.log(`  POST http://localhost:${PORT}/api/service-points/search-by-geolocation`);
  console.log(`  POST http://localhost:${PORT}/api/channel-access/:agreementId/unblock`);
  console.log(`  POST http://localhost:${PORT}/api/kyc/risk-score`);
});
