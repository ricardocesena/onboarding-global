import { Router, Request, Response } from 'express';
import { proxyRequest } from '../services/apiProxyService';

const router = Router();

/**
 * GET /api/countries
 * Retrieves country catalog. Supports filtering by query params.
 * Query params (all optional): code, iso_alpha2, iso_alpha3, iso_numeric, internal
 */
router.get('/', async (req: Request, res: Response) => {
  try {
    const queryParams: Record<string, string> = {};
    const allowedParams = ['code', 'iso_alpha2', 'iso_alpha3', 'iso_numeric', 'internal'];

    for (const param of allowedParams) {
      if (req.query[param]) {
        queryParams[param] = req.query[param] as string;
      }
    }

    const result = await proxyRequest({
      method: 'GET',
      path: '/santander-mexico/intranet-core/v2/countries/',
      queryParams,
    });

    res.status(result.status).json(result.data);
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : 'Unknown error';
    console.error('[Countries] Error:', message);
    res.status(502).json({
      success: false,
      error: 'Failed to fetch countries',
      details: message,
    });
  }
});

export default router;
