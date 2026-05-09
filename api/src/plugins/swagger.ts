import fp from 'fastify-plugin';
import type { FastifyPluginAsync } from 'fastify';
import fastifySwagger from '@fastify/swagger';
import scalarReference from '@scalar/fastify-api-reference';

const swaggerPlugin: FastifyPluginAsync = async (fastify) => {
  await fastify.register(fastifySwagger, {
    openapi: {
      openapi: '3.1.0',
      info: {
        title: 'KejaFinder API',
        version: '1.0.0',
        description: [
          'Enterprise real estate discovery API for the Kenyan market.',
          '',
          'Powers the KejaFinder mobile app (React Native + Expo) and marketing website (Next.js).',
          '',
          '**Authentication:** All protected routes require a Firebase ID token in the `Authorization: Bearer <token>` header.',
          'Obtain the token by signing in via Firebase Auth (phone OTP or email) on the client app.',
        ].join('\n'),
        contact: {
          name: 'KejaFinder Engineering',
          email: 'api@kejafinder.co.ke',
        },
      },
      servers: [
        { url: 'http://localhost:3001/v1', description: 'Local development' },
        { url: 'https://staging-api.kejafinder.co.ke/v1', description: 'Staging' },
        { url: 'https://api.kejafinder.co.ke/v1', description: 'Production' },
      ],
      tags: [
        { name: 'auth', description: 'Firebase Auth registration + user sync' },
        { name: 'users', description: 'User profiles, saved listings, unlock history' },
        { name: 'listings', description: 'Property search, featured, map pins, locked/unlocked detail' },
        { name: 'areas', description: 'Area Intelligence: safety, cost, accessibility, amenities' },
        { name: 'payments', description: 'M-Pesa STK Push, IPN callbacks, payment history' },
        { name: 'agents', description: 'Agent profiles, listings CRUD, leads CRM, dashboard stats' },
        { name: 'media', description: 'Cloudinary signed upload URLs, Firebase Storage for avatars/KYC' },
        { name: 'notifications', description: 'In-app notifications, FCM push token management' },
        { name: 'admin', description: 'Listing moderation, agent KYC verification, platform stats' },
      ],
      components: {
        securitySchemes: {
          BearerAuth: {
            type: 'http',
            scheme: 'bearer',
            bearerFormat: 'Firebase ID Token',
            description: 'Firebase ID token obtained from Firebase Auth client SDK',
          },
        },
      },
    },
  });

  // Expose the generated spec at /documentation/json for Scalar + CI linting
  fastify.get('/documentation/json', { schema: { hide: true } }, async (_req, reply) => {
    reply.type('application/json').send(fastify.swagger());
  });

  if (process.env.DOCS_ENABLED === 'true') {
    await fastify.register(scalarReference, {
      routePrefix: '/docs',
      configuration: {
        title: 'KejaFinder API Reference',
        theme: 'blue',
        spec: { url: '/documentation/json' },
        authentication: {
          preferredSecurityScheme: 'BearerAuth',
        },
        customCss: `
          :root { --scalar-color-1: #00236f; }
          .scalar-card { border-radius: 1rem; }
        `,
        hideDownloadButton: false,
        tagsSorter: 'alpha',
      },
    });

    fastify.log.info('Scalar API docs available at /docs');
  }
};

export default fp(swaggerPlugin, { name: 'swagger' });
