type RateLimitOptions = {
  key: string;
  limit?: number;
  windowMs?: number;
};

type Bucket = {
  tokens: number;
  reset: number;
};

const buckets = new Map<string, Bucket>();

export const rateLimit = async (_req: Request, opts: RateLimitOptions) => {
  const limit = opts.limit ?? 60;
  const windowMs = opts.windowMs ?? 60_000;
  const now = Date.now();

  const existing = buckets.get(opts.key);
  if (!existing || existing.reset < now) {
    buckets.set(opts.key, { tokens: limit - 1, reset: now + windowMs });
    return { ok: true, remaining: limit - 1, reset: now + windowMs };
  }

  if (existing.tokens <= 0) {
    return { ok: false, remaining: 0, reset: existing.reset };
  }

  existing.tokens -= 1;
  return { ok: true, remaining: existing.tokens, reset: existing.reset };
};
