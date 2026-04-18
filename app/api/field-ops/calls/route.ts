import { auth } from '@clerk/nextjs/server';
import { z } from 'zod';
import { ok, fail } from '@/lib/response';
import { rateLimit } from '@/server/rate-limit';

/**
 * Required env:
 * - VAPI_PRIVATE_KEY=...
 * - VAPI_ASSISTANT_ID=assistant_...
 * Optional:
 * - VAPI_PHONE_NUMBER_ID=phoneNumber_...
 */

const phoneSchema = z
  .string()
  .regex(/^\+[0-9]+$/, 'Invalid phone format (E.164 required)');

const bodySchema = z.object({
  action: z.enum(['start', 'stop']),
  caseId: z.string().optional(),
  phone: phoneSchema.optional(),
});

const ensureEnv = () => {
  const key = process.env.VAPI_PRIVATE_KEY;
  const assistant = process.env.VAPI_ASSISTANT_ID;
  const phoneNumberId = process.env.VAPI_PHONE_NUMBER_ID;
  if (!key || !assistant) {
    return null;
  }
  return { key, assistant, phoneNumberId };
};

export async function POST(req: Request) {
  const { userId } = auth();
  if (!userId) {
    return fail('Unauthorized', 401);
  }

  const limited = await rateLimit(req, { key: `fieldops:${userId}`, limit: 50 });
  if (!limited.ok) {
    return fail('Rate limit exceeded', 429);
  }

  const body = await req.json().catch(() => null);
  const parsed = bodySchema.safeParse(body ?? {});
  if (!parsed.success) {
    return fail('Invalid request', 400, parsed.error.flatten());
  }

  const { action, caseId, phone } = parsed.data;

  if (action === 'start') {
    if (!phone || !phone.startsWith('+')) {
      return fail('Invalid phone format (E.164 required)', 400);
    }
    if (!caseId) {
      return fail('caseId is required for start', 400);
    }

    const env = ensureEnv();
    if (!env) {
      return fail('Vapi not configured', 500);
    }

    const payload: Record<string, any> = {
      assistantId: env.assistant,
      customer: {
        number: phone,
      },
      metadata: {
        caseId,
        userId,
      },
      assistantOverrides: {
        variableValues: {
          case_id: caseId,
          customer_number: phone,
        },
      },
    };

    if (env.phoneNumberId) {
      payload.phoneNumberId = env.phoneNumberId;
    }

    const res = await fetch('https://api.vapi.ai/call', {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${env.key}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(payload),
    });

    let json: any = null;
    try {
      json = await res.json();
    } catch {
      json = null;
    }

    if (!res.ok) {
      return fail('Vapi call failed', res.status, json);
    }

    return ok(
      {
        status: json?.status || 'dialing',
        vapiCallId: json?.id ?? null,
        caseId,
        phone,
      },
      'Call request accepted',
    );
  }

  // STOP placeholder; we are not terminating via REST yet.
  return ok(
    {
      status: 'stop_requested',
      caseId: caseId ?? null,
      phone: phone ?? null,
    },
    'Stop request acknowledged',
  );
}
