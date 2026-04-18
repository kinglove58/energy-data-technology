import type { ApiResponse } from '@/types/api';
import type { Insight, InsightInput } from '@/types/ai';

export async function fetchInsights(input?: InsightInput & { range?: string }): Promise<ApiResponse<Insight[]>> {
  const res = await fetch('/api/insights', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    cache: 'no-store',
    body: JSON.stringify({
      range: input?.range ?? '30d',
      metrics: input?.metrics,
    }),
  });
  return res.json();
}
