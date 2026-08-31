import { create } from 'zustand';
import type { User } from '@/types';
import { usersApi } from '@/lib/api/services';

interface AuthState {
  address:     string | null;
  token:       string | null;
  user:        User | null;
  isConnected: boolean;
  setAuth:     (address: string, token: string, user: User, rememberMe?: boolean) => void;
  setAddress:  (address: string) => void;
  updateUser:  (patch: Partial<User>) => void;
  deleteAccount: (password: string) => Promise<void>;
  logout:      () => void;
  rehydrate:   () => void;
}

export const useAuthStore = create<AuthState>((set) => ({
  address: null, token: null, user: null, isConnected: false,

  setAuth: (address, token, user, rememberMe = false) => {
    if (typeof window !== 'undefined') {
      localStorage.setItem('hamplard_token', token);
      localStorage.setItem('hamplard_address', address);
      const maxAge = rememberMe ? 30 * 24 * 3600 : 24 * 3600;
      document.cookie = `hamplard_token=${token}; path=/; max-age=${maxAge}; SameSite=Lax`;
    }
    set({ address, token, user, isConnected: true });
  },

  setAddress: (address) => set({ address, isConnected: true }),

  updateUser: (patch) =>
    set((state) => ({ user: state.user ? { ...state.user, ...patch } : state.user })),

  deleteAccount: async (password) => {
    await usersApi.deleteAccount(password);
    if (typeof window !== 'undefined') {
      localStorage.removeItem('hamplard_token');
      localStorage.removeItem('hamplard_address');
      document.cookie = 'hamplard_token=; path=/; max-age=0';
    }
    set({ address: null, token: null, user: null, isConnected: false });
  },

  logout: () => {
    if (typeof window !== 'undefined') {
      localStorage.removeItem('hamplard_token');
      localStorage.removeItem('hamplard_address');
      document.cookie = 'hamplard_token=; path=/; max-age=0';
    }
    set({ address: null, token: null, user: null, isConnected: false });
  },

  rehydrate: () => {
    if (typeof window !== 'undefined') {
      const token   = localStorage.getItem('hamplard_token');
      const address = localStorage.getItem('hamplard_address');
      if (token && address) set({ token, address, isConnected: true });
    }
  },
}));
