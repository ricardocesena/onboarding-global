import { Router, Request, Response } from 'express';
import { proxyRequest } from '../services/apiProxyService';

const router = Router();

/**
 * POST /api/service-points/search-by-geolocation
 * Searches for bank branches by geolocation.
 * Used in the branch selection step of the onboarding flow.
 */
router.post('/search-by-geolocation', async (req: Request, res: Response) => {
  try {
    const result = await proxyRequest({
      method: 'POST',
      path: '/santander-mexico/intranet-core/service_point_locator/search_by_geolocation',
      body: req.body,
    });

    res.status(result.status).json(result.data);
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : 'Unknown error';
    console.error('[ServicePointLocator] Error:', message);
    res.status(502).json({
      success: false,
      error: 'Failed to search service points',
      details: message,
    });
  }
});

export default router;
