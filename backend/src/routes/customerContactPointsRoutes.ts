import { Router, Request, Response } from 'express';
import { proxyRequest } from '../services/apiProxyService';

const router = Router();

/**
 * POST /api/customer-contact-points/:customerId/contact-points
 * Registers a customer's postal address.
 * Used after document validation in the onboarding flow.
 */
router.post('/:customerId/contact-points', async (req: Request, res: Response) => {
  try {
    const { customerId } = req.params;
    const result = await proxyRequest({
      method: 'POST',
      path: `/santander-mexico/intranet-core/v2/customer_contact_points/${customerId}/contact_points`,
      body: req.body,
    });

    res.status(result.status).json(result.data);
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : 'Unknown error';
    console.error('[CustomerContactPoints] Error:', message);
    res.status(502).json({
      success: false,
      error: 'Failed to create contact point',
      details: message,
    });
  }
});

export default router;
