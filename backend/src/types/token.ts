export interface TokenHeader {
  alg: string;
  typ: string;
  kid: string;
}

export interface TokenPayload {
  cid_tp: string;
  sub: string;
  iss: string;
  aud: string[];
  exp: number;
  jti: string;
  iat: number;
  nbf: number;
  scope: string;
  client_id: string;
  cid: string;
  channel_tp: string;
}

export interface GestorTokenPayload {
  sub: string;
  aud: string[];
  nbf: number;
  iss: string;
  exp: number;
  iat: number;
  client_id: string;
}

export interface PublicKeyResponse {
  key: string;
  exp?: number;
  secCtx?: Record<string, unknown>;
  sessionDetails?: {
    key: string;
    [k: string]: unknown;
  };
}

export interface SignedTokenResult {
  accessToken: string;
  expiresAt: number;
  jti: string;
  tokenType: 'Bearer';
}
