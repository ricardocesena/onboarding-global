import { config } from './config/environment';
import app from './app';

const PORT = config.port;

app.listen(PORT, () => {
  console.log(`[Server] Onboarding Global Backend running on port ${PORT}`);
  console.log(`[Server] Environment: ${config.nodeEnv}`);
  console.log(`[Server] Token KID: ${config.tokenKid}`);
  console.log(`[Server] PKM Host: ${config.hostPkm}`);
  console.log(`[Server] Gateway Host: ${config.hostGateway}`);
  console.log(`[Server] Endpoints:`);
  console.log(`  POST http://localhost:${PORT}/api/token/generate`);
  console.log(`  POST http://localhost:${PORT}/api/token/generate-local`);
  console.log(`  POST http://localhost:${PORT}/api/token/generate-gestor`);
  console.log(`  GET  http://localhost:${PORT}/api/token/public-key`);
  console.log(`  GET  http://localhost:${PORT}/api/token/health`);
});
