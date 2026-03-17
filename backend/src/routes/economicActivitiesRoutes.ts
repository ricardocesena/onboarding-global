import { Router, Request, Response } from 'express';
import { proxyRequest } from '../services/apiProxyService';

const router = Router();

/**
 * POST /api/economic-activities/retrieve
 * Retrieves economic activities by description.
 * Used to populate the business information form.
 */
router.post('/retrieve', async (req: Request, res: Response) => {
  try {
    const result = await proxyRequest({
      method: 'POST',
      path: '/santander-mexico/intranet-core/economic_activities_accounting_sectors/retrieve_economic_activities',
      body: req.body,
    });

    res.status(result.status).json(result.data);
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : 'Unknown error';
    console.error('[EconomicActivities] Error:', message);
    res.status(502).json({
      success: false,
      error: 'Failed to retrieve economic activities',
      details: message,
    });
  }
});

export default router;
