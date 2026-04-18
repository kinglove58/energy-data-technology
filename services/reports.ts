import type { ApiResponse } from '@/types/api';
import type { ReportRequest, ReportResponse } from '@/types/ai';

export async function generateReport(input: ReportRequest): Promise<ApiResponse<ReportResponse>> {
  const res = await fetch('/api/reports', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(input),
  });
  return res.json();
}

export async function downloadReportPdf(markdown: string, title = 'Executive Report'): Promise<Blob> {
  const res = await fetch('/api/reports/pdf', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ markdown, title }),
  });
  if (!res.ok) {
    throw new Error('Failed to generate PDF');
  }
  return res.blob();
}
