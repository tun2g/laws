/**
 * Single source of truth for env access in the web app.
 * Browser-side code must only read NEXT_PUBLIC_* vars; everything else is
 * server-only and will be undefined in the browser.
 */
export const env = {
  apiBaseUrl:
    process.env.NEXT_PUBLIC_API_BASE_URL ?? 'http://localhost:4000/api',
  serverApiBaseUrl: process.env.API_BASE_URL ?? 'http://localhost:4000/api',
  authCookieName: process.env.AUTH_COOKIE_NAME ?? 'laws_session',
  brandName: process.env.NEXT_PUBLIC_BRAND_NAME ?? 'Laws',
  isProd: process.env.NODE_ENV === 'production',
} as const;

export type Env = typeof env;
