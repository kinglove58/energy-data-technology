import { auth } from '@clerk/nextjs/server';
import { z } from 'zod';
import { ok, fail } from '@/lib/response';
import { getInsights } from '@/server/services/insights';
import { rateLimit } from '@/server/rate-limit';

const metricsSchema = z.object({
  energySuppliedMWh: z.number().optional(),
  energyBilledMWh: z.number().optional(),
  revenueLossUSD: z.number().optional(),
  theftCases: z.number().optional(),
  recoveryUSD: z.number().optional(),
  period: z.string().optional(),
});

const querySchema = z.object({
  range: z.string().optional(),
});

const bodySchema = z.object({
  range: z.string().optional(),
  metrics: metricsSchema.optional(),
});

async function handleInsights(req: Request, input?: { range?: string; metrics?: z.infer<typeof metricsSchema> }) {
  const { userId } = auth();
  if (!userId) {
    return fail('Unauthorized', 401);
  }

  const limited = await rateLimit(req, { key: `insights:${userId}`, limit: 60 });
  if (!limited.ok) {
    return fail('Rate limit exceeded', 429);
  }

  const data = await getInsights({ metrics: input?.metrics });
  return ok(data);
}

export async function GET(req: Request) {
  const url = new URL(req.url);
  const parsed = querySchema.safeParse(Object.fromEntries(url.searchParams));
  if (!parsed.success) {
    return fail('Invalid request', 400, parsed.error.flatten());
  }
  return handleInsights(req, { range: parsed.data.range });
}

export async function POST(req: Request) {
  const body = await req.json().catch(() => null);
  const parsed = bodySchema.safeParse(body ?? {});
  if (!parsed.success) {
    return fail('Invalid request', 400, parsed.error.flatten());
  }
  return handleInsights(req, parsed.data);
}
