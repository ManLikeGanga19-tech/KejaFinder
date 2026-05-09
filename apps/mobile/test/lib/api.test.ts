import { http, HttpResponse } from 'msw';
import { setupServer } from 'msw/node';
import { apiFetch } from '../../src/lib/api';
import AsyncStorage from '@react-native-async-storage/async-storage';

const BASE = 'http://localhost:3001/v1';

const server = setupServer();

beforeAll(() => server.listen({ onUnhandledRequest: 'error' }));
afterEach(() => {
  server.resetHandlers();
  AsyncStorage.clear();
});
afterAll(() => server.close());

describe('apiFetch', () => {
  it('returns data on a successful response', async () => {
    server.use(
      http.get(`${BASE}/listings`, () =>
        HttpResponse.json({ success: true, data: { listings: [{ id: '1' }] } }),
      ),
    );
    const result = await apiFetch<{ listings: { id: string }[] }>('/listings');
    expect(result.listings).toEqual([{ id: '1' }]);
  });

  it('throws when success=false in body', async () => {
    server.use(
      http.get(`${BASE}/listings`, () =>
        HttpResponse.json({ success: false, error: { message: 'Boom' } }, { status: 400 }),
      ),
    );
    await expect(apiFetch('/listings')).rejects.toThrow('Boom');
  });

  it('throws on non-2xx HTTP', async () => {
    server.use(http.get(`${BASE}/listings`, () => new HttpResponse(null, { status: 500 })));
    await expect(apiFetch('/listings')).rejects.toThrow();
  });

  it('attaches Bearer token when auth: true and token exists', async () => {
    await AsyncStorage.setItem('firebase_token', 'TOKEN_123');

    let receivedAuth: string | null = null;
    server.use(
      http.get(`${BASE}/users/me`, ({ request }) => {
        receivedAuth = request.headers.get('authorization');
        return HttpResponse.json({ success: true, data: { user: { id: 'u1' } } });
      }),
    );

    await apiFetch('/users/me', { auth: true });
    expect(receivedAuth).toBe('Bearer TOKEN_123');
  });

  it('omits Authorization header when auth: false', async () => {
    let receivedAuth: string | null = null;
    server.use(
      http.get(`${BASE}/listings`, ({ request }) => {
        receivedAuth = request.headers.get('authorization');
        return HttpResponse.json({ success: true, data: { listings: [] } });
      }),
    );

    await apiFetch('/listings');
    expect(receivedAuth).toBeNull();
  });

  it('sends JSON body on POST', async () => {
    let receivedBody: unknown;
    server.use(
      http.post(`${BASE}/payments/initiate`, async ({ request }) => {
        receivedBody = await request.json();
        return HttpResponse.json({ success: true, data: { payment: { id: 'p1' } } });
      }),
    );

    const idempotencyKey = '6ba7b810-9dad-41d1-80b4-00c04fd430c8';
    await apiFetch('/payments/initiate', {
      method: 'POST',
      auth: true,
      body: { listingId: 'l1', idempotencyKey },
    });

    expect(receivedBody).toEqual({ listingId: 'l1', idempotencyKey });
  });
});
