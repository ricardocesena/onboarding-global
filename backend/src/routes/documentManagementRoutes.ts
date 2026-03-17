import { Router, Request, Response } from 'express';
import { proxyRequest } from '../services/apiProxyService';

const router = Router();

/**
 * POST /api/document-management/upload
 * Uploads a document to the document management service.
 * Used for Constancia Fiscal and Comprobante de Domicilio.
 */
router.post('/upload', async (req: Request, res: Response) => {
  try {
    const result = await proxyRequest({
      method: 'POST',
      path: '/santander-mexico/intranet-core/v2/document_management/upload_document',
      body: req.body,
    });

    res.status(result.status).json(result.data);
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : 'Unknown error';
    console.error('[DocumentManagement] Error:', message);
    res.status(502).json({
      success: false,
      error: 'Failed to upload document',
      details: message,
    });
  }
});

export default router;
