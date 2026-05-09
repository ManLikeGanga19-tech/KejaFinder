import type { FastifyPluginAsync } from 'fastify';
import { assertValidIdempotencyKey } from '../../lib/idempotency.js';
import { normalizePhone } from '../../lib/phone.js';
import { mapDarajaResultCode, extractDarajaReceipt, isFromDaraja } from '../../lib/mpesa.js';

const paymentsRouter: FastifyPluginAsync = async (fastify) => {
  // Public IPN webhook (no auth, IP allowlisted)
  fastify.post('/callback', {
    schema: { tags: ['payments'], summary: 'Daraja IPN webhook' },
  }, async (req, reply) => {
    if (process.env.NODE_ENV === 'production' && !isFromDaraja(req.ip)) {
      return reply.code(403).send({ success: false });
    }

    const body = (req.body as any)?.Body?.stkCallback ?? req.body;
    const checkoutRequestId = body?.CheckoutRequestID;
    const resultCode = body?.ResultCode;

    if (!checkoutRequestId) {
      return reply.code(200).send({ ResultCode: 0, ResultDesc: 'Accepted' });
    }

    const status = mapDarajaResultCode(resultCode);
    const receipt = extractDarajaReceipt(body);

    await fastify.sql`
      UPDATE payments
      SET status = ${status}::payment_status,
          result_code = ${resultCode},
          result_desc = ${body.ResultDesc ?? null},
          mpesa_receipt_number = ${receipt?.receiptNumber ?? null},
          updated_at = NOW()
      WHERE checkout_request_id = ${checkoutRequestId}
    `;

    // Cache status in Redis for fast polling
    await fastify.redis.setex(`payment:${checkoutRequestId}`, 600, status);

    // If completed, create unlock + lead (typically done via BullMQ worker; inline for simplicity)
    if (status === 'completed') {
      const [payment] = await fastify.sql`
        SELECT id, user_id, listing_id, payment_type FROM payments WHERE checkout_request_id = ${checkoutRequestId}
      `;
      if (payment && payment.paymentType === 'unlock' && payment.listingId) {
        await fastify.sql`
          INSERT INTO unlocks (user_id, listing_id, payment_id)
          VALUES (${payment.userId}, ${payment.listingId}, ${payment.id})
          ON CONFLICT (user_id, listing_id) DO NOTHING
        `;
        const [listing] = await fastify.sql`SELECT agent_id FROM listings WHERE id = ${payment.listingId}`;
        if (listing) {
          await fastify.sql`
            INSERT INTO leads (user_id, listing_id, agent_id, payment_type)
            VALUES (${payment.userId}, ${payment.listingId}, ${listing.agentId}, 'unlock')
            ON CONFLICT (user_id, listing_id) DO NOTHING
          `;
          await fastify.sql`UPDATE listings SET unlock_count = unlock_count + 1 WHERE id = ${payment.listingId}`;
        }
      }
    }

    return reply.code(200).send({ ResultCode: 0, ResultDesc: 'Accepted' });
  });

  // Authenticated routes below
  fastify.register(async (authed) => {
    authed.addHook('preHandler', fastify.requireAuth);

    authed.post('/initiate', {
      schema: {
        tags: ['payments'],
        summary: 'Initiate M-Pesa STK Push',
        security: [{ BearerAuth: [] }],
        body: {
          type: 'object',
          required: ['listingId', 'paymentType', 'mpesaPhone', 'idempotencyKey'],
          properties: {
            listingId: { type: 'string' },
            paymentType: { type: 'string', enum: ['unlock', 'booking'] },
            mpesaPhone: { type: 'string' },
            idempotencyKey: { type: 'string' },
          },
        },
      },
    }, async (req, reply) => {
      const { listingId, paymentType, mpesaPhone, idempotencyKey } = req.body as any;
      try {
        const key = assertValidIdempotencyKey(idempotencyKey);
        const phone = normalizePhone(mpesaPhone);

        // Check idempotency: if same key seen, return existing payment
        const existing = await fastify.sql`
          SELECT id, checkout_request_id, status, amount_kes
          FROM payments WHERE idempotency_key = ${key}
        `;
        if (existing.length) {
          const p = existing[0];
          return reply.code(202).send({
            success: true,
            data: { payment: { paymentId: p.id, checkoutRequestId: p.checkoutRequestId, status: p.status, amountKes: p.amountKes } },
          });
        }

        // Check if already unlocked
        const unlocked = await fastify.sql`
          SELECT 1 FROM unlocks WHERE user_id = ${req.userId!} AND listing_id = ${listingId}
        `;
        if (unlocked.length) {
          return reply.code(400).send({
            success: false,
            error: { code: 'ALREADY_UNLOCKED', message: 'You have already unlocked this listing.' },
          });
        }

        const [listing] = await fastify.sql`SELECT id, unlock_price_kes FROM listings WHERE id = ${listingId} AND status = 'active'`;
        if (!listing) {
          return reply.code(404).send({ success: false, error: { code: 'LISTING_NOT_FOUND', message: 'Listing not found' } });
        }

        const amount = listing.unlockPriceKes;
        // STUB: Daraja STK Push integration goes here. For dev, generate a fake checkout ID.
        const checkoutRequestId = `ws_CO_${Date.now()}_${Math.floor(Math.random() * 1e6)}`;
        const merchantRequestId = `mr_${Date.now()}`;

        const [payment] = await fastify.sql`
          INSERT INTO payments (user_id, listing_id, payment_type, amount_kes, mpesa_phone,
                                idempotency_key, checkout_request_id, merchant_request_id, status)
          VALUES (${req.userId!}, ${listingId}, ${paymentType}::payment_type, ${amount}, ${phone},
                  ${key}, ${checkoutRequestId}, ${merchantRequestId}, 'pending')
          RETURNING id
        `;

        await fastify.redis.setex(`payment:${checkoutRequestId}`, 600, 'pending');

        return reply.code(202).send({
          success: true,
          data: {
            payment: {
              paymentId: payment.id,
              checkoutRequestId,
              status: 'pending',
              amountKes: amount,
              paymentType,
              pollUrl: `/v1/payments/${checkoutRequestId}/status`,
              expiresAt: new Date(Date.now() + 5 * 60 * 1000).toISOString(),
            },
          },
        });
      } catch (err: any) {
        return reply.code(err.statusCode ?? 400).send({
          success: false,
          error: { code: err.code ?? 'BAD_REQUEST', message: err.message ?? 'Bad request' },
        });
      }
    });

    authed.get('/:checkoutRequestId/status', {
      schema: { tags: ['payments'], summary: 'Poll payment status', security: [{ BearerAuth: [] }] },
    }, async (req) => {
      const { checkoutRequestId } = req.params as any;
      // Fast path: Redis
      const cached = await fastify.redis.get(`payment:${checkoutRequestId}`);
      if (cached) {
        return { success: true, data: { payment: { status: cached } } };
      }
      // Fallback: DB
      const [p] = await fastify.sql`
        SELECT status FROM payments WHERE checkout_request_id = ${checkoutRequestId} AND user_id = ${req.userId!}
      `;
      return { success: true, data: { payment: { status: p?.status ?? 'unknown' } } };
    });

    authed.get('/history', {
      schema: { tags: ['payments'], summary: 'Payment history', security: [{ BearerAuth: [] }] },
    }, async (req) => {
      const payments = await fastify.sql`
        SELECT id, payment_type, status, amount_kes, mpesa_receipt_number, created_at
        FROM payments WHERE user_id = ${req.userId!}
        ORDER BY created_at DESC LIMIT 50
      `;
      return { success: true, data: { payments } };
    });
  });
};

export default paymentsRouter;
