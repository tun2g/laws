'use client';

import axios, { AxiosError, AxiosInstance } from 'axios';
import { env } from '@/config/env';

const STORAGE_KEY = 'laws.accessToken';

export function readToken(): string | null {
  if (typeof window === 'undefined') return null;
  return window.localStorage.getItem(STORAGE_KEY);
}

export function setToken(token: string): void {
  if (typeof window === 'undefined') return;
  window.localStorage.setItem(STORAGE_KEY, token);
}

export function clearToken(): void {
  if (typeof window === 'undefined') return;
  window.localStorage.removeItem(STORAGE_KEY);
}

export const api: AxiosInstance = axios.create({
  baseURL: env.apiBaseUrl,
  withCredentials: true,
});

api.interceptors.request.use((config) => {
  const token = readToken();
  if (token) {
    config.headers = config.headers ?? {};
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

export type ApiErrorBody = {
  message?: string | string[];
  code?: string;
  statusCode?: number;
};

export function isCodexNotConnectedError(err: unknown): boolean {
  if (!(err instanceof AxiosError)) return false;
  const body = err.response?.data as ApiErrorBody | undefined;
  return body?.code === 'CODEX_NOT_CONNECTED';
}

export function readableError(err: unknown, fallback = 'Đã có lỗi xảy ra'): string {
  if (err instanceof AxiosError) {
    const body = err.response?.data as ApiErrorBody | undefined;
    const m = body?.message;
    if (Array.isArray(m)) return m.join(', ');
    if (typeof m === 'string') return m;
  }
  if (err instanceof Error) return err.message;
  return fallback;
}
