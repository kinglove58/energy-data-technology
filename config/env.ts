import { z } from 'zod';

const envSchema = z.object({
  NODE_ENV: z.enum(['development', 'test', 'production']).default('development'),
  NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY: z.string().optional(),
  CLERK_SECRET_KEY: z.string().optional(),
  GEMINI_API_KEY: z.string().optional(),
  POWERGRID_API_BASE_URL: z.string().url().optional(),
  NEXT_PUBLIC_API_BASE_URL: z.string().url().optional(),
});

const parsed = envSchema.safeParse(process.env);

if (!parsed.success) {
  console.warn('Invalid environment variables:', parsed.error.flatten().fieldErrors);
}

const fallbackEnv: z.infer<typeof envSchema> = {
  NODE_ENV: 'development',
  NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY: undefined,
  CLERK_SECRET_KEY: undefined,
  GEMINI_API_KEY: undefined,
  POWERGRID_API_BASE_URL: undefined,
  NEXT_PUBLIC_API_BASE_URL: undefined,
};

export const env = parsed.success
  ? parsed.data
  : fallbackEnv;

export const requireClerkKeys = () => {
  if (!env.NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY || !env.CLERK_SECRET_KEY) {
    throw new Error('Clerk keys are missing. Please set NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY and CLERK_SECRET_KEY.');
  }
};
