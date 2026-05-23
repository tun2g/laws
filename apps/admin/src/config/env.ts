/**
 * Single source of truth for env vars in the admin app.
 * Only VITE_* vars are available in the browser; everything else is undefined.
 */
export const env = {
  apiBaseUrl: import.meta.env.VITE_API_BASE_URL ?? 'http://localhost:4000/api',
  brandName: import.meta.env.VITE_BRAND_NAME ?? 'Laws Admin',
} as const;

export type Env = typeof env;
