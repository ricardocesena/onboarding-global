import { Router, Request, Response } from 'express';
import { proxyRequest } from '../services/apiProxyService';

const router = Router();

/**
 * POST /api/customers
 * Creates a new customer record in the core banking system.
 * Fundamental API of the onboarding flow.
 */
router.post('/', async (req: Request, res: Response) => {
  try {
    const result = await proxyRequest({
      method: 'POST',
      path: '/santander-mexico/intranet-core/v5/customers/',
      body: req.body,
    });

    res.status(result.status).json(result.data);
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : 'Unknown error';
    console.error('[Customers] Error:', message);
    res.status(502).json({
      success: false,
      error: 'Failed to create customer',
      details: message,
    });
  }
});

export default router;
