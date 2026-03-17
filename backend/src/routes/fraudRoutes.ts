import { Router, Request, Response } from 'express';
import { proxyRequest } from '../services/apiProxyService';

const router = Router();

/**
 * POST /api/fraud/evaluate
 * Evaluates fraud risk for a prospect (email, phone).
 */
router.post('/evaluate', async (req: Request, res: Response) => {
  try {
    const result = await proxyRequest({
      method: 'POST',
      path: '/santander-mexico/intranet-core/v3/fraud/evaluate_object',
      body: req.body,
    });

    res.status(result.status).json(result.data);
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : 'Unknown error';
    console.error('[Fraud] Error:', message);
    res.status(502).json({
      success: false,
      error: 'Failed to evaluate fraud',
      details: message,
    });
  }
});

export default router;
