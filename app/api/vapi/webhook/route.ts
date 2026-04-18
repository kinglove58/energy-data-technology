import { NextResponse } from 'next/server';

export async function POST(request: Request) {
  // Optional: verify webhook secret
  const secret = process.env.VAPI_WEBHOOK_SECRET;
  if (secret) {
    const provided = request.headers.get('x-vapi-signature') || '';
    if (provided !== secret) {
      return NextResponse.json({ success: false, message: 'Unauthorized' }, { status: 401 });
    }
  }

  const body = await request.json().catch(() => null);

  // TODO: persist to DB when available
  console.log('Vapi webhook event:', body);

  // Extract scorecard/results if present
  const scorecard = body?.scorecard ?? null;
  const callId = body?.id ?? null;

  return NextResponse.json({
    success: true,
    message: 'Webhook received',
    callId,
    scorecard,
  });
}
