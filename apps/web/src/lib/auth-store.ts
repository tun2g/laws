'use client';

import { create } from 'zustand';
import type { User } from '@laws/shared';
import { api, clearToken, setToken } from './api';

interface AuthState {
  user: User | null;
  loading: boolean;
  initialise: () => Promise<void>;
  login: (email: string, password: string) => Promise<User>;
  register: (email: string, password: string, name: string) => Promise<User>;
  logout: () => void;
  refresh: () => Promise<User | null>;
}

export const useAuth = create<AuthState>((set) => ({
  user: null,
  loading: true,

  async initialise() {
    try {
      const { data } = await api.get<User>('/auth/me');
      set({ user: data, loading: false });
    } catch {
      set({ user: null, loading: false });
    }
  },

  async login(email, password) {
    const { data } = await api.post<{ accessToken: string; user: User }>('/auth/login', {
      email,
      password,
    });
    setToken(data.accessToken);
    set({ user: data.user });
    return data.user;
  },

  async register(email, password, name) {
    const { data } = await api.post<{ accessToken: string; user: User }>('/auth/register', {
      email,
      password,
      name,
    });
    setToken(data.accessToken);
    set({ user: data.user });
    return data.user;
  },

  logout() {
    clearToken();
    set({ user: null });
  },

  async refresh() {
    try {
      const { data } = await api.get<User>('/auth/me');
      set({ user: data });
      return data;
    } catch {
      set({ user: null });
      return null;
    }
  },
}));
