'use client';

import { z } from 'zod';

export const loginSchema = z.object({
  email: z
    .string()
    .trim()
    .min(1, 'Enter your email')
    .email('Enter a valid email'),
  password: z.string().min(1, 'Enter your password'),
});

export type LoginSchemaValues = z.infer<typeof loginSchema>;
