import { Router, Request, Response } from 'express';
import { proxyRequest } from '../services/apiProxyService';

const router = Router();

/**
 * POST /api/account-warning-blocks/:accountId/warning-blocks
 * Creates warnings or blocks on an account.
 */
router.post('/:accountId/warning-blocks', async (req: Request, res: Response) => {
  try {
    const { accountId } = req.params;
    const result = await proxyRequest({
      method: 'POST',
      path: `/santander-mexico/intranet-core/v5/account_warning_blocks/${accountId}/warning_blocks`,
      body: req.body,
    });

    res.status(result.status).json(result.data);
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : 'Unknown error';
    console.error('[AccountWarningBlocks] Error:', message);
    res.status(502).json({
      success: false,
      error: 'Failed to create warning/block',
      details: message,
    });
  }
});

export default router;
