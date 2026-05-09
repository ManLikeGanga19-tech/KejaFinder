import { Type } from '@sinclair/typebox';

export const RegisterBody = Type.Object({
  firebaseIdToken: Type.String({ minLength: 10 }),
  name: Type.String({ minLength: 2, maxLength: 100 }),
  phone: Type.RegExp(/^\+254[71]\d{8}$/, { description: 'E.164 Kenyan phone' }),
  role: Type.Union([Type.Literal('consumer'), Type.Literal('agent')]),
});

export const SyncBody = Type.Object({
  firebaseIdToken: Type.String({ minLength: 10 }),
});

export const UserResponse = Type.Object({
  success: Type.Literal(true),
  data: Type.Object({
    user: Type.Object({
      id: Type.String(),
      firebaseUid: Type.String(),
      name: Type.String(),
      email: Type.String(),
      phone: Type.String(),
      role: Type.Union([Type.Literal('consumer'), Type.Literal('agent'), Type.Literal('admin')]),
      createdAt: Type.String(),
    }),
  }),
});

export const ErrorResponse = Type.Object({
  success: Type.Literal(false),
  error: Type.Object({
    code: Type.String(),
    message: Type.String(),
  }),
});
