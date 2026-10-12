import * as SecureStore from 'expo-secure-store';

import { getCurrentCustomer } from '@/api/auth';
import { mockFetch } from '@/test/fetch';

import { useSession } from './session-store';
import { tokenStorage } from './token-storage';

const me = { id: '42', phoneNumber: '9876543210' };

beforeEach(async () => {
  (SecureStore as unknown as { __reset: () => void }).__reset();
  useSession.setState({ status: 'booting', token: null, customer: null });
});

describe('session bootstrap', () => {
  it('signs out when no token is stored', async () => {
    const calls = mockFetch();
    await useSession.getState().bootstrap();
    expect(useSession.getState().status).toBe('signedOut');
    expect(calls).toHaveLength(0);
  });

  it('enters the app when /api/auth/me accepts the stored token', async () => {
    await tokenStorage.set('stored-token');
    const calls = mockFetch({ status: 200, body: me });

    await useSession.getState().bootstrap();

    expect(useSession.getState()).toMatchObject({ status: 'signedIn', customer: me, token: 'stored-token' });
    expect(calls[0]?.url).toMatch(/\/api\/auth\/me$/);
  });

  it('clears the stored token on 401', async () => {
    await tokenStorage.set('expired-token');
    mockFetch({ status: 401, body: { error: 'Unauthorized' } });

    await useSession.getState().bootstrap();

    expect(useSession.getState()).toMatchObject({ status: 'signedOut', token: null });
    await expect(tokenStorage.get()).resolves.toBeNull();
  });

  it('keeps the token and reports unreachable when the backend is down', async () => {
    await tokenStorage.set('stored-token');
    mockFetch(new TypeError('Network request failed'));

    await useSession.getState().bootstrap();

    expect(useSession.getState().status).toBe('unreachable');
    await expect(tokenStorage.get()).resolves.toBe('stored-token');
  });
});

describe('signIn / signOut', () => {
  it('stores the token securely and loads the customer', async () => {
    mockFetch({ status: 200, body: me });
    await useSession.getState().signIn('new-token');
    expect(useSession.getState()).toMatchObject({ status: 'signedIn', customer: me });
    await expect(tokenStorage.get()).resolves.toBe('new-token');
  });

  it('ends the session when any authenticated call returns 401', async () => {
    mockFetch({ status: 200, body: me }, { status: 401, body: { error: 'Unauthorized' } });
    await useSession.getState().signIn('new-token');

    await expect(getCurrentCustomer()).rejects.toBeTruthy();
    await Promise.resolve();

    expect(useSession.getState().status).toBe('signedOut');
  });
});
