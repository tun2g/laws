import { create } from 'zustand';
import type { User } from '@laws/shared';
import { api, clearToken, setToken } from './api';

interface State {
  user: User | null;
  loading: boolean;
  initialise: () => Promise<void>;
  login: (email: string, password: string) => Promise<User>;
  logout: () => void;
}

export const useAuth = create<State>((set) => ({
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
    if (data.user.role !== 'ADMIN') {
      throw new Error('This account does not have admin access.');
    }
    setToken(data.accessToken);
    set({ user: data.user });
    return data.user;
  },

  logout() {
    clearToken();
    set({ user: null });
  },
}));
