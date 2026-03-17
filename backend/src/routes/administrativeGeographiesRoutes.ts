import { Router, Request, Response } from 'express';
import { proxyRequest } from '../services/apiProxyService';

const router = Router();

/**
 * GET /api/administrative-geographies/districts
 * Retrieves districts (colonias) by postal code.
 * Used to auto-complete address information.
 * Required query params: country_code, post_code
 */
router.get('/districts', async (req: Request, res: Response) => {
  try {
    const queryParams: Record<string, string> = {};

    if (req.query.country_code) {
      queryParams.country_code = req.query.country_code as string;
    }
    if (req.query.post_code) {
      queryParams.post_code = req.query.post_code as string;
    }

    const result = await proxyRequest({
      method: 'GET',
      path: '/santander-mexico/intranet-core/administrative_geographies/districts',
      queryParams,
      extraHeaders: { 'accept-language': 'en-US' },
    });

    res.status(result.status).json(result.data);
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : 'Unknown error';
    console.error('[AdministrativeGeographies] Error:', message);
    res.status(502).json({
      success: false,
      error: 'Failed to fetch districts',
      details: message,
    });
  }
});

export default router;
