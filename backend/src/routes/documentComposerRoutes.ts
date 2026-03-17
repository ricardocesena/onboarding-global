import { Router, Request, Response } from 'express';
import { proxyRequest } from '../services/apiProxyService';

const router = Router();

/**
 * POST /api/document-composer/compose
 * Composes and stores a document from a template.
 * Used for generating contract documents during the signing step.
 */
router.post('/compose', async (req: Request, res: Response) => {
  try {
    const result = await proxyRequest({
      method: 'POST',
      path: '/santander-mexico/intranet-core/document_composer/compose_store_document',
      body: req.body,
    });

    res.status(result.status).json(result.data);
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : 'Unknown error';
    console.error('[DocumentComposer] Error:', message);
    res.status(502).json({
      success: false,
      error: 'Failed to compose document',
      details: message,
    });
  }
});

export default router;
