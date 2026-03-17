import { Router, Request, Response } from 'express';
import { proxyRequest } from '../services/apiProxyService';

const router = Router();

/**
 * POST /api/watchlist-screening/validate-status
 * Validates if a person/organization is on AML/PLD watchlists.
 * Used during eligibility check in the onboarding flow.
 */
router.post('/validate-status', async (req: Request, res: Response) => {
  try {
    const result = await proxyRequest({
      method: 'POST',
      path: '/santander-mexico/intranet-core/v1/watchlist_screening/validate_status',
      body: req.body,
    });

    res.status(result.status).json(result.data);
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : 'Unknown error';
    console.error('[WatchlistScreening] Error:', message);
    res.status(502).json({
      success: false,
      error: 'Failed to call watchlist screening service',
      details: message,
    });
  }
});

export default router;
