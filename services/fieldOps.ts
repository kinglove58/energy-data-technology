import type { ApiResponse } from '@/types/api';

export async function requestCall(
  action: 'start' | 'stop',
  caseId?: string,
  phone?: string,
): Promise<ApiResponse<{ status: string; action: string; caseId: string | null; phone: string | null }>> {
  const res = await fetch('/api/field-ops/calls', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ action, caseId, phone }),
  });
  return res.json();
}

export async function getCallStatus(callId: string): Promise<ApiResponse<{ status: string; callId: string; raw?: any }>> {
  const res = await fetch('/api/field-ops/calls/status', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ callId }),
  });
  return res.json();
}
