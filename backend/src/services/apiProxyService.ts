import axios, { AxiosRequestConfig, Method } from 'axios';
import { generateSignedTokenLocal } from './tokenService';
import { config } from '../config/environment';

/**
 * Common headers required by all Santander APIC APIs.
 */
function getCommonHeaders(token: string): Record<string, string> {
  return {
    'Authorization': token,
    'x-ibm-client-id': config.apicClientId,
    'x-santander-client-id': config.apicClientId,
    'Content-Type': 'application/json',
    'accept': 'application/json',
  };
}

export interface ProxyRequestOptions {
  method: Method;
  /** Path relative to the base host (e.g. /santander-mexico/intranet-core/v1/...) */
  path: string;
  body?: unknown;
  queryParams?: Record<string, string>;
  extraHeaders?: Record<string, string>;
}

export interface ProxyResponse {
  status: number;
  data: unknown;
  headers: Record<string, string>;
}

/**
 * Makes an authenticated request to the upstream Santander API.
 * Generates a fresh JWT token for every call (tokens expire).
 */
export async function proxyRequest(options: ProxyRequestOptions): Promise<ProxyResponse> {
  // Generate a fresh token for this request
  const tokenResult = generateSignedTokenLocal();

  const url = `${config.hostPre}${options.path}`;
  const headers = {
    ...getCommonHeaders(tokenResult.accessToken),
    ...options.extraHeaders,
  };

  console.log(`[ApiProxy] ${options.method.toUpperCase()} ${url}`);

  const axiosConfig: AxiosRequestConfig = {
    method: options.method,
    url,
    headers,
    data: options.body,
    params: options.queryParams,
    timeout: 30000,
    validateStatus: () => true, // Don't throw on non-2xx
  };

  try {
    const response = await axios(axiosConfig);

    console.log(`[ApiProxy] Response: ${response.status}`);

    return {
      status: response.status,
      data: response.data,
      headers: response.headers as Record<string, string>,
    };
  } catch (error) {
    if (axios.isAxiosError(error)) {
      console.error(`[ApiProxy] Request failed: ${error.message}`);
      if (error.response) {
        return {
          status: error.response.status,
          data: error.response.data,
          headers: error.response.headers as Record<string, string>,
        };
      }
    }
    throw error;
  }
}
