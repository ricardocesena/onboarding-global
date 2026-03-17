import dotenv from 'dotenv';
import path from 'path';

dotenv.config({ path: path.resolve(__dirname, '../../.env') });

function requireEnv(key: string): string {
  const value = process.env[key];
  if (!value) {
    throw new Error(`Missing required environment variable: ${key}`);
  }
  return value;
}

function parsePrivateKey(raw: string): string {
  return raw.replace(/\\n/g, '\n');
}

export const config = {
  port: parseInt(process.env.PORT || '3001', 10),
  nodeEnv: process.env.NODE_ENV || 'development',

  // PKM Service
  hostPkm: requireEnv('HOST_PKM'),

  // Gateway
  hostGateway: requireEnv('HOST_GATEWAY'),

  // Token config
  tokenAlg: requireEnv('TOKEN_ALG') as 'RS256',
  tokenType: requireEnv('TOKEN_TYPE'),
  tokenKid: requireEnv('TOKEN_KID'),

  // APIC config
  apicClientId: requireEnv('APIC_CLIENT_ID'),
  apicClientSecret: requireEnv('APIC_CLIENT_SECRET'),
  apicIss: requireEnv('APIC_ISS'),
  apicScope: requireEnv('APIC_SCOPE'),

  // RSA Private Key
  privateKey: parsePrivateKey(requireEnv('PRIVATE_KEY')),
} as const;
