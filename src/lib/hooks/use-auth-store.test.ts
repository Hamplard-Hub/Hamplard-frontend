import { describe, it, expect, beforeEach, vi } from 'vitest';
import { act, renderHook } from '@testing-library/react';

// ── Mock usersApi before importing the store ──────────────────────────────
vi.mock('@/lib/api/services', () => ({
  usersApi: {
    getMe: vi.fn(),
    deleteAccount: vi.fn(),
  },
}));

import { useAuthStore } from './use-auth-store';
import { usersApi } from '@/lib/api/services';
import type { User } from '@/types';

const mockUser: User = {
  id: 'user-1',
  name: 'Alice',
  email: 'alice@example.com',
  stellarAddress: 'GAABC',
  avatarUrl: null,
  bio: null,
  role: 'STUDENT',
  createdAt: '2024-01-01T00:00:00Z',
  updatedAt: '2024-01-01T00:00:00Z',
};

function resetStore() {
  useAuthStore.setState({
    address: null,
    token: null,
    user: null,
    isConnected: false,
    isHydrating: false,
  });
}

function setLocalStorage(token: string | null, address: string | null) {
  if (token) localStorage.setItem('hamplard_token', token);
  else localStorage.removeItem('hamplard_token');

  if (address) localStorage.setItem('hamplard_address', address);
  else localStorage.removeItem('hamplard_address');
}

beforeEach(() => {
  resetStore();
  localStorage.clear();
  vi.clearAllMocks();
});

describe('rehydrate', () => {
  it('does nothing when localStorage has no token', async () => {
    setLocalStorage(null, null);

    await act(async () => {
      await useAuthStore.getState().rehydrate();
    });

    const state = useAuthStore.getState();
    expect(state.user).toBeNull();
    expect(state.isConnected).toBe(false);
    expect(state.isHydrating).toBe(false);
  });

  it('fetches the user and stores it when a valid token exists', async () => {
    setLocalStorage('valid-token', 'GAABC');
    vi.mocked(usersApi.getMe).mockResolvedValueOnce(mockUser);

    await act(async () => {
      await useAuthStore.getState().rehydrate();
    });

    const state = useAuthStore.getState();
    expect(state.user).toEqual(mockUser);
    expect(state.isConnected).toBe(true);
    expect(state.isHydrating).toBe(false);
  });

  it('sets isHydrating to true during the fetch and false after', async () => {
    setLocalStorage('valid-token', 'GAABC');

    let hydrateDuringFetch = false;
    vi.mocked(usersApi.getMe).mockImplementationOnce(async () => {
      hydrateDuringFetch = useAuthStore.getState().isHydrating;
      return mockUser;
    });

    await act(async () => {
      await useAuthStore.getState().rehydrate();
    });

    expect(hydrateDuringFetch).toBe(true);
    expect(useAuthStore.getState().isHydrating).toBe(false);
  });

  it('calls logout and clears storage when getMe returns 401', async () => {
    setLocalStorage('expired-token', 'GAABC');
    const error = Object.assign(new Error('Unauthorized'), {
      response: { status: 401 },
    });
    vi.mocked(usersApi.getMe).mockRejectedValueOnce(error);

    await act(async () => {
      await useAuthStore.getState().rehydrate();
    });

    const state = useAuthStore.getState();
    expect(state.user).toBeNull();
    expect(state.token).toBeNull();
    expect(state.isConnected).toBe(false);
    expect(state.isHydrating).toBe(false);
    expect(localStorage.getItem('hamplard_token')).toBeNull();
    expect(localStorage.getItem('hamplard_address')).toBeNull();
  });

  it('keeps the token on a network error (non-401)', async () => {
    setLocalStorage('valid-token', 'GAABC');
    const error = new Error('Network Error');
    vi.mocked(usersApi.getMe).mockRejectedValueOnce(error);

    await act(async () => {
      await useAuthStore.getState().rehydrate();
    });

    const state = useAuthStore.getState();
    // Token kept; user remains null but we don't log out.
    expect(state.token).toBe('valid-token');
    expect(state.isConnected).toBe(true);
    expect(state.isHydrating).toBe(false);
  });
});
