import type { FastifyPluginAsync } from 'fastify';
import { registerUser, syncUser } from './auth.service.js';
import { RegisterBody, SyncBody, UserResponse, ErrorResponse } from './auth.schema.js';

const authRouter: FastifyPluginAsync = async (fastify) => {
  fastify.post('/register', {
    schema: {
      tags: ['auth'],
      summary: 'Register a new user',
      description: 'Creates a user record after the client has signed in via Firebase Auth. Send the Firebase ID token + profile fields.',
      body: RegisterBody,
      response: { 201: UserResponse, 400: ErrorResponse, 409: ErrorResponse },
    },
  }, async (req, reply) => {
    const { firebaseIdToken, name, phone, role } = req.body as any;
    try {
      const user = await registerUser(fastify, firebaseIdToken, name, phone, role);
      return reply.code(201).send({ success: true, data: { user } });
    } catch (err: any) {
      return reply.code(err.statusCode ?? 500).send({
        success: false,
        error: { code: err.code ?? 'INTERNAL', message: err.message ?? 'Internal error' },
      });
    }
  });

  fastify.post('/sync', {
    schema: {
      tags: ['auth'],
      summary: 'Sync existing user (login)',
      description: 'Verifies the Firebase ID token and returns the existing user record. Updates last_login_at.',
      body: SyncBody,
      response: { 200: UserResponse, 404: ErrorResponse },
    },
  }, async (req, reply) => {
    const { firebaseIdToken } = req.body as any;
    try {
      const user = await syncUser(fastify, firebaseIdToken);
      return { success: true, data: { user } };
    } catch (err: any) {
      return reply.code(err.statusCode ?? 500).send({
        success: false,
        error: { code: err.code ?? 'INTERNAL', message: err.message ?? 'Internal error' },
      });
    }
  });
};

export default authRouter;
