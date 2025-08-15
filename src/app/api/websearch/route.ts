import { NextRequest, NextResponse } from 'next/server';

export async function POST(req: NextRequest) {
  try {
    const { query } = await req.json();
    if (!query) {
      return NextResponse.json({ error: 'Query is required' }, { status: 400 });
    }
    const apiKey = process.env.TAVILY_API_KEY;
    if (!apiKey) {
      return NextResponse.json({ error: 'Tavily API key not set' }, { status: 500 });
    }
    const tavilyRes = await fetch('https://api.tavily.com/search', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${apiKey}`,
      },
      body: JSON.stringify({ query }),
    });
    if (!tavilyRes.ok) {
      return NextResponse.json({ error: 'Failed to fetch from Tavily' }, { status: tavilyRes.status });
    }
    const data = await tavilyRes.json();
    return NextResponse.json({ result: data.result || data }, { status: 200 });
  } catch (err) {
    return NextResponse.json({ error: `Error fetching web search: ${err}` }, { status: 500 });
  }
}