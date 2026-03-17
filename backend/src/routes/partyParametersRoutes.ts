import { Router, Request, Response } from 'express';
import { proxyRequest } from '../services/apiProxyService';

const router = Router();

/**
 * GET /api/party-parameters/:parameterId
 * Retrieves parameter catalogs (e.g. civil_status, genders, etc.).
 * Used to populate dropdown fields in onboarding forms.
 */
router.get('/:parameterId', async (req: Request, res: Response) => {
  try {
    const { parameterId } = req.params;
    const result = await proxyRequest({
      method: 'GET',
      path: `/santander-mexico/intranet-core/party_parameters/${parameterId}`,
    });

    res.status(result.status).json(result.data);
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : 'Unknown error';
    console.error('[PartyParameters] Error:', message);
    res.status(502).json({
      success: false,
      error: 'Failed to fetch party parameters',
      details: message,
    });
  }
});

export default router;
