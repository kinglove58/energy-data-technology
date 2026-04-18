import { auth } from '@clerk/nextjs/server';
import { z } from 'zod';
import { rateLimit } from '@/server/rate-limit';
import { fail } from '@/lib/response';
import { renderReportPdf } from '@/server/services/pdf';

const bodySchema = z.object({
  markdown: z.string().min(1),
  title: z.string().default('Executive Report'),
});

export async function POST(req: Request) {
  const { userId } = auth();
  if (!userId) {
    return fail('Unauthorized', 401);
  }

  const limited = await rateLimit(req, { key: `report-pdf:${userId}`, limit: 10 });
  if (!limited.ok) {
    return fail('Rate limit exceeded', 429);
  }

  const body = await req.json().catch(() => null);
  const parsed = bodySchema.safeParse(body ?? {});
  if (!parsed.success) {
    return fail('Invalid request', 400, parsed.error.flatten());
  }

  const pdfBytes = await renderReportPdf(parsed.data.markdown, parsed.data.title);
  const fileName = `${parsed.data.title.replace(/\s+/g, '-').toLowerCase()}.pdf`;

  return new Response(pdfBytes, {
    status: 200,
    headers: {
      'Content-Type': 'application/pdf',
      'Content-Disposition': `attachment; filename="${fileName}"`,
    },
  });
}
