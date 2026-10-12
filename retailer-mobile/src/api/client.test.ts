import { z } from 'zod';

import { mockFetch } from '@/test/fetch';

import { apiRequest, configureApiAuth } from './client';
import { ApiError, NETWORK_ERROR_MESSAGE } from './errors';

const onUnauthorized = jest.fn();

beforeEach(() => {
  onUnauthorized.mockReset();
  configureApiAuth({ getToken: () => 'token-123', onUnauthorized });
});

async function rejection(promise: Promise<unknown>): Promise<ApiError> {
  try {
    await promise;
  } catch (error) {
    if (error instanceof ApiError) return error;
    throw error;
  }
  throw new Error('expected the request to fail');
}

describe('apiRequest', () => {
  it('sends JSON and the bearer token only when auth is requested', async () => {
    const calls = mockFetch({ status: 201, body: { ok: true } }, { status: 200, body: {} });

    await apiRequest('/api/auth/otp/request', { method: 'POST', body: { phoneNumber: '9876543210' } });
    await apiRequest('/api/auth/me', { auth: true });

    const [first, second] = calls;
    expect(first?.init?.body).toBe(JSON.stringify({ phoneNumber: '9876543210' }));
    expect((first?.init?.headers as Record<string, string>).Authorization).toBeUndefined();
    expect((second?.init?.headers as Record<string, string>).Authorization).toBe('Bearer token-123');
  });

  it.each([
    ['message', { message: 'Invalid OTP.' }, 'Invalid OTP.', null],
    ['error', { error: 'Order not found' }, 'Order not found', null],
    ['code + message', { code: 'PAYMENT_UNAVAILABLE', message: 'Payment is temporarily unavailable.' }, 'Payment is temporarily unavailable.', 'PAYMENT_UNAVAILABLE'],
  ])('reads the backend %s error shape', async (_shape, body, message, code) => {
    mockFetch({ status: 400, body });
    const error = await rejection(apiRequest('/x'));
    expect(error).toMatchObject({ kind: 'http', status: 400, message, code });
  });

  it('calls onUnauthorized for an authenticated 401 only', async () => {
    mockFetch({ status: 401, body: { error: 'Unauthorized' } }, { status: 401, body: { error: 'Unauthorized' } });
    await rejection(apiRequest('/api/auth/me', { auth: true }));
    await rejection(apiRequest('/public'));
    expect(onUnauthorized).toHaveBeenCalledTimes(1);
  });

  it('maps a failed connection to a network error', async () => {
    mockFetch(new TypeError('Network request failed'));
    const error = await rejection(apiRequest('/x'));
    expect(error).toMatchObject({ kind: 'network', status: null, message: NETWORK_ERROR_MESSAGE });
  });

  it('rejects responses that do not match the schema', async () => {
    mockFetch({ status: 200, body: { id: 5 } });
    const error = await rejection(apiRequest('/x', { schema: z.object({ id: z.string() }) }));
    expect(error.kind).toBe('invalid_response');
  });

  it('returns undefined for 204', async () => {
    mockFetch({ status: 204 });
    await expect(apiRequest('/x', { method: 'DELETE' })).resolves.toBeUndefined();
  });
});
