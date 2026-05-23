import axios from 'axios';
import { env } from '@/config/env';

const STORAGE_KEY = 'laws.admin.accessToken';

export function readToken(): string | null {
  return window.localStorage.getItem(STORAGE_KEY);
}
export function setToken(t: string): void {
  window.localStorage.setItem(STORAGE_KEY, t);
}
export function clearToken(): void {
  window.localStorage.removeItem(STORAGE_KEY);
}

export const api = axios.create({
  baseURL: env.apiBaseUrl,
});

api.interceptors.request.use((cfg) => {
  const t = readToken();
  if (t) {
    cfg.headers = cfg.headers ?? {};
    cfg.headers.Authorization = `Bearer ${t}`;
  }
  return cfg;
});
