// Mock AsyncStorage BEFORE importing modules that use it
jest.mock(
  '@react-native-async-storage/async-storage',
  () => require('@react-native-async-storage/async-storage/jest/async-storage-mock'),
);

import { apiFetch } from '../../src/lib/api';
import AsyncStorage from '@react-native-async-storage/async-storage';

const fetchMock = jest.fn() as jest.Mock;
global.fetch = fetchMock as unknown as typeof fetch;

const jsonResponse = (data: unknown, status = 200) => ({
  ok: status >= 200 && status < 300,
  status,
  json: () => Promise.resolve(data),
});

beforeEach(async () => {
  fetchMock.mockReset();
  await AsyncStorage.clear();
});

describe('apiFetch', () => {
  it('returns data on a successful response', async () => {
    fetchMock.mockResolvedValueOnce(
      jsonResponse({ success: true, data: { listings: [{ id: '1' }] } }),
    );
    const result = await apiFetch<{ listings: { id: string }[] }>('/listings');
    expect(result.listings).toEqual([{ id: '1' }]);
  });

  it('throws when success=false in body', async () => {
    fetchMock.mockResolvedValueOnce(
      jsonResponse({ success: false, error: { message: 'Boom' } }, 400),
    );
    await expect(apiFetch('/listings')).rejects.toThrow('Boom');
  });

  it('throws on non-2xx HTTP', async () => {
    fetchMock.mockResolvedValueOnce(jsonResponse({}, 500));
    await expect(apiFetch('/listings')).rejects.toThrow();
  });

  it('attaches Bearer token when auth: true and token exists', async () => {
    await AsyncStorage.setItem('firebase_token', 'TOKEN_123');
    fetchMock.mockResolvedValueOnce(
      jsonResponse({ success: true, data: { user: { id: 'u1' } } }),
    );
    await apiFetch('/users/me', { auth: true });
    const [, init] = fetchMock.mock.calls[0];
    expect(init.headers.Authorization).toBe('Bearer TOKEN_123');
  });

  it('omits Authorization header when auth: false', async () => {
    fetchMock.mockResolvedValueOnce(
      jsonResponse({ success: true, data: { listings: [] } }),
    );
    await apiFetch('/listings');
    const [, init] = fetchMock.mock.calls[0];
    expect(init.headers.Authorization).toBeUndefined();
  });

  it('sends JSON body on POST', async () => {
    fetchMock.mockResolvedValueOnce(
      jsonResponse({ success: true, data: { payment: { id: 'p1' } } }),
    );
    const idempotencyKey = '6ba7b810-9dad-41d1-80b4-00c04fd430c8';
    await apiFetch('/payments/initiate', {
      method: 'POST',
      auth: true,
      body: { listingId: 'l1', idempotencyKey },
    });
    const [, init] = fetchMock.mock.calls[0];
    expect(init.method).toBe('POST');
    expect(JSON.parse(init.body)).toEqual({ listingId: 'l1', idempotencyKey });
  });

  it('builds the correct URL with API_BASE_URL prefix', async () => {
    fetchMock.mockResolvedValueOnce(
      jsonResponse({ success: true, data: { listings: [] } }),
    );
    await apiFetch('/listings');
    const [url] = fetchMock.mock.calls[0];
    expect(url).toMatch(/\/v1\/listings$/);
  });
});
