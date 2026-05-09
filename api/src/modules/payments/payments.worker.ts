/**
 * BullMQ workers for async M-Pesa fulfillment.
 *
 * The IPN webhook returns 200 immediately and enqueues a job here. Workers
 * handle: creating Unlock + Lead, incrementing counters, sending FCM push.
 *
 * This is a stub. Wire up with `import { Worker } from 'bullmq'` and connect
 * to Redis when implementing.
 */

export {};
