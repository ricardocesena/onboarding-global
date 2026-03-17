import { Router, Request, Response } from 'express';
import { proxyRequest } from '../services/apiProxyService';

const router = Router();

/**
 * POST /api/channel-access/:agreementId/unblock
 * Unblocks channel access for a new customer (e-banking, app, etc.).
 */
router.post('/:agreementId/unblock', async (req: Request, res: Response) => {
  try {
    const { agreementId } = req.params;
    const result = await proxyRequest({
      method: 'POST',
      path: `/santander-mexico/intranet-core/v3/channel_access_agreements/${agreementId}/unblock_channels`,
      body: req.body,
      extraHeaders: { 'accept-language': 'en-US' },
    });

    res.status(result.status).json(result.data);
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : 'Unknown error';
    console.error('[ChannelAccess] Error:', message);
    res.status(502).json({
      success: false,
      error: 'Failed to unblock channels',
      details: message,
    });
  }
});

export default router;
