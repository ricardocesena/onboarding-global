import { Router, Request, Response } from 'express';
import { proxyRequest } from '../services/apiProxyService';

const router = Router();

/**
 * POST /api/cards
 * Requests issuance of a debit card associated to the new account.
 */
router.post('/', async (req: Request, res: Response) => {
  try {
    const result = await proxyRequest({
      method: 'POST',
      path: '/santander-mexico/intranet-core/v5/cards/',
      body: req.body,
      extraHeaders: { 'accept-language': 'en-US' },
    });

    res.status(result.status).json(result.data);
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : 'Unknown error';
    console.error('[CardInformation] Error:', message);
    res.status(502).json({
      success: false,
      error: 'Failed to create card',
      details: message,
    });
  }
});

export default router;
