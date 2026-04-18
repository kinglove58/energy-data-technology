import { z } from 'zod';

const envSchema = z.object({
  NODE_ENV: z.enum(['development', 'test', 'production']).default('development'),
  NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY: z.string().optional(),
  CLERK_SECRET_KEY: z.string().optional(),
  GEMINI_API_KEY: z.string().optional(),
});

const parsed = envSchema.safeParse(process.env);

if (!parsed.success) {
  console.warn('Invalid environment variables:', parsed.error.flatten().fieldErrors);
}

export const env = parsed.success
  ? parsed.data
  : {
      NODE_ENV: 'development',
    };

export const requireClerkKeys = () => {
  if (!env.NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY || !env.CLERK_SECRET_KEY) {
    throw new Error('Clerk keys are missing. Please set NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY and CLERK_SECRET_KEY.');
  }
};
