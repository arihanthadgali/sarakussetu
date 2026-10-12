import { create } from 'zustand';

import { getCurrentCustomer, type CurrentCustomer } from '@/api/auth';
import { configureApiAuth } from '@/api/client';
import { isApiError } from '@/api/errors';

import { tokenStorage } from './token-storage';

/**
 * booting      – reading the stored token / calling /api/auth/me
 * signedOut    – no valid session; show sign-in
 * signedIn     – /api/auth/me succeeded
 * unreachable  – a token exists but the backend could not be reached;
 *                the token is kept and the user can retry (not a logout)
 */
export type SessionStatus = 'booting' | 'signedOut' | 'signedIn' | 'unreachable';

type SessionState = {
  status: SessionStatus;
  token: string | null;
  customer: CurrentCustomer | null;
  bootstrap: () => Promise<void>;
  signIn: (accessToken: string) => Promise<void>;
  signOut: () => Promise<void>;
};

export const useSession = create<SessionState>((set, get) => ({
  status: 'booting',
  token: null,
  customer: null,

  // Initial status is already 'booting'. A retry from 'unreachable' keeps that
  // screen mounted until the outcome is known.
  bootstrap: async () => {
    let stored: string | null = null;
    try {
      stored = await tokenStorage.get();
    } catch {
      stored = null;
    }

    if (!stored) {
      set({ status: 'signedOut', token: null, customer: null });
      return;
    }

    set({ token: stored });
    try {
      const customer = await getCurrentCustomer();
      set({ status: 'signedIn', customer });
    } catch (error) {
      if (isApiError(error) && error.isUnauthorized) {
        await get().signOut();
        return;
      }
      set({ status: 'unreachable' });
    }
  },

  signIn: async (accessToken) => {
    await tokenStorage.set(accessToken);
    set({ token: accessToken });
    try {
      const customer = await getCurrentCustomer();
      set({ status: 'signedIn', customer });
    } catch (error) {
      await get().signOut();
      throw error;
    }
  },

  signOut: async () => {
    try {
      await tokenStorage.clear();
    } finally {
      set({ status: 'signedOut', token: null, customer: null });
    }
  },
}));

// Give the API client read access to the token and a way to end the session
// when any authenticated call returns 401 (expired JWT — there is no refresh token).
configureApiAuth({
  getToken: () => useSession.getState().token,
  onUnauthorized: () => {
    if (useSession.getState().status === 'signedIn') void useSession.getState().signOut();
  },
});
