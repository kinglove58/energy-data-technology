import { auth } from '@clerk/nextjs/server';
import { z } from 'zod';
import { ok, fail } from '@/lib/response';
import { rateLimit } from '@/server/rate-limit';

const bodySchema = z.object({
  callId: z.string(),
});

const ensureEnv = () => {
  const key = process.env.VAPI_PRIVATE_KEY;
  if (!key) return null;
  return { key };
};

export async function POST(req: Request) {
  const { userId } = await auth();
  if (!userId) {
    return fail('Unauthorized', 401);
  }

  const limited = await rateLimit(req, { key: `fieldops-status:${userId}`, limit: 80 });
  if (!limited.ok) {
    return fail('Rate limit exceeded', 429);
  }

  const body = await req.json().catch(() => null);
  const parsed = bodySchema.safeParse(body ?? {});
  if (!parsed.success) {
    return fail('Invalid request', 400, parsed.error.flatten());
  }

  const env = ensureEnv();
  if (!env) {
    return fail('voice not configured', 500);
  }

  const res = await fetch(`https://api.vapi.ai/call/${parsed.data.callId}`, {
    method: 'GET',
    headers: {
      Authorization: `Bearer ${env.key}`,
    },
  });

  let json: any = null;
  try {
    json = await res.json();
  } catch {
    json = null;
  }

  if (!res.ok) {
    return fail('Failed to fetch call status', res.status, json);
  }

  return ok(
    {
      status: json?.status ?? 'unknown',
      callId: parsed.data.callId,
      raw: json,
    },
    'Call status fetched',
  );
}
