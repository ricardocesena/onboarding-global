import { Router, Request, Response } from 'express';
import {
  generateSignedToken,
  generateGestorToken,
  generateSignedTokenLocal,
  fetchPublicKey,
} from '../services/tokenService';

const router = Router();

/**
 * POST /api/token/generate
 * Generates a new signed JWT token (full flow: PKM fetch + sign).
 * Body (optional): { "sub": "user-id" }
 */
router.post('/generate', async (req: Request, res: Response) => {
  try {
    const { sub } = req.body || {};
    const result = await generateSignedToken(sub);

    res.json({
      success: true,
      data: {
        accessToken: result.accessToken,
        expiresAt: result.expiresAt,
        expiresAtISO: new Date(result.expiresAt * 1000).toISOString(),
        jti: result.jti,
        tokenType: result.tokenType,
      },
    });
  } catch (error: any) {
    console.error('[TokenRoute] Error generating token:', error.message);
    res.status(500).json({
      success: false,
      error: 'Failed to generate token',
      details: error.message,
    });
  }
});

/**
 * POST /api/token/generate-local
 * Generates a signed JWT locally without calling PKM.
 * Useful when PKM service is unavailable.
 * Body (optional): { "sub": "user-id" }
 */
router.post('/generate-local', (req: Request, res: Response) => {
  try {
    const { sub } = req.body || {};
    const result = generateSignedTokenLocal(sub);

    res.json({
      success: true,
      data: {
        accessToken: result.accessToken,
        expiresAt: result.expiresAt,
        expiresAtISO: new Date(result.expiresAt * 1000).toISOString(),
        jti: result.jti,
        tokenType: result.tokenType,
      },
    });
  } catch (error: any) {
    console.error('[TokenRoute] Error generating local token:', error.message);
    res.status(500).json({
      success: false,
      error: 'Failed to generate local token',
      details: error.message,
    });
  }
});

/**
 * POST /api/token/generate-gestor
 * Generates a Gestor-type signed JWT token.
 * Body (optional): { "sub": "user-id" }
 */
router.post('/generate-gestor', async (req: Request, res: Response) => {
  try {
    const { sub } = req.body || {};
    const result = await generateGestorToken(sub);

    res.json({
      success: true,
      data: {
        accessToken: result.accessToken,
        expiresAt: result.expiresAt,
        expiresAtISO: new Date(result.expiresAt * 1000).toISOString(),
        jti: result.jti,
        tokenType: result.tokenType,
      },
    });
  } catch (error: any) {
    console.error('[TokenRoute] Error generating gestor token:', error.message);
    res.status(500).json({
      success: false,
      error: 'Failed to generate gestor token',
      details: error.message,
    });
  }
});

/**
 * GET /api/token/public-key
 * Fetches the public key from the PKM service.
 */
router.get('/public-key', async (_req: Request, res: Response) => {
  try {
    const publicKeyData = await fetchPublicKey();

    res.json({
      success: true,
      data: publicKeyData,
    });
  } catch (error: any) {
    console.error('[TokenRoute] Error fetching public key:', error.message);
    res.status(502).json({
      success: false,
      error: 'Failed to fetch public key from PKM',
      details: error.message,
    });
  }
});

/**
 * GET /api/token/health
 * Health check for the token service.
 */
router.get('/health', (_req: Request, res: Response) => {
  try {
    // Verify we can generate a token locally
    const result = generateSignedTokenLocal();

    res.json({
      success: true,
      message: 'Token service is healthy',
      canGenerateTokens: true,
      sampleTokenExpiry: new Date(result.expiresAt * 1000).toISOString(),
    });
  } catch (error: any) {
    res.status(500).json({
      success: false,
      message: 'Token service is unhealthy',
      canGenerateTokens: false,
      error: error.message,
    });
  }
});

export default router;
