import { auth } from '@clerk/nextjs/server';
import { z } from 'zod';
import { ok, fail } from '@/lib/response';
import { rateLimit } from '@/server/rate-limit';
import { generateExecutiveReport } from '@/server/services/reports';

const bodySchema = z.object({
  period: z.string().default('Last 30 Days'),
  metrics: z.record(z.any()).default({}),
});

export async function POST(req: Request) {
  const { userId } = await auth();
  if (!userId) {
    return fail('Unauthorized', 401);
  }

  const limited = await rateLimit(req, { key: `reports:${userId}`, limit: 20 });
  if (!limited.ok) {
    return fail('Rate limit exceeded', 429);
  }

  const body = await req.json().catch(() => null);
  const parsed = bodySchema.safeParse(body ?? {});
  if (!parsed.success) {
    return fail('Invalid request', 400, parsed.error.flatten());
  }

  const report = await generateExecutiveReport(parsed.data);
  return ok(report);
}
