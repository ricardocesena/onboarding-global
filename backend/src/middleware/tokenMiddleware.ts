import { Request, Response, NextFunction } from 'express';
import { generateSignedToken, generateSignedTokenLocal } from '../services/tokenService';

/**
 * Express middleware that generates a fresh signed JWT token before each API call.
 * The token is attached to the request object for downstream handlers to use.
 * 
 * Since the token expires, a new one is generated for every request.
 */
export async function attachToken(
  req: Request,
  _res: Response,
  next: NextFunction
): Promise<void> {
  try {
    const result = await generateSignedToken();
    // Attach the token to the request for downstream use
    (req as any).signedToken = result.accessToken;
    (req as any).tokenInfo = result;
    next();
  } catch (error) {
    console.warn(
      '[TokenMiddleware] Full token generation failed, falling back to local signing'
    );
    try {
      const localResult = generateSignedTokenLocal();
      (req as any).signedToken = localResult.accessToken;
      (req as any).tokenInfo = localResult;
      next();
    } catch (localError) {
      console.error('[TokenMiddleware] Token generation failed completely:', localError);
      next(localError);
    }
  }
}
