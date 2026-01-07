import { z } from 'zod';

export const registerSchema = z
  .object({
    email: z
      .string()
      .trim()
      .min(1, 'Enter your email')
      .email('Enter a valid email'),
    displayName: z.string().trim().optional(),
    password: z
      .string()
      .min(6, 'At least 6 characters')
      .regex(/\d/, 'Must contain at least 1 digit'),
    confirmPassword: z.string().min(1, 'Confirm your password'),
  })
  .superRefine((v, ctx) => {
    if (v.confirmPassword !== v.password) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        path: ['confirmPassword'],
        message: 'Passwords do not match',
      });
    }
  });

export type RegisterSchemaValues = z.infer<typeof registerSchema>;
