/**
 * Centralized API configuration based on environment variables.
 * In the browser, API URL uses the same host as the page so login works when
 * accessing the app via IP (e.g. 192.168.0.21:7002) instead of localhost.
 */

const FALLBACK_API = 'http://localhost:7001/api/v1';
const FALLBACK_APP = 'http://localhost:7002';
const BACKEND_PORT = process.env.NEXT_PUBLIC_BACKEND_PORT || '7001';

const envApiBase = (process.env.NEXT_PUBLIC_API_URL || FALLBACK_API).replace(/\/$/, '');
const APP_URL = (process.env.NEXT_PUBLIC_APP_URL || FALLBACK_APP).replace(/\/$/, '');

/** API base URL: in browser uses same host as page + backend port; on server uses env. */
export function getApiBaseUrl(): string {
  if (typeof window !== 'undefined') {
    return `${window.location.protocol}//${window.location.hostname}:${BACKEND_PORT}/api/v1`;
  }
  return envApiBase;
}

/** Server root (no /api/v1). Use for uploads, etc. */
export function getServerUrl(): string {
  const base = getApiBaseUrl();
  if (base.includes('/api/v1')) return base.split('/api/v1')[0];
  return base;
}

// For SSR / static config
const staticServerUrl = envApiBase.includes('/api/v1') ? envApiBase.split('/api/v1')[0] : envApiBase;

export const API_CONFIG = {
  APP_URL,

  /** Prefer getApiBaseUrl() in browser so same-host API is used. */
  get BASE_URL(): string {
    return getApiBaseUrl();
  },

  SERVER_URL: staticServerUrl,

  get UPLOADS_URL(): string {
    return `${getServerUrl()}/uploads`;
  },

  VERSION: 'v1',
};

export default API_CONFIG;
