import { z } from 'zod';

export const forgotPasswordSchema = z.object({
  email: z.string().trim().min(1).email(),
});

export type ForgotPasswordSchemaValues = z.infer<typeof forgotPasswordSchema>;
