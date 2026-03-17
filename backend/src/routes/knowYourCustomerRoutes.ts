import { Router, Request, Response } from 'express';
import { proxyRequest } from '../services/apiProxyService';

const router = Router();

/**
 * POST /api/kyc/risk-score
 * Calculates KYC risk score for a prospect.
 * Determines if the prospect can continue onboarding.
 */
router.post('/risk-score', async (req: Request, res: Response) => {
  try {
    const result = await proxyRequest({
      method: 'POST',
      path: '/santander-mexico/intranet-core/v6/know_your_customer/risk_score',
      body: req.body,
    });

    res.status(result.status).json(result.data);
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : 'Unknown error';
    console.error('[KnowYourCustomer] Error:', message);
    res.status(502).json({
      success: false,
      error: 'Failed to calculate KYC risk score',
      details: message,
    });
  }
});

export default router;
