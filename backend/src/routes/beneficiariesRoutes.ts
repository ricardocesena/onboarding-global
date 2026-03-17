import { Router, Request, Response } from 'express';
import { proxyRequest } from '../services/apiProxyService';

const router = Router();

/**
 * GET /api/beneficiaries/:accountId
 * Retrieves post-mortem beneficiaries for an account.
 * Used in the personalization step of the onboarding flow.
 */
router.get('/:accountId', async (req: Request, res: Response) => {
  try {
    const { accountId } = req.params;
    const result = await proxyRequest({
      method: 'GET',
      path: `/santander-mexico/intranet-core/v1/account_post_mortem_beneficiaries/${accountId}/beneficiaries`,
    });

    res.status(result.status).json(result.data);
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : 'Unknown error';
    console.error('[Beneficiaries] Error:', message);
    res.status(502).json({
      success: false,
      error: 'Failed to fetch beneficiaries',
      details: message,
    });
  }
});

export default router;
