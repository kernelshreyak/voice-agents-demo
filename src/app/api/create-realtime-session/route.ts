import { NextRequest, NextResponse } from 'next/server';

export async function POST(req: NextRequest) {
  const OPENAI_API_KEY = process.env.OPENAI_API_KEY;
  if (!OPENAI_API_KEY) {
    return NextResponse.json({ error: 'Missing OPENAI_API_KEY' }, { status: 500 });
  }

  const body = await req.json();
  const model = body.model || 'gpt-4o-realtime-preview-2025-06-03';

  try {
    const openaiRes = await fetch('https://api.openai.com/v1/realtime/sessions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${OPENAI_API_KEY}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ model }),
    });

    if (!openaiRes.ok) {
      const error = await openaiRes.text();
      return NextResponse.json({ error }, { status: openaiRes.status });
    }

    const data = await openaiRes.json();
    // The client secret is at data.client_secret.value
    return NextResponse.json({ clientSecret: data.client_secret?.value });
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}