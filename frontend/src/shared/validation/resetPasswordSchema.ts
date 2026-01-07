import { z } from 'zod';

export const resetPasswordSchema = z
  .object({
    token: z.string().trim().min(1),
    password: z
      .string()
      .min(6)
      .regex(/.*\d.*/),
    confirmPassword: z.string().min(1),
  })
  .superRefine((v, ctx) => {
    if (v.password !== v.confirmPassword) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        path: ['confirmPassword'],
        message: 'Passwords do not match',
      });
    }
  });

export type ResetPasswordSchemaValues = z.infer<typeof resetPasswordSchema>;
