import { NextRequest, NextResponse } from 'next/server';

export const runtime = 'nodejs';

import { promises as fs } from 'fs';
import path from 'path';

export async function POST(req: NextRequest) {
  const OPENAI_API_KEY = process.env.OPENAI_API_KEY;
  if (!OPENAI_API_KEY) {
    return NextResponse.json({ error: 'Missing OPENAI_API_KEY' }, { status: 500 });
  }

  // Chat history file path (persisted on server)
  const historyFile = path.join('/tmp', 'voice-agent-chat-history.json');

  // Expect audio in the request body (audio/webm, audio/wav, etc.)
  let audioBuffer: ArrayBuffer;
  let contentType = req.headers.get('content-type') || '';
  try {
    audioBuffer = await req.arrayBuffer();
    if (!audioBuffer || audioBuffer.byteLength === 0) {
      return NextResponse.json({ error: 'No audio data received' }, { status: 400 });
    }
  } catch {
    return NextResponse.json({ error: 'Failed to read audio data' }, { status: 400 });
  }

  // 1. Transcribe audio using OpenAI's transcription API (whisper/gpt-4o-transcribe)
  let transcript: string = '';
  try {
    // Prepare form data for OpenAI transcription endpoint
    const formData = new FormData();
    // Convert ArrayBuffer to Blob
    const audioBlob = new Blob([audioBuffer], { type: contentType || 'audio/webm' });
    // File name and type are required by OpenAI
    formData.append('file', audioBlob, 'audio.webm');
    formData.append('model', 'gpt-4o-transcribe'); // or 'gpt-4o-transcribe' if available
    formData.append('response_format', 'text');
    formData.append('language', 'en');

    const transcriptionRes = await fetch('https://api.openai.com/v1/audio/transcriptions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${OPENAI_API_KEY}`,
      },
      body: formData as any,
    });

    if (!transcriptionRes.ok) {
      const error = await transcriptionRes.text();
      return NextResponse.json({ error: 'Transcription failed: ' + error }, { status: transcriptionRes.status });
    }

    transcript = await transcriptionRes.text();
    if (!transcript) {
      return NextResponse.json({ error: 'No transcript received' }, { status: 500 });
    }
  } catch (err: any) {
    return NextResponse.json({ error: err.message || 'Failed to transcribe audio' }, { status: 500 });
  }

  // 2. Load chat history from file (or start new)
  let chatHistory: Array<{ role: 'system' | 'user' | 'assistant', content: string }> = [];
  try {
    const data = await fs.readFile(historyFile, 'utf-8');
    chatHistory = JSON.parse(data);
    if (!Array.isArray(chatHistory)) chatHistory = [];
  } catch {
    // File does not exist or is invalid, start new
    chatHistory = [];
  }

  // 3. Add system prompt if history is empty
  if (chatHistory.length === 0) {
    chatHistory.push({
      role: 'system',
      content: 'You are a helpful assistant. Always respond in English, regardless of the user\'s language. Respond clearly and politely and be concise unless asked to elaborate.'
    });
  }

  // 4. Add new user message
  chatHistory.push({
    role: 'user',
    content: transcript
  });

  // 5. Call GPT-4.1 with full history
  let gptResponseText: string;
  try {
    const gptRes = await fetch('https://api.openai.com/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${OPENAI_API_KEY}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: 'gpt-4.1-mini',
        messages: chatHistory,
        max_tokens: 256,
        temperature: 0.7,
      }),
    });

    if (!gptRes.ok) {
      const error = await gptRes.text();
      return NextResponse.json({ error }, { status: gptRes.status });
    }

    const gptData = await gptRes.json();
    gptResponseText = gptData.choices?.[0]?.message?.content || '';
    if (!gptResponseText) {
      return NextResponse.json({ error: 'No response from GPT-4.1' }, { status: 500 });
    }
  } catch (err: any) {
    return NextResponse.json({ error: err.message || 'Failed to call GPT-4.1' }, { status: 500 });
  }

  // 6. Add assistant response to history and persist
  chatHistory.push({
    role: 'assistant',
    content: gptResponseText
  });
  try {
    await fs.writeFile(historyFile, JSON.stringify(chatHistory, null, 2), 'utf-8');
  } catch (err: any) {
    // If write fails, log but do not block response
    console.error('Failed to write chat history:', err);
  }

  // 7. Return transcript and GPT-4.1 response as JSON
  return NextResponse.json({
    transcript,
    gptResponseText,
  });
}