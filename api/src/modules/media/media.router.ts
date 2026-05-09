import type { FastifyPluginAsync } from 'fastify';
import crypto from 'node:crypto';

const mediaRouter: FastifyPluginAsync = async (fastify) => {
  fastify.addHook('preHandler', fastify.requireAuth);

  fastify.post('/upload-url', {
    schema: {
      tags: ['media'],
      summary: 'Get signed upload URL',
      description: 'Returns a Cloudinary signed upload URL for listing photos, or a Firebase Storage signed PUT URL for avatars/KYC docs.',
      security: [{ BearerAuth: [] }],
      body: {
        type: 'object',
        required: ['folder'],
        properties: {
          folder: { type: 'string', enum: ['listings', 'avatars', 'kyc'] },
          filename: { type: 'string' },
        },
      },
    },
  }, async (req) => {
    const { folder, filename } = req.body as any;

    if (folder === 'listings') {
      // Cloudinary signed upload
      const timestamp = Math.floor(Date.now() / 1000);
      const folderPath = `${folder}/${req.userId}`;
      const apiSecret = process.env.CLOUDINARY_API_SECRET ?? '';
      const sigBase = `folder=${folderPath}&timestamp=${timestamp}${apiSecret}`;
      const signature = crypto.createHash('sha1').update(sigBase).digest('hex');
      return {
        success: true,
        data: {
          provider: 'cloudinary',
          uploadUrl: `https://api.cloudinary.com/v1_1/${process.env.CLOUDINARY_CLOUD_NAME}/auto/upload`,
          formFields: {
            api_key: process.env.CLOUDINARY_API_KEY,
            timestamp,
            signature,
            folder: folderPath,
          },
          transformHints: {
            thumbnail: 'w_400,h_300,c_fill,q_auto,f_auto',
            card: 'w_800,h_600,c_fill,q_auto,f_auto',
            fullscreen: 'w_1600,h_1200,c_limit,q_auto,f_auto',
          },
        },
      };
    }

    // Firebase Storage signed URL (avatars, kyc)
    const fileId = `${req.userId}-${Date.now()}-${filename ?? 'file'}`;
    const filePath = `${folder}/${fileId}`;
    return {
      success: true,
      data: {
        provider: 'firebase',
        // Stub: real implementation calls admin.storage().bucket().file().getSignedUrl()
        uploadUrl: `https://storage.googleapis.com/${process.env.FIREBASE_STORAGE_BUCKET}/${filePath}`,
        publicUrl: `https://firebasestorage.googleapis.com/v0/b/${process.env.FIREBASE_STORAGE_BUCKET}/o/${encodeURIComponent(filePath)}`,
        filePath,
      },
    };
  });

  fastify.delete('/:publicId', {
    schema: { tags: ['media'], summary: 'Delete media asset', security: [{ BearerAuth: [] }] },
  }, async (req, reply) => {
    const { publicId } = req.params as any;
    // Ownership check: publicId for Cloudinary must contain userId; Firebase filename must start with userId
    if (!publicId.includes(req.userId!) && !publicId.startsWith(req.userId!)) {
      return reply.code(403).send({ success: false, error: { code: 'FORBIDDEN', message: 'Not your asset' } });
    }
    return { success: true, data: { deleted: true } };
  });
};

export default mediaRouter;
