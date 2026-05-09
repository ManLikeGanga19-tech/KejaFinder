import fp from 'fastify-plugin';
import type { FastifyPluginAsync, FastifyRequest, FastifyReply } from 'fastify';
import admin from 'firebase-admin';

declare module 'fastify' {
  interface FastifyRequest {
    userId?: string;
    userRole?: 'consumer' | 'agent' | 'admin';
    firebaseUid?: string;
  }
  interface FastifyInstance {
    requireAuth: (req: FastifyRequest, reply: FastifyReply) => Promise<void>;
    requireRole: (
      role: 'consumer' | 'agent' | 'admin',
    ) => (req: FastifyRequest, reply: FastifyReply) => Promise<void>;
  }
}

const firebaseAuthPlugin: FastifyPluginAsync = async (fastify) => {
  // Initialise Firebase Admin SDK — gracefully handle missing credentials
  // so the server can boot without a service account key (auth routes will
  // return 503 until credentials are added).
  try {
    if (!admin.apps.length) {
      admin.initializeApp({
        credential: admin.credential.applicationDefault(),
        projectId: process.env.FIREBASE_PROJECT_ID,
        storageBucket: process.env.FIREBASE_STORAGE_BUCKET,
      });
      fastify.log.info('Firebase Admin SDK initialised');
    }
  } catch (err) {
    fastify.log.warn(
      'Firebase Admin SDK not initialised (no credentials). Auth endpoints will return 503.',
    );
  }

  fastify.decorate('requireAuth', async (req: FastifyRequest, reply: FastifyReply) => {
    if (!admin.apps.length) {
      return reply.code(503).send({
        success: false,
        error: { code: 'FIREBASE_UNAVAILABLE', message: 'Firebase Admin SDK is not configured.' },
      });
    }

    const header = req.headers.authorization;
    if (!header?.startsWith('Bearer ')) {
      return reply.code(401).send({
        success: false,
        error: { code: 'NO_TOKEN', message: 'Missing Bearer token' },
      });
    }
    const token = header.slice('Bearer '.length).trim();

    let decoded: admin.auth.DecodedIdToken;
    try {
      decoded = await admin.auth().verifyIdToken(token);
    } catch (err) {
      return reply.code(401).send({
        success: false,
        error: { code: 'INVALID_TOKEN', message: 'Token is invalid or expired' },
      });
    }

    // Look up our internal user record
    const users = await fastify.sql<{ id: string; role: 'consumer' | 'agent' | 'admin'; isActive: boolean }[]>`
      SELECT id, role, is_active FROM users WHERE firebase_uid = ${decoded.uid}
    `;

    if (!users.length || !users[0].isActive) {
      return reply.code(401).send({
        success: false,
        error: { code: 'USER_NOT_FOUND', message: 'No active user for this token' },
      });
    }

    req.userId = users[0].id;
    req.userRole = users[0].role;
    req.firebaseUid = decoded.uid;
  });

  fastify.decorate('requireRole', (role: 'consumer' | 'agent' | 'admin') => {
    return async (req: FastifyRequest, reply: FastifyReply) => {
      await fastify.requireAuth(req, reply);
      if (reply.sent) return;
      if (req.userRole !== role) {
        return reply.code(403).send({
          success: false,
          error: { code: 'FORBIDDEN', message: `${role} role required` },
        });
      }
    };
  });
};

export default fp(firebaseAuthPlugin, { name: 'firebase-auth', dependencies: ['db'] });
