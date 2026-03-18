import jwt from 'jsonwebtoken';
import crypto from 'crypto';
import axios from 'axios';
import https from 'https';
import { config } from '../config/environment';

const httpsAgent = new https.Agent({ rejectUnauthorized: false });
import {
  TokenPayload,
  GestorTokenPayload,
  PublicKeyResponse,
  SignedTokenResult,
} from '../types/token';

// Default audiences for the onboarding flow
const DEFAULT_AUDIENCES = [
  'watchlist_screening',
  'party_parameters',
  'cstacce',
  'accounts',
  'card_information',
  'administrative_geographies',
  'customer_contact_points',
  'customers',
  'account_post_mortem_beneficiaries',
  'countries',
  'customer_position',
  'terdep',
  'comrep',
  'fraeva',
  'currac',
  'cor',
  'idevadm',
  'crcard',
  'caraut',
  'loan',
  'prdm',
  'legentdir',
  'serord',
  'cusaccent',
];

const GESTOR_AUDIENCES = ['docser'];

/**
 * Fetches the public key from the PKM (Public Key Manager) service.
 * This is the first step: GET {{host_pkm}}/{{token_kid}}
 */
export async function fetchPublicKey(): Promise<PublicKeyResponse> {
  const url = `${config.hostPkm}/${config.tokenKid}`;
  console.log(`[TokenService] Fetching public key from: ${url}`);

  try {
    const response = await axios.get<PublicKeyResponse>(url, {
      headers: { 'Content-Type': 'application/json' },
      timeout: 10000,
      httpsAgent,
    });

    console.log('[TokenService] Public key fetched successfully');
    return response.data;
  } catch (error) {
    if (axios.isAxiosError(error)) {
      console.error(
        `[TokenService] Failed to fetch public key: ${error.message}`,
        error.response?.status,
        error.response?.data
      );
    }
    throw error;
  }
}

/**
 * Builds the JWT payload for the standard onboarding token.
 */
function buildTokenPayload(sub?: string): TokenPayload {
  const currentTimestamp = Math.floor(Date.now() / 1000);
  const jti = crypto.randomUUID();

  return {
    cid_tp: config.apicClientId,
    sub: sub || '56750135',
    iss: config.apicIss,
    aud: DEFAULT_AUDIENCES,
    exp: currentTimestamp + 60 * 5 * 240 * 10, // ~200 hours
    jti,
    iat: currentTimestamp,
    nbf: currentTimestamp,
    scope: config.apicScope,
    client_id: config.apicClientId,
    cid: config.apicClientId,
    channel_tp: 'OBD',
  };
}

/**
 * Builds the JWT payload for the Gestor token variant.
 */
function buildGestorTokenPayload(sub?: string): GestorTokenPayload {
  const currentTimestamp = Math.floor(Date.now() / 1000);

  return {
    sub: sub || '56750135',
    aud: GESTOR_AUDIENCES,
    nbf: currentTimestamp,
    iss: config.apicIss,
    exp: currentTimestamp + 60 * 5 * 240 * 10,
    iat: currentTimestamp,
    client_id: 'e6426594-a568-45e6-a432-270dbcac5e61',
  };
}

/**
 * Signs a JWT token with the RSA private key using RS256.
 * This is the second step: sign the payload with the private key.
 */
function signToken(payload: TokenPayload | GestorTokenPayload): string {
  const header = {
    alg: config.tokenAlg,
    typ: config.tokenType,
    kid: config.tokenKid,
  };

  const token = jwt.sign(payload, config.privateKey, {
    algorithm: 'RS256',
    header,
  });

  return token;
}

/**
 * Generates and signs a new access token for API calls.
 * Flow:
 *   1. Fetch public key from PKM service (validates connectivity / gets session)
 *   2. Build the JWT payload with current timestamps
 *   3. Sign the JWT with the RSA private key (RS256)
 *   4. Return the Bearer token ready for use
 *
 * Because the token expires, this must be called before each API request.
 */
export async function generateSignedToken(
  sub?: string
): Promise<SignedTokenResult> {
  // Step 1: Fetch public key from PKM (validates the key ID and gets session info)
  let publicKeyData: PublicKeyResponse | null = null;
  try {
    publicKeyData = await fetchPublicKey();
    console.log('[TokenService] PKM session validated');
  } catch (error) {
    console.warn(
      '[TokenService] PKM service unavailable, proceeding with local signing only'
    );
  }

  // Step 2: Build payload
  const payload = buildTokenPayload(sub);

  // Step 3: Sign the token with private key
  const signedJwt = signToken(payload);

  console.log(`[TokenService] Token generated, jti: ${payload.jti}`);
  console.log(
    `[TokenService] Token expires at: ${new Date(payload.exp * 1000).toISOString()}`
  );

  return {
    accessToken: `Bearer ${signedJwt}`,
    expiresAt: payload.exp,
    jti: payload.jti,
    tokenType: 'Bearer',
  };
}

/**
 * Generates and signs a Gestor token variant.
 * Same flow but with the Gestor-specific payload and client_id.
 */
export async function generateGestorToken(
  sub?: string
): Promise<SignedTokenResult> {
  try {
    await fetchPublicKey();
  } catch {
    console.warn(
      '[TokenService] PKM service unavailable for gestor token, proceeding with local signing'
    );
  }

  const payload = buildGestorTokenPayload(sub);
  const signedJwt = signToken(payload);
  const jti = crypto.randomUUID();

  console.log(`[TokenService] Gestor token generated`);

  return {
    accessToken: `Bearer ${signedJwt}`,
    expiresAt: payload.exp,
    jti,
    tokenType: 'Bearer',
  };
}

/**
 * Quick method to generate a signed token without the PKM call.
 * Useful when PKM is unreachable but you still need a valid signed JWT.
 */
export function generateSignedTokenLocal(sub?: string): SignedTokenResult {
  const payload = buildTokenPayload(sub);
  const signedJwt = signToken(payload);

  return {
    accessToken: `Bearer ${signedJwt}`,
    expiresAt: payload.exp,
    jti: payload.jti,
    tokenType: 'Bearer',
  };
}
